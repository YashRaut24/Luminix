require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const path = require("path");
const fs = require("fs");
const connectDB = require("../config/db");
const Post = require("../models/Post");
const paletteService = require("../services/paletteService");

const DEFAULT_PALETTE_STR = JSON.stringify([
  "#1e293b",
  "#334155",
  "#6366f1",
  "#475569",
  "#0f172a",
]);

async function runBackfill() {
  console.log("=== Luminix Dominant Palette Backfill Script ===");
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    const posts = await Post.find({});
    console.log(`Found ${posts.length} total posts in database.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let emptyCount = 0;

    for (const post of posts) {
      const isMissingOrEmpty =
        !post.palette ||
        !Array.isArray(post.palette) ||
        post.palette.length === 0;

      const isDefaultPalette =
        Array.isArray(post.palette) &&
        JSON.stringify(post.palette.map((c) => c.toLowerCase())) ===
          DEFAULT_PALETTE_STR;

      if (isMissingOrEmpty || isDefaultPalette) {
        if (!post.file_url) {
          post.palette = [];
          await post.save();
          emptyCount++;
          continue;
        }

        // Resolve local file path
        const relativeName = post.file_url.replace(/^\/?uploads\/?/, "");
        const localPath = path.join(__dirname, "../uploads", relativeName);

        if (fs.existsSync(localPath)) {
          const extracted = paletteService.extractPaletteFromFile(localPath);
          post.palette = extracted;
          await post.save();
          updatedCount++;
          console.log(
            `[Post ${post._id}] Extracted ${extracted.length} dominant colors:`,
            extracted
          );
        } else {
          // File does not exist on disk, store empty palette per edge-case spec
          post.palette = [];
          await post.save();
          emptyCount++;
          console.log(`[Post ${post._id}] Image file not found on disk, stored empty palette.`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log("================================================");
    console.log(`Backfill complete:`);
    console.log(`  Updated with real extracted palette: ${updatedCount}`);
    console.log(`  Stored empty palette: ${emptyCount}`);
    console.log(`  Already valid palette: ${skippedCount}`);
    console.log("================================================");
    process.exit(0);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
}

runBackfill();
