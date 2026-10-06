#!/usr/bin/env bash
# Instala las dependencias de los contratos (no se versionan en git).
set -euo pipefail
cd "$(dirname "$0")"
forge install --no-git foundry-rs/forge-std
forge install --no-git OpenZeppelin/openzeppelin-contracts@v5.1.0
forge install --no-git smartcontractkit/chainlink-brownie-contracts@1.3.0
