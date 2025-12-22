"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type SiteHeaderProps = {
  eyebrow: string;
  title: string;
  navLinks: Array<{ label: string; href: string }>;
};

export default function SiteHeader({ eyebrow, title, navLinks }: SiteHeaderProps) {
  const [logoOpen, setLogoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!logoOpen) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [logoOpen]);

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

      {mounted && logoOpen
        ? createPortal(
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
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
