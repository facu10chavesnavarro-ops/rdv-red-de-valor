// Copia el ABI de Raffle desde la compilación de Foundry a lib/abi.ts.
// Uso: (cd ../contracts && forge build) && npm run sync-abi
import { readFileSync, writeFileSync } from "node:fs";

const out = JSON.parse(readFileSync(new URL("../../contracts/out/Raffle.sol/Raffle.json", import.meta.url)));
const src = `// Generado por scripts/sync-abi.mjs — no editar a mano.
export const raffleAbi = ${JSON.stringify(out.abi, null, 2)} as const;
`;
writeFileSync(new URL("../lib/abi.ts", import.meta.url), src);
console.log("lib/abi.ts actualizado");
