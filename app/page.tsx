import fs from "fs";
import path from "path";
import Gallery from "./components/Gallery";
import SiteHeader from "./components/SiteHeader";


type ImageManifestEntry = {
  file: string;
  country?: string;
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
    // Key by "Country/filename" so same filename in different countries is distinct
    return new Map(data.map((entry) => [`${entry.country ?? ""}/${entry.file}`, entry]));
  } catch {
    return new Map<string, ImageManifestEntry>();
  }
};

const getImages = () => {
  const picsDir = path.join(process.cwd(), "public", "pictures");
  if (!fs.existsSync(picsDir)) return [];

  const manifest = readManifest();
  const images: Array<{ src: string; alt: string; country: string; width?: number; height?: number }> = [];

  for (const country of fs.readdirSync(picsDir).sort()) {
    const countryDir = path.join(picsDir, country);
    if (!fs.statSync(countryDir).isDirectory()) continue;

    for (const file of fs.readdirSync(countryDir).sort()) {
      if (!IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
      const meta = manifest.get(`${country}/${file}`);
      images.push({
        src: encodeURI(`/pictures/${country}/${file}`),
        alt: toAltText(file) || "Photograph",
        country,
        width: meta?.width,
        height: meta?.height,
      });
    }
  }

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

      <footer className="site-footer">
        © 2026 Arthur Fontanelli. All photographs are original works and may not be reproduced, distributed, or used without written permission.
      </footer>

    </div>
  );
}
