import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type Props = {
  className?: string;
  density?: number;
};

type Dot = { x: number; y: number; vx: number; vy: number; r: number; a: number };

export function ParticleShimmer({ className, density = 48 }: Props) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let frame = 0;
    let raf = 0;
    let visible = true;
    const dots: Dot[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots.length = 0;
      const count = Math.min(density, Math.floor((width * height) / 9000));
      for (let i = 0; i < count; i += 1) {
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.08,
          r: Math.random() * 1.2 + 0.4,
          a: Math.random() * 0.35 + 0.08,
        });
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    const draw = () => {
      raf = window.requestAnimationFrame(draw);
      if (!visible) {
        return;
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = w;
        if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h;
        if (d.y > h) d.y = 0;
        ctx.fillStyle = `rgba(242, 242, 242, ${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame += 1;
      if (frame % 120 === 0) {
        const flicker = dots[0];
        if (flicker) flicker.a = Math.random() * 0.25 + 0.05;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [density, reduced]);

  if (reduced) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
