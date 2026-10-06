// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IRawFulfill {
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external;
}

/// @notice Mock mínimo de Chainlink VRF v2.5. Determinístico (sin suscripciones) para que
///         funcione igual en tests y en scripts de forge sobre anvil.
///         Cualquiera puede llamar `fulfillRandomWords`: SOLO PRUEBAS, nunca para una rifa real.
contract MockVRFCoordinator {
    struct Request {
        address consumer;
        uint32 numWords;
        uint32 callbackGasLimit;
    }

    uint256 public nextRequestId = 1;
    mapping(uint256 => Request) public requests;

    event RandomWordsRequested(uint256 indexed requestId, address indexed consumer);
    event RandomWordsFulfilled(uint256 indexed requestId, bool success);

    error InvalidRequest();

    function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata req) external returns (uint256 id) {
        id = nextRequestId++;
        requests[id] = Request(msg.sender, req.numWords, req.callbackGasLimit);
        emit RandomWordsRequested(id, msg.sender);
    }

    /// @notice Responde con palabras pseudoaleatorias keccak256(requestId, i).
    function fulfillRandomWords(uint256 requestId, address consumer) external {
        Request memory r = requests[requestId];
        uint256[] memory words = new uint256[](r.numWords);
        for (uint256 i; i < words.length; ++i) {
            words[i] = uint256(keccak256(abi.encode(requestId, i)));
        }
        fulfillRandomWordsWithOverride(requestId, consumer, words);
    }

    /// @notice Responde con las palabras indicadas (útil para tests).
    function fulfillRandomWordsWithOverride(uint256 requestId, address consumer, uint256[] memory words) public {
        Request memory r = requests[requestId];
        if (r.consumer == address(0) || r.consumer != consumer || words.length != r.numWords) {
            revert InvalidRequest();
        }
        delete requests[requestId];
        // Igual que Chainlink: el callback tiene gas limitado y si falla no revierte el coordinador.
        (bool ok,) =
            consumer.call{gas: r.callbackGasLimit}(abi.encodeCall(IRawFulfill.rawFulfillRandomWords, (requestId, words)));
        emit RandomWordsFulfilled(requestId, ok);
    }
}
