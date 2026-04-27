type SiteHeaderProps = {
  eyebrow: string;
  title: string;
  navLinks: Array<{ label: string; href: string }>;
};

export default function SiteHeader({ eyebrow, title, navLinks }: SiteHeaderProps) {
  return (
    <header className="intro">
      <div className="intro-inner">

        {/* top bar */}
        <div className="intro-bar">
          <span>{eyebrow}</span>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="intro-bar-link">
              {link.label}
              <span className="intro-bar-arrow">↓</span>
            </a>
          ))}
        </div>

        {/* center content */}
        <div className="intro-center">
          <h1 className="intro-title">
            <span className="intro-title-word">Facets</span>
            <em className="intro-title-of">of the</em>
            <span className="intro-title-word">World</span>
          </h1>
        </div>

        {/* bottom bar */}
        <div className="intro-foot">
          <span>Photography</span>
          <a href={navLinks[0]?.href ?? "#"} className="intro-scroll" aria-label="Scroll to gallery">
            <span>Scroll</span>
            <div className="intro-scroll-line" />
          </a>
        </div>

      </div>
    </header>
  );
}
