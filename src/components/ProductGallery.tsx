import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  alt: string;
};

/**
 * Premium product gallery: horizontal slide with parallax background,
 * dot indicators, swipe support, and an active thumbnail strip.
 */
export function ProductGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [animDir, setAnimDir] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  const total = images.length;
  const safeImages = total > 0 ? images : [];

  const go = (next: number) => {
    if (total === 0) return;
    const wrapped = (next + total) % total;
    setAnimDir(wrapped > active || (active === total - 1 && wrapped === 0) ? 1 : -1);
    setActive(wrapped);
  };

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft") go(active - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, total]);

  // Parallax: track pointer over the main image
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--px", String(x));
    el.style.setProperty("--py", String(y));
  };
  const onMouseLeave = () => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? active + 1 : active - 1);
    touchStart.current = null;
  };

  if (total === 0) {
    return (
      <div className="aspect-square rounded-2xl glass border border-gold/20 flex items-center justify-center text-muted-foreground text-sm">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative aspect-square rounded-2xl overflow-hidden glass border border-gold/20 group select-none"
        style={{ ["--px" as string]: "0", ["--py" as string]: "0" }}
      >
        {/* Slides */}
        {safeImages.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
              i === active
                ? "opacity-100 translate-x-0 scale-100 z-10"
                : i < active
                  ? "opacity-0 -translate-x-8 scale-[0.98] z-0"
                  : "opacity-0 translate-x-8 scale-[0.98] z-0"
            }`}
          >
            {/* Parallax background */}
            <div
              aria-hidden
              className="absolute inset-0 scale-110 blur-2xl opacity-40"
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: `translate3d(calc(var(--px) * -16px), calc(var(--py) * -16px), 0) scale(1.15)`,
                transition: "transform 0.4s ease-out",
              }}
            />
            {/* Foreground image with parallax */}
            <img
              src={src}
              alt={`${alt} — image ${i + 1}`}
              loading={i === active ? "eager" : "lazy"}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover will-change-transform"
              style={{
                transform: `translate3d(calc(var(--px) * 18px), calc(var(--py) * 18px), 0) scale(1.05)`,
                transition: "transform 0.4s ease-out",
              }}
            />
          </div>
        ))}

        {/* Gold sheen on slide change */}
        <div
          key={`sheen-${active}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, oklch(0.88 0.15 90 / 22%) 50%, transparent 70%)",
            transform: animDir === 1 ? "translateX(-120%)" : "translateX(120%)",
            animation: "gallerySheen 0.9s ease-out forwards",
          }}
        />

        {/* Controls */}
        {total > 1 && (
          <>
            <button
              onClick={() => go(active - 1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full glass border border-gold/30 text-gold flex items-center justify-center hover:bg-gold hover:text-deep-green transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => go(active + 1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full glass border border-gold/30 text-gold flex items-center justify-center hover:bg-gold hover:text-deep-green transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-6 bg-gradient-gold" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute top-3 right-3 z-30 text-[11px] font-medium glass border border-gold/30 text-gold px-2.5 py-1 rounded-full">
              {active + 1} / {total}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {safeImages.map((img, i) => (
            <button
              key={`thumb-${i}`}
              onClick={() => go(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-gold shadow-gold scale-[1.03]"
                  : "border-gold/15 opacity-60 hover:opacity-100 hover:border-gold/40"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
