"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWriteContract } from "wagmi";
import { useRaffle } from "@/hooks/useRaffle";
import { useTx } from "@/hooks/useTx";
import { useWallet } from "@/hooks/useWallet";
import { raffleAbi } from "@/lib/abi";
import { config } from "@/lib/config";
import { fmtNumber, fmtToken, RaffleState } from "@/lib/format";
import { Notice, Section, Spinner, TxLink } from "./ui";

export function MyNumbers() {
  const { raffle, refetch } = useRaffle();
  const w = useWallet();
  const { writeContractAsync } = useWriteContract();
  const refund = useTx();

  const s = raffle?.stats;
  const dec = raffle?.decimals ?? 18;
  const now = Math.floor(Date.now() / 1000);
  const completed = s?.state === RaffleState.Completed;
  const iWon = completed && w.address && raffle?.winner.toLowerCase() === w.address.toLowerCase();

  // El reembolso aplica en estado Refunding, o si terminó el plazo sin meta (claimRefund cierra solo).
  const refundable =
    !!s &&
    (s.state === RaffleState.Refunding ||
      (s.state === RaffleState.Open && now >= Number(s.deadline) && (s.totalRaised < s.goal || s.numbersSold === 0)));

  const claim = async () => {
    const r = await refund.run(() =>
      writeContractAsync({ address: config.raffle, abi: raffleAbi, functionName: "claimRefund", chainId: config.chainId }),
    );
    if (r) {
      w.refetch();
      refetch();
    }
  };

  return (
    <Section id="mis-numeros" kicker="Tu participación" title="Mis números">
      {!w.isConnected ? (
        <div className="card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">Conectá tu wallet para ver tus números.</p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button className="pill-ghost" onClick={openConnectModal}>
                Conectar wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      ) : w.isLoading ? (
        <p className="flex items-center gap-2 text-muted">
          <Spinner /> Cargando…
        </p>
      ) : (
        <div className="space-y-4">
          {iWon && (
            <Notice tone="ok">
              🎉 ¡Tu número #{fmtNumber(raffle!.winnerNumber)} salió sorteado! Te vamos a contactar por nuestras redes para la entrega
              del premio. Nunca te vamos a pedir tu frase semilla.
            </Notice>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <p className="label">Números</p>
              <p className="mt-1 font-mono text-2xl font-bold">{w.myNumbers ?? 0}</p>
            </div>
            <div className="card p-4">
              <p className="label">Total aportado</p>
              <p className="mt-1 font-mono text-2xl font-bold">
                {fmtToken(w.paid, dec)} <span className="text-sm text-muted">{config.tokenSymbol}</span>
              </p>
            </div>
          </div>

          {w.ranges.length === 0 ? (
            <p className="text-muted">Todavía no tenés números en esta rifa.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {w.ranges.map((r) => {
                const last = r.first + r.quantity - 1;
                const hasWinner = completed && raffle!.winnerNumber >= r.first && raffle!.winnerNumber <= last;
                return (
                  <li
                    key={r.first}
                    className={`rounded-lg border px-3 py-2 font-mono text-sm ${hasWinner ? "border-accent bg-accent-soft text-accent" : "border-line bg-raised"}`}
                  >
                    #{fmtNumber(r.first)}
                    {r.quantity > 1 && <> → #{fmtNumber(last)}</>}
                    <span className="ml-2 text-xs text-muted">({r.quantity})</span>
                  </li>
                );
              })}
            </ul>
          )}

          {refundable && (
            <div className="card space-y-3 p-4">
              <p className="font-semibold">No se alcanzó la meta: podés recuperar tu aporte completo.</p>
              {w.paid && w.paid > 0n ? (
                <>
                  <button className="pill-solid" disabled={refund.busy || w.wrongNetwork} onClick={claim}>
                    {refund.busy && <Spinner />} Reclamar {fmtToken(w.paid, dec)} {config.tokenSymbol}
                  </button>
                  {w.wrongNetwork && <p className="text-sm text-bad">Cambiá tu wallet a la red correcta para reclamar.</p>}
                </>
              ) : (
                <p className="text-sm text-muted">Esta wallet no tiene montos pendientes de reembolso.</p>
              )}
              {refund.status === "success" && refund.hash && (
                <Notice tone="ok">
                  Reembolso enviado. Comprobante: <TxLink hash={refund.hash} />
                </Notice>
              )}
              {refund.error && <Notice tone="error">{refund.error}</Notice>}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
