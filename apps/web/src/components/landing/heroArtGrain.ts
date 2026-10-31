import { createNoise, drawHalftoneField } from "@/components/background/halftoneNoise";

const HERO_GRAIN_SEED = 19;
const FRAME_MS = 33;

export function mountHeroArtGrain(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return () => undefined;
  }

  const hero = container.closest(".home-hero");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noise = createNoise(HERO_GRAIN_SEED);
  let raf = 0;
  let time = 0;
  let lastFrame = 0;
  let visible = true;
  const pointer = { x: 0, y: 0, active: false };

  const layoutCanvas = () => {
    if (!hero || canvas.parentElement !== hero) {
      canvas.style.left = "";
      canvas.style.top = "";
      canvas.style.width = "";
      canvas.style.height = "";
      return;
    }
    const rect = container.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    canvas.style.left = `${rect.left - heroRect.left}px`;
    canvas.style.top = `${rect.top - heroRect.top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  const resize = () => {
    layoutCanvas();
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(0, rect.width);
    const h = Math.max(0, rect.height);
    if (w < 1 || h < 1) {
      return;
    }
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const paint = () => {
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w < 1 || h < 1) {
      return;
    }

    drawHalftoneField(
      ctx,
      w,
      h,
      11,
      time,
      noise,
      "#ffffff",
      pointer,
      {
        alphaMin: 0.05,
        alphaMax: 0.2,
        pointerRadius: 150,
        maxRadiusScale: 0.34,
        pointerBoost: 1.65,
      },
    );
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible) {
      return;
    }
    if (now - lastFrame >= FRAME_MS) {
      time += (now - lastFrame) / 1000;
      lastFrame = now;
      paint();
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf || reduceMotion) {
      paint();
      return;
    }
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const syncPointer = (clientX: number, clientY: number) => {
    const rect = container.getBoundingClientRect();
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
    pointer.active = true;
  };

  const onHeroMove = (event: MouseEvent) => {
    syncPointer(event.clientX, event.clientY);
    if (reduceMotion) {
      paint();
    }
  };

  const onHeroLeave = () => {
    pointer.active = false;
    if (reduceMotion) {
      paint();
    }
  };

  const onVisibility = () => {
    visible = document.visibilityState === "visible";
    if (visible) {
      start();
    } else {
      stop();
    }
  };

  resize();
  paint();
  canvas.classList.add("is-ready");
  start();

  hero?.addEventListener("mousemove", onHeroMove);
  hero?.addEventListener("mouseleave", onHeroLeave);
  document.addEventListener("visibilitychange", onVisibility);

  const ro = new ResizeObserver(() => {
    resize();
    paint();
  });
  ro.observe(container);
  window.addEventListener("resize", resize, { passive: true });

  return () => {
    stop();
    ro.disconnect();
    window.removeEventListener("resize", resize);
    hero?.removeEventListener("mousemove", onHeroMove);
    hero?.removeEventListener("mouseleave", onHeroLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    if (canvas.parentElement !== container) {
      container.appendChild(canvas);
    }
  };
}
