"use client";

import { formatUnits } from "viem";
import { useRaffle } from "@/hooks/useRaffle";
import { config } from "@/lib/config";
import { TICKER } from "@/lib/content";
import { fmtToken, RaffleState, STATE_LABEL } from "@/lib/format";
import { Countdown } from "./Countdown";
import { HeroCanvas } from "./HeroCanvas";
import { AnimatedNumber, Arrow, ProgressBar } from "./ui";

const es = (max = 0) => (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: max });

function Stat({ value, label }: { value: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface/70 px-4 py-5 text-center backdrop-blur-sm">
      <p className="font-mono text-[26px] font-medium tabular-nums text-ink sm:text-[30px]">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function Hero() {
  const { raffle } = useRaffle();
  const s = raffle?.stats;
  const dec = raffle?.decimals ?? 18;
  const raised = s ? Number(formatUnits(s.totalRaised, dec)) : 0;
  const pct = s && s.goal > 0n ? Number((s.totalRaised * 10000n) / s.goal) / 100 : 0;
  const open = s?.state === RaffleState.Open;
  const chips = TICKER.map(([i, a, b], k) => (
    <span key={k} className="inline-flex items-center gap-2 whitespace-nowrap rounded-[9px] bg-surface px-3 py-1.5 text-[13px] text-ink">
      <i className="grid h-5 w-5 place-items-center rounded-full bg-raised font-mono text-[10px] not-italic text-accent">{i}</i>
      {a} <em className="not-italic text-muted">{b}</em>
    </span>
  ));

  return (
    <header id="inicio" className="relative overflow-hidden pt-14 sm:pt-[72px]">
      <HeroCanvas />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid justify-items-center gap-5 text-center sm:gap-6">
          <p className="kicker">
            Rifa on-chain · BNB Chain {s && <span className="text-ink">· {STATE_LABEL[s.state]}</span>}
          </p>
          <h1 className="max-w-[15ch] text-[clamp(2.3rem,5.6vw,4.1rem)] font-semibold leading-[1.04]">
            Tecnología con impacto, <span className="text-accent">financiada por la comunidad</span>
          </h1>
          <p className="max-w-[60ch] text-lg">
            Participá por un {config.prizeName} desde 2 USDT. Cada aporte financia proyectos tecnológicos, sociales y ambientales,
            queda registrado en la blockchain y el sorteo se puede verificar.
          </p>
          {open ? <Countdown deadline={s ? Number(s.deadline) : undefined} /> : s && <p className="font-mono text-accent">La venta terminó</p>}
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#participar" className="pill-solid">
              Participar en la rifa <Arrow />
            </a>
            <a href="#donaciones" className="pill-outline">
              Destino de las donaciones
            </a>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3.5 md:grid-cols-4" aria-label="Estado de la rifa">
          <Stat value={<><AnimatedNumber value={raised} format={es(2)} /> <span className="text-base text-muted">{config.tokenSymbol}</span></>} label="Recaudado" />
          <Stat value={<AnimatedNumber value={pct} format={(n) => `${es(1)(n)}%`} />} label={`de la meta de ${fmtToken(s?.goal, dec)} ${config.tokenSymbol}`} />
          <Stat
            value={<AnimatedNumber value={s?.numbersSold ?? 0} format={es()} />}
            label={`Números vendidos de ${es()(s?.maxNumbers ?? 5000)}`}
          />
          <Stat value={<AnimatedNumber value={s?.participants ?? 0} format={es()} />} label="Participantes" />
        </div>
        <div className="mt-4">
          <ProgressBar pct={pct} thin />
        </div>
        <div className="mt-2.5 flex justify-between font-mono text-xs tracking-wide text-muted">
          <span>
            {fmtToken(s?.totalRaised, dec)} / {fmtToken(s?.goal, dec)} {config.tokenSymbol}
          </span>
          <span>Disponibles: {s ? es()(s.maxNumbers - s.numbersSold) : "—"}</span>
        </div>

        <div
          className="mt-10 overflow-hidden rounded-xl border border-line bg-raised/80 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
          aria-label="Proyectos que financia la rifa"
        >
          <div className="flex w-max animate-ticker gap-3 p-2.5">
            {chips}
            {chips}
          </div>
        </div>
      </div>
    </header>
  );
}
