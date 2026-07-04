import {
  AclPausedError,
  BalanceCheckUnavailableError,
  ChainMismatchError,
  DecryptionFailedError,
  EncryptionFailedError,
  InsufficientConfidentialBalanceError,
  InsufficientERC20BalanceError,
  NoCiphertextError,
  RelayerRequestFailedError,
  SigningRejectedError,
  TransactionRevertedError,
  WalletNotConnectedError,
} from "@zama-fhe/sdk";

export function isUserRejection(error: unknown): boolean {
  if (error instanceof SigningRejectedError) return true;
  if (typeof error === "object" && error !== null) {
    const e = error as { name?: string; code?: number; cause?: unknown };
    if (e.name === "UserRejectedRequestError" || e.code === 4001) return true;
    if (e.cause) return isUserRejection(e.cause);
  }
  return false;
}

export function humanizeError(error: unknown): string {
  if (isUserRejection(error)) {
    return "Signature declined in the wallet. Nothing was sent.";
  }
  if (error instanceof InsufficientERC20BalanceError) {
    return "Not enough public tokens for that amount. Grab some from the faucet first.";
  }
  if (error instanceof InsufficientConfidentialBalanceError) {
    return "Your confidential balance is smaller than that amount.";
  }
  if (error instanceof BalanceCheckUnavailableError) {
    return "Decrypt your balance first so the amount can be checked before sending.";
  }
  if (error instanceof NoCiphertextError) {
    return "This account has never held this confidential token, so the balance is 0.";
  }
  if (error instanceof RelayerRequestFailedError) {
    return "The decryption relayer did not respond. Your funds are safe. Retry in a moment.";
  }
  if (error instanceof DecryptionFailedError) {
    return "Decryption failed. Retry, and if it persists the relayer may be down.";
  }
  if (error instanceof EncryptionFailedError) {
    return "Could not encrypt the amount locally. Reload the page and try again.";
  }
  if (error instanceof TransactionRevertedError) {
    return "The transaction reverted on-chain. Check the details below.";
  }
  if (error instanceof ChainMismatchError) {
    return "Your wallet is on a different network. Switch to Sepolia and retry.";
  }
  if (error instanceof WalletNotConnectedError) {
    return "Connect a wallet first.";
  }
  if (error instanceof AclPausedError) {
    return "The FHE access control system is paused. Try again later.";
  }
  if (error instanceof Error && error.message.toLowerCase().includes("fetch")) {
    return "Network request failed. Check your connection and retry.";
  }
  return "Something went wrong. The raw error is below.";
}

export function rawErrorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}
