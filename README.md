# RDV · Red de Valor — rifa on-chain (MVP)

**Tecnología con impacto, financiada por la comunidad.** RDV financia proyectos tecnológicos (seguridad urbana con
GPS + IA, aeroespacial, RWA para el campo y la ciudad), iniciativas sociales y ambientales, y el sostenimiento del
ecosistema a través de una rifa transparente en BNB Chain.

Destino de lo recaudado (editable en `web/lib/content.ts`): **50 %** proyectos tecnológicos · **25 %** impacto social y
ambiental · **25 %** ecosistema e infraestructura. Lo recaudado no se reparte entre socios.

Se compran números con USDT, el progreso se ve en vivo y el ganador lo elige
**Chainlink VRF v2.5**. Si no se alcanza la meta, cada persona recupera exactamente lo que aportó.

> ⚠️ **Solo testnet.** Este MVP está pensado para BSC Testnet (chainId 97) y para pruebas locales con anvil.
> El script de despliegue y la web se niegan a funcionar en otra red. Antes de producción, ver
> [CHECKLIST_PRODUCCION.md](CHECKLIST_PRODUCCION.md).

## Estructura

```
contracts/               Foundry
  src/Raffle.sol           contrato de la rifa
  src/mocks/               MockUSDT (18 decimales + faucet) y MockVRFCoordinator (pruebas)
  test/Raffle.t.sol        tests unitarios y fuzz
  script/Deploy.s.sol      despliegue (anvil o BSC Testnet)
  simulate-local.sh        simula rifas completas en anvil
  deployments/<chainId>.json  direcciones del último despliegue (las usa la web)
web/                     Next.js 14 (App Router) + wagmi + viem + RainbowKit + Tailwind
```

## Cómo funciona el contrato

| Función | Quién | Cuándo |
|---|---|---|
| `buyPack(packId)` | cualquiera | venta abierta, antes del deadline |
| `donate(amount)` | cualquiera | venta abierta, mínimo 1 USDT, sin números |
| `closeSales()` | cualquiera | deadline cumplido o números agotados |
| `requestDraw()` | cualquiera | meta alcanzada (cierra la venta si hace falta). Reintentable si VRF no responde en 24 h |
| `claimRefund()` | cada aportante | meta no alcanzada (cierra la venta si hace falta) |
| `withdraw()` | cualquiera | después del sorteo; los fondos van **solo** a `treasury` |

- Paquetes fijos al desplegar: 1 nº = 2 USDT, 3 = 4, 7 = 8, 15 = 15. Los precios se escalan con los `decimals()` del token (USDT en BNB Chain usa **18**).
- Cada compra guarda un rango `{buyer, first, quantity}`; no hay un registro por número. Los números van de `#0000` a `vendidos - 1`.
- Ganador: `randomWord % numbersSold` y búsqueda binaria sobre los rangos.
- **Sin owner ni funciones de administración.** No heredamos `VRFConsumerBaseV2Plus` porque trae un owner que podría cambiar el coordinador de VRF. Acá el coordinador es inmutable.
- Si la meta se alcanza solo con donaciones (0 números vendidos), no hay a quién sortear: la rifa pasa a reembolsos.
- Estados: `Open → Closed → Drawing → Completed`, o `Open → Refunding`.

## Requisitos

