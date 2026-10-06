"use client";

import { useCallback, useState } from "react";
import type { Hash, TransactionReceipt } from "viem";
import { usePublicClient } from "wagmi";
import { config } from "@/lib/config";
import { friendlyError } from "@/lib/errors";

export type TxStatus = "idle" | "wallet" | "pending" | "success" | "error";

/**
 * Envuelve una escritura on-chain: espera la firma en la wallet, luego la confirmación,
 * y traduce errores a mensajes en español.
 */
export function useTx() {
  const client = usePublicClient({ chainId: config.chainId });
  const [status, setStatus] = useState<TxStatus>("idle");
  const [hash, setHash] = useState<Hash>();
  const [error, setError] = useState<string>();

  const run = useCallback(
    async (send: () => Promise<Hash>): Promise<TransactionReceipt | undefined> => {
      setError(undefined);
      setHash(undefined);
      setStatus("wallet");
      try {
        const h = await send();
        setHash(h);
        setStatus("pending");
        const receipt = await client!.waitForTransactionReceipt({ hash: h });
        if (receipt.status !== "success") throw new Error("La transacción fue revertida.");
        setStatus("success");
        return receipt;
      } catch (e) {
        setError(e instanceof Error && e.message === "La transacción fue revertida." ? e.message : friendlyError(e));
        setStatus("error");
        return undefined;
      }
    },
    [client],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(undefined);
    setHash(undefined);
  }, []);

  return { run, status, hash, error, reset, busy: status === "wallet" || status === "pending" };
}
