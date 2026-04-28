import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const PICS_DIR = path.join(ROOT, "public", "pictures");
const MANIFEST_PATH = path.join(ROOT, "public", "images.json");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

if (!fs.existsSync(PICS_DIR)) {
  console.error("public/pictures not found.");
  process.exit(1);
}

const entries = [];

for (const country of fs.readdirSync(PICS_DIR).sort()) {
  const countryDir = path.join(PICS_DIR, country);
  if (!fs.statSync(countryDir).isDirectory()) continue;

  for (const file of fs.readdirSync(countryDir).sort()) {
    if (!IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const filePath = path.join(countryDir, file);
    try {
      const { width, height } = await sharp(filePath).metadata();
      entries.push({ file, country, width, height });
    } catch {
      console.warn(`Could not read dimensions for ${country}/${file} — skipping.`);
    }
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2));
console.log(`images.json updated: ${entries.length} entries.`);
