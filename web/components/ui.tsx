"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { explorerAddress, explorerTx } from "@/lib/config";
import { shortAddr } from "@/lib/format";

/** Sección con encabezado centrado: kicker mono, título y bajada opcional. */
export function Section({
  id,
  title,
  kicker,
  intro,
  extra,
  children,
}: {
  id?: string;
  title: string;
  kicker?: string;
  intro?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="section">
      <div className="mx-auto mb-10 grid max-w-2xl justify-items-center gap-3.5 text-center">
        {kicker && <p className="kicker">{kicker}</p>}
        <h2 className="text-[clamp(1.7rem,3.4vw,2.5rem)] font-semibold leading-[1.1]">{title}</h2>
        {intro && <p className="max-w-[62ch] text-body">{intro}</p>}
        {extra}
      </div>
      {children}
    </section>
  );
}

export function Arrow() {
  return (
    <svg className="h-4 w-4 flex-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
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

export function ProgressBar({ pct, thin = false }: { pct: number; thin?: boolean }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={`${thin ? "h-1.5" : "h-2.5"} w-full overflow-hidden rounded-full bg-raised`}
      role="progressbar"
      aria-valuenow={Math.round(w)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
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
      className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted hover:text-ink"
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
      ? "border-bad/40 bg-bad/10 text-[#ffb3bb]"
      : tone === "ok"
        ? "border-accent/40 bg-accent-soft text-ink"
        : "border-line bg-raised text-body";
  return <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${cls}`}>{children}</div>;
}

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

/** Ícono de línea para listas y roles. */
export function LineIcon({ name, className = "h-[22px] w-[22px]" }: { name: string; className?: string }) {
  const p: Record<string, ReactNode> = {
    ticket: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M9 6v12" strokeDasharray="2 2" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h12M8 12h12M8 18h12" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </>
    ),
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
    pie: (
      <>
        <path d="M12 3a9 9 0 109 9h-9z" />
        <path d="M15 3.5A9 9 0 0120.5 9H15z" />
      </>
    ),
    pulse: <path d="M2 12h5l2-5 4 10 2-5h7" />,
    bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9V16h7v-2.1A6 6 0 0012 3z" />,
    lab: <path d="M9 3h6M10 3v6L4 20h16L14 9V3" />,
    chat: <path d="M4 5h16v11H9l-5 4z" />,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      {p[name]}
    </svg>
  );
}
