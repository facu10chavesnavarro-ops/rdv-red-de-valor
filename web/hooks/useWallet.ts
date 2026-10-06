"use client";

import { erc20Abi } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { config } from "@/lib/config";
import { raffleAbi } from "@/lib/abi";
import { POLL_MS } from "./useRaffle";

/** Datos de la wallet conectada: red, saldo de USDT, autorización y números propios. */
export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const wrongNetwork = isConnected && chainId !== config.chainId;
  const token = { address: config.token, abi: erc20Abi, chainId: config.chainId } as const;
  const raffle = { address: config.raffle, abi: raffleAbi, chainId: config.chainId } as const;

  const q = useReadContracts({
    allowFailure: false,
    contracts: address
      ? [
          { ...token, functionName: "balanceOf", args: [address] },
          { ...token, functionName: "allowance", args: [address, config.raffle] },
          { ...raffle, functionName: "getRangesOf", args: [address] },
          { ...raffle, functionName: "paid", args: [address] },
          { ...raffle, functionName: "numbersOf", args: [address] },
        ]
      : [],
    query: { enabled: !!address, refetchInterval: POLL_MS },
  });

  const d = q.data as
    | [bigint, bigint, readonly { buyer: `0x${string}`; first: number; quantity: number }[], bigint, number]
    | undefined;

  return {
    address,
    isConnected,
    wrongNetwork,
    balance: d?.[0],
    allowance: d?.[1],
    ranges: d?.[2] ?? [],
    paid: d?.[3],
    myNumbers: d?.[4],
    refetch: q.refetch,
    isLoading: q.isLoading,
  };
}
