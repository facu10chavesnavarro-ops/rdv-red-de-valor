"use client";

import { useWriteContract } from "wagmi";
import { useRaffle } from "@/hooks/useRaffle";
import { useTx } from "@/hooks/useTx";
import { useWallet } from "@/hooks/useWallet";
import { raffleAbi } from "@/lib/abi";
import { config } from "@/lib/config";
import { fmtToken, RaffleState, STATE_LABEL } from "@/lib/format";
import { AddressLink, CopyButton, Notice, Section, Spinner, TxLink } from "./ui";
import { VerifyDraw } from "./VerifyDraw";

type Action = "closeSales" | "requestDraw" | "withdraw";

/** Funciones públicas del contrato: cualquiera puede ejecutarlas cuando corresponde. */
function PublicActions() {
  const { raffle, refetch } = useRaffle();
  const w = useWallet();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();
  if (!raffle) return null;

  const s = raffle.stats;
  const now = Math.floor(Date.now() / 1000);
  const deadlinePassed = now >= Number(s.deadline);
  const goalOk = s.totalRaised >= s.goal && s.numbersSold > 0;

  let action: { fn: Action; label: string; help: string } | null = null;
  if (s.state === RaffleState.Open && (deadlinePassed || s.numbersSold === s.maxNumbers)) {
    action = goalOk
      ? { fn: "requestDraw", label: "Cerrar venta y pedir sorteo", help: "Terminó el plazo y se alcanzó la meta." }
      : { fn: "closeSales", label: "Cerrar venta", help: "Terminó el plazo sin alcanzar la meta: se habilitan los reembolsos." };
  } else if (s.state === RaffleState.Closed) {
    action = { fn: "requestDraw", label: "Pedir sorteo a Chainlink VRF", help: "La venta cerró con la meta alcanzada." };
  } else if (s.state === RaffleState.Drawing && now >= Number(raffle.drawRequestedAt + raffle.drawTimeout)) {
    action = { fn: "requestDraw", label: "Reintentar sorteo", help: "Chainlink VRF no respondió en 24 h; se puede volver a pedir." };
  } else if (s.state === RaffleState.Completed && s.balance > 0n) {
    action = {
      fn: "withdraw",
      label: "Enviar fondos a la tesorería",
      help: `Envía ${fmtToken(s.balance, raffle.decimals)} ${config.tokenSymbol} a la dirección de tesorería fijada en el contrato.`,
    };
  }

  if (!action) {
    // Tras ejecutar la acción, deja de estar disponible: mantenemos visible el comprobante.
    return tx.status === "success" && tx.hash ? (
      <div className="mt-4">
        <Notice tone="ok">
          Hecho. Comprobante: <TxLink hash={tx.hash} />
        </Notice>
      </div>
    ) : null;
  }

  const run = async () => {
    const r = await tx.run(() =>
      writeContractAsync({ address: config.raffle, abi: raffleAbi, functionName: action!.fn, chainId: config.chainId }),
    );
    if (r) refetch();
  };

  return (
    <div className="card mt-4 space-y-2 p-4">
      <p className="label">Acción pública disponible</p>
      <p className="text-sm text-muted">
        {action.help} Cualquier persona puede ejecutarla (paga solo la comisión de red); el contrato decide qué se puede hacer.
      </p>
      <button className="btn-ghost" disabled={!w.isConnected || w.wrongNetwork || tx.busy} onClick={run}>
        {tx.busy && <Spinner />} {action.label}
      </button>
      {!w.isConnected && <p className="text-xs text-muted">Conectá una wallet para ejecutarla.</p>}
      {tx.status === "success" && tx.hash && (
        <Notice tone="ok">
          Hecho. Comprobante: <TxLink hash={tx.hash} />
        </Notice>
      )}
      {tx.error && <Notice tone="error">{tx.error}</Notice>}
    </div>
  );
}

export function Transparency() {
  const { raffle } = useRaffle();
  const s = raffle?.stats;
  const dec = raffle?.decimals ?? 18;
  const goal = s ? `${fmtToken(s.goal, dec)} ${config.tokenSymbol}` : "la meta";

  return (
    <Section id="transparencia" kicker="Transparencia" title="Reglas claras, verificables por cualquiera">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card space-y-3 p-4 text-sm">
            <div>
              <p className="label">Contrato de la rifa</p>
              <div className="mt-1 flex items-center gap-2">
                <AddressLink address={config.raffle} full />
                <CopyButton text={config.raffle} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="label">Token de pago</p>
                <AddressLink address={raffle?.token} />
              </div>
              <div>
                <p className="label">Tesorería (recibe los fondos)</p>
                <AddressLink address={raffle?.treasury} />
              </div>
              <div>
                <p className="label">Coordinador Chainlink VRF</p>
                <AddressLink address={raffle?.vrfCoordinator} />
              </div>
              <div>
                <p className="label">Estado</p>
                <p className="font-mono">{s ? STATE_LABEL[s.state] : "—"}</p>
              </div>
            </div>
          </div>

          <ol className="card list-decimal space-y-3 p-4 pl-9 text-sm text-muted marker:font-mono marker:text-accent">
            <li>
              <span className="text-ink">Cada compra te asigna números consecutivos</span> (#0000, #0001…). Quedan registrados en el
              contrato a tu nombre.
            </li>
            <li>
              <span className="text-ink">Si al terminar el plazo se juntó {goal} o más</span>, se hace el sorteo. Después, los fondos
              van a la tesorería como aporte para financiar los proyectos tecnológicos de la empresa.
            </li>
            <li>
              <span className="text-ink">Si no se llega a la meta, se devuelve todo.</span> Cada persona recupera exactamente lo que
              aportó (compras y aportes libres) desde “Mis números”. Nadie puede quedarse con ese dinero.
            </li>
            <li>
              <span className="text-ink">El ganador lo elige Chainlink VRF</span>, un servicio que genera un número aleatorio con una
              prueba criptográfica verificable: ni nosotros ni nadie puede predecirlo ni cambiarlo. El número ganador es{" "}
              <span className="font-mono text-ink">aleatorio mod números vendidos</span>.
            </li>
            <li>
              <span className="text-ink">No hay administrador.</span> El contrato no tiene funciones para mover los fondos de otra forma
              ni para cambiar las reglas. Cerrar la venta, pedir el sorteo o enviar los fondos a la tesorería lo puede hacer cualquiera,
              cuando corresponde.
            </li>
            <li>
              Si Chainlink no responde en 24 horas, se puede volver a pedir el sorteo. Así los fondos nunca quedan trabados.
            </li>
          </ol>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Verificar sorteo</h3>
          {raffle ? <VerifyDraw raffle={raffle} /> : <p className="text-muted">Cargando…</p>}
          <PublicActions />
        </div>
      </div>
    </Section>
  );
}
