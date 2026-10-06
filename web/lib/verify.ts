import type { Address } from "viem";

export type Range = { buyer: Address; first: number; quantity: number };

/**
 * Replica exactamente la lógica del contrato:
 *   winnerNumber = randomWord % totalNumbersSold
 *   ganador = comprador del último rango con first <= winnerNumber (búsqueda binaria)
 */
export function computeWinner(randomWord: bigint, ranges: Range[]) {
  if (!ranges.length) throw new Error("No hay números vendidos");
  const last = ranges[ranges.length - 1];
  const totalSold = last.first + last.quantity;
  const number = Number(randomWord % BigInt(totalSold));

  let lo = 0;
  let hi = ranges.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (ranges[mid].first <= number) lo = mid;
    else hi = mid - 1;
  }
  return { totalSold, number, rangeIndex: lo, range: ranges[lo], winner: ranges[lo].buyer };
}

/** Comprueba que los rangos sean consecutivos y sin huecos (0, 0+q0, ...). */
export function rangesAreContiguous(ranges: Range[]) {
  let expected = 0;
  for (const r of ranges) {
    if (r.first !== expected || r.quantity <= 0) return false;
    expected += r.quantity;
  }
  return true;
}
