"use client";

import { useReadContracts } from "wagmi";
import { raffleAbi } from "@/lib/abi";
import { config, isConfigured } from "@/lib/config";

export const POLL_MS = 10_000;

const c = { address: config.raffle, abi: raffleAbi, chainId: config.chainId } as const;

/** Estado general de la rifa. Se actualiza cada 10 s. */
export function useRaffle() {
  const q = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...c, functionName: "getStats" },
      { ...c, functionName: "getPacks" },
      { ...c, functionName: "tokenDecimals" },
      { ...c, functionName: "winner" },
      { ...c, functionName: "winnerNumber" },
      { ...c, functionName: "randomWord" },
      { ...c, functionName: "drawRequestId" },
      { ...c, functionName: "drawRequestedAt" },
      { ...c, functionName: "treasury" },
      { ...c, functionName: "paymentToken" },
      { ...c, functionName: "vrfCoordinator" },
      { ...c, functionName: "vrfSubscriptionId" },
      { ...c, functionName: "maxPerWallet" },
      { ...c, functionName: "DRAW_TIMEOUT" },
    ],
    query: { enabled: isConfigured, refetchInterval: POLL_MS },
  });

  const d = q.data;
  return {
    ...q,
    raffle: d && {
      stats: d[0],
      packs: d[1],
      decimals: d[2],
      winner: d[3],
      winnerNumber: d[4],
      randomWord: d[5],
      drawRequestId: d[6],
      drawRequestedAt: d[7],
      treasury: d[8],
      token: d[9],
      vrfCoordinator: d[10],
      vrfSubscriptionId: d[11],
      maxPerWallet: d[12],
      drawTimeout: d[13],
    },
  };
}

export type RaffleData = NonNullable<ReturnType<typeof useRaffle>["raffle"]>;
