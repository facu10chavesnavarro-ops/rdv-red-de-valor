"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BRAND } from "@/lib/content";

const NAV = [
  ["#progreso", "Progreso"],
  ["#participar", "Participar"],
  ["#donaciones", "Donaciones"],
  ["#transparencia", "Transparencia"],
  ["#primeros-pasos", "Primeros pasos"],
];

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  // Tres nodos enlazados: la "red" de RDV
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#a6ff3d" />
      <path d="M12 27 20 12l8 15z" fill="none" stroke="#081204" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="20" cy="12" r="3.6" fill="#081204" />
      <circle cx="12" cy="27" r="3.6" fill="#081204" />
      <circle cx="28" cy="27" r="3.6" fill="#081204" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-7 px-5">
        <a href="#inicio" className="flex items-center gap-2.5" aria-label={`${BRAND.short} · ${BRAND.name}, inicio`}>
          <Logo />
          <span className="leading-tight">
            <span className="block font-bold tracking-tight text-ink">{BRAND.short}</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:block">{BRAND.name}</span>
          </span>
          <span className="rounded-full border border-accent/45 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-accent">TESTNET</span>
        </a>
        <nav className="hidden gap-6 text-sm font-medium lg:flex" aria-label="Principal">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="text-body hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto">
          <ConnectButton label="Conectar wallet" accountStatus="address" chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </header>
  );
}
