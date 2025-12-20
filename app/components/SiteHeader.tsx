"use client";

import { useCallback, useEffect, useState } from "react";

type SiteHeaderProps = {
  eyebrow: string;
  title: string;
  navLinks: Array<{ label: string; href: string }>;
};

export default function SiteHeader({ eyebrow, title, navLinks }: SiteHeaderProps) {
  const [logoOpen, setLogoOpen] = useState(false);

  const closeLogo = useCallback(() => {
    setLogoOpen(false);
  }, []);

  useEffect(() => {
    if (!logoOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLogo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [logoOpen, closeLogo]);

  return (
    <header className="site-header">
      <div className="brand">
        <button
          type="button"
          className="logo-button"
          onClick={() => setLogoOpen(true)}
          aria-label="Open logo"
        >
          <img
            src="/logo.png"
            alt="Facets Of The World logo"
            className="brand-logo"
          />
        </button>
        <p className="brand-eyebrow">{eyebrow}</p>
        <h1 className="brand-title">{title}</h1>
      </div>
      <nav className="site-nav" aria-label="Primary">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      {logoOpen ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Logo view"
          onClick={closeLogo}
        >
          <div
            className="lightbox-inner"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src="/logo.png"
              alt="Facets Of The World logo"
              className="logo-popup-image"
            />
            <div className="lightbox-controls">
              <button
                type="button"
                className="lightbox-button"
                onClick={closeLogo}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
