// Genera web/.env.local a partir de contracts/deployments/<chainId>.json
// Uso: npm run env:local  (31337)  |  npm run env:testnet  (97)
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const chainId = process.argv[2] ?? "31337";
const file = new URL(`../../contracts/deployments/${chainId}.json`, import.meta.url);
if (!existsSync(file)) {
  console.error(`No existe contracts/deployments/${chainId}.json. Desplegá primero el contrato.`);
  process.exit(1);
}
const d = JSON.parse(readFileSync(file, "utf8"));
const envFile = new URL("../.env.local", import.meta.url);

// Conserva las variables que no vienen del despliegue (redes sociales, WalletConnect, etc.)
const keep = existsSync(envFile)
  ? readFileSync(envFile, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !/^NEXT_PUBLIC_(CHAIN_ID|RPC_URL|RAFFLE_ADDRESS|TOKEN_ADDRESS|DEPLOY_BLOCK)=/.test(l))
  : [];

const rpc = chainId === "31337" ? "http://127.0.0.1:8545" : "https://bsc-testnet-rpc.publicnode.com";
const lines = [
  `NEXT_PUBLIC_CHAIN_ID=${d.chainId}`,
  `NEXT_PUBLIC_RPC_URL=${rpc}`,
  `NEXT_PUBLIC_RAFFLE_ADDRESS=${d.raffle}`,
  `NEXT_PUBLIC_TOKEN_ADDRESS=${d.token}`,
  `NEXT_PUBLIC_DEPLOY_BLOCK=${d.deployBlock}`,
  ...keep,
];
writeFileSync(envFile, lines.join("\n") + "\n");
console.log(`web/.env.local actualizado para chainId ${d.chainId} (Raffle ${d.raffle})`);
