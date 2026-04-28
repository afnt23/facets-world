import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = process.cwd();
const PICS_DIR = path.join(ROOT, "public", "pictures");
const CACHE_DIR = path.join(ROOT, ".cache");
const CACHE_PATH = path.join(CACHE_DIR, "image-resize.json");
const SIPS_PATH = "/usr/bin/sips";
const MAX_DIMENSION = Number(process.env.IMAGE_MAX_DIM ?? "2000");
const JPEG_QUALITY = Number(process.env.IMAGE_JPEG_QUALITY ?? "75");

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".tif", ".tiff", ".bmp", ".heic",
]);

const canResize = process.platform === "darwin" && fs.existsSync(SIPS_PATH);

if (!canResize) {
  console.log("Image resize skipped: macOS sips not available.");
  process.exit(0);
}

if (!fs.existsSync(PICS_DIR)) {
  console.log("Image resize skipped: public/pictures not found.");
  process.exit(0);
}

const readCache = () => {
  if (!fs.existsSync(CACHE_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")); } catch { return {}; }
};

const writeCache = (c) => {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(c, null, 2));
};

const cache = readCache();
const nextCache = {};
let processed = 0;

// Walk country subfolders
for (const country of fs.readdirSync(PICS_DIR).sort()) {
  const countryDir = path.join(PICS_DIR, country);
  if (!fs.statSync(countryDir).isDirectory()) continue;

  for (const file of fs.readdirSync(countryDir).sort()) {
    const ext = path.extname(file).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const filePath = path.join(countryDir, file);
    const stat = fs.statSync(filePath);
    const cacheKey = `${country}/${file}`;
    const cached = cache[cacheKey];

    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      nextCache[cacheKey] = cached;
      continue;
    }

    const tempPath = path.join(countryDir, `.tmp-resize-${Date.now()}-${file}`);
    const args =
      ext === ".jpg" || ext === ".jpeg"
        ? ["-Z", `${MAX_DIMENSION}`, "-s", "format", "jpeg", "-s", "formatOptions", `${JPEG_QUALITY}`, filePath, "--out", tempPath]
        : ["-Z", `${MAX_DIMENSION}`, filePath, "--out", tempPath];

    try {
      execFileSync(SIPS_PATH, args, { stdio: "ignore" });
      fs.renameSync(tempPath, filePath);
      const updated = fs.statSync(filePath);
      nextCache[cacheKey] = { mtimeMs: updated.mtimeMs, size: updated.size };
      processed += 1;
    } catch {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.warn(`Image resize failed for ${country}/${file}.`);
    }
  }
}

writeCache(nextCache);
console.log(`Image resize complete. Updated ${processed} file(s).`);
