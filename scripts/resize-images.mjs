import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = process.cwd();
const IMAGE_DIR = path.join(ROOT, "public", "pictures");
const CACHE_DIR = path.join(ROOT, ".cache");
const CACHE_PATH = path.join(CACHE_DIR, "image-resize.json");
const SIPS_PATH = "/usr/bin/sips";
const MAX_DIMENSION = Number(process.env.IMAGE_MAX_DIM ?? "2000");
const JPEG_QUALITY = Number(process.env.IMAGE_JPEG_QUALITY ?? "75");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".tif",
  ".tiff",
  ".bmp",
  ".heic",
]);

const canResize =
  process.platform === "darwin" && fs.existsSync(SIPS_PATH);

if (!canResize) {
  console.log("Image resize skipped: macOS sips not available.");
  process.exit(0);
}

if (!fs.existsSync(IMAGE_DIR)) {
  console.log("Image resize skipped: public/pictures not found.");
  process.exit(0);
}

const readCache = () => {
  if (!fs.existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
};

const writeCache = (cache) => {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
};

const cache = readCache();
const nextCache = {};
let processed = 0;

for (const file of fs.readdirSync(IMAGE_DIR)) {
  const ext = path.extname(file).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) continue;

  const filePath = path.join(IMAGE_DIR, file);
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) continue;

  const cacheEntry = cache[file];
  if (cacheEntry && cacheEntry.mtimeMs === stat.mtimeMs && cacheEntry.size === stat.size) {
    nextCache[file] = cacheEntry;
    continue;
  }

  const tempPath = path.join(IMAGE_DIR, `.tmp-resize-${Date.now()}-${file}`);
  const args =
    ext === ".jpg" || ext === ".jpeg"
      ? [
          "-Z",
          `${MAX_DIMENSION}`,
          "-s",
          "format",
          "jpeg",
          "-s",
          "formatOptions",
          `${JPEG_QUALITY}`,
          filePath,
          "--out",
          tempPath,
        ]
      : ["-Z", `${MAX_DIMENSION}`, filePath, "--out", tempPath];

  try {
    execFileSync(SIPS_PATH, args, { stdio: "ignore" });
    fs.renameSync(tempPath, filePath);
    const updated = fs.statSync(filePath);
    nextCache[file] = { mtimeMs: updated.mtimeMs, size: updated.size };
    processed += 1;
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.warn(`Image resize failed for ${file}.`);
  }
}

writeCache(nextCache);
console.log(`Image resize complete. Updated ${processed} file(s).`);
