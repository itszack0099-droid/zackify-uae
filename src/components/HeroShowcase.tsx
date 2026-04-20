import { useEffect, useRef, useState } from "react";
import heroVideo from "@/assets/hero-luxury-uae.mp4.asset.json";
import hero1 from "@/assets/hero-uae-1.jpg";
import hero2 from "@/assets/hero-uae-2.jpg";
import hero3 from "@/assets/hero-uae-3.jpg";
import hero4 from "@/assets/hero-uae-4.jpg";

const POSTER_SLIDES = [
  { src: hero1, alt: "Luxury sports car at Dubai sunset" },
  { src: hero2, alt: "Premium gym lifestyle in Dubai" },
  { src: hero3, alt: "Luxury phone and accessories flat lay" },
  { src: hero4, alt: "Modern Emirati man at sunset" },
];

const SLIDE_MS = 5500;

/**
 * Cinematic auto-playing hero with a real luxury UAE MP4 reel.
 * If the video fails to load (slow network, codec, etc.), automatically
 * falls back to the Ken-Burns image carousel — so the hero is never empty.
 */
export function HeroShowcase() {
  const [idx, setIdx] = useState(0);
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoOk) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % POSTER_SLIDES.length),
      SLIDE_MS,
    );
    return () => clearInterval(t);
  }, [videoOk]);

  // Force mobile autoplay
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
  }, []);

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-3xl border border-gold/30 shadow-luxury group">
      {videoOk ? (
        <video
          ref={videoRef}
          src={heroVideo.url}
          autoPlay
          loop
          muted
          playsInline
          poster={hero1}
          preload="auto"
          aria-label="Luxury UAE lifestyle reel"
          onError={() => setVideoOk(false)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        POSTER_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== idx}
          >
            <img
              src={s.src}
              alt={s.alt}
              width={1920}
              height={1080}
              loading={i === 0 ? "eager" : "lazy"}
              className={`w-full h-full object-cover ${i === idx ? "animate-kenburns" : ""}`}
            />
          </div>
        ))
      )}

      {/* Top + bottom luxury gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/70 to-transparent pointer-events-none" />

      {/* Floating gold orbs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl animate-float pointer-events-none" />
      <div
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-deep-green/30 blur-3xl animate-float pointer-events-none"
        style={{ animationDelay: "2s" }}
      />

      {/* Corner badge */}
      <div className="absolute top-4 left-4 glass border border-gold/40 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-gold opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
        </span>
        <span className="text-gold font-semibold tracking-wider uppercase">
          Live · UAE
        </span>
      </div>
    </div>
  );
}
