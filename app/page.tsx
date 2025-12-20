import Gallery from "./components/Gallery";
import SiteHeader from "./components/SiteHeader";

export default function Home() {
  return (
    <div className="page">
      <SiteHeader
        eyebrow="Arthur Fontanelli"
        title="Facets Of The World"
        navLinks={[{ label: "Gallery", href: "#gallery" }]}
      />

      <main id="gallery" className="gallery-section">
        <Gallery />
      </main>

    </div>
  );
}
