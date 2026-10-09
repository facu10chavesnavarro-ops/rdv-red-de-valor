// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVRFCoordinatorV2Plus} from
    "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/// @title Raffle — rifa on-chain de RDV (Red de Valor)
/// @notice Venta de números por paquetes en un token ERC20 (USDT). Si se alcanza la meta,
///         el ganador se elige con Chainlink VRF v2.5 y los fondos van a `treasury`.
///         Si no se alcanza, cada wallet recupera exactamente lo que aportó.
/// @dev Sin owner ni funciones de administración: toda la configuración es inmutable.
///      No heredamos VRFConsumerBaseV2Plus a propósito: trae un owner que puede cambiar
///      el coordinador (y por lo tanto el sorteo). Acá el coordinador es inmutable.
///      Los números van de 0 a totalNumbersSold - 1.
contract Raffle is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------- tipos

    enum State {
        Open,
        Closed,
        Drawing,
        Completed,
        Refunding
    }

    struct Pack {
        uint32 quantity;
        uint96 price;
    }

    /// @dev Rango de números consecutivos [first, first + quantity) de un comprador.
    struct Range {
        address buyer;
        uint32 first;
        uint32 quantity;
    }

    struct VRFConfig {
        address coordinator;
        bytes32 keyHash;
        uint256 subscriptionId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        bool nativePayment;
    }

    struct Config {
        address paymentToken;
        uint256 goal;
        uint64 deadline;
        uint32 maxNumbers;
        uint32 maxPerWallet;
        address treasury;
    }

    struct Stats {
        State state;
        uint256 totalRaised;
        uint256 totalFromSales;
        uint256 totalDonations;
        uint256 totalRefunded;
        uint32 numbersSold;
        uint32 maxNumbers;
        uint32 participants;
        uint256 goal;
        uint64 deadline;
        uint256 balance;
    }

    // ---------------------------------------------------------------- inmutables

    IERC20 public immutable paymentToken;
    uint8 public immutable tokenDecimals;
    uint256 public immutable goal;
    uint64 public immutable deadline;
    uint32 public immutable maxNumbers;
    uint32 public immutable maxPerWallet;
    address public immutable treasury;
    uint256 public immutable minDonation; // 1 unidad del token

    IVRFCoordinatorV2Plus public immutable vrfCoordinator;
    bytes32 public immutable vrfKeyHash;
    uint256 public immutable vrfSubscriptionId;
    uint16 public immutable vrfRequestConfirmations;
    uint32 public immutable vrfCallbackGasLimit;
    bool public immutable vrfNativePayment;

    /// @notice Si el callback de VRF no llega en este plazo, cualquiera puede volver a pedir el sorteo.
    uint256 public constant DRAW_TIMEOUT = 24 hours;

    // ---------------------------------------------------------------- estado

    State public state;

    Pack[] internal _packs;
    Range[] internal _ranges;
    mapping(address => uint256[]) internal _rangeIdsOf;

    mapping(address => uint32) public numbersOf;
    mapping(address => uint256) public paid;
    mapping(address => bool) public isParticipant;

    uint32 public numbersSold;
    uint32 public participants;
    uint256 public totalFromSales;
    uint256 public totalDonations;
    uint256 public totalRefunded;

    uint256 public drawRequestId;
    uint256 public drawRequestedAt;
    uint256 public randomWord;
    uint32 public winnerNumber;
    address public winner;

    // ---------------------------------------------------------------- eventos

    event Purchase(address indexed buyer, uint8 indexed packId, uint32 first, uint32 quantity, uint256 amount);
    event Donation(address indexed donor, uint256 amount);
    event SalesClosed(bool goalReached, uint256 totalRaised, uint32 numbersSold);
    event DrawRequested(uint256 indexed requestId);
    event RandomnessReceived(uint256 indexed requestId, uint256 randomWord);
    event WinnerSelected(uint32 number, address indexed winner, uint256 indexed requestId);
    event Refunded(address indexed account, uint256 amount);
    event Withdrawn(address indexed treasury, uint256 amount);

    // ---------------------------------------------------------------- errores

    error InvalidConfig();
    error InvalidPack();
    error InvalidState(State current);
    error SalesEnded();
    error SoldOut();
    error WalletLimitExceeded();
    error DonationTooSmall();
    error CannotCloseYet();
    error GoalNotReached();
    error DrawPending();
    error NothingToRefund();
    error OnlyCoordinator();

    // ---------------------------------------------------------------- constructor

    constructor(Config memory cfg, Pack[] memory packs_, VRFConfig memory vrf) {
        if (
            cfg.paymentToken == address(0) || cfg.treasury == address(0) || cfg.goal == 0
                || cfg.deadline <= block.timestamp || cfg.maxNumbers == 0 || cfg.maxPerWallet == 0
                || packs_.length == 0 || packs_.length > type(uint8).max || vrf.coordinator == address(0)
                || vrf.callbackGasLimit == 0
        ) revert InvalidConfig();

        paymentToken = IERC20(cfg.paymentToken);
        uint8 dec = IERC20Metadata(cfg.paymentToken).decimals();
        tokenDecimals = dec;
        minDonation = 10 ** dec;
        goal = cfg.goal;
        deadline = cfg.deadline;
        maxNumbers = cfg.maxNumbers;
        maxPerWallet = cfg.maxPerWallet;
        treasury = cfg.treasury;

        for (uint256 i; i < packs_.length; ++i) {
            if (packs_[i].quantity == 0 || packs_[i].price == 0 || packs_[i].quantity > cfg.maxPerWallet) {
                revert InvalidConfig();
            }
            _packs.push(packs_[i]);
        }

        vrfCoordinator = IVRFCoordinatorV2Plus(vrf.coordinator);
        vrfKeyHash = vrf.keyHash;
        vrfSubscriptionId = vrf.subscriptionId;
        vrfRequestConfirmations = vrf.requestConfirmations;
        vrfCallbackGasLimit = vrf.callbackGasLimit;
        vrfNativePayment = vrf.nativePayment;
    }

    // ---------------------------------------------------------------- aportes

    /// @notice Compra un paquete. Requiere `approve` previo por el precio del paquete.
    function buyPack(uint8 packId) external nonReentrant {
        if (state != State.Open) revert InvalidState(state);
        if (block.timestamp >= deadline) revert SalesEnded();
        if (packId >= _packs.length) revert InvalidPack();

        Pack memory p = _packs[packId];
        uint32 first = numbersSold;
        if (uint256(first) + p.quantity > maxNumbers) revert SoldOut();
        if (uint256(numbersOf[msg.sender]) + p.quantity > maxPerWallet) revert WalletLimitExceeded();

        numbersSold = first + p.quantity;
        numbersOf[msg.sender] += p.quantity;
        paid[msg.sender] += p.price;
        totalFromSales += p.price;
        _markParticipant(msg.sender);

        _rangeIdsOf[msg.sender].push(_ranges.length);
        _ranges.push(Range({buyer: msg.sender, first: first, quantity: p.quantity}));

        paymentToken.safeTransferFrom(msg.sender, address(this), p.price);
        emit Purchase(msg.sender, packId, first, p.quantity, p.price);
    }

    /// @notice Aporte libre sin números. Mínimo 1 unidad del token.
    function donate(uint256 amount) external nonReentrant {
        if (state != State.Open) revert InvalidState(state);
        if (block.timestamp >= deadline) revert SalesEnded();
        if (amount < minDonation) revert DonationTooSmall();

        paid[msg.sender] += amount;
        totalDonations += amount;
        _markParticipant(msg.sender);

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Donation(msg.sender, amount);
    }

    // ---------------------------------------------------------------- cierre y sorteo

    /// @notice Cierra la venta. Cualquiera puede llamarla al llegar el deadline o si se agotaron los números.
    function closeSales() external {
        if (state != State.Open) revert InvalidState(state);
        if (!canClose()) revert CannotCloseYet();
        _close();
    }

    /// @notice Pide el número aleatorio a Chainlink VRF. Solo si se alcanzó la meta.
    ///         Si un pedido anterior no se respondió en DRAW_TIMEOUT, permite reintentar.
    function requestDraw() external nonReentrant returns (uint256 requestId) {
        if (state == State.Open && canClose()) _close();

        if (state == State.Drawing) {
            if (block.timestamp < drawRequestedAt + DRAW_TIMEOUT) revert DrawPending();
        } else if (state != State.Closed) {
            if (state == State.Refunding) revert GoalNotReached();
            revert InvalidState(state);
        }

        state = State.Drawing;
        requestId = vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: vrfKeyHash,
                subId: vrfSubscriptionId,
                requestConfirmations: vrfRequestConfirmations,
                callbackGasLimit: vrfCallbackGasLimit,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: vrfNativePayment}))
            })
        );
        drawRequestId = requestId;
        drawRequestedAt = block.timestamp;
        emit DrawRequested(requestId);
    }

    /// @notice Callback de Chainlink VRF. Solo el coordinador puede llamarlo.
    /// @dev No revierte ante pedidos viejos: simplemente los ignora.
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != address(vrfCoordinator)) revert OnlyCoordinator();
        if (state != State.Drawing || requestId != drawRequestId || randomWords.length == 0) return;

        uint256 rnd = randomWords[0];
        uint32 number = uint32(rnd % numbersSold);
        address w = _ranges[_findRange(number)].buyer;

        randomWord = rnd;
        winnerNumber = number;
        winner = w;
        state = State.Completed;

        emit RandomnessReceived(requestId, rnd);
        emit WinnerSelected(number, w, requestId);
    }

    // ---------------------------------------------------------------- salida de fondos

    /// @notice Si no se alcanzó la meta, devuelve exactamente lo aportado (compras + donaciones).
    function claimRefund() external nonReentrant {
        if (state == State.Open && canClose()) _close();
        if (state != State.Refunding) revert InvalidState(state);

        uint256 amount = paid[msg.sender];
        if (amount == 0) revert NothingToRefund();
        paid[msg.sender] = 0;
        totalRefunded += amount;

        paymentToken.safeTransfer(msg.sender, amount);
        emit Refunded(msg.sender, amount);
    }

    /// @notice Tras el sorteo, envía todo el saldo a la tesorería. Cualquiera puede llamarla.
    function withdraw() external nonReentrant {
        if (state != State.Completed) revert InvalidState(state);
        uint256 amount = paymentToken.balanceOf(address(this));
        paymentToken.safeTransfer(treasury, amount);
        emit Withdrawn(treasury, amount);
    }

    // ---------------------------------------------------------------- vistas

    function totalRaised() public view returns (uint256) {
        return totalFromSales + totalDonations;
    }

    function goalReached() public view returns (bool) {
        return totalRaised() >= goal;
    }

    /// @notice true si la venta puede cerrarse ahora (deadline cumplido o números agotados).
    function canClose() public view returns (bool) {
        return state == State.Open && (block.timestamp >= deadline || numbersSold == maxNumbers);
    }

    function packsCount() external view returns (uint256) {
        return _packs.length;
    }

    function getPacks() external view returns (Pack[] memory) {
        return _packs;
    }

    function rangesCount() external view returns (uint256) {
        return _ranges.length;
    }

    function getRange(uint256 index) external view returns (Range memory) {
        return _ranges[index];
    }

    /// @notice Devuelve rangos paginados (para recalcular el sorteo en el navegador).
    function getRanges(uint256 offset, uint256 limit) external view returns (Range[] memory out) {
        uint256 len = _ranges.length;
        if (offset >= len) return new Range[](0);
        uint256 end = offset + limit > len ? len : offset + limit;
        out = new Range[](end - offset);
        for (uint256 i = offset; i < end; ++i) {
            out[i - offset] = _ranges[i];
        }
    }

    function getRangesOf(address account) external view returns (Range[] memory out) {
        uint256[] storage ids = _rangeIdsOf[account];
        out = new Range[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            out[i] = _ranges[ids[i]];
        }
    }

    /// @notice Dueño de un número vendido.
    function ownerOfNumber(uint32 number) external view returns (address) {
        require(number < numbersSold, "numero no vendido");
        return _ranges[_findRange(number)].buyer;
    }

    function getStats() external view returns (Stats memory) {
        return Stats({
            state: state,
            totalRaised: totalRaised(),
            totalFromSales: totalFromSales,
            totalDonations: totalDonations,
            totalRefunded: totalRefunded,
            numbersSold: numbersSold,
            maxNumbers: maxNumbers,
            participants: participants,
            goal: goal,
            deadline: deadline,
            balance: paymentToken.balanceOf(address(this))
        });
    }

    // ---------------------------------------------------------------- internas

    /// @dev Cierra la venta. Con meta alcanzada (y al menos un número vendido) pasa a Closed;
    ///      si no, a Refunding.
    function _close() internal {
        bool ok = goalReached() && numbersSold > 0;
        state = ok ? State.Closed : State.Refunding;
        emit SalesClosed(ok, totalRaised(), numbersSold);
    }

    function _markParticipant(address account) internal {
        if (!isParticipant[account]) {
            isParticipant[account] = true;
            participants++;
        }
    }

    /// @dev Búsqueda binaria: índice del último rango con first <= number.
    ///      Los rangos son consecutivos y están ordenados por `first`.
    function _findRange(uint32 number) internal view returns (uint256) {
        uint256 lo;
        uint256 hi = _ranges.length - 1;
        while (lo < hi) {
            uint256 mid = (lo + hi + 1) / 2;
            if (_ranges[mid].first <= number) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
}
