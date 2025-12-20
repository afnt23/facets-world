import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const IMAGE_DIR = path.join(ROOT, "public", "pictures");
const OUTPUT = path.join(ROOT, "public", "images.json");
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
]);

const ensureManifest = () => {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.writeFileSync(OUTPUT, JSON.stringify([]));
    return;
  }

  const files = fs.readdirSync(IMAGE_DIR);
  const images = files.filter((file) =>
    IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()),
  );

  fs.writeFileSync(OUTPUT, JSON.stringify(images, null, 2));
};

ensureManifest();