- Node.js 20+ y npm.
- [Foundry](https://book.getfoundry.sh/getting-started/installation). En Windows, desde **Git Bash**:
  `curl -L https://foundry.paradigm.xyz | bash` y luego `foundryup`.

## 1. Contratos: instalar y testear

```bash
cd contracts
./install-deps.sh      # forge-std, OpenZeppelin 5.1, Chainlink 1.3 (no se versionan en git)
forge test             # 28 tests, incluye fuzz de la búsqueda binaria
```

## 2. Prueba local completa (anvil)

En una terminal:

```bash
anvil
```

En otra (Git Bash):

```bash
cd contracts
./simulate-local.sh exito      # meta alcanzada → sorteo → retiro a tesorería
./simulate-local.sh reembolso  # meta no alcanzada → cada uno recupera lo suyo
./simulate-local.sh demo       # despliega y carga compras sin cerrar (para ver la web)
```

Las simulaciones usan las cuentas desbloqueadas de anvil, así que no hace falta ninguna clave privada.
`exito` y `reembolso` adelantan el reloj de anvil 7 días: para volver a empezar, reiniciá anvil.

Web contra anvil:

```bash
cd web
npm install
npm run env:local    # genera web/.env.local desde contracts/deployments/31337.json
npm run dev          # http://localhost:3000
```

En modo local, el modal de "Conectar wallet" incluye **"Cuenta de prueba (anvil)"**, una cuenta desbloqueada
de anvil que sirve para probar la compra sin extensión. Esta opción **no existe** en testnet.

Para probar el sorteo desde la web en local:

```bash
cast rpc evm_increaseTime 604800 && cast rpc anvil_mine 1
cast send --unlocked --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 <RAFFLE> "requestDraw()"
cast send --unlocked --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 <VRF_MOCK> \
  "fulfillRandomWords(uint256,address)" $(cast call <RAFFLE> "drawRequestId()(uint256)") <RAFFLE>
```

Después, en "Transparencia → Verificar sorteo", tocá **Recalcular en mi navegador**.

## 3. Despliegue en BSC Testnet

Son tres pasos:

1. **Wallet de despliegue solo para testnet.** Creala nueva (no uses una wallet con fondos reales) e importala en el keystore
   cifrado de Foundry, así la clave no queda en texto plano:
   ```bash
   cast wallet import deployer --interactive
   ```
2. **tBNB:** pedí al menos 0,1 tBNB para esa dirección en el [faucet de BNB Chain](https://www.bnbchain.org/en/testnet-faucet).
3. **Desplegar todo con un solo comando** (Git Bash):
   ```bash
   cd contracts
   DURATION_SECONDS=900 ./deploy-testnet.sh     # sin DURATION_SECONDS, la rifa dura 7 días
   ```
   Te pide la contraseña del keystore (no se muestra ni se guarda) y hace lo siguiente:
   1. crea la suscripción de Chainlink VRF y la fondea con 0,05 tBNB;
   2. despliega MockUSDT y Raffle;
   3. agrega la Raffle como *consumer*;
   4. verifica que todo quede bien;
   5. genera `web/.env.local`.

   Variables opcionales: `GOAL_USDT`, `TREASURY`, `VRF_FUND_TBNB`, `VRF_SUBSCRIPTION_ID` (para usar una suscripción que ya tengas),
   `DEPLOYER_ACCOUNT` (si importaste la wallet con otro nombre). Las direcciones quedan en `deployments/97.json`.

Configuración oficial de VRF que usa el script ([docs](https://docs.chain.link/vrf/v2-5/supported-networks)):
coordinador `0xDA3b641D438362C440Ac5458c57e00a712b66700`, key hash de 50 gwei
`0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26`, 3 confirmaciones, pago en tBNB.
El flujo completo (suscripción, despliegue, pedido de sorteo al coordinador real, callback y retiro) se probó contra un fork
de BSC Testnet. El callback usó unos 87.000 de gas, con un límite de 500.000.

(Opcional) Verificar el código en BscScan con `forge verify-contract` y una API key de Etherscan v2.

### Tokens de prueba

- **tBNB** (para las comisiones de red): faucet de BNB Chain (link arriba).
- **USDT de prueba:** botón "Pedir 1.000 USDT de prueba" en la sección Participar, que aparece cuando no te alcanza el saldo, o
  `cast send <MOCK_USDT> "faucet()" --rpc-url bsc_testnet --account <tu-cuenta>`.

### Simular una rifa completa en testnet

Para no esperar 7 días, desplegá con un plazo corto: `DURATION_SECONDS=900` (15 minutos).

- **Meta alcanzada (10 USDT):** comprá paquetes por 10 USDT o más desde la web. Al vencer el plazo, en "Transparencia" aparece
  la acción pública **Cerrar venta y pedir sorteo**. Chainlink responde en 1 o 2 minutos. Después verificá el sorteo y ejecutá
  **Enviar fondos a la tesorería**.
- **Meta no alcanzada:** hacé otro despliegue y comprá menos de 10 USDT. Al vencer el plazo, en "Mis números" aparece
  **Reclamar** con el monto exacto aportado.

## 4. Web: variables de entorno

`npm run env:testnet` completa las cinco primeras desde `contracts/deployments/97.json` y conserva las demás.

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | `97` (BSC Testnet) o `31337` (anvil). Cualquier otro valor falla a propósito |
| `NEXT_PUBLIC_RPC_URL` | RPC. Por defecto `https://bsc-testnet-rpc.publicnode.com` |
| `NEXT_PUBLIC_RAFFLE_ADDRESS` | dirección de la Raffle |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | dirección del token de pago |
| `NEXT_PUBLIC_DEPLOY_BLOCK` | bloque de despliegue (desde ahí se leen los eventos) |
| `NEXT_PUBLIC_EXPLORER_URL` | por defecto `https://testnet.bscscan.com` |
| `NEXT_PUBLIC_LOGS_CHUNK` | tamaño de tramo para `getLogs` (por defecto 50000, probado con el RPC público de BSC Testnet; bajalo si tu RPC lo limita) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | opcional. Habilita MetaMask, Trust y WalletConnect en celulares ([cloud.reown.com](https://cloud.reown.com)) |
| `NEXT_PUBLIC_PRIZE_NAME` / `NEXT_PUBLIC_PRIZE_IMAGE` | nombre e imagen del premio (por ejemplo `/premio.jpg` en `web/public`) |
| `NEXT_PUBLIC_AUTHORIZATION_NUMBER` | número de autorización (vacío = "Pendiente") |
| `NEXT_PUBLIC_TERMS_URL` | link a términos y condiciones |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM` / `_X` / `_TELEGRAM` | redes de contacto del footer |

### Despliegue en Vercel

Importá el repo, configurá **Root Directory = `web`**, cargá las variables de arriba y desplegá. No hace falta backend:
la web lee todo del contrato (funciones `view` cada 10 s y eventos `Purchase`/`Donation`).

## Notas de diseño

- **Feed sin backend:** la primera carga recorre los eventos hacia atrás en tramos hasta juntar 10, y después solo pide los
  bloques nuevos. Los RPC públicos limitan el rango de `getLogs`; si falla, bajá `NEXT_PUBLIC_LOGS_CHUNK`.
- **Autorización por monto exacto:** la web pide `approve` solo por el precio del paquete, nunca ilimitado.
- **Verificación:** la web descarga todos los rangos (`getRanges`, paginado), recalcula `aleatorio mod vendidos` con la misma
  búsqueda binaria y lo compara con el ganador guardado en el contrato.
- **Redacción:** los fondos se describen como "aporte para financiar los proyectos tecnológicos de la empresa".
