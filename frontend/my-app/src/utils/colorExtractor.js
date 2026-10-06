// Luminix Dynamic Color Theming Engine
// Extracts dominant aesthetic color and generates Lumi glow tokens

const colorCache = new Map();

const CURATED_PALETTES = [
  { primary: "#8b5cf6", glow: "rgba(139, 92, 246, 0.35)", tint: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.4)" },
  { primary: "#ec4899", glow: "rgba(236, 72, 153, 0.35)", tint: "rgba(236, 72, 153, 0.08)", border: "rgba(236, 72, 153, 0.4)" },
  { primary: "#38bdf8", glow: "rgba(56, 189, 248, 0.35)", tint: "rgba(56, 189, 248, 0.08)", border: "rgba(56, 189, 248, 0.4)" },
  { primary: "#10b981", glow: "rgba(16, 185, 129, 0.35)", tint: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.4)" },
  { primary: "#f59e0b", glow: "rgba(245, 158, 11, 0.35)", tint: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.4)" },
  { primary: "#6366f1", glow: "rgba(99, 102, 241, 0.35)", tint: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.4)" },
];

export function getFallbackPalette(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURATED_PALETTES.length;
  return CURATED_PALETTES[index];
}

export function extractDominantColor(imgSrc, callback) {
  if (!imgSrc) {
    callback(CURATED_PALETTES[0]);
    return;
  }

  if (colorCache.has(imgSrc)) {
    callback(colorCache.get(imgSrc));
    return;
  }

  const img = new Image();
  img.crossOrigin = "Anonymous";

  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 40;
      canvas.height = 40;
      ctx.drawImage(img, 0, 0, 40, 40);

      const imageData = ctx.getImageData(0, 0, 40, 40).data;
      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a > 128) {
          // Skip pure black and pure white to favor vibrant mids
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 25 && brightness < 235) {
            rSum += r;
            gSum += g;
            bSum += b;
            count++;
          }
        }
      }

      if (count > 0) {
        const rAvg = Math.round(rSum / count);
        const gAvg = Math.round(gSum / count);
        const bAvg = Math.round(bSum / count);

        const palette = {
          primary: `rgb(${rAvg}, ${gAvg}, ${bAvg})`,
          glow: `rgba(${rAvg}, ${gAvg}, ${bAvg}, 0.35)`,
          tint: `rgba(${rAvg}, ${gAvg}, ${bAvg}, 0.08)`,
          border: `rgba(${rAvg}, ${gAvg}, ${bAvg}, 0.4)`,
        };

        colorCache.set(imgSrc, palette);
        callback(palette);
      } else {
        const fallback = getFallbackPalette(imgSrc);
        colorCache.set(imgSrc, fallback);
        callback(fallback);
      }
    } catch {
      const fallback = getFallbackPalette(imgSrc);
      colorCache.set(imgSrc, fallback);
      callback(fallback);
    }
  };

  img.onerror = () => {
    const fallback = getFallbackPalette(imgSrc);
    colorCache.set(imgSrc, fallback);
    callback(fallback);
  };

  img.src = imgSrc;
}
