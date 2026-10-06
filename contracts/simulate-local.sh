#!/usr/bin/env bash
# Simula una rifa completa en anvil (local), con meta alcanzada o no alcanzada.
# Uso:
#   anvil                                  # en otra terminal
#   ./simulate-local.sh exito              # meta alcanzada -> sorteo -> retiro a tesorería
#   ./simulate-local.sh reembolso          # meta no alcanzada -> reembolso
#   ./simulate-local.sh demo               # despliega y carga compras, sin cerrar (para ver la web)
# Usa las cuentas de prueba desbloqueadas de anvil (sin claves privadas).
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-exito}"
RPC="${RPC:-http://127.0.0.1:8545}"
DEPLOYER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
ALICE=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
BOB=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

send() { cast send --rpc-url "$RPC" --unlocked --from "$@" >/dev/null; }
call() { cast call --rpc-url "$RPC" "$@"; }
fmt() { cast from-wei "$(echo "$1" | awk '{print $1}')"; }

# anvil arranca en el bloque 0; minamos uno para tener blockhash previo
cast rpc --rpc-url "$RPC" anvil_mine 1 >/dev/null

echo "==> Desplegando (meta 10 USDT, 7 días)"
forge script script/Deploy.s.sol --rpc-url "$RPC" --broadcast --unlocked --sender "$DEPLOYER" >/dev/null
RAFFLE=$(grep -o '"raffle": *"[^"]*"' deployments/31337.json | grep -o '0x[0-9a-fA-F]*')
TOKEN=$(grep -o '"token": *"[^"]*"' deployments/31337.json | grep -o '0x[0-9a-fA-F]*')
VRF=$(grep -o '"vrfCoordinator": *"[^"]*"' deployments/31337.json | grep -o '0x[0-9a-fA-F]*')
TREASURY=$(grep -o '"treasury": *"[^"]*"' deployments/31337.json | grep -o '0x[0-9a-fA-F]*')
echo "    Raffle $RAFFLE | USDT $TOKEN"

for W in $ALICE $BOB; do
  send "$W" "$TOKEN" "faucet()"
  send "$W" "$TOKEN" "approve(address,uint256)" "$RAFFLE" "$(cast max-uint)"
done

if [ "$MODE" = "demo" ]; then
  echo "==> Compras de ejemplo (Alice, Bob y Carol)"
  CAROL=0x90F79bf6EB2c4f870365E785982E1f101E93b906
  send "$CAROL" "$TOKEN" "faucet()"
  send "$CAROL" "$TOKEN" "approve(address,uint256)" "$RAFFLE" "$(cast max-uint)"
  send $ALICE "$RAFFLE" "buyPack(uint8)" 1
  send $BOB "$RAFFLE" "buyPack(uint8)" 0
  send $CAROL "$RAFFLE" "donate(uint256)" "$(cast to-wei 1)"
  echo "    Recaudado: $(fmt "$(call "$RAFFLE" "totalRaised()(uint256)")") USDT | vendidos: $(call "$RAFFLE" "numbersSold()(uint32)")"
  echo "    Copiá en web/.env.local: NEXT_PUBLIC_RAFFLE_ADDRESS=$RAFFLE NEXT_PUBLIC_TOKEN_ADDRESS=$TOKEN"
  exit 0
fi

if [ "$MODE" = "exito" ]; then
  echo "==> Alice compra 7 números (8 USDT), Bob compra 3 (4 USDT) y dona 2"
  send $ALICE "$RAFFLE" "buyPack(uint8)" 2
  send $BOB "$RAFFLE" "buyPack(uint8)" 1
  send $BOB "$RAFFLE" "donate(uint256)" "$(cast to-wei 2)"
else
  echo "==> Alice compra 1 número (2 USDT), Bob compra 3 (4 USDT): total 6 < 10"
  send $ALICE "$RAFFLE" "buyPack(uint8)" 0
  send $BOB "$RAFFLE" "buyPack(uint8)" 1
fi
echo "    Recaudado: $(fmt "$(call "$RAFFLE" "totalRaised()(uint256)")") USDT | vendidos: $(call "$RAFFLE" "numbersSold()(uint32)")"

echo "==> Avanzando el tiempo 7 días"
cast rpc --rpc-url "$RPC" evm_increaseTime 604800 >/dev/null
cast rpc --rpc-url "$RPC" anvil_mine 1 >/dev/null

if [ "$MODE" = "exito" ]; then
  send $DEPLOYER "$RAFFLE" "requestDraw()"
  REQ=$(call "$RAFFLE" "drawRequestId()(uint256)")
  echo "==> Sorteo pedido (requestId $REQ). El mock de VRF responde:"
  send $DEPLOYER "$VRF" "fulfillRandomWords(uint256,address)" "$REQ" "$RAFFLE"
  echo "    Número aleatorio: $(call "$RAFFLE" "randomWord()(uint256)" | awk '{print $1}')"
  echo "    Número ganador:   $(call "$RAFFLE" "winnerNumber()(uint32)")"
  echo "    Ganador:          $(call "$RAFFLE" "winner()(address)")  (Alice=$ALICE, Bob=$BOB)"
  send $DEPLOYER "$RAFFLE" "withdraw()"
  echo "==> Retiro: tesorería tiene $(fmt "$(call "$TOKEN" "balanceOf(address)(uint256)" "$TREASURY")") USDT"
else
  for W in $ALICE $BOB; do
    PAID=$(call "$RAFFLE" "paid(address)(uint256)" "$W")
    send "$W" "$RAFFLE" "claimRefund()"
    echo "==> $W aportó $(fmt "$PAID") USDT y lo recuperó; saldo: $(fmt "$(call "$TOKEN" "balanceOf(address)(uint256)" "$W")") USDT"
  done
  echo "    Estado: $(call "$RAFFLE" "state()(uint8)") (4 = Refunding)"
fi
echo "Listo."
