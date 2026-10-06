// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

/// @notice Mock oficial de Chainlink VRF v2.5, re-exportado para usarlo en tests y en el
///         despliegue local. En el mock, cualquiera puede llamar `fulfillRandomWords`.
///         SOLO PRUEBAS: nunca usar para una rifa real.
contract MockVRFCoordinator is VRFCoordinatorV2_5Mock {
    constructor() VRFCoordinatorV2_5Mock(0.1 ether, 1 gwei, 4e15) {}
}
