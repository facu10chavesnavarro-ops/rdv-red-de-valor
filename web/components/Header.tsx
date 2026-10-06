"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV = [
  ["#progreso", "Progreso"],
  ["#participar", "Participar"],
  ["#mis-numeros", "Mis números"],
  ["#transparencia", "Transparencia"],
  ["#primeros-pasos", "Primeros pasos"],
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-sm text-bg">R</span>
          <span className="hidden sm:inline">Rifa solidaria</span>
          <span className="rounded border border-accent/40 bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent">
            testnet
          </span>
        </a>
        <nav className="hidden gap-5 text-sm text-muted md:flex">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <ConnectButton label="Conectar wallet" accountStatus="address" chainStatus="icon" showBalance={false} />
      </div>
    </header>
  );
}
