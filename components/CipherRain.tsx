"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "0123456789ABCDEF#%&$?/<>*+=";
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

/** Ambient falling-ciphertext backdrop. Sparse, slow, and paused for reduced motion. */
export function CipherRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const FS = 15;
    let cols: { x: number; y: number; sp: number }[] = [];
    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.floor(w / (FS * 2.2));
      cols = Array.from({ length: n }, (_, i) => ({
        x: i * FS * 2.2 + FS,
        y: Math.random() * h,
        sp: 0.22 + Math.random() * 0.4,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      if (now - last > 66) {
        last = now;
        ctx.clearRect(0, 0, w, h);
        ctx.font = `${FS}px ui-monospace, monospace`;
        for (const c of cols) {
          c.y += c.sp * FS;
          if (c.y > h + FS) {
            c.y = -FS * 2;
            c.sp = 0.22 + Math.random() * 0.4;
          }
          ctx.fillStyle = "rgba(124,183,172,0.13)";
          ctx.fillText(rnd(), c.x, c.y);
          ctx.fillStyle = "rgba(124,183,172,0.04)";
          ctx.fillText(rnd(), c.x, c.y - FS * 2.4);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-40"
    />
  );
}
