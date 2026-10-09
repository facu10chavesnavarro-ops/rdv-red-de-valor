"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useRaffle } from "@/hooks/useRaffle";
import { config } from "@/lib/config";
import { DONATION_SPLIT, PROJECTS } from "@/lib/content";
import { Art } from "./Art";
import { AddressLink, Section } from "./ui";

const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

function Split({ total, label }: { total: number; label: string }) {
  return (
    <div className="grid gap-4">
      <div className="flex h-3.5 gap-[3px] overflow-hidden rounded-full" aria-hidden>
        {DONATION_SPLIT.map((d) => (
          <i key={d.key} className="block h-full" style={{ width: `${d.pct}%`, background: d.color }} />
        ))}
      </div>
      <div className="grid gap-2.5" aria-label={label}>
        {DONATION_SPLIT.map((d) => (
          <div key={d.key} className="grid grid-cols-[12px_1fr_auto] items-center gap-2.5 text-sm">
            <i className="h-3 w-3 rounded-[3px]" style={{ background: d.color }} />
            <span>
              {d.legend} <span className="font-mono text-muted">· {d.pct}%</span>
            </span>
            <b className="font-mono font-medium tabular-nums text-ink">
              {fmt((total * d.pct) / 100)} {config.tokenSymbol}
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donations() {
  const { raffle } = useRaffle();
  const dec = raffle?.decimals ?? 18;
  const raised = raffle ? Number(formatUnits(raffle.stats.totalRaised, dec)) : 0;
  const [sim, setSim] = useState(1400);
  const [tech, impact, eco] = DONATION_SPLIT;

  return (
    <Section
      id="donaciones"
      kicker="Donaciones · Destino de los fondos"
      title="A dónde va cada aporte"
      intro="Lo recaudado no se reparte entre socios: vuelve a proyectos con impacto y al ecosistema que los hace posibles. Así se reparte cada aporte:"
    >
      {/* Diagrama de capas */}
      <div className="flex flex-col items-center justify-center lg:flex-row" aria-label="Destino de las donaciones">
        {[impact, tech, eco].map((d) => {
          const center = d.key === tech.key;
          return (
            <div
              key={d.key}
              className={`grid aspect-square w-[300px] max-w-full place-content-center gap-2 rounded-full border p-10 text-center lg:w-[340px] lg:p-12 ${
                center ? "relative -my-5 border-accent/50 lg:-mx-8 lg:my-0 lg:-translate-y-8" : "border-[#2c372d]"
              }`}
              style={{
                background:
                  "repeating-linear-gradient(0deg, rgba(166,255,61,.035) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(166,255,61,.035) 0 1px, transparent 1px 22px), radial-gradient(circle at 50% 40%, rgba(19,25,19,.95), rgba(8,11,9,.92))",
                zIndex: center ? 2 : 1,
              }}
            >
              <span className="label">{d.label}</span>
              <span className="font-mono text-[44px] font-medium leading-none" style={{ color: d.color === "#e6f6dc" ? "#a6ff3d" : d.color }}>
                {d.pct}%
              </span>
              <h3 className="font-mono text-[15px] font-medium uppercase tracking-[0.06em]">{d.title}</h3>
              <ul className="mt-1 grid gap-0.5 text-sm">
                {d.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center font-mono text-xs leading-relaxed text-muted">
        <svg viewBox="0 0 230 28" fill="none" className="mx-auto mb-1 block h-7 w-[230px]" aria-hidden>
          <path d="M220 4 C 180 26, 50 26, 10 6" stroke="#7d8b7f" />
          <path d="M10 6 l8 1 M10 6 l4 7" stroke="#7d8b7f" />
        </svg>
        Los resultados de los proyectos vuelven
        <br />a la comunidad que los financió
      </p>

      {/* Reparto en vivo y simulador */}
      <div className="mt-10 grid gap-3.5 md:grid-cols-2">
        <div className="card grid content-start gap-4 p-6">
          <p className="kicker">Lo recaudado hasta ahora</p>
          <p className="font-mono text-3xl font-medium text-ink">
            {fmt(raised)} <span className="text-base text-muted">{config.tokenSymbol}</span>
          </p>
          <Split total={raised} label="Reparto de lo recaudado" />
          <div className="border-t border-line pt-4">
            <label htmlFor="sim-range" className="label">
              Simulá: si la rifa recauda
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                id="sim-range"
                type="range"
                min={10}
                max={10000}
                step={10}
                value={sim}
                onChange={(e) => setSim(Number(e.target.value))}
                className="min-w-[160px] flex-1 accent-[#a6ff3d]"
              />
              <output htmlFor="sim-range" className="min-w-[110px] text-right font-mono text-lg text-ink">
                {fmt(sim)} {config.tokenSymbol}
              </output>
            </div>
            <div className="mt-3">
              <Split total={sim} label="Reparto simulado" />
            </div>
          </div>
        </div>

        <div className="card grid content-start gap-4 p-6">
          <p className="kicker">Cómo lo controlás</p>
          <h3 className="text-xl font-semibold">Cada movimiento de fondos queda en la blockchain</h3>
          <p>
            Los fondos salen del contrato de la rifa a una única dirección de tesorería, pública y fija desde el primer día. Desde ahí,
            cada transferencia a un proyecto se publica con su enlace al explorador, para que cualquiera pueda seguirla.
          </p>
          <div>
            <p className="label">Tesorería</p>
            <AddressLink address={raffle?.treasury} full />
          </div>
          <p className="text-sm text-muted">
            Si la rifa no llega a la meta, no se reparte nada: cada persona recupera exactamente lo que aportó.
          </p>
        </div>
      </div>

      {/* Proyectos */}
      <div className="mt-3.5 grid gap-3.5 md:grid-cols-2">
        {PROJECTS.map((p) => (
          <article key={p.title} className="relative flex min-h-[300px] items-end overflow-hidden rounded-2xl border border-line bg-surface">
            <Art kind={p.art} />
            <div className="relative grid w-full gap-2.5 bg-gradient-to-b from-transparent via-bg/90 to-bg/95 p-6 pt-14">
              <p className="kicker">{p.kicker}</p>
              <h3 className="text-[1.4rem] font-semibold">{p.title}</h3>
              <p className="max-w-[54ch] text-[15px]">{p.text}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Sin fines de lucro + costos del ecosistema */}
      <div className="mt-3.5 grid gap-3.5 md:grid-cols-2">
        <div className="grid content-start gap-3 rounded-2xl border border-accent/45 bg-gradient-to-br from-accent/10 to-surface to-55% p-7">
          <p className="kicker">Lo recaudado no se reparte</p>
          <h3 className="text-xl font-semibold">Nadie se lleva un reparto de lo recaudado</h3>
          <p>
            Lo que se recauda no se distribuye entre socios: se usa en los proyectos, en el impacto social y ambiental y en sostener la
            plataforma. Todo se puede seguir on-chain.
          </p>
        </div>
        <div className="card grid content-start gap-3 p-7">
          <p className="kicker">Por qué una parte sostiene el ecosistema</p>
          <h3 className="text-xl font-semibold">Mantener la plataforma tiene costos reales</h3>
          <ul className="grid list-disc gap-1 pl-5">
            <li>Servidores, nodos y RPC para que la web funcione siempre</li>
            <li>Auditorías de seguridad de los contratos</li>
            <li>Comisiones de red y del sorteo con Chainlink</li>
            <li>Desarrollo, soporte y educación para la comunidad</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
