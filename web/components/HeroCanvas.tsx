"use client";

import { useEffect, useRef } from "react";
import { fitCanvas, glow, rand } from "./Art";

/** Constelación de nodos conectados, como bloques de una red. Estática si el usuario prefiere menos movimiento. */
export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let ctx: CanvasRenderingContext2D;
    let W = 0;
    let H = 0;
    let pts: { x: number; y: number; vx: number; vy: number; s: number }[] = [];

    const setup = () => {
      [ctx, W, H] = fitCanvas(cv);
      const R = rand(42);
      pts = Array.from({ length: 90 }, () => {
        const a = R() * Math.PI * 2;
        const r = Math.sqrt(R());
        return {
          x: W / 2 + Math.cos(a) * r * Math.min(W * 0.48, 520),
          y: H * 0.3 + Math.sin(a) * r * H * 0.28,
          vx: (R() - 0.5) * 0.18,
          vy: (R() - 0.5) * 0.18,
          s: R(),
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      glow(ctx, W / 2, H * 0.3, Math.min(W, 900) * 0.5, 0.07);
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.strokeStyle = `rgba(166,255,61,${(1 - d / 120) * 0.22})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      for (const p of pts) {
        ctx.fillStyle = p.s > 0.86 ? "#a6ff3d" : `rgba(230,246,220,${0.25 + p.s * 0.45})`;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
      const fade = ctx.createLinearGradient(0, H * 0.4, 0, H * 0.75);
      fade.addColorStop(0, "rgba(6,8,7,0)");
      fade.addColorStop(1, "rgba(6,8,7,1)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, H * 0.4, W, H * 0.6);
    };

    const loop = () => {
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H * 0.65) p.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    setup();
    draw();
    if (!reduce) raf = requestAnimationFrame(loop);

    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setup();
        draw();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full opacity-90" aria-hidden />;
}
