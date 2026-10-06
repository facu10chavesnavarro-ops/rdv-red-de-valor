import { formatUnits } from "viem";

export const shortAddr = (a?: string, n = 4) => (a ? `${a.slice(0, 2 + n)}…${a.slice(-n)}` : "—");

/** Monto del token en formato es-AR (máx. 2 decimales). */
export function fmtToken(value: bigint | undefined, decimals: number, maxFrac = 2) {
  if (value === undefined) return "—";
  const n = Number(formatUnits(value, decimals));
  return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: maxFrac });
}

export const fmtInt = (n: number | bigint | undefined) =>
  n === undefined ? "—" : Number(n).toLocaleString("es-AR");

/** Número de rifa con 4 dígitos: 7 -> "0007". */
export const fmtNumber = (n: number | bigint) => String(n).padStart(4, "0");

export function timeAgo(tsSeconds: number, now = Date.now() / 1000) {
  const s = Math.max(0, Math.floor(now - tsSeconds));
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export const STATE_LABEL = ["Abierta", "Cerrada", "Sorteando", "Sorteada", "Reembolsos"] as const;
export enum RaffleState {
  Open = 0,
  Closed = 1,
  Drawing = 2,
  Completed = 3,
  Refunding = 4,
}
