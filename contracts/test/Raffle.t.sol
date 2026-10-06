// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Raffle} from "../src/Raffle.sol";
import {MockUSDT} from "../src/mocks/MockUSDT.sol";
import {MockVRFCoordinator} from "../src/mocks/MockVRFCoordinator.sol";

contract RaffleTest is Test {
    MockUSDT usdt;
    MockVRFCoordinator vrf;
    Raffle raffle;
    uint256 subId;

    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    uint256 constant U = 1e18; // USDT en BNB Chain: 18 decimales
    uint256 constant GOAL = 10 * U;
    uint64 deadline;

    // ------------------------------------------------------------ helpers

    function _packs() internal pure returns (Raffle.Pack[] memory p) {
        p = new Raffle.Pack[](4);
        p[0] = Raffle.Pack({quantity: 1, price: uint96(2 * U)});
        p[1] = Raffle.Pack({quantity: 3, price: uint96(4 * U)});
        p[2] = Raffle.Pack({quantity: 7, price: uint96(8 * U)});
        p[3] = Raffle.Pack({quantity: 15, price: uint96(15 * U)});
    }

    function _deploy(uint256 goal, uint32 maxNumbers, uint32 maxPerWallet) internal returns (Raffle r) {
        r = new Raffle(
            Raffle.Config({
                paymentToken: address(usdt),
                goal: goal,
                deadline: deadline,
                maxNumbers: maxNumbers,
                maxPerWallet: maxPerWallet,
                treasury: treasury
            }),
            _packs(),
            Raffle.VRFConfig({
                coordinator: address(vrf),
                keyHash: bytes32(uint256(1)),
                subscriptionId: subId,
                requestConfirmations: 3,
                callbackGasLimit: 500_000,
                nativePayment: false
            })
        );
        vrf.addConsumer(subId, address(r));
    }

    function _fund(address who) internal {
        usdt.mint(who, 10_000 * U);
        vm.prank(who);
        usdt.approve(address(raffle), type(uint256).max);
    }

    function _fundFor(Raffle r, address who) internal {
        usdt.mint(who, 10_000 * U);
        vm.prank(who);
        usdt.approve(address(r), type(uint256).max);
    }

    function _buy(address who, uint8 packId) internal {
        vm.prank(who);
        raffle.buyPack(packId);
    }

    function _draw(uint256 word) internal returns (uint256 reqId) {
        reqId = raffle.requestDraw();
        uint256[] memory words = new uint256[](1);
        words[0] = word;
        vrf.fulfillRandomWordsWithOverride(reqId, address(raffle), words);
    }

    function setUp() public {
        deadline = uint64(block.timestamp + 7 days);
        usdt = new MockUSDT();
        vrf = new MockVRFCoordinator();
        subId = vrf.createSubscription();
        vrf.fundSubscription(subId, 1_000 ether);
        raffle = _deploy(GOAL, 5_000, 200);
        _fund(alice);
        _fund(bob);
        _fund(carol);
    }

    // ------------------------------------------------------------ configuración

    function test_readsDecimalsFromToken() public view {
        assertEq(raffle.tokenDecimals(), 18);
        assertEq(raffle.minDonation(), 1 * U);
    }

    function test_revert_invalidConfig() public {
        vm.expectRevert(Raffle.InvalidConfig.selector);
        new Raffle(
            Raffle.Config(address(usdt), GOAL, uint64(block.timestamp), 5_000, 200, treasury),
            _packs(),
            Raffle.VRFConfig(address(vrf), bytes32(0), subId, 3, 500_000, false)
        );
    }

    // ------------------------------------------------------------ compras

    function test_buyEachPack() public {
        uint32[4] memory qty = [uint32(1), 3, 7, 15];
        uint256[4] memory price = [2 * U, 4 * U, 8 * U, 15 * U];
        uint32 expectedFirst;
        for (uint8 i; i < 4; ++i) {
            uint256 before = usdt.balanceOf(alice);
            vm.expectEmit(true, true, false, true, address(raffle));
            emit Raffle.Purchase(alice, i, expectedFirst, qty[i], price[i]);
            _buy(alice, i);
            assertEq(before - usdt.balanceOf(alice), price[i]);
            Raffle.Range memory r = raffle.getRange(i);
            assertEq(r.buyer, alice);
            assertEq(r.first, expectedFirst);
            assertEq(r.quantity, qty[i]);
            expectedFirst += qty[i];
        }
        assertEq(raffle.numbersSold(), 26);
        assertEq(raffle.numbersOf(alice), 26);
        assertEq(raffle.paid(alice), 29 * U);
        assertEq(raffle.totalRaised(), 29 * U);
        assertEq(raffle.participants(), 1);
        assertEq(raffle.getRangesOf(alice).length, 4);
        assertEq(usdt.balanceOf(address(raffle)), 29 * U);
    }

    function test_revert_invalidPack() public {
        vm.expectRevert(Raffle.InvalidPack.selector);
        _buy(alice, 4);
    }

    function test_revert_walletLimit() public {
        // 13 x 15 = 195 números; 7 más pasarían de 200
        for (uint256 i; i < 13; ++i) _buy(alice, 3);
        _buy(alice, 1); // 198
        vm.expectRevert(Raffle.WalletLimitExceeded.selector);
        _buy(alice, 1); // 201
        _buy(alice, 0); // 199
        _buy(alice, 0); // 200
        vm.expectRevert(Raffle.WalletLimitExceeded.selector);
        _buy(alice, 0);
        assertEq(raffle.numbersOf(alice), 200);
        _buy(bob, 0); // otra wallet sí puede
    }

    function test_revert_soldOut_andCanClose() public {
        raffle = _deploy(GOAL, 20, 200);
        _fund(alice);
        _buy(alice, 3); // 15
        vm.expectRevert(Raffle.SoldOut.selector);
        _buy(alice, 2); // 22 > 20
        assertFalse(raffle.canClose());
        _buy(alice, 1); // 18
        _buy(alice, 0); // 19
        _buy(alice, 0); // 20 = agotado
        assertTrue(raffle.canClose());
        raffle.closeSales();
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Closed));
    }

    function test_revert_buyAfterDeadline() public {
        vm.warp(deadline);
        vm.expectRevert(Raffle.SalesEnded.selector);
        _buy(alice, 0);
    }

    function test_revert_buyWithoutApprove() public {
        address dave = makeAddr("dave");
        usdt.mint(dave, 100 * U);
        vm.expectRevert();
        _buy(dave, 0);
    }

    // ------------------------------------------------------------ donaciones

    function test_donate() public {
        vm.prank(bob);
        raffle.donate(5 * U);
        assertEq(raffle.totalDonations(), 5 * U);
        assertEq(raffle.paid(bob), 5 * U);
        assertEq(raffle.numbersOf(bob), 0);
        assertEq(raffle.participants(), 1);
    }

    function test_revert_donateBelowMinimum() public {
        vm.prank(bob);
        vm.expectRevert(Raffle.DonationTooSmall.selector);
        raffle.donate(1 * U - 1);
    }

    // ------------------------------------------------------------ cierre

    function test_revert_closeBeforeDeadline() public {
        vm.expectRevert(Raffle.CannotCloseYet.selector);
        raffle.closeSales();
    }

    function test_close_goalReached() public {
        _buy(alice, 3); // 15 USDT >= 10
        vm.warp(deadline);
        raffle.closeSales();
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Closed));
    }

    function test_close_goalNotReached() public {
        _buy(alice, 1); // 4 USDT < 10
        vm.warp(deadline);
        raffle.closeSales();
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Refunding));
    }

    function test_close_onlyDonations_goesToRefund() public {
        // Meta alcanzada solo con donaciones: no hay números para sortear -> reembolso.
        vm.prank(bob);
        raffle.donate(50 * U);
        vm.warp(deadline);
        raffle.closeSales();
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Refunding));
    }

    // ------------------------------------------------------------ meta alcanzada: sorteo y retiro

    function test_goalReached_fullFlow() public {
        _buy(alice, 1); // 0..2
        _buy(bob, 2); // 3..9
        _buy(carol, 0); // 10
        vm.prank(carol);
        raffle.donate(3 * U);
        assertEq(raffle.totalRaised(), 17 * U);

        vm.warp(deadline);
        uint256 reqId = _draw(1_000_005); // 1_000_005 % 11 = 6 -> bob
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Completed));
        assertEq(raffle.randomWord(), 1_000_005);
        assertEq(raffle.winnerNumber(), 1_000_005 % 11);
        assertEq(raffle.winner(), bob);
        assertEq(raffle.drawRequestId(), reqId);

        raffle.withdraw();
        assertEq(usdt.balanceOf(treasury), 17 * U);
        assertEq(usdt.balanceOf(address(raffle)), 0);
    }

    function test_requestDraw_autoClosesAfterDeadline() public {
        _buy(alice, 3);
        vm.warp(deadline);
        raffle.requestDraw();
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Drawing));
    }

    function test_revert_requestDraw_beforeClose() public {
        _buy(alice, 3);
        vm.expectRevert(abi.encodeWithSelector(Raffle.InvalidState.selector, Raffle.State.Open));
        raffle.requestDraw();
    }

    function test_revert_requestDraw_goalNotReached() public {
        _buy(alice, 0);
        vm.warp(deadline);
        vm.expectRevert(Raffle.GoalNotReached.selector);
        raffle.requestDraw();
    }

    function test_cannotDrawTwice() public {
        _buy(alice, 3);
        _buy(bob, 3);
        vm.warp(deadline);

        uint256 reqId = raffle.requestDraw();
        vm.expectRevert(Raffle.DrawPending.selector);
        raffle.requestDraw();

        uint256[] memory words = new uint256[](1);
        words[0] = 7;
        vrf.fulfillRandomWordsWithOverride(reqId, address(raffle), words);
        address w = raffle.winner();
        assertEq(w, alice);

        vm.expectRevert(abi.encodeWithSelector(Raffle.InvalidState.selector, Raffle.State.Completed));
        raffle.requestDraw();

        // Un segundo callback directo del coordinador no cambia nada
        words[0] = 20;
        vm.prank(address(vrf));
        raffle.rawFulfillRandomWords(reqId, words);
        assertEq(raffle.winner(), w);
        assertEq(raffle.randomWord(), 7);
    }

    function test_drawTimeout_allowsRetry_andIgnoresStaleRequest() public {
        _buy(alice, 3);
        vm.warp(deadline);
        uint256 oldReq = raffle.requestDraw();

        vm.warp(block.timestamp + raffle.DRAW_TIMEOUT());
        uint256 newReq = raffle.requestDraw();
        assertTrue(newReq != oldReq);

        // La respuesta vieja se ignora
        uint256[] memory words = new uint256[](1);
        words[0] = 1;
        vm.prank(address(vrf));
        raffle.rawFulfillRandomWords(oldReq, words);
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Drawing));

        vrf.fulfillRandomWordsWithOverride(newReq, address(raffle), words);
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Completed));
    }

    function test_revert_fulfillNotCoordinator() public {
        uint256[] memory words = new uint256[](1);
        vm.expectRevert(Raffle.OnlyCoordinator.selector);
        raffle.rawFulfillRandomWords(1, words);
    }

    function test_withdraw_onlyToTreasury() public {
        _buy(alice, 3);
        vm.warp(deadline);
        _draw(123);

        // Aunque lo llame un tercero, los fondos van a la tesorería
        address attacker = makeAddr("attacker");
        vm.prank(attacker);
        raffle.withdraw();
        assertEq(usdt.balanceOf(attacker), 0);
        assertEq(usdt.balanceOf(treasury), 15 * U);
    }

    function test_revert_withdrawBeforeDraw() public {
        _buy(alice, 3);
        vm.expectRevert(abi.encodeWithSelector(Raffle.InvalidState.selector, Raffle.State.Open));
        raffle.withdraw();
        vm.warp(deadline);
        raffle.requestDraw();
        vm.expectRevert(abi.encodeWithSelector(Raffle.InvalidState.selector, Raffle.State.Drawing));
        raffle.withdraw();
    }

    // ------------------------------------------------------------ meta no alcanzada: reembolso

    function test_refund_exact() public {
        _buy(alice, 0); // 2
        _buy(alice, 1); // 4
        vm.prank(alice);
        raffle.donate(1 * U); // 1  -> 7
        _buy(bob, 0); // 2
        uint256 aliceBefore = usdt.balanceOf(alice) + 7 * U;
        uint256 bobBefore = usdt.balanceOf(bob) + 2 * U;

        vm.expectRevert(abi.encodeWithSelector(Raffle.InvalidState.selector, Raffle.State.Open));
        vm.prank(alice);
        raffle.claimRefund();

        vm.warp(deadline);
        vm.prank(alice);
        raffle.claimRefund(); // cierra automáticamente
        assertEq(uint8(raffle.state()), uint8(Raffle.State.Refunding));
        assertEq(usdt.balanceOf(alice), aliceBefore);

        vm.prank(alice);
        vm.expectRevert(Raffle.NothingToRefund.selector);
        raffle.claimRefund();

        vm.prank(bob);
        raffle.claimRefund();
        assertEq(usdt.balanceOf(bob), bobBefore);

        assertEq(usdt.balanceOf(address(raffle)), 0);
        assertEq(raffle.totalRefunded(), 9 * U);

        vm.expectRevert(abi.encodeWithSelector(Raffle.InvalidState.selector, Raffle.State.Refunding));
        raffle.withdraw();
    }

    function test_revert_refundWhenGoalReached() public {
        _buy(alice, 3);
        vm.warp(deadline);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Raffle.InvalidState.selector, Raffle.State.Closed));
        raffle.claimRefund();
    }

    // ------------------------------------------------------------ fuzz: búsqueda binaria

    /// @dev Muchas compras aleatorias de muchas wallets; el ganador por búsqueda binaria
    ///      debe coincidir con una búsqueda lineal.
    function testFuzz_winnerBinarySearch(uint256 seed, uint256 word, uint8 nPurchases) public {
        uint256 n = bound(nPurchases, 1, 250);
        raffle = _deploy(1 * U, 5_000, 200);

        address[] memory buyers = new address[](n);
        uint32[] memory firsts = new uint32[](n);
        for (uint256 i; i < n; ++i) {
            address b = address(uint160(uint256(keccak256(abi.encode(seed, i % 37))) | 1));
            if (raffle.numbersOf(b) == 0 && usdt.balanceOf(b) == 0) _fundFor(raffle, b);
            uint8 pack = uint8(uint256(keccak256(abi.encode(seed, i, "p"))) % 4);
            firsts[i] = raffle.numbersSold();
            buyers[i] = b;
            vm.prank(b);
            try raffle.buyPack(pack) {} catch {
                buyers[i] = address(0); // límite por wallet
            }
        }
        vm.warp(deadline);
        _draw(word);

        uint32 sold = raffle.numbersSold();
        uint32 number = uint32(word % sold);
        assertEq(raffle.winnerNumber(), number);

        address expected;
        for (uint256 i; i < n; ++i) {
            if (buyers[i] != address(0) && firsts[i] <= number) expected = buyers[i];
        }
        assertEq(raffle.winner(), expected);
        assertEq(raffle.ownerOfNumber(number), expected);
    }

    /// @dev ownerOfNumber coincide con los rangos en los bordes de cada rango.
    function testFuzz_ownerOfNumberBorders(uint8 a, uint8 b, uint8 c) public {
        address[3] memory who = [alice, bob, carol];
        uint8[3] memory packs = [a % 4, b % 4, c % 4];
        for (uint256 i; i < 3; ++i) _buy(who[i], packs[i]);
        for (uint256 i; i < 3; ++i) {
            Raffle.Range memory r = raffle.getRange(i);
            assertEq(raffle.ownerOfNumber(r.first), who[i]);
            assertEq(raffle.ownerOfNumber(r.first + r.quantity - 1), who[i]);
        }
    }

    function test_getRangesPaginated() public {
        for (uint256 i; i < 5; ++i) _buy(alice, 0);
        assertEq(raffle.getRanges(0, 3).length, 3);
        assertEq(raffle.getRanges(3, 10).length, 2);
        assertEq(raffle.getRanges(10, 10).length, 0);
    }
}
