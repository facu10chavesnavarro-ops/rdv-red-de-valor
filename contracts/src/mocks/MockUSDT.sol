// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice USDT de prueba con 18 decimales (igual que USDT en BNB Chain). SOLO TESTNET.
///         Cualquiera puede pedir tokens con `faucet()`.
contract MockUSDT is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1_000 ether; // 1.000 USDT

    constructor() ERC20("Mock Tether USD", "USDT") {}

    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
