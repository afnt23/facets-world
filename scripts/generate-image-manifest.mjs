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

const getPngSize = (buffer) => {
  if (buffer.length < 24) return null;
  const signature = buffer.slice(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
};

const getGifSize = (buffer) => {
  if (buffer.length < 10) return null;
  const header = buffer.slice(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  return { width, height };
};

const getJpegSize = (buffer) => {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    let marker = buffer[offset + 1];
    while (marker === 0xff) {
      offset += 1;
      marker = buffer[offset + 1];
    }

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (!segmentLength) return null;

    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isSof) {
      if (offset + 7 >= buffer.length) return null;
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    offset += 2 + segmentLength;
  }

  return null;
};

const getImageSize = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".png") return getPngSize(buffer);
  if (ext === ".gif") return getGifSize(buffer);
  if (ext === ".jpg" || ext === ".jpeg") return getJpegSize(buffer);

  return null;
};

const ensureManifest = () => {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.writeFileSync(OUTPUT, JSON.stringify([]));
    return;
  }

  const files = fs.readdirSync(IMAGE_DIR);
  const images = files
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .map((file) => {
      const size = getImageSize(path.join(IMAGE_DIR, file));
      return {
        file,
        width: size?.width ?? null,
        height: size?.height ?? null,
      };
    });

  fs.writeFileSync(OUTPUT, JSON.stringify(images, null, 2));
};

ensureManifest();
