"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
  getDefaultConfig,
  type Wallet,
  type WalletDetailsParams,
} from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, trustWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { foundry } from "viem/chains";
import { WagmiProvider, createConfig, createConnector, http } from "wagmi";
import { mock } from "wagmi/connectors";
import { chain, config } from "@/lib/config";

const transports = { [chain.id]: http(config.rpcUrl) };

// SOLO LOCAL (anvil, chainId 31337): wallet de prueba con una cuenta desbloqueada de anvil,
// para probar el flujo de compra sin extensión. No existe en testnet.
const ANVIL_TEST_ACCOUNT = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
const anvilWallet = (): Wallet => ({
  id: "anvil-test",
  name: "Cuenta de prueba (anvil)",
  iconBackground: "#F3BA2F",
  iconUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'><rect width='28' height='28' rx='6' fill='%23F3BA2F'/><text x='14' y='19' font-size='14' text-anchor='middle' font-family='monospace' fill='%230B0E11'>A</text></svg>",
  createConnector: (details: WalletDetailsParams) =>
    createConnector((cfg) => ({ ...mock({ accounts: [ANVIL_TEST_ACCOUNT], features: { reconnect: true } })(cfg), ...details })),
});
const isLocal = chain.id === foundry.id;

// Con WalletConnect projectId: MetaMask, Trust, WalletConnect (móvil). Sin él: solo wallets del navegador.
const wagmiConfig = config.walletConnectProjectId
  ? getDefaultConfig({
      appName: "Rifa solidaria",
      projectId: config.walletConnectProjectId,
      chains: [chain],
      transports,
      wallets: [{ groupName: "Recomendadas", wallets: [metaMaskWallet, trustWallet, walletConnectWallet, injectedWallet] }],
      ssr: true,
    })
  : createConfig({
      chains: [chain],
      transports,
      connectors: connectorsForWallets([{ groupName: "Wallets", wallets: isLocal ? [injectedWallet, anvilWallet] : [injectedWallet] }], {
        appName: "Rifa solidaria",
        projectId: "none",
      }),
      ssr: true,
    });

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale="es-419"
          initialChain={chain}
          theme={darkTheme({ accentColor: "#F3BA2F", accentColorForeground: "#0B0E11", borderRadius: "medium" })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
