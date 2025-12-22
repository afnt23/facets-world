import fs from "fs";
import path from "path";
import Gallery from "./components/Gallery";
import SiteHeader from "./components/SiteHeader";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type ImageManifestEntry = {
  file: string;
  width?: number;
  height?: number;
};

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
]);

const toAltText = (filename: string) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const readManifest = () => {
  const manifestPath = path.join(process.cwd(), "public", "images.json");
  if (!fs.existsSync(manifestPath)) {
    return new Map<string, ImageManifestEntry>();
  }

  try {
    const data = JSON.parse(
      fs.readFileSync(manifestPath, "utf8"),
    ) as ImageManifestEntry[];
    return new Map(data.map((entry) => [entry.file, entry]));
  } catch {
    return new Map<string, ImageManifestEntry>();
  }
};

const getImages = () => {
  const directory = path.join(process.cwd(), "public", "pictures");
  if (!fs.existsSync(directory)) {
    return [];
  }

  const manifest = readManifest();
  const files = fs.readdirSync(directory);
  const images = files
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .map((file) => {
      const alt = toAltText(file) || "Photograph";
      const meta = manifest.get(file);
      return {
        src: encodeURI(`/pictures/${file}`),
        alt,
        width: meta?.width,
        height: meta?.height,
      };
    });

  return shuffle(images);
};

export default function Home() {
  const images = getImages();

  return (
    <div className="page">
      <SiteHeader
        eyebrow="Arthur Fontanelli"
        title="Facets Of The World"
        navLinks={[{ label: "Gallery", href: "#gallery" }]}
      />

      <main id="gallery" className="gallery-section">
        <Gallery images={images} />
      </main>

    </div>
  );
}
