"use client";

import { useCallback, useEffect, useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const toAltText = (filename: string) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function Gallery() {
  const [introActive, setIntroActive] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
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

  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      try {
        const response = await fetch("/images.json");
        if (!response.ok) {
          throw new Error("Failed to load image manifest.");
        }
        const files = (await response.json()) as Array<{
          file: string;
          width: number | null;
          height: number | null;
        }>;
        const mapped = files.map((entry) => ({
          src: encodeURI(`/pictures/${entry.file}`),
          alt: toAltText(entry.file) || "Photograph",
          width: entry.width ?? undefined,
          height: entry.height ?? undefined,
        }));
        if (isMounted) {
          setImages(shuffle(mapped));
        }
      } catch {
        if (isMounted) {
          setImages([]);
        }
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
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
              width={image.width}
              height={image.height}
              loading={index < 2 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
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
