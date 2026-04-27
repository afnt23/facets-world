import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const picturesDir = path.join(root, "public", "pictures");
const manifestPath = path.join(root, "public", "images.json");

const COLS = 7;
const CELL_W = 280;
const CELL_H = Math.round(CELL_W * 9 / 16); // 16:9 landscape cells

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// Same selection logic as the site: sorted by name, landscape only, first 120
const images = manifest
  .filter(e => (e.width ?? 0) > (e.height ?? 0))
  .sort((a, b) => a.file.localeCompare(b.file))
  .slice(0, 120);

const totalW = COLS * CELL_W;
const ROWS = Math.ceil(images.length / COLS);
const totalH = ROWS * CELL_H;

console.log(`Building ${COLS}×${ROWS} collage (${totalW}×${totalH}px) from ${images.length} images…`);

const composites = [];

for (let i = 0; i < images.length; i++) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const filePath = path.join(picturesDir, images[i].file);

  if (!fs.existsSync(filePath)) continue;

  try {
    const tile = await sharp(filePath)
      .resize(CELL_W, CELL_H, { fit: "cover", position: "centre" })
      .toBuffer();

    composites.push({ input: tile, left: col * CELL_W, top: row * CELL_H });
  } catch (e) {
    console.warn(`Skipping ${images[i].file}: ${e.message}`);
  }
}

const outputPath = path.join(root, "collage.jpg");

await sharp({
  create: { width: totalW, height: totalH, channels: 3, background: { r: 12, g: 11, b: 8 } },
})
  .composite(composites)
  .jpeg({ quality: 90 })
  .toFile(outputPath);

console.log(`Saved → ${outputPath}`);
