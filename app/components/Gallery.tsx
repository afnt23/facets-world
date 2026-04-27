"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
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

const EAGER_COUNT = 8;
const PRIORITY_COUNT = 4;

export default function Gallery({ images }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [colCount, setColCount] = useState(2);
  const [viewportWidth, setViewportWidth] = useState(375);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeLock = useRef(false);
  const masonryRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  // ── scroll to top on load ────────────────────────────
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // ── responsive column count (before first paint) ─────
  useLayoutEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      setColCount(w >= 1400 ? 4 : w >= 900 ? 3 : 2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── greedy column distribution ────────────────────────
  const columns = useMemo(() => {
    // Estimate column width to convert the 10px gap into ratio units so the
    // greedy algorithm accounts for the gap cost each item adds to a column.
    const pagePad = Math.min(44, Math.max(20, viewportWidth * 0.035));
    const colWidth = Math.max(80, (viewportWidth - 2 * pagePad - (colCount - 1) * 10) / colCount);
    const gapRatio = 10 / colWidth;

    const cols: Array<Array<{ image: GalleryImage; i: number }>> =
      Array.from({ length: colCount }, () => []);
    const heights = new Array(colCount).fill(0);
    images.forEach((image, i) => {
      const ratio = (image.height ?? 1333) / (image.width ?? 2000);
      let shortest = 0;
      for (let c = 1; c < colCount; c++) {
        if (heights[c] < heights[shortest]) shortest = c;
      }
      cols[shortest].push({ image, i });
      heights[shortest] += ratio + gapRatio;
    });
    return cols;
  }, [images, colCount, viewportWidth]);

  // ── scroll reveal ────────────────────────────────────
  useEffect(() => {
    const container = masonryRef.current;
    if (!container) return;
    let n = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${(n % 6) * 65}ms`;
          n++;
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -24px 0px" },
    );
    container.querySelectorAll(".masonry-item").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [columns]);

  // ── lightbox controls ────────────────────────────────
  const close = useCallback(() => setActiveIndex(null), []);
  const showNext = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i + 1) % total));
  }, [total]);
  const showPrev = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i - 1 + total) % total));
  }, [total]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, showNext, showPrev]);

  useEffect(() => { setMounted(true); }, []);

  // ── scroll lock ──────────────────────────────────────
  useEffect(() => {
    if (activeIndex === null) return;
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position, top: body.style.top,
      left: body.style.left, right: body.style.right, width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0"; body.style.right = "0"; body.style.width = "100%";
    return () => {
      Object.assign(body.style, prev);
      window.scrollTo(0, scrollY);
    };
  }, [activeIndex]);

  // ── touch ────────────────────────────────────────────
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    swipeLock.current = true;
    dx < 0 ? showNext() : showPrev();
    setTimeout(() => { swipeLock.current = false; }, 250);
  };

  const activeImage = activeIndex !== null ? images[activeIndex] : null;
  const counter = activeIndex !== null
    ? `${String(activeIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
    : "";

  return (
    <div className="gallery">
      <div className="gallery-lead">
        <span>Selected Works</span>
        <span>{total}</span>
      </div>

      <div className="masonry" ref={masonryRef}>
        {columns.map((col, ci) => (
          <div key={ci} className="masonry-col">
            {col.map(({ image, i }) => {
              const eager = i < EAGER_COUNT;
              const priority = i < PRIORITY_COUNT;
              return (
                <div key={image.src} className="masonry-item">
                  <button
                    type="button"
                    className="image-tile"
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Open photo ${i + 1}`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width ?? 2000}
                      height={image.height ?? 1333}
                      sizes="(max-width: 899px) 50vw, (max-width: 1399px) 34vw, 25vw"
                      priority={priority}
                      loading={priority ? undefined : eager ? "eager" : "lazy"}
                      className="gallery-image"
                      style={{ width: "100%", height: "auto", display: "block" }}
                      ref={(el) => { if (el?.complete) el.classList.add("is-loaded"); }}
                      onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                      unoptimized
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {mounted && activeImage ? createPortal(
        <div
          className="lightbox"
          role="dialog" aria-modal="true" aria-label="Photo viewer"
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        >
          <div className="lightbox-topbar">
            <span className="lightbox-counter">{counter}</span>
            <button type="button" className="lightbox-close" onClick={close} aria-label="Close">Close</button>
          </div>
          <div
            className="lightbox-stage"
            onClick={(e) => { if (e.target === e.currentTarget && !swipeLock.current) close(); }}
          >
            <Image
              key={activeImage.src}
              src={activeImage.src}
              alt={activeImage.alt}
              width={activeImage.width ?? 2000}
              height={activeImage.height ?? 1333}
              priority
              className="lightbox-image"
              style={{ width: "auto", height: "auto" }}
              unoptimized
            />
          </div>
          <div className="lightbox-hint">← → navigate &nbsp;&nbsp;·&nbsp;&nbsp; esc close</div>
          {total > 1 && (
            <>
              <button type="button" className="lightbox-prev" onClick={showPrev} aria-label="Previous">‹</button>
              <button type="button" className="lightbox-next" onClick={showNext} aria-label="Next">›</button>
            </>
          )}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
