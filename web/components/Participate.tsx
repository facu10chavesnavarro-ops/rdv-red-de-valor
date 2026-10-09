"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, formatEther, parseAbi, parseEventLogs, parseUnits, type Hash } from "viem";
import { usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { useRaffle } from "@/hooks/useRaffle";
import { useTx, type TxStatus } from "@/hooks/useTx";
import { useWallet } from "@/hooks/useWallet";
import { raffleAbi } from "@/lib/abi";
import { chain, config } from "@/lib/config";
import { fmtNumber, fmtToken, RaffleState } from "@/lib/format";
import { Notice, Section, Spinner, TxLink } from "./ui";

const RECOMMENDED = 1; // paquete de 3 números
const faucetAbi = parseAbi(["function faucet()"]);
// Valores de respaldo si no se puede estimar el gas (p. ej. comprar antes de autorizar)
const GAS_APPROVE = 60_000n;
const GAS_BUY = 230_000n;

type Purchase = { first: number; quantity: number; hash: Hash };

function StepBadge({ n, status, done }: { n: number; status: TxStatus; done: boolean }) {
  if (done || status === "success") return <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-accent-ink">✓</span>;
  if (status === "wallet" || status === "pending") return <span className="grid h-6 w-6 place-items-center text-accent"><Spinner /></span>;
  return <span className="grid h-6 w-6 place-items-center rounded-full border border-line font-mono text-xs">{n}</span>;
}

function txHint(status: TxStatus) {
  if (status === "wallet") return "Confirmá en tu wallet…";
  if (status === "pending") return "Esperando confirmación en la red…";
  return null;
}

export function Participate() {
  const { raffle, refetch } = useRaffle();
  const w = useWallet();
  const client = usePublicClient({ chainId: config.chainId });
  const { writeContractAsync } = useWriteContract();
  const { switchChain, isPending: switching, error: switchError } = useSwitchChain();

  const [sel, setSel] = useState(RECOMMENDED);
  const [fee, setFee] = useState<bigint>();
  const [result, setResult] = useState<Purchase>();
  const [donation, setDonation] = useState("");
  const approveTx = useTx();
  const buyTx = useTx();
  const faucetTx = useTx();
  const donateTx = useTx();

  const dec = raffle?.decimals ?? 18;
  const packs = useMemo(() => raffle?.packs ?? [], [raffle?.packs]);
  const pack = packs[sel];
  const s = raffle?.stats;
  const now = Math.floor(Date.now() / 1000);
  const salesOpen = !!s && s.state === RaffleState.Open && now < Number(s.deadline);

  const needsApprove = !!pack && w.allowance !== undefined && w.allowance < pack.price;
  const noBalance = !!pack && w.balance !== undefined && w.balance < pack.price;
  const overWallet = !!pack && raffle && w.myNumbers !== undefined && w.myNumbers + pack.quantity > raffle.maxPerWallet;
  const overSupply = !!pack && s && s.numbersSold + pack.quantity > s.maxNumbers;

  const basePerNumber = packs[0] ? packs[0].price / BigInt(packs[0].quantity) : 0n;
  const savings = useMemo(
    () =>
      packs.map((p) => {
        const full = basePerNumber * BigInt(p.quantity);
        const save = full > p.price ? full - p.price : 0n;
        return { save, pct: full > 0n ? Number((save * 100n) / full) : 0 };
      }),
    [packs, basePerNumber],
  );

  // Comisión de red estimada (approve si hace falta + compra)
  useEffect(() => {
    if (!client || !pack || !w.address || w.wrongNetwork) return setFee(undefined);
    let cancel = false;
    (async () => {
      try {
        const gasPrice = await client.getGasPrice();
        let gas = needsApprove ? GAS_APPROVE + GAS_BUY : GAS_BUY;
        if (!needsApprove && !noBalance) {
          gas = await client
            .estimateContractGas({ address: config.raffle, abi: raffleAbi, functionName: "buyPack", args: [sel], account: w.address! })
            .catch(() => GAS_BUY);
        }
        if (!cancel) setFee(gas * gasPrice);
      } catch {
        if (!cancel) setFee(undefined);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [client, pack, sel, needsApprove, noBalance, w.address, w.wrongNetwork]);

  const afterTx = () => {
    w.refetch();
    refetch();
  };

  const approve = async () => {
    if (!pack) return;
    const r = await approveTx.run(() =>
      writeContractAsync({ address: config.token, abi: erc20Abi, functionName: "approve", args: [config.raffle, pack.price], chainId: config.chainId }),
    );
    if (r) afterTx();
  };

  const buy = async () => {
    setResult(undefined);
    const r = await buyTx.run(() =>
      writeContractAsync({ address: config.raffle, abi: raffleAbi, functionName: "buyPack", args: [sel], chainId: config.chainId }),
    );
    if (r) {
      const [log] = parseEventLogs({ abi: raffleAbi, eventName: "Purchase", logs: r.logs });
      if (log) setResult({ first: log.args.first, quantity: log.args.quantity, hash: r.transactionHash });
      approveTx.reset();
      afterTx();
    }
  };

  const faucet = async () => {
    const r = await faucetTx.run(() =>
      writeContractAsync({ address: config.token, abi: faucetAbi, functionName: "faucet", chainId: config.chainId }),
    );
    if (r) afterTx();
  };

  const donationAmount = (() => {
    try {
      return donation ? parseUnits(donation.replace(",", "."), dec) : 0n;
    } catch {
      return 0n;
    }
  })();
  const donate = async () => {
    if (donationAmount < 10n ** BigInt(dec)) return;
    if (w.allowance === undefined || w.allowance < donationAmount) {
      const a = await donateTx.run(() =>
        writeContractAsync({ address: config.token, abi: erc20Abi, functionName: "approve", args: [config.raffle, donationAmount], chainId: config.chainId }),
      );
      if (!a) return;
    }
    const r = await donateTx.run(() =>
      writeContractAsync({ address: config.raffle, abi: raffleAbi, functionName: "donate", args: [donationAmount], chainId: config.chainId }),
    );
    if (r) {
      setDonation("");
      afterTx();
    }
  };

  return (
    <Section
      id="participar"
      kicker="Participar"
      title="Elegí tu paquete"
      intro="Cuantos más números llevás, menos pagás por cada uno. Tus números son consecutivos y quedan registrados a tu nombre en el contrato."
    >
      {/* Paquetes */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {packs.map((p, i) => {
          const active = i === sel;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSel(i);
                setResult(undefined);
                buyTx.reset();
                approveTx.reset();
              }}
              className={`card relative grid gap-1 px-5 py-6 text-left transition hover:-translate-y-0.5 ${active ? "border-accent shadow-[inset_0_0_0_1px_#a6ff3d,0_0_40px_-18px_#a6ff3d]" : "hover:border-[#3a463b]"}`}
              aria-pressed={active}
            >
              {i === RECOMMENDED && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
                  Recomendado
                </span>
              )}
              <p className="font-mono text-[40px] font-medium leading-none text-ink">{p.quantity}</p>
              <p className="text-sm text-muted">{p.quantity === 1 ? "número" : "números"}</p>
              <p className="mt-3.5 font-mono text-lg text-ink">
                {fmtToken(p.price, dec)} <span className="text-sm text-muted">{config.tokenSymbol}</span>
              </p>
              <p className="text-xs text-muted">
                {fmtToken(p.price / BigInt(p.quantity), dec)} por número
              </p>
              <p className={`mt-2.5 font-mono text-xs ${savings[i]?.save ? "text-accent" : "text-transparent"}`}>
                {savings[i]?.save ? `Ahorrás ${fmtToken(savings[i].save, dec)} ${config.tokenSymbol} (${savings[i].pct}%)` : "—"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Flujo de compra */}
      <div className="card mt-4 p-5 sm:p-6">
        {!s ? (
          <p className="flex items-center gap-2 text-muted">
            <Spinner /> Leyendo datos del contrato…
          </p>
        ) : !salesOpen ? (
          <Notice>La venta está cerrada. Revisá “Mis números” y “Transparencia” para ver el resultado.</Notice>
        ) : !w.isConnected ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">Conectá tu wallet para participar. ¿No tenés una? Mirá “Primeros pasos” más abajo.</p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button className="pill-solid" onClick={openConnectModal}>
                  Conectar wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        ) : w.wrongNetwork ? (
          <div className="flex flex-col gap-3">
            <Notice tone="error">Tu wallet está en otra red. Para participar tenés que usar {chain.name}.</Notice>
            <button className="pill-solid self-start" disabled={switching} onClick={() => switchChain({ chainId: config.chainId })}>
              {switching && <Spinner />} Cambiar a {chain.name}
            </button>
            {switchError && <p className="text-sm text-bad">No se pudo cambiar de red. Hacelo manualmente desde tu wallet.</p>}
          </div>
        ) : pack ? (
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="label">Tu selección</p>
              <p className="mt-1 text-xl font-semibold">
                {pack.quantity} {pack.quantity === 1 ? "número" : "números"} · {fmtToken(pack.price, dec)} {config.tokenSymbol}
              </p>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Tu saldo</dt>
                  <dd className="font-mono">{fmtToken(w.balance, dec)} {config.tokenSymbol}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Comisión de red estimada</dt>
                  <dd className="font-mono">{fee !== undefined ? `≈ ${Number(formatEther(fee)).toFixed(6)} ${chain.nativeCurrency.symbol}` : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Tus números actuales</dt>
                  <dd className="font-mono">{w.myNumbers ?? 0} / {raffle?.maxPerWallet ?? "—"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted">
                Tu aporte financia los proyectos tecnológicos de la empresa. Si no se alcanza la meta, podés pedir el reembolso
                completo desde esta página.
              </p>
            </div>

            <div className="space-y-3">
              {noBalance ? (
                <div className="space-y-3">
                  <Notice tone="error">No tenés suficientes {config.tokenSymbol} para este paquete.</Notice>
                  {config.isTestnet && (
                    <button className="pill-ghost w-full" disabled={faucetTx.busy} onClick={faucet}>
                      {faucetTx.busy && <Spinner />} Pedir 1.000 {config.tokenSymbol} de prueba
                    </button>
                  )}
                  {faucetTx.error && <p className="text-sm text-bad">{faucetTx.error}</p>}
                </div>
              ) : overWallet ? (
                <Notice tone="error">Con este paquete superarías el máximo de {raffle?.maxPerWallet} números por wallet.</Notice>
              ) : overSupply ? (
                <Notice tone="error">No quedan suficientes números para este paquete. Probá con uno más chico.</Notice>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <StepBadge n={1} status={approveTx.status} done={!needsApprove} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Autorizar {fmtToken(pack.price, dec)} {config.tokenSymbol}</p>
                      <p className="text-xs text-muted">Permite que el contrato cobre solo este monto.</p>
                    </div>
                    {needsApprove && (
                      <button className="pill-ghost" disabled={approveTx.busy} onClick={approve}>
                        Autorizar
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StepBadge n={2} status={buyTx.status} done={false} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Comprar</p>
                      <p className="text-xs text-muted">Se te asignan números consecutivos.</p>
                    </div>
                    <button className="pill-solid" disabled={needsApprove || buyTx.busy || approveTx.busy} onClick={buy}>
                      Comprar
                    </button>
                  </div>
                  {[approveTx, buyTx].map((t, i) =>
                    txHint(t.status) ? (
                      <p key={i} className="flex items-center gap-2 text-sm text-muted">
                        <Spinner /> {txHint(t.status)} {t.hash && <TxLink hash={t.hash} />}
                      </p>
                    ) : null,
                  )}
                  {(approveTx.error || buyTx.error) && <Notice tone="error">{approveTx.error || buyTx.error}</Notice>}
                </>
              )}

              {result && (
                <div className="rounded-lg border border-accent/40 bg-accent-soft p-4">
                  <p className="font-semibold text-accent">¡Listo! Tu compra quedó registrada.</p>
                  <p className="mt-2 text-sm">
                    Tus números:{" "}
                    <span className="font-mono font-bold">
                      #{fmtNumber(result.first)}
                      {result.quantity > 1 && ` → #${fmtNumber(result.first + result.quantity - 1)}`}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Comprobante: <TxLink hash={result.hash} />
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted">Cargando paquetes…</p>
        )}
      </div>

      {/* Aporte libre */}
      {salesOpen && w.isConnected && !w.wrongNetwork && (
        <details className="card mt-4 p-4">
          <summary className="cursor-pointer text-sm font-medium">Hacer un aporte libre (sin números)</summary>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="input sm:max-w-[200px]"
              inputMode="decimal"
              placeholder={`Monto en ${config.tokenSymbol} (mín. 1)`}
              value={donation}
              onChange={(e) => setDonation(e.target.value)}
            />
            <button className="pill-ghost" disabled={donateTx.busy || donationAmount < 10n ** BigInt(dec)} onClick={donate}>
              {donateTx.busy && <Spinner />} Aportar
            </button>
          </div>
          {txHint(donateTx.status) && <p className="mt-2 text-sm text-muted">{txHint(donateTx.status)}</p>}
          {donateTx.status === "success" && <p className="mt-2 text-sm text-accent">¡Gracias por tu aporte!</p>}
          {donateTx.error && <p className="mt-2 text-sm text-bad">{donateTx.error}</p>}
        </details>
      )}
    </Section>
  );
}
