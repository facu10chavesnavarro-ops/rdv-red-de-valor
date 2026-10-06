"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useFeed } from "@/hooks/useFeed";
import { useRaffle } from "@/hooks/useRaffle";
import { config } from "@/lib/config";
import { fmtToken, shortAddr, timeAgo } from "@/lib/format";
import { AddressLink, AnimatedNumber, Notice, ProgressBar, Section, Spinner, TxLink } from "./ui";

const es = (max = 0) => (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: max });

function Stat({ label, children, sub }: { label: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{children}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function LiveProgress() {
  const { raffle, isLoading, isError } = useRaffle();
  const { items, loading: feedLoading, error: feedError } = useFeed();
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 5000);
    return () => clearInterval(id);
  }, []);

  const s = raffle?.stats;
  const dec = raffle?.decimals ?? 18;
  const raised = s ? Number(formatUnits(s.totalRaised, dec)) : 0;
  const pct = s && s.goal > 0n ? Number((s.totalRaised * 10000n) / s.goal) / 100 : 0;

  return (
    <Section id="progreso" kicker="En vivo" title="Progreso de la rifa">
      {isError && <Notice tone="error">No se pudo leer el contrato. Revisá la conexión o la configuración de red.</Notice>}
      {isLoading && (
        <p className="flex items-center gap-2 text-muted">
          <Spinner /> Leyendo datos del contrato…
        </p>
      )}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Recaudado" sub={`Meta: ${fmtToken(s.goal, dec)} ${config.tokenSymbol}`}>
              <AnimatedNumber value={raised} format={es(2)} /> <span className="text-sm text-muted">{config.tokenSymbol}</span>
            </Stat>
            <Stat label="Avance de la meta">
              <AnimatedNumber value={pct} format={(n) => `${es(1)(n)}%`} />
            </Stat>
            <Stat label="Números vendidos" sub={`Disponibles: ${es()(s.maxNumbers - s.numbersSold)}`}>
              <AnimatedNumber value={s.numbersSold} format={es()} />
              <span className="text-sm text-muted"> / {es()(s.maxNumbers)}</span>
            </Stat>
            <Stat label="Participantes">
              <AnimatedNumber value={s.participants} format={es()} />
            </Stat>
          </div>
          <div className="mt-4">
            <ProgressBar pct={pct} />
          </div>
        </>
      )}

      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-semibold">Últimos aportes</h3>
          <span className="label">se actualiza cada 10 s</span>
        </div>
        {feedError && <div className="p-3"><Notice tone="error">{feedError}</Notice></div>}
        {feedLoading && !items.length ? (
          <p className="flex items-center gap-2 p-4 text-sm text-muted">
            <Spinner /> Buscando eventos en la blockchain…
          </p>
        ) : !items.length ? (
          <p className="p-4 text-sm text-muted">Todavía no hay aportes. ¡Podés ser el primero!</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((it) => (
              <li
                key={`${it.txHash}-${it.logIndex}`}
                className="grid animate-slidein grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 text-sm sm:grid-cols-[1.2fr_1fr_1fr_auto]"
              >
                <span className="font-mono" title={it.who}>
                  <AddressLink address={it.who} />
                </span>
                <span className="text-right font-mono sm:text-left">
                  <span className="text-ink">{fmtToken(it.amount, dec)}</span>{" "}
                  <span className="text-muted">{config.tokenSymbol}</span>
                  <span className="ml-2 text-xs text-muted">
                    {it.kind === "compra" ? `${it.quantity} nº` : "aporte libre"}
                  </span>
                </span>
                <span className="text-xs text-muted sm:text-sm" title={it.txHash}>
                  tx <TxLink hash={it.txHash} chars={4} />
                </span>
                <span className="text-right text-xs text-muted sm:text-sm">
                  {it.timestamp ? timeAgo(it.timestamp, now) : `bloque ${it.blockNumber}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        Datos leídos directamente del contrato {shortAddr(config.raffle)}. No usamos base de datos propia.
      </p>
    </Section>
  );
}
