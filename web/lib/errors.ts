import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

const CONTRACT_ERRORS: Record<string, string> = {
  SalesEnded: "La venta ya terminó.",
  SoldOut: "No quedan suficientes números para ese paquete. Probá con uno más chico.",
  WalletLimitExceeded: "Superarías el máximo de números por wallet.",
  InvalidPack: "Paquete inválido.",
  InvalidState: "La rifa no está en el estado correcto para esta acción.",
  DonationTooSmall: "El aporte mínimo es 1 USDT.",
  CannotCloseYet: "Todavía no se puede cerrar la venta.",
  GoalNotReached: "No se alcanzó la meta: corresponde reembolso, no sorteo.",
  DrawPending: "Ya hay un sorteo en curso. Esperá la respuesta de Chainlink VRF.",
  NothingToRefund: "Esta wallet no tiene nada para reembolsar.",
  ERC20InsufficientBalance: "No tenés suficientes USDT en esta wallet.",
  ERC20InsufficientAllowance: "Falta autorizar el uso de USDT (paso 1).",
};

/** Convierte cualquier error de wallet/contrato en un mensaje claro en español. */
export function friendlyError(err: unknown): string {
  if (!err) return "";
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) {
      return "Cancelaste la operación en tu wallet.";
    }
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? "";
      if (CONTRACT_ERRORS[name]) return CONTRACT_ERRORS[name];
      if (revert.reason) return `El contrato rechazó la operación: ${revert.reason}`;
    }
    const msg = `${err.shortMessage} ${err.details ?? ""}`.toLowerCase();
    if (msg.includes("insufficient funds")) {
      return "No tenés suficiente BNB para pagar la comisión de red.";
    }
    if (msg.includes("user rejected") || msg.includes("user denied")) {
      return "Cancelaste la operación en tu wallet.";
    }
    if (msg.includes("chain") && msg.includes("mismatch")) {
      return "Tu wallet está en otra red. Cambiá a BNB Chain.";
    }
    return err.shortMessage || "Algo salió mal. Probá de nuevo.";
  }
  return "Algo salió mal. Probá de nuevo.";
}
