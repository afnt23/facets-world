"use client";

import { useCallback, useEffect, useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
};

type GalleryProps = {
  images: GalleryImage[];
};

export default function Gallery({ images }: GalleryProps) {
  const [introActive, setIntroActive] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = images.length;

  const close = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current + 1) % total;
    });
  }, [total]);

  const showPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current - 1 + total) % total;
    });
  }, [total]);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
      if (event.key === "ArrowRight") {
        showNext();
      }
      if (event.key === "ArrowLeft") {
        showPrev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, close, showNext, showPrev]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroActive(false);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  return (
    <div className="gallery">
      <div className="masonry">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            className="masonry-item image-tile"
            onClick={() => setActiveIndex(index)}
            aria-label={`Open image ${index + 1}`}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading={index < 6 ? "eager" : "lazy"}
              fetchPriority={index < 2 ? "high" : "auto"}
              decoding="async"
              className="gallery-image"
            />
          </button>
        ))}
      </div>

      {introActive ? (
        <div
          className="lightbox intro-splash"
          role="dialog"
          aria-modal="true"
          aria-label="Intro logo"
        >
          <div className="lightbox-inner">
            <img
              src="/logo.png"
              alt="Facets Of The World logo"
              className="logo-popup-image"
            />
          </div>
        </div>
      ) : null}

      {activeImage ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded image view"
          onClick={close}
        >
          <div className="lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="lightbox-image"
            />
            <div className="lightbox-controls">
              <button
                type="button"
                className="lightbox-button"
                onClick={showPrev}
                aria-label="Previous image"
              >
                Prev
              </button>
              <button
                type="button"
                className="lightbox-button"
                onClick={close}
                aria-label="Close image view"
              >
                Close
              </button>
              <button
                type="button"
                className="lightbox-button"
                onClick={showNext}
                aria-label="Next image"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
