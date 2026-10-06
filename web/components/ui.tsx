"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { explorerAddress, explorerTx } from "@/lib/config";
import { shortAddr } from "@/lib/format";

export function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-12 sm:py-16">
      {kicker && <p className="label mb-2 text-accent">{kicker}</p>}
      <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

/** Número que se anima desde el valor anterior al nuevo y destella al cambiar. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const [flash, setFlash] = useState(0);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const t0 = performance.now();
    const dur = 900;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    setFlash((f) => f + 1);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span key={flash} className={flash ? "animate-flash" : undefined}>
      {format(shown)}
    </span>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.round(w)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${w}%` }} />
    </div>
  );
}

export function AddressLink({ address, chars = 4, full = false }: { address?: string; chars?: number; full?: boolean }) {
  if (!address) return <span className="font-mono text-muted">—</span>;
  return (
    <a href={explorerAddress(address)} target="_blank" rel="noreferrer" className="link break-all font-mono">
      {full ? address : shortAddr(address, chars)}
    </a>
  );
}

export function TxLink({ hash, chars = 6 }: { hash: string; chars?: number }) {
  return (
    <a href={explorerTx(hash)} target="_blank" rel="noreferrer" className="link font-mono">
      {shortAddr(hash, chars)}
    </a>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="rounded border border-line px-2 py-0.5 text-xs text-muted hover:text-ink"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {}
      }}
    >
      {ok ? "Copiado" : "Copiar"}
    </button>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "border-bad/40 bg-bad/10 text-bad"
      : tone === "ok"
        ? "border-ok/40 bg-ok/10 text-ok"
        : "border-line bg-raised text-muted";
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}
