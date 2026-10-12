const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");

class PaletteService {
  /**
   * Euclidean distance in 3D RGB color space
   */
  rgbDistance(c1, c2) {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  }

  /**
   * Validates and parses a 6-digit hex string into RGB object
   * Returns null if invalid
   */
  hexToRgb(hex) {
    if (!hex || typeof hex !== "string") return null;
    const cleanHex = hex.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
      return null;
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return { r, g, b };
  }

  /**
   * Converts RGB components (0-255) to 6-digit hex string (#RRGGBB)
   */
  rgbToHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const rh = clamp(r).toString(16).padStart(2, "0");
    const gh = clamp(g).toString(16).padStart(2, "0");
    const bh = clamp(b).toString(16).padStart(2, "0");
    return `#${rh}${gh}${bh}`.toLowerCase();
  }

  /**
   * Core Dominant Colors Extraction Algorithm:
   * 1. Shrinks image to ~48x48 pixels to preserve dominant colors and optimize speed.
   * 2. Groups pixels into coarse buckets (16 levels per channel = 4096 buckets).
   * 3. Averages the pixels in each bucket and ranks buckets by pixel count.
   * 4. Picks top buckets, skipping any within distance 60 of an already picked color.
   * 5. Returns up to 5 visibly distinct hex colors.
   */
  extractPaletteFromRawPixels(data, width, height) {
    if (!data || width <= 0 || height <= 0) return [];

    const targetW = 48;
    const targetH = 48;
    const buckets = new Map();

    for (let ty = 0; ty < targetH; ty++) {
      const sy = Math.min(height - 1, Math.floor((ty * height) / targetH));
      for (let tx = 0; tx < targetW; tx++) {
        const sx = Math.min(width - 1, Math.floor((tx * width) / targetW));
        const idx = (sy * width + sx) * 4;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3] !== undefined ? data[idx + 3] : 255;

        // Ignore mostly transparent pixels
        if (a < 128) continue;

        // 16 levels per channel = 4096 coarse buckets
        const rBucket = Math.min(15, Math.floor(r / 16));
        const gBucket = Math.min(15, Math.floor(g / 16));
        const bBucket = Math.min(15, Math.floor(b / 16));
        const bucketKey = (rBucket << 8) | (gBucket << 4) | bBucket;

        let entry = buckets.get(bucketKey);
        if (!entry) {
          entry = { count: 0, sumR: 0, sumG: 0, sumB: 0 };
          buckets.set(bucketKey, entry);
        }
        entry.count += 1;
        entry.sumR += r;
        entry.sumG += g;
        entry.sumB += b;
      }
    }

    // Average the pixels in each bucket
    const rankedBuckets = [];
    for (const [, entry] of buckets) {
      if (entry.count > 0) {
        rankedBuckets.push({
          count: entry.count,
          r: Math.round(entry.sumR / entry.count),
          g: Math.round(entry.sumG / entry.count),
          b: Math.round(entry.sumB / entry.count),
        });
      }
    }

    // Rank buckets by pixel count (descending)
    rankedBuckets.sort((a, b) => b.count - a.count);

    // Pick top buckets, skipping any within distance 60 of one already picked
    const pickedColors = [];
    for (const candidate of rankedBuckets) {
      const isTooClose = pickedColors.some(
        (picked) => this.rgbDistance(candidate, picked) < 60
      );

      if (!isTooClose) {
        pickedColors.push(candidate);
        if (pickedColors.length >= 5) break;
      }
    }

    return pickedColors.map((c) => this.rgbToHex(c.r, c.g, c.b));
  }

  /**
   * Safely decodes an image file and extracts its dominant color palette.
   * If decoding fails, returns [] (the post still uploads).
   */
  extractPaletteFromFile(filePath) {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return [];
      }

      const buffer = fs.readFileSync(filePath);
      if (!buffer || buffer.length === 0) {
        return [];
      }

      // Check PNG signature: 89 50 4E 47
      if (
        buffer.length > 4 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        try {
          const png = PNG.sync.read(buffer);
          return this.extractPaletteFromRawPixels(png.data, png.width, png.height);
        } catch (pngErr) {
          console.warn("PNG decode warning:", pngErr.message);
        }
      }

      // Check JPEG signature: FF D8
      if (buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
        try {
          const rawJpeg = jpeg.decode(buffer, { useTArray: true });
          return this.extractPaletteFromRawPixels(
            rawJpeg.data,
            rawJpeg.width,
            rawJpeg.height
          );
        } catch (jpegErr) {
          console.warn("JPEG decode warning:", jpegErr.message);
        }
      }

      // Fallback try PNG then JPEG
      try {
        const png = PNG.sync.read(buffer);
        return this.extractPaletteFromRawPixels(png.data, png.width, png.height);
      } catch (e1) {
        try {
          const rawJpeg = jpeg.decode(buffer, { useTArray: true });
          return this.extractPaletteFromRawPixels(
            rawJpeg.data,
            rawJpeg.width,
            rawJpeg.height
          );
        } catch (e2) {
          return [];
        }
      }
    } catch (err) {
      console.warn("Palette extraction fallback error:", err.message);
      return [];
    }
  }

  /**
   * Color Nearest-Neighbor Search:
   * Compares target color against each post's palette.
   * Keeps posts with distance <= 80, sorted nearest first.
   * Match percentage = 100 * (1 - distance / 160).
   */
  searchPostsByColor(posts, targetHex) {
    const targetRgb = this.hexToRgb(targetHex);
    if (!targetRgb) {
      throw new Error("Invalid 6-digit hex color");
    }

    const matchedPosts = [];

    for (const post of posts) {
      if (!post.palette || !Array.isArray(post.palette) || post.palette.length === 0) {
        continue;
      }

      let minDistance = Infinity;
      let closestColor = null;

      for (const hex of post.palette) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) continue;

        const dist = this.rgbDistance(targetRgb, rgb);
        if (dist < minDistance) {
          minDistance = dist;
          closestColor = hex;
        }
      }

      // Keep posts with distance <= 80
      if (minDistance <= 80) {
        // Match percentage for display = 100 * (1 - distance / 160)
        const matchPercentage = Math.round(
          Math.max(0, Math.min(100, 100 * (1 - minDistance / 160)))
        );

        matchedPosts.push({
          post,
          distance: Math.round(minDistance * 10) / 10,
          matchPercentage,
          matchedColor: closestColor,
        });
      }
    }

    // Sort nearest first (smallest distance)
    matchedPosts.sort((a, b) => a.distance - b.distance);

    return matchedPosts;
  }
}

module.exports = new PaletteService();
