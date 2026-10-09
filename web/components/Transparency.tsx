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
    <div className="card mt-4 space-y-2 p-5">
      <p className="label">Acción pública disponible</p>
      <p className="text-sm text-muted">
        {action.help} Cualquier persona puede ejecutarla (paga solo la comisión de red); el contrato decide qué se puede hacer.
      </p>
      <button className="pill-ghost" disabled={!w.isConnected || w.wrongNetwork || tx.busy} onClick={run}>
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

const WHY = [
  {
    title: "Trazabilidad",
    text: "Cada compra, aporte y transferencia queda registrada con fecha y comprobante. Se puede seguir desde el origen hasta su destino.",
    icon: (
      <>
        <circle cx="10" cy="24" r="5" />
        <circle cx="38" cy="10" r="5" />
        <circle cx="38" cy="38" r="5" />
        <path d="M15 22l18-10M15 26l18 10" />
      </>
    ),
  },
  {
    title: "Descentralización",
    text: "No depende de nosotros: el contrato corre en miles de nodos y nadie puede pausarlo, frenarlo ni quedarse con los fondos.",
    icon: (
      <>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <rect x="30" y="6" width="12" height="12" rx="2" />
        <rect x="6" y="30" width="12" height="12" rx="2" />
        <rect x="30" y="30" width="12" height="12" rx="2" />
        <path d="M18 12h12M18 36h12M12 18v12M36 18v12" />
      </>
    ),
  },
  {
    title: "Transparencia",
    text: "Cualquiera puede ver el contrato, los aportes y el sorteo, y recalcular el resultado en su propio navegador.",
    icon: (
      <>
        <path d="M4 24s7-13 20-13 20 13 20 13-7 13-20 13S4 24 4 24z" />
        <circle cx="24" cy="24" r="6" />
      </>
    ),
  },
];

function WhyBlockchain() {
  return (
    <div className="grid border-y border-line md:grid-cols-3">
      {WHY.map((w, i) => (
        <div
          key={w.title}
          className={`grid justify-items-center gap-3 px-7 py-8 text-center ${i ? "border-t border-line md:border-l md:border-t-0" : ""}`}
        >
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-11 w-11 text-accent" aria-hidden>
            {w.icon}
          </svg>
          <h3 className="text-lg font-semibold">{w.title}</h3>
          <p className="max-w-[34ch] text-[15px]">{w.text}</p>
        </div>
      ))}
    </div>
  );
}

export function Transparency() {
  const { raffle } = useRaffle();
  const s = raffle?.stats;
  const dec = raffle?.decimals ?? 18;
  const goal = s ? `${fmtToken(s.goal, dec)} ${config.tokenSymbol}` : "la meta";

  return (
    <Section
      id="transparencia"
      kicker="Transparencia"
      title="¿Por qué en blockchain?"
      intro="Las reglas de la rifa están programadas en un contrato público. No hay administrador que pueda cambiarlas ni mover los fondos de otra forma."
    >
      <WhyBlockchain />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card space-y-3 p-5 text-sm">
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

          <ol className="card list-decimal space-y-3 p-5 pl-10 text-sm text-body marker:font-mono marker:text-accent">
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
