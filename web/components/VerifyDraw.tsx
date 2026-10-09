"use client";

import { useEffect, useState } from "react";
import { type Hash } from "viem";
import { usePublicClient } from "wagmi";
import type { RaffleData } from "@/hooks/useRaffle";
import { raffleAbi } from "@/lib/abi";
import { config } from "@/lib/config";
import { fmtInt, fmtNumber, RaffleState } from "@/lib/format";
import { computeWinner, rangesAreContiguous, type Range } from "@/lib/verify";
import { AddressLink, CopyButton, Notice, Spinner, TxLink } from "./ui";

const PAGE = 500n;
const MAX_CHUNKS_BACK = 200n;

type Check = { label: string; ok: boolean; detail: string };

export function VerifyDraw({ raffle }: { raffle: RaffleData }) {
  const client = usePublicClient({ chainId: config.chainId });
  const [fulfillTx, setFulfillTx] = useState<Hash>();
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<Check[]>();
  const [error, setError] = useState<string>();

  const s = raffle.stats;
  const completed = s.state === RaffleState.Completed;

  // Busca la transacción en la que Chainlink entregó el número aleatorio (evento WinnerSelected)
  useEffect(() => {
    if (!client || !completed || fulfillTx) return;
    let cancel = false;
    (async () => {
      try {
        let to = await client.getBlockNumber();
        for (let i = 0n; i < MAX_CHUNKS_BACK && to >= config.deployBlock && !cancel; i++) {
          const from = to - config.logsChunk + 1n > config.deployBlock ? to - config.logsChunk + 1n : config.deployBlock;
          const logs = await client.getContractEvents({
            address: config.raffle,
            abi: raffleAbi,
            eventName: "WinnerSelected",
            fromBlock: from,
            toBlock: to,
          });
          if (logs.length) {
            if (!cancel) setFulfillTx(logs[logs.length - 1].transactionHash);
            return;
          }
          if (from === config.deployBlock) return;
          to = from - 1n;
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [client, completed, fulfillTx]);

  const verify = async () => {
    if (!client) return;
    setRunning(true);
    setChecks(undefined);
    setError(undefined);
    try {
      // 1) Descargar todos los rangos del contrato
      const count = await client.readContract({ address: config.raffle, abi: raffleAbi, functionName: "rangesCount" });
      const ranges: Range[] = [];
      for (let offset = 0n; offset < count; offset += PAGE) {
        const page = await client.readContract({
          address: config.raffle,
          abi: raffleAbi,
          functionName: "getRanges",
          args: [offset, PAGE],
        });
        ranges.push(...page.map((r) => ({ buyer: r.buyer, first: r.first, quantity: r.quantity })));
      }

      // 2) Recalcular
      const r = computeWinner(raffle.randomWord, ranges);
      const winnerMatches = r.winner.toLowerCase() === raffle.winner.toLowerCase();
      setChecks([
        {
          label: "Rangos consecutivos y sin huecos",
          ok: rangesAreContiguous(ranges),
          detail: `${fmtInt(ranges.length)} compras descargadas del contrato`,
        },
        {
          label: "Total de números vendidos",
          ok: r.totalSold === s.numbersSold,
          detail: `${fmtInt(r.totalSold)} (contrato: ${fmtInt(s.numbersSold)})`,
        },
        {
          label: "Número ganador = aleatorio mod vendidos",
          ok: r.number === raffle.winnerNumber,
          detail: `#${fmtNumber(r.number)} (contrato: #${fmtNumber(raffle.winnerNumber)})`,
        },
        {
          label: "Dueño del número ganador",
          ok: winnerMatches,
          detail: `Rango #${fmtNumber(r.range.first)}–#${fmtNumber(r.range.first + r.range.quantity - 1)} de ${r.winner}`,
        },
      ]);
    } catch (e) {
      console.error(e);
      setError("No se pudo completar la verificación. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setRunning(false);
    }
  };

  if (s.state === RaffleState.Drawing) {
    return (
      <Notice>
        <span className="flex flex-wrap items-center gap-2">
          <Spinner /> Sorteo en curso: esperando la respuesta de Chainlink VRF (pedido{" "}
          <span className="font-mono">{raffle.drawRequestId.toString().slice(0, 12)}…</span>).
        </span>
      </Notice>
    );
  }

  if (!completed) {
    return (
      <p className="text-sm text-muted">
        Cuando se realice el sorteo, acá vas a ver el número aleatorio entregado por Chainlink VRF, el número ganador y la wallet
        ganadora, y vas a poder recalcularlo vos mismo en tu navegador.
      </p>
    );
  }

  const allOk = checks?.every((c) => c.ok);

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm">
        <div className="card p-3">
          <dt className="label flex items-center justify-between">
            Número aleatorio (Chainlink VRF) <CopyButton text={raffle.randomWord.toString()} />
          </dt>
          <dd className="mt-1 break-all font-mono text-xs text-ink">{raffle.randomWord.toString()}</dd>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-3">
            <dt className="label">Números vendidos</dt>
            <dd className="mt-1 font-mono text-lg">{fmtInt(s.numbersSold)}</dd>
          </div>
          <div className="card p-3">
            <dt className="label">Número ganador</dt>
            <dd className="mt-1 font-mono text-lg text-accent">#{fmtNumber(raffle.winnerNumber)}</dd>
          </div>
          <div className="card p-3">
            <dt className="label">Wallet ganadora</dt>
            <dd className="mt-1 text-sm">
              <AddressLink address={raffle.winner} chars={6} />
            </dd>
          </div>
        </div>
        <div className="card p-3 text-xs text-muted">
          <p>
            Fórmula: <span className="font-mono text-ink">aleatorio mod {fmtInt(s.numbersSold)} = {fmtNumber(raffle.winnerNumber)}</span>
          </p>
          <p className="mt-1">
            Pedido VRF: <span className="break-all font-mono">{raffle.drawRequestId.toString()}</span>
          </p>
          {fulfillTx && (
            <p className="mt-1">
              Transacción de Chainlink: <TxLink hash={fulfillTx} />
            </p>
          )}
        </div>
      </dl>

      <button className="pill-solid w-full sm:w-auto" disabled={running} onClick={verify}>
        {running && <Spinner />} Recalcular en mi navegador
      </button>
      {error && <Notice tone="error">{error}</Notice>}

      {checks && (
        <div className="card divide-y divide-line">
          {checks.map((c) => (
            <div key={c.label} className="flex items-start gap-3 p-3 text-sm">
              <span className={c.ok ? "text-ok" : "text-bad"}>{c.ok ? "✓" : "✗"}</span>
              <div className="min-w-0">
                <p className="font-medium">{c.label}</p>
                <p className="break-all font-mono text-xs text-muted">{c.detail}</p>
              </div>
            </div>
          ))}
          <div className="p-3">
            {allOk ? (
              <Notice tone="ok">Verificado: el resultado coincide con lo que registró el contrato.</Notice>
            ) : (
              <Notice tone="error">El recálculo no coincide. Por favor, avisanos por nuestras redes.</Notice>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
