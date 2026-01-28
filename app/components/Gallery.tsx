"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";

type GalleryImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type GalleryProps = {
  images: GalleryImage[];
};

const EAGER_IMAGE_COUNT = 8;
const HIGH_PRIORITY_COUNT = 4;

export default function Gallery({ images }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeLock = useRef(false);
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

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
  }, [activeIndex]);

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    swipeLock.current = true;
    if (deltaX < 0) {
      showNext();
    } else {
      showPrev();
    }

    window.setTimeout(() => {
      swipeLock.current = false;
    }, 250);
  };

  const handleOverlayClick = () => {
    if (swipeLock.current) {
      return;
    }
    close();
  };

  return (
    <div className="gallery">
      <div className="masonry">
        {images.map((image, index) => {
          const eager = index < EAGER_IMAGE_COUNT;
          const highPriority = index < HIGH_PRIORITY_COUNT;

          return (
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
                loading={eager ? "eager" : "lazy"}
                fetchPriority={highPriority ? "high" : "auto"}
                decoding="async"
                className="gallery-image"
              />
            </button>
          );
        })}
      </div>

      {mounted && activeImage
        ? createPortal(
            <div
              className="lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Expanded image view"
              onClick={handleOverlayClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="lightbox-inner"
                onClick={(event) => event.stopPropagation()}
              >
                <img
                  src={activeImage.src}
                  alt={activeImage.alt}
                  decoding="async"
                  className="lightbox-image"
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
