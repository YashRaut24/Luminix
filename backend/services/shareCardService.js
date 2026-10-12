const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

/**
 * Escapes characters for XML / HTML
 */
function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wraps caption text manually: ~24 chars per line, max 4 lines with ellipsis
 */
function wrapCaption(text, maxCharsPerLine = 24, maxLines = 4) {
  if (!text || !text.trim()) return ["Creative Proof"];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (!currentLine) {
      if (word.length > maxCharsPerLine) {
        currentLine = word.slice(0, maxCharsPerLine);
      } else {
        currentLine = word;
      }
    } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;

      if (lines.length === maxLines - 1) {
        // Last line - append remaining words or truncate with ellipsis
        const remaining = [currentLine, ...words.slice(i + 1)].join(" ");
        if (remaining.length > maxCharsPerLine) {
          lines.push(remaining.slice(0, Math.max(1, maxCharsPerLine - 1)) + "…");
        } else {
          lines.push(remaining);
        }
        return lines;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generates or retrieves cached 1200x630 share card PNG
 */
async function getOrGenerateShareCard(post) {
  const uploadsDir = path.resolve(__dirname, "../uploads");
  const cacheDir = path.resolve(uploadsDir, "share_cards");

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const updateTime = post.updatedAt ? new Date(post.updatedAt).getTime() : 0;
  const cacheFileName = `card_${post._id}_${updateTime}.png`;
  const cacheFilePath = path.join(cacheDir, cacheFileName);

  // 1. Performance: Check disk cache
  if (fs.existsSync(cacheFilePath)) {
    return fs.promises.readFile(cacheFilePath);
  }

  // 2. Security: Path traversal protection on post.file_url
  const relativeFile = (post.file_url || "").replace(/^\/?uploads\/?/, "");
  const imagePath = path.resolve(uploadsDir, relativeFile);

  let resizedArtworkBuffer;
  const hasValidImage = imagePath.startsWith(uploadsDir) && fs.existsSync(imagePath);

  if (hasValidImage) {
    try {
      resizedArtworkBuffer = await sharp(imagePath)
        .resize(630, 630, { fit: "cover", position: "centre" })
        .png()
        .toBuffer();
    } catch (e) {
      console.error("Failed to decode artwork with sharp, using placeholder:", e.message);
    }
  }

  // Fallback placeholder if image is missing or corrupted
  if (!resizedArtworkBuffer) {
    resizedArtworkBuffer = await sharp({
      create: {
        width: 630,
        height: 630,
        channels: 4,
        background: { r: 18, g: 18, b: 24, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  }

  // 3. Build text-side SVG (570px wide, 630px high, offset at x: 630)
  const captionLines = wrapCaption(post.caption || post.file_name || "Creative Proof", 24, 4);
  const username = escapeXml(post.username || post.author?.username || post.author?.name || "creator");
  const palette = Array.isArray(post.palette) ? post.palette.slice(0, 5) : [];

  const textStartX = 680;
  const captionStartY = 145;
  const captionLineHeight = 36;
  const captionBlockHeight = captionLines.length * captionLineHeight;
  const authorY = captionStartY + captionBlockHeight + 10;

  let paletteSvg = "";
  if (palette.length > 0) {
    const swatchStartY = Math.max(authorY + 50, 420);
    paletteSvg += `
      <!-- 5-Color Dominant Palette -->
      <text x="${textStartX}" y="${swatchStartY - 14}" fill="#71717a" font-family="monospace" font-size="11" font-weight="700" letter-spacing="1">DOMINANT COLOR PALETTE</text>
      <g transform="translate(${textStartX}, ${swatchStartY})">
    `;

    palette.forEach((hex, i) => {
      const swatchX = i * 64;
      const cleanHex = escapeXml(String(hex).toUpperCase());
      paletteSvg += `
        <rect x="${swatchX}" y="0" width="50" height="50" rx="3" fill="${cleanHex}" stroke="#27272a" stroke-width="1.5" />
        <text x="${swatchX + 25}" y="66" fill="#71717a" font-family="monospace" font-size="10" text-anchor="middle">${cleanHex}</text>
      `;
    });

    paletteSvg += `</g>`;
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Right Side Background -->
  <rect x="630" y="0" width="570" height="630" fill="#09090b" />
  
  <!-- Subtle Vertical Divider -->
  <line x1="630" y1="0" x2="630" y2="630" stroke="#27272a" stroke-width="2" />

  <!-- Brand Badge (Solid darkroom token #6366f1) -->
  <rect x="${textStartX}" y="52" width="86" height="26" rx="2" fill="#18181b" stroke="#6366f1" stroke-width="1.5" />
  <text x="${textStartX + 43}" y="69" fill="#6366f1" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="1.5">LUMINIX</text>
  <text x="${textStartX + 98}" y="69" fill="#71717a" font-family="monospace" font-size="11" letter-spacing="1">DARKROOM // PROOF</text>

  <!-- Caption Title (Manual text wrapping) -->
  ${captionLines
    .map(
      (line, i) =>
        `<text x="${textStartX}" y="${captionStartY + i * captionLineHeight}" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="28" font-weight="700">${escapeXml(line)}</text>`
    )
    .join("\n  ")}

  <!-- Creator Attribution -->
  <text x="${textStartX}" y="${authorY}" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="18" font-weight="600">by @${username}</text>

  ${paletteSvg}

  <!-- Footer Backline & Mark -->
  <line x1="${textStartX}" y1="565" x2="1140" y2="565" stroke="#27272a" stroke-width="1" />
  <text x="${textStartX}" y="595" fill="#71717a" font-family="monospace" font-size="11" letter-spacing="0.5">OPEN IN LUMINIX WORKSPACE</text>
  <text x="1140" y="595" text-anchor="end" fill="#6366f1" font-family="monospace" font-size="12" font-weight="700">luminix.art</text>
</svg>`;

  // 4. Composite onto solid dark 1200x630 canvas
  const canvas = sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 }, // #09090b
    },
  });

  const finalPngBuffer = await canvas
    .composite([
      { input: resizedArtworkBuffer, left: 0, top: 0 },
      { input: Buffer.from(svgContent), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  // 5. Write to disk cache
  try {
    await fs.promises.writeFile(cacheFilePath, finalPngBuffer);
  } catch (err) {
    console.error("Failed to write share card cache file:", err);
  }

  return finalPngBuffer;
}

module.exports = {
  getOrGenerateShareCard,
  escapeXml,
  wrapCaption,
};
