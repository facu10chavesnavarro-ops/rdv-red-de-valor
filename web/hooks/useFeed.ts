"use client";

import { useEffect, useRef, useState } from "react";
import { parseAbiItem, type Address, type Hash } from "viem";
import { usePublicClient } from "wagmi";
import { config, isConfigured } from "@/lib/config";
import { POLL_MS } from "./useRaffle";

export type FeedItem = {
  kind: "compra" | "aporte";
  who: Address;
  amount: bigint;
  quantity?: number;
  txHash: Hash;
  blockNumber: bigint;
  logIndex: number;
  timestamp?: number;
};

const purchaseEvent = parseAbiItem(
  "event Purchase(address indexed buyer, uint8 indexed packId, uint32 first, uint32 quantity, uint256 amount)",
);
const donationEvent = parseAbiItem("event Donation(address indexed donor, uint256 amount)");

const LIMIT = 10;

/**
 * Últimos aportes leídos directamente de los eventos del contrato.
 * La primera vez recorre hacia atrás en tramos (los RPC públicos limitan el rango de getLogs)
 * hasta juntar 10; después solo pide los bloques nuevos cada 10 s.
 */
export function useFeed() {
  const client = usePublicClient({ chainId: config.chainId });
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastBlock = useRef<bigint | null>(null);
  const timestamps = useRef(new Map<bigint, number>());

  useEffect(() => {
    if (!client || !isConfigured) return;
    let cancelled = false;

    const fetchRange = async (fromBlock: bigint, toBlock: bigint): Promise<FeedItem[]> => {
      // Un solo getLogs para ambos eventos (la mitad de pedidos al RPC)
      const logs = await client.getLogs({ address: config.raffle, events: [purchaseEvent, donationEvent], fromBlock, toBlock });
      return logs.map((l) =>
        l.eventName === "Purchase"
          ? {
              kind: "compra" as const,
              who: l.args.buyer!,
              amount: l.args.amount!,
              quantity: Number(l.args.quantity),
              txHash: l.transactionHash!,
              blockNumber: l.blockNumber!,
              logIndex: l.logIndex!,
            }
          : {
              kind: "aporte" as const,
              who: l.args.donor!,
              amount: l.args.amount!,
              txHash: l.transactionHash!,
              blockNumber: l.blockNumber!,
              logIndex: l.logIndex!,
            },
      );
    };

    const withTimestamps = async (list: FeedItem[]) => {
      const missing = Array.from(new Set(list.map((i) => i.blockNumber))).filter((b) => !timestamps.current.has(b));
      await Promise.all(
        missing.map(async (b) => {
          const block = await client.getBlock({ blockNumber: b });
          timestamps.current.set(b, Number(block.timestamp));
        }),
      );
      return list.map((i) => ({ ...i, timestamp: timestamps.current.get(i.blockNumber) }));
    };

    const sortDesc = (a: FeedItem, b: FeedItem) =>
      a.blockNumber === b.blockNumber ? b.logIndex - a.logIndex : a.blockNumber > b.blockNumber ? -1 : 1;

    let running = false;
    const tick = async () => {
      if (running) return; // evita superponer lecturas si el RPC está lento
      running = true;
      try {
        const latest = await client.getBlockNumber();
        let found: FeedItem[] = [];

        if (lastBlock.current === null) {
          // Carga inicial: hacia atrás hasta tener 10 o llegar al bloque de despliegue
          let to = latest;
          while (found.length < LIMIT && to >= config.deployBlock) {
            const from = to - config.logsChunk + 1n > config.deployBlock ? to - config.logsChunk + 1n : config.deployBlock;
            found = found.concat(await fetchRange(from, to));
            if (from === config.deployBlock) break;
            to = from - 1n;
          }
        } else if (latest > lastBlock.current) {
          let from = lastBlock.current + 1n;
          while (from <= latest) {
            const to = from + config.logsChunk - 1n < latest ? from + config.logsChunk - 1n : latest;
            found = found.concat(await fetchRange(from, to));
            from = to + 1n;
          }
        }
        lastBlock.current = latest;

        if (found.length && !cancelled) {
          const enriched = await withTimestamps(found.sort(sortDesc).slice(0, LIMIT));
          setItems((prev) => {
            const seen = new Set(prev.map((p) => `${p.txHash}-${p.logIndex}`));
            const fresh = enriched.filter((e) => !seen.has(`${e.txHash}-${e.logIndex}`));
            return [...fresh, ...prev].sort(sortDesc).slice(0, LIMIT);
          });
        }
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) setError("No se pudieron leer los últimos aportes. Reintentando…");
        console.error(e);
      } finally {
        running = false;
        if (!cancelled) setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [client]);

  return { items, loading, error };
}
