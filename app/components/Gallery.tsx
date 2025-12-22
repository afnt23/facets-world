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
};

type GalleryProps = {
  images: GalleryImage[];
};

export default function Gallery({ images }: GalleryProps) {
  const [introActive, setIntroActive] = useState(true);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
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

  const handleIntroEnd = () => {
    setIntroActive(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!introActive || !mounted) return;
    const video = introVideoRef.current;
    if (!video) return;

    const tryPlay = () => {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          window.setTimeout(handleIntroEnd, 500);
        });
      }
    };

    const onCanPlay = () => {
      tryPlay();
    };

    video.addEventListener("canplay", onCanPlay);
    tryPlay();

    const fallback = window.setTimeout(() => {
      if (video.paused) {
        handleIntroEnd();
      }
    }, 3500);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      window.clearTimeout(fallback);
    };
  }, [introActive, mounted]);

  useEffect(() => {
    if (!introActive && activeIndex === null) return;

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
  }, [introActive, activeIndex]);

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

      {mounted && introActive
        ? createPortal(
            <div
              className="lightbox intro-splash"
              role="dialog"
              aria-modal="true"
              aria-label="Intro video"
            >
              <div className="lightbox-inner">
                <video
                  className={`intro-video${introPlaying ? " is-playing" : ""}`}
                  src={encodeURI("/My Movie 3.mp4")}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  controls={false}
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  ref={introVideoRef}
                  onPlaying={() => setIntroPlaying(true)}
                  onEnded={handleIntroEnd}
                  onError={handleIntroEnd}
                />
              </div>
            </div>,
            document.body,
          )
        : null}

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
