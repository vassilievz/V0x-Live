import { type ReactNode, useEffect, useRef } from "react";
import {
  createNoise,
  drawHalftoneField,
  seedFromCode,
} from "@/components/background/halftoneNoise";

type Props = {
  code: string;
  children: ReactNode;
};

const SPACING = 13;
const FRAME_MS = 33;

export function HighlightHalftoneCell({ code, children }: Props) {
  const cellRef = useRef<HTMLLIElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cell = cellRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!(cell && canvas && ctx)) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const noise = createNoise(seedFromCode(code));
    let hovering = false;
    let raf = 0;
    let time = 0;
    let lastTick = 0;
    let pointer = { x: 0, y: 0, active: false };

    const size = () => ({
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = () => {
      const { width, height } = size();
      if (width < 1 || height < 1) {
        return;
      }
      const color = getComputedStyle(canvas).color;
      drawHalftoneField(ctx, width, height, SPACING, time, noise, color, pointer);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!hovering) {
        return;
      }
      if (now - lastTick >= FRAME_MS) {
        time += (now - lastTick) / 1000;
        lastTick = now;
        paint();
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || reduceMotion) {
        return;
      }
      lastTick = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onEnter = () => {
      hovering = true;
      cell.classList.add("is-hover");
      resize();
      paint();
      if (!reduceMotion) {
        start();
      }
    };

    const onLeave = () => {
      hovering = false;
      pointer.active = false;
      cell.classList.remove("is-hover");
      stop();
      ctx.clearRect(0, 0, size().width, size().height);
    };

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer = { x, y, active: true };
      cell.style.setProperty("--hx", `${(x / rect.width) * 100}%`);
      cell.style.setProperty("--hy", `${(y / rect.height) * 100}%`);
      if (reduceMotion && hovering) {
        paint();
      }
    };

    cell.addEventListener("mouseenter", onEnter);
    cell.addEventListener("mouseleave", onLeave);
    cell.addEventListener("mousemove", onMove);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (hovering) {
        paint();
      }
    });
    resizeObserver.observe(cell);

    return () => {
      stop();
      resizeObserver.disconnect();
      cell.removeEventListener("mouseenter", onEnter);
      cell.removeEventListener("mouseleave", onLeave);
      cell.removeEventListener("mousemove", onMove);
    };
  }, [code]);

  return (
    <li ref={cellRef} className="home-highlight-cell">
      <canvas
        ref={canvasRef}
        className="home-highlight-cell__halftone"
        aria-hidden="true"
      />
      <div className="home-highlight-cell__inner">{children}</div>
    </li>
  );
}
