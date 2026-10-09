"use client";

import { useEffect, useState } from "react";
import { useFeed } from "@/hooks/useFeed";
import { useRaffle } from "@/hooks/useRaffle";
import { config } from "@/lib/config";
import { fmtToken, shortAddr, timeAgo } from "@/lib/format";
import { AddressLink, Notice, Section, Spinner, TxLink } from "./ui";

export function LiveProgress() {
  const { raffle, isError } = useRaffle();
  const { items, loading, error } = useFeed();
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 5000);
    return () => clearInterval(id);
  }, []);
  const dec = raffle?.decimals ?? 18;

  return (
    <Section
      id="progreso"
      kicker="En vivo"
      title="Cada aporte, a la vista"
      intro="La página lee los datos directamente del contrato cada 10 segundos. No hay base de datos propia: lo que ves es lo que registró la blockchain."
    >
      {isError && (
        <div className="mb-4">
          <Notice tone="error">No se pudo leer el contrato. Revisá la conexión o la configuración de red.</Notice>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h3 className="font-semibold">Últimos aportes</h3>
          <span className="label">se actualiza cada 10 s</span>
        </div>
        {error && (
          <div className="p-3">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
        {loading && !items.length ? (
          <p className="flex items-center gap-2 p-5 text-sm text-muted">
            <Spinner /> Buscando aportes en la blockchain…
          </p>
        ) : !items.length ? (
          <p className="p-5 text-sm text-muted">Todavía no hay aportes. ¡Podés ser el primero!</p>
        ) : (
          <ul>
            {items.map((it) => (
              <li
                key={`${it.txHash}-${it.logIndex}`}
                className="grid animate-slidein grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-5 py-3.5 text-sm last:border-b-0 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
              >
                <span title={it.who}>
                  <AddressLink address={it.who} />
                </span>
                <span className="text-right font-mono text-ink sm:text-left">
                  {fmtToken(it.amount, dec)} {config.tokenSymbol}
                  <small className="ml-2 text-muted">
                    {it.kind === "compra" ? `${it.quantity} ${it.quantity === 1 ? "número" : "números"}` : "aporte libre"}
                  </small>
                </span>
                <span className="hidden font-mono text-muted sm:inline" title={it.txHash}>
                  tx <TxLink hash={it.txHash} chars={4} />
                </span>
                <span className="col-span-2 text-xs text-muted sm:col-span-1 sm:text-right sm:text-[13px]">
                  {it.timestamp ? timeAgo(it.timestamp, now) : `bloque ${it.blockNumber}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Datos leídos directamente del contrato {shortAddr(config.raffle)}.</p>
    </Section>
  );
}
