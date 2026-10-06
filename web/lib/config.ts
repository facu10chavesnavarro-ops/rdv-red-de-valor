import { type Address, type Chain } from "viem";
import { bscTestnet, foundry } from "viem/chains";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 97);

if (chainId !== bscTestnet.id && chainId !== foundry.id) {
  // MVP: solo testnet o local. No hay soporte para mainnet hasta que se autorice.
  throw new Error(`NEXT_PUBLIC_CHAIN_ID=${chainId} no soportado (usar 97 o 31337)`);
}

const baseChain: Chain = chainId === foundry.id ? foundry : bscTestnet;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || baseChain.rpcUrls.default.http[0];

export const chain: Chain = {
  ...baseChain,
  name: chainId === foundry.id ? "Anvil (local)" : "BNB Chain Testnet",
  // En local también mostramos BNB para que la UI se vea igual que en testnet
  nativeCurrency: chainId === foundry.id ? { name: "BNB", symbol: "BNB", decimals: 18 } : baseChain.nativeCurrency,
  rpcUrls: { default: { http: [rpcUrl] } },
};

export const config = {
  chainId,
  rpcUrl,
  raffle: (process.env.NEXT_PUBLIC_RAFFLE_ADDRESS ?? "") as Address,
  token: (process.env.NEXT_PUBLIC_TOKEN_ADDRESS ?? "") as Address,
  deployBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? 0),
  logsChunk: BigInt(process.env.NEXT_PUBLIC_LOGS_CHUNK ?? 50000),
  explorer: (process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://testnet.bscscan.com").replace(/\/$/, ""),
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  tokenSymbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "USDT",
  prizeName: process.env.NEXT_PUBLIC_PRIZE_NAME ?? "iPhone",
  isTestnet: true,
  // Footer
  authorizationNumber: process.env.NEXT_PUBLIC_AUTHORIZATION_NUMBER ?? "",
  termsUrl: process.env.NEXT_PUBLIC_TERMS_URL ?? "",
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "",
    x: process.env.NEXT_PUBLIC_SOCIAL_X ?? "",
    telegram: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM ?? "",
  },
};

export const isConfigured = /^0x[0-9a-fA-F]{40}$/.test(config.raffle);

export const explorerTx = (hash: string) => `${config.explorer}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${config.explorer}/address/${addr}`;
