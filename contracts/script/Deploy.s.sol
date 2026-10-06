// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Raffle} from "../src/Raffle.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";
import {MockVRFCoordinator} from "../src/mocks/MockVRFCoordinator.sol";

/// @notice Despliegue de la rifa.
///  - En anvil (chainId 31337): despliega MockUSDT + mock de VRF, crea y fondea la suscripción.
///  - En BSC Testnet (97): usa el VRF real de Chainlink. Si USDT_ADDRESS está vacío, despliega MockUSDT.
///  Bloquea cualquier otra red (no hay despliegue a mainnet en este MVP).
///  Variables: ver contracts/.env.example
contract Deploy is Script {
    uint256 constant BSC_TESTNET = 97;
    uint256 constant ANVIL = 31337;

    // Chainlink VRF v2.5 en BSC Testnet (docs.chain.link/vrf/v2-5/supported-networks)
    address constant BSC_TESTNET_VRF_COORDINATOR = 0xDA3b641D438362C440Ac5458c57e00a712b66700;
    bytes32 constant BSC_TESTNET_KEY_HASH_50GWEI = 0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26;

    function run() external {
        uint256 chainId = block.chainid;
        require(chainId == BSC_TESTNET || chainId == ANVIL, "Solo anvil o BSC Testnet");

        vm.startBroadcast();
        (, address deployer,) = vm.readCallers();

        // ---- token
        address token = vm.envOr("USDT_ADDRESS", address(0));
        if (token == address(0)) {
            token = address(new MockUSDT());
            console2.log("MockUSDT desplegado:", token);
        }
        uint256 unit = 10 ** IERC20Metadata(token).decimals();

        // ---- VRF
        Raffle.VRFConfig memory vrf;
        bool isLocal = chainId == ANVIL;
        if (isLocal) {
            MockVRFCoordinator mock = new MockVRFCoordinator();
            vrf = Raffle.VRFConfig(address(mock), bytes32(uint256(1)), 0, 3, 500_000, false);
        } else {
            vrf = Raffle.VRFConfig({
                coordinator: vm.envOr("VRF_COORDINATOR", BSC_TESTNET_VRF_COORDINATOR),
                keyHash: vm.envOr("VRF_KEY_HASH", BSC_TESTNET_KEY_HASH_50GWEI),
                subscriptionId: vm.envUint("VRF_SUBSCRIPTION_ID"),
                requestConfirmations: uint16(vm.envOr("VRF_CONFIRMATIONS", uint256(3))),
                callbackGasLimit: uint32(vm.envOr("VRF_CALLBACK_GAS_LIMIT", uint256(500_000))),
                nativePayment: vm.envOr("VRF_NATIVE_PAYMENT", true)
            });
        }

        // ---- paquetes (precios en unidades del token, usando sus decimales)
        Raffle.Pack[] memory packs = new Raffle.Pack[](4);
        packs[0] = Raffle.Pack(1, uint96(2 * unit));
        packs[1] = Raffle.Pack(3, uint96(4 * unit));
        packs[2] = Raffle.Pack(7, uint96(8 * unit));
        packs[3] = Raffle.Pack(15, uint96(15 * unit));

        Raffle.Config memory cfg = Raffle.Config({
            paymentToken: token,
            goal: vm.envOr("GOAL_USDT", uint256(10)) * unit,
            deadline: uint64(block.timestamp + vm.envOr("DURATION_SECONDS", uint256(7 days))),
            maxNumbers: uint32(vm.envOr("MAX_NUMBERS", uint256(5_000))),
            maxPerWallet: uint32(vm.envOr("MAX_PER_WALLET", uint256(200))),
            treasury: vm.envOr("TREASURY", deployer)
        });

        Raffle raffle = new Raffle(cfg, packs, vrf);
        vm.stopBroadcast();

        // ---- resumen en deployments/<chainId>.json (lo usa la web)
        string memory k = "d";
        vm.serializeUint(k, "chainId", chainId);
        vm.serializeAddress(k, "raffle", address(raffle));
        vm.serializeAddress(k, "token", token);
        vm.serializeAddress(k, "vrfCoordinator", vrf.coordinator);
        vm.serializeUint(k, "vrfSubscriptionId", vrf.subscriptionId);
        vm.serializeAddress(k, "treasury", cfg.treasury);
        vm.serializeUint(k, "deadline", cfg.deadline);
        string memory json = vm.serializeUint(k, "deployBlock", block.number);
        vm.writeJson(json, string.concat("./deployments/", vm.toString(chainId), ".json"));

        console2.log("Raffle:", address(raffle));
        console2.log("Token:", token);
        console2.log("Bloque:", block.number);
        if (!isLocal) {
            console2.log("IMPORTANTE: agrega la Raffle como consumer de tu suscripcion en vrf.chain.link");
        }
    }
}
