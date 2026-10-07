#!/usr/bin/env bash
# Despliegue completo en BSC Testnet en un solo paso:
#   1. crea la suscripción de Chainlink VRF (o usa VRF_SUBSCRIPTION_ID si ya tenés una)
#   2. la fondea con tBNB (pago nativo)
#   3. despliega MockUSDT + Raffle
#   4. agrega la Raffle como consumer de la suscripción
#   5. verifica todo y genera web/.env.local
#
# Requisitos: una wallet importada en el keystore de Foundry y con tBNB del faucet:
#   cast wallet import deployer --interactive
# Uso (Git Bash):
#   ./deploy-testnet.sh
# Variables opcionales (o en contracts/.env): DEPLOYER_ACCOUNT (deployer), VRF_FUND_TBNB (0.05),
#   VRF_SUBSCRIPTION_ID, GOAL_USDT (10), DURATION_SECONDS (604800), TREASURY, USDT_ADDRESS.
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && { set -a; source .env; set +a; }

RPC="${BSC_TESTNET_RPC_URL:-https://bsc-testnet-rpc.publicnode.com}"
COORD="${VRF_COORDINATOR:-0xDA3b641D438362C440Ac5458c57e00a712b66700}"
FUND="${VRF_FUND_TBNB:-0.05}"
ACCOUNT="${DEPLOYER_ACCOUNT:-deployer}"
EXPLORER="https://testnet.bscscan.com"

say() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

command -v forge >/dev/null || fail "No encuentro Foundry. Instalalo con foundryup (ver README)."
command -v node >/dev/null || fail "No encuentro Node.js."

CHAIN_ID=$(cast chain-id --rpc-url "$RPC") || fail "No pude conectarme al RPC $RPC"
[ "$CHAIN_ID" = "97" ] || fail "El RPC no es BSC Testnet (chainId $CHAIN_ID). Este script solo despliega en testnet."

# ---- wallet
if [ -n "${FORK_TEST_SENDER:-}" ]; then
  # Solo para probar este script contra un fork local (anvil --fork-url ...): cuenta desbloqueada.
  ADDR="$FORK_TEST_SENDER"
  WALLET=(--unlocked --from "$ADDR")
  SCRIPT_WALLET=(--unlocked --sender "$ADDR")
else
  if [ -n "${DEPLOYER_KEYSTORE:-}" ]; then KS=(--keystore "$DEPLOYER_KEYSTORE"); else KS=(--account "$ACCOUNT"); fi
  read -rsp "Contraseña del keystore de Foundry ('${DEPLOYER_KEYSTORE:-$ACCOUNT}'): " PW
  echo
  PWFILE=$(mktemp)
  chmod 600 "$PWFILE"
  trap 'rm -f "$PWFILE"' EXIT
  printf '%s' "$PW" >"$PWFILE"
  unset PW
  WALLET=("${KS[@]}" --password-file "$PWFILE")
  ADDR=$(cast wallet address "${WALLET[@]}") || fail "No pude abrir el keystore. ¿La contraseña es correcta?"
  SCRIPT_WALLET=("${WALLET[@]}" --sender "$ADDR")
fi

BAL=$(cast balance "$ADDR" --rpc-url "$RPC" --ether)
say "Wallet de despliegue: $ADDR (saldo: $BAL tBNB)"
NEEDED=$(awk -v f="$FUND" 'BEGIN { print f + 0.02 }')
awk -v b="$BAL" -v n="$NEEDED" 'BEGIN { exit !(b >= n) }' ||
  fail "Necesitás al menos $NEEDED tBNB ($FUND para la suscripción + 0.02 de comisiones). Pedí más en https://www.bnbchain.org/en/testnet-faucet"

# ---- 1. suscripción VRF
SUB="${VRF_SUBSCRIPTION_ID:-}"
if [ -z "$SUB" ]; then
  say "Creando suscripción de Chainlink VRF"
  RCPT=$(cast send "$COORD" "createSubscription()" "${WALLET[@]}" --rpc-url "$RPC" --json)
  TOPIC=$(cast keccak "SubscriptionCreated(uint256,address)")
  SUB=$(node -e '
    const r = JSON.parse(process.argv[1]); const [coord, topic] = [process.argv[2].toLowerCase(), process.argv[3]];
    const log = r.logs.find(l => l.address.toLowerCase() === coord && l.topics[0] === topic);
    if (!log) process.exit(1);
    console.log(BigInt(log.topics[1]).toString());
  ' "$RCPT" "$COORD" "$TOPIC") || fail "No encontré el evento SubscriptionCreated en la transacción."
  echo "    Subscription ID: $SUB"
else
  say "Usando la suscripción existente $SUB"
fi

say "Fondeando la suscripción con $FUND tBNB"
cast send "$COORD" "fundSubscriptionWithNative(uint256)" "$SUB" --value "${FUND}ether" "${WALLET[@]}" --rpc-url "$RPC" >/dev/null

# ---- 2. contratos
say "Desplegando contratos (meta ${GOAL_USDT:-10} USDT, duración ${DURATION_SECONDS:-604800} s)"
VRF_SUBSCRIPTION_ID="$SUB" forge script script/Deploy.s.sol --rpc-url "$RPC" --broadcast "${SCRIPT_WALLET[@]}" >/dev/null
RAFFLE=$(node -e 'console.log(require("./deployments/97.json").raffle)')
TOKEN=$(node -e 'console.log(require("./deployments/97.json").token)')
echo "    Raffle: $RAFFLE"
echo "    Token:  $TOKEN"

# ---- 3. consumer
say "Agregando la Raffle como consumer de la suscripción"
cast send "$COORD" "addConsumer(uint256,address)" "$SUB" "$RAFFLE" "${WALLET[@]}" --rpc-url "$RPC" >/dev/null

# ---- 4. verificación
say "Verificando"
INFO=$(cast call "$COORD" "getSubscription(uint256)(uint96,uint96,uint64,address,address[])" "$SUB" --rpc-url "$RPC")
echo "$INFO" | tr '[:upper:]' '[:lower:]' | grep -q "$(echo "$RAFFLE" | tr '[:upper:]' '[:lower:]')" ||
  fail "La Raffle no figura como consumer de la suscripción $SUB."
NATIVE=$(echo "$INFO" | sed -n 2p | awk '{print $1}')
echo "    Consumer agregado ✓ | saldo de la suscripción: $(cast from-wei "$NATIVE") tBNB"
echo "    Meta: $(cast from-wei "$(cast call "$RAFFLE" "goal()(uint256)" --rpc-url "$RPC" | awk '{print $1}')") USDT | paquetes: $(cast call "$RAFFLE" "packsCount()(uint256)" --rpc-url "$RPC")"
DEADLINE=$(cast call "$RAFFLE" "deadline()(uint64)" --rpc-url "$RPC" | awk '{print $1}')
echo "    Cierre de la venta: $(date -d "@$DEADLINE" '+%d/%m/%Y %H:%M' 2>/dev/null || echo "timestamp $DEADLINE")"

# ---- 5. web
if [ -z "${SKIP_WEB_ENV:-}" ]; then
  node ../web/scripts/env-from-deployment.mjs 97
fi

cat <<EOF

Listo. Resumen:
  Rifa:          $EXPLORER/address/$RAFFLE
  USDT de prueba: $EXPLORER/address/$TOKEN
  Suscripción VRF: https://vrf.chain.link/bnb-testnet/$SUB

Siguiente paso: cd ../web && npm run build && npm start   (o desplegá web/ en Vercel)
EOF
