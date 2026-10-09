"use client";

import { useEffect, useRef } from "react";
import type { ArtKind } from "@/lib/content";

// Arte generativo dibujado en canvas (sin imágenes externas).
const LIME = "#a6ff3d";
const INK = "#e6f6dc";
const SURFACE = "#0c100d";

type Ctx = CanvasRenderingContext2D;

export const rand = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export function glow(ctx: Ctx, x: number, y: number, r: number, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(166,255,61,${a})`);
  g.addColorStop(1, "rgba(166,255,61,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function fitCanvas(cv: HTMLCanvasElement): [Ctx, number, number] {
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.max(1, r.width * dpr);
  cv.height = Math.max(1, r.height * dpr);
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [ctx, r.width, r.height];
}

const ART: Record<ArtKind, (ctx: Ctx, w: number, h: number) => void> = {
  prize(ctx, w, h) {
    const R = rand(7);
    ctx.fillStyle = SURFACE;
    ctx.fillRect(0, 0, w, h);
    glow(ctx, w * 0.75, h * 0.5, h * 0.9, 0.16);
    ctx.strokeStyle = "rgba(166,255,61,.10)";
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.ellipse(w * 0.75, h * 0.5, 40 + i * 26, 18 + i * 12, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(230,246,220,${R() * 0.5})`;
      ctx.fillRect(R() * w, R() * h, 1.5, 1.5);
    }
    const g = ctx.createLinearGradient(0, 0, w * 0.7, 0);
    g.addColorStop(0, "rgba(12,16,13,.96)");
    g.addColorStop(1, "rgba(12,16,13,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  city(ctx, w, h) {
    const R = rand(11);
    ctx.fillStyle = "#081009";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(166,255,61,.13)";
    ctx.lineWidth = 1;
    for (let x = -40; x < w + 40; x += 34 + R() * 26) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 30, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30 + R() * 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y - 18);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(166,255,61,.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.bezierCurveTo(w * 0.3, h * 0.5, w * 0.55, h * 0.75, w, h * 0.4);
    ctx.stroke();
    const hx = w * 0.64;
    const hy = h * 0.34;
    glow(ctx, hx, hy, 120, 0.35);
    ctx.strokeStyle = "rgba(166,255,61,.6)";
    ctx.lineWidth = 1;
    for (const r of [22, 44, 66]) {
      ctx.beginPath();
      ctx.arc(hx, hy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const x = R() * w;
      const y = R() * h * 0.7;
      ctx.fillStyle = LIME;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(166,255,61,.4)";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  space(ctx, w, h) {
    const R = rand(23);
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(230,246,220,${R() * 0.8})`;
      const s = R() * 1.6;
      ctx.fillRect(R() * w, R() * h, s, s);
    }
    const cx = w * 0.72;
    const cy = h * 0.32;
    glow(ctx, cx, cy, 90, 0.25);
    ctx.fillStyle = "#10180f";
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(166,255,61,.5)";
    ctx.stroke();
    ctx.strokeStyle = "rgba(166,255,61,.25)";
    for (const [a, b] of [[80, 26], [130, 44], [190, 64]]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, a, b, -0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(230,246,220,.5)";
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.95);
    ctx.quadraticCurveTo(w * 0.35, h * 0.1, cx - 60, cy + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = LIME;
    ctx.beginPath();
    ctx.arc(cx - 60, cy + 10, 4, 0, Math.PI * 2);
    ctx.fill();
  },
  field(ctx, w, h) {
    ctx.fillStyle = "#070b07";
    ctx.fillRect(0, 0, w, h);
    const hz = h * 0.42;
    glow(ctx, w * 0.5, hz, w * 0.5, 0.12);
    ctx.strokeStyle = "rgba(166,255,61,.22)";
    for (let i = -14; i <= 14; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, hz);
      ctx.lineTo(w * 0.5 + i * w * 0.09, h);
      ctx.stroke();
    }
    for (let i = 1; i < 9; i++) {
      const y = hz + (h - hz) * Math.pow(i / 9, 1.8);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const R = rand(5);
    let x = w * 0.52;
    ctx.fillStyle = "#0f170f";
    ctx.strokeStyle = "rgba(230,246,220,.35)";
    while (x < w) {
      const bw = 14 + R() * 26;
      const bh = 20 + R() * 70;
      ctx.fillRect(x, hz - bh, bw, bh);
      ctx.strokeRect(x, hz - bh, bw, bh);
      x += bw + 3;
    }
    ctx.strokeStyle = "rgba(166,255,61,.7)";
    for (let i = 0; i < 6; i++) ctx.strokeRect(w * 0.1 + i * 34, hz - 70 + (i % 2) * 14, 22, 22);
  },
  social(ctx, w, h) {
    ctx.fillStyle = "#060a08";
    ctx.fillRect(0, 0, w, h);
    const R = rand(31);
    const pts: [number, number][] = [];
    for (let i = 0; i < 46; i++) pts.push([w * 0.35 + R() * w * 0.6, R() * h * 0.8]);
    ctx.strokeStyle = "rgba(166,255,61,.16)";
    for (const a of pts)
      for (const b of pts) {
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 80) {
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        }
      }
    for (const [x, y] of pts) {
      ctx.fillStyle = R() > 0.8 ? LIME : "rgba(230,246,220,.7)";
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    glow(ctx, w * 0.7, h * 0.35, 130, 0.18);
    ctx.strokeStyle = "rgba(166,255,61,.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.7, h * 0.62);
    ctx.bezierCurveTo(w * 0.58, h * 0.5, w * 0.6, h * 0.22, w * 0.7, h * 0.16);
    ctx.bezierCurveTo(w * 0.8, h * 0.22, w * 0.82, h * 0.5, w * 0.7, h * 0.62);
    ctx.stroke();
    ctx.lineWidth = 1;
  },
  wallet(ctx, w, h) {
    ctx.fillStyle = "#0a110b";
    ctx.fillRect(0, 0, w, h);
    glow(ctx, w * 0.5, h * 0.5, w * 0.45, 0.2);
    ctx.strokeStyle = LIME;
    ctx.lineWidth = 2;
    const bw = w * 0.42;
    const bh = h * 0.46;
    const x = w * 0.29;
    const y = h * 0.27;
    ctx.strokeRect(x, y, bw, bh);
    ctx.strokeRect(x + bw * 0.6, y + bh * 0.34, bw * 0.4, bh * 0.32);
    ctx.fillStyle = INK;
    ctx.font = "500 11px monospace";
    ["abeja", "río", "llave", "sol", "…"].forEach((t, i) => ctx.fillText(t, w * 0.08, h * 0.2 + i * 18));
    ctx.lineWidth = 1;
  },
  exchange(ctx, w, h) {
    ctx.fillStyle = "#0a0f0b";
    ctx.fillRect(0, 0, w, h);
    glow(ctx, w * 0.62, h * 0.5, w * 0.4, 0.2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(230,246,220,.6)";
    ctx.beginPath();
    ctx.arc(w * 0.36, h * 0.5, h * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = LIME;
    ctx.beginPath();
    ctx.arc(w * 0.64, h * 0.5, h * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "600 20px sans-serif";
    ctx.fillStyle = INK;
    ctx.fillText("$", w * 0.36, h * 0.5 + 7);
    ctx.fillStyle = LIME;
    ctx.fillText("₮", w * 0.64, h * 0.5 + 7);
    ctx.font = "500 10px monospace";
    ctx.fillText("BEP-20", w * 0.64, h * 0.88);
    ctx.textAlign = "start";
    ctx.lineWidth = 1;
  },
  network(ctx, w, h) {
    ctx.fillStyle = "#090d0a";
    ctx.fillRect(0, 0, w, h);
    const nodes: [number, number, boolean][] = [
      [0.5, 0.22, true],
      [0.25, 0.75, false],
      [0.75, 0.75, false],
    ];
    ctx.strokeStyle = "rgba(230,246,220,.4)";
    ctx.lineWidth = 1.5;
    for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
      ctx.beginPath();
      ctx.moveTo(nodes[a][0] * w, nodes[a][1] * h);
      ctx.lineTo(nodes[b][0] * w, nodes[b][1] * h);
      ctx.stroke();
    }
    for (const [x, y, on] of nodes) {
      if (on) glow(ctx, x * w, y * h, 60, 0.3);
      ctx.fillStyle = "#0f160f";
      ctx.strokeStyle = on ? LIME : "rgba(230,246,220,.5)";
      ctx.beginPath();
      ctx.arc(x * w, y * h, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  },
};

/** Canvas que ocupa su contenedor y se redibuja al cambiar de tamaño. */
export function Art({ kind, className = "absolute inset-0 h-full w-full" }: { kind: ArtKind; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const paint = () => {
      const [ctx, w, h] = fitCanvas(cv);
      ART[kind](ctx, w, h);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [kind]);
  return <canvas ref={ref} className={className} aria-hidden />;
}
