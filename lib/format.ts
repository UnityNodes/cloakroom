const AMOUNT_RE = /^(\d*)\.?(\d*)$/;

export function parseAmount(input: string, decimals: number): bigint | null {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === ".") return null;
  const match = trimmed.match(AMOUNT_RE);
  if (!match) return null;
  const [, whole, frac] = match;
  if (whole === "" && frac === "") return null;
  if (frac.length > decimals) return null;
  const scaled = (whole || "0") + frac.padEnd(decimals, "0");
  return BigInt(scaled);
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatAmount(value: bigint, decimals: number, maxFrac = 6): string {
  if (value === 0n) return "0";
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;
  const fracStr = frac.toString().padStart(decimals, "0");
  const shownFrac = fracStr.slice(0, Math.min(maxFrac, decimals)).replace(/0+$/, "");
  if (whole === 0n && shownFrac === "") {
    return `<0.${"0".repeat(Math.max(0, Math.min(maxFrac, decimals) - 1))}1`;
  }
  const wholeStr = groupThousands(whole.toString());
  return shownFrac === "" ? wholeStr : `${wholeStr}.${shownFrac}`;
}

export interface WrapPreview {
  credited: bigint;
  wrapped: bigint;
  refund: bigint;
}

export function wrapPreview(amount: bigint, rate: bigint): WrapPreview {
  const safeRate = rate > 0n ? rate : 1n;
  const credited = amount / safeRate;
  const wrapped = credited * safeRate;
  return { credited, wrapped, refund: amount - wrapped };
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatHandle(handle: string): string {
  if (handle.length <= 18) return handle;
  return `${handle.slice(0, 10)}…${handle.slice(-6)}`;
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
