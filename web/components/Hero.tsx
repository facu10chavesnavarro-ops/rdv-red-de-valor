"use client";

import { useRaffle } from "@/hooks/useRaffle";
import { config } from "@/lib/config";
import { fmtToken, RaffleState, STATE_LABEL } from "@/lib/format";
import { Countdown } from "./Countdown";
import { PrizeArt } from "./PrizeArt";
import { ProgressBar } from "./ui";

export function Hero() {
  const { raffle } = useRaffle();
  const s = raffle?.stats;
  const dec = raffle?.decimals ?? 18;
  const pct = s && s.goal > 0n ? Number((s.totalRaised * 10000n) / s.goal) / 100 : 0;

  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 pb-8 pt-10 md:grid-cols-[1.2fr_1fr] md:pt-16">
      <div className="order-2 md:order-1">
        <p className="label mb-3 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-ok" />
          Rifa on-chain · BNB Chain {s && <span className="text-accent">· {STATE_LABEL[s.state]}</span>}
        </p>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
          Participá por un <span className="text-accent">{config.prizeName}</span> y apoyá proyectos tecnológicos
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Números desde 2 USDT. Cada aporte financia los proyectos tecnológicos de la empresa. El sorteo es público y
          verificable: lo hace un contrato inteligente con Chainlink VRF.
        </p>

        <div className="mt-6">
          <p className="label mb-2">{s?.state === RaffleState.Open ? "Termina en" : "Estado"}</p>
          <Countdown deadline={s ? Number(s.deadline) : undefined} />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span>
              <span className="font-mono text-lg font-bold text-ink">{fmtToken(s?.totalRaised, dec)}</span>
              <span className="text-muted"> / {fmtToken(s?.goal, dec)} {config.tokenSymbol}</span>
            </span>
            <span className="font-mono text-accent">{pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%</span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        <a href="#participar" className="btn-accent mt-6 w-full px-8 py-3 text-base sm:w-auto">
          Participar
        </a>
      </div>
      <div className="order-1 md:order-2">
        <PrizeArt />
      </div>
    </section>
  );
}
