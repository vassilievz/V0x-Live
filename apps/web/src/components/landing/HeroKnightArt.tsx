import { useEffect, useRef } from "react";
import heroArt from "@/assets/hero-knight.jpg";
import { mountHeroArtGrain } from "@/components/landing/heroArtGrain";

export function HeroKnightArt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const hero = container.closest(".home-hero");
    if (hero && canvas.parentElement !== hero) {
      hero.insertBefore(canvas, hero.querySelector(".home-hero-inner"));
    }

    return mountHeroArtGrain(container, canvas);
  }, []);

  return (
    <div ref={containerRef} className="home-hero-art" aria-hidden="true">
      <img
        src={heroArt}
        alt=""
        className="home-hero-art-image"
        width={1200}
        height={1600}
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
      <canvas ref={canvasRef} className="home-hero-art-grain" aria-hidden="true" />
    </div>
  );
}
