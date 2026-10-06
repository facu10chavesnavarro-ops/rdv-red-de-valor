"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, connectorsForWallets, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, trustWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { chain, config } from "@/lib/config";

const transports = { [chain.id]: http(config.rpcUrl) };

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
      connectors: connectorsForWallets([{ groupName: "Wallets", wallets: [injectedWallet] }], {
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
