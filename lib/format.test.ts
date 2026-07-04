import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatHandle,
  parseAmount,
  shortAddress,
  wrapPreview,
} from "./format";

describe("parseAmount", () => {
  it("parses integer amounts", () => {
    expect(parseAmount("42", 6)).toBe(42_000_000n);
  });

  it("parses fractional amounts", () => {
    expect(parseAmount("1.5", 6)).toBe(1_500_000n);
    expect(parseAmount("1.2345678", 18)).toBe(1_234_567_800_000_000_000n);
  });

  it("accepts leading dot and trailing dot", () => {
    expect(parseAmount(".5", 6)).toBe(500_000n);
    expect(parseAmount("5.", 6)).toBe(5_000_000n);
  });

  it("rejects empty, bare dot and garbage", () => {
    expect(parseAmount("", 6)).toBeNull();
    expect(parseAmount(".", 6)).toBeNull();
    expect(parseAmount("abc", 6)).toBeNull();
    expect(parseAmount("1..2", 6)).toBeNull();
    expect(parseAmount("-1", 6)).toBeNull();
  });

  it("rejects more fractional digits than the token supports", () => {
    expect(parseAmount("1.1234567", 6)).toBeNull();
  });
});

describe("formatAmount", () => {
  it("formats and trims trailing zeros", () => {
    expect(formatAmount(1_500_000n, 6)).toBe("1.5");
    expect(formatAmount(1_000_000n, 6)).toBe("1");
    expect(formatAmount(0n, 6)).toBe("0");
  });

  it("groups thousands", () => {
    expect(formatAmount(1_234_567_890_000n, 6)).toBe("1,234,567.89");
  });

  it("caps fractional digits at maxFrac and keeps precision below it visible", () => {
    expect(formatAmount(1_234_567_800_000_000_000n, 18, 6)).toBe("1.234567");
    expect(formatAmount(1n, 18, 6)).toBe("<0.000001");
  });

  it("round-trips with parseAmount for 6 decimals", () => {
    const value = parseAmount("123.456789", 8);
    expect(value).not.toBeNull();
    expect(formatAmount(value!, 8, 8)).toBe("123.456789");
  });
});

describe("wrapPreview", () => {
  it("passes through when rate is 1 (6-decimal underlying)", () => {
    const preview = wrapPreview(1_500_000n, 1n);
    expect(preview).toEqual({ credited: 1_500_000n, wrapped: 1_500_000n, refund: 0n });
  });

  it("floors 18-decimal amounts to the rate and reports the refund", () => {
    const rate = 10n ** 12n;
    const amount = 1_234_567_800_000_000_000n;
    const preview = wrapPreview(amount, rate);
    expect(preview.credited).toBe(1_234_567n);
    expect(preview.wrapped).toBe(1_234_567_000_000_000_000n);
    expect(preview.refund).toBe(800_000_000_000n);
    expect(preview.wrapped + preview.refund).toBe(amount);
  });

  it("credits zero when the amount is below the rate", () => {
    const preview = wrapPreview(999_999_999_999n, 10n ** 12n);
    expect(preview.credited).toBe(0n);
    expect(preview.wrapped).toBe(0n);
    expect(preview.refund).toBe(999_999_999_999n);
  });
});

describe("shortAddress", () => {
  it("shortens an address keeping both ends", () => {
    expect(shortAddress("0x2f0750Bbb0A246059d80e94c454586a7F27a128e")).toBe(
      "0x2f07…128e",
    );
  });
});

describe("formatHandle", () => {
  it("shortens a 32-byte handle", () => {
    const handle =
      "0x830a61b343d2f3de67ec59cb18961fd086085c1c73ff0000000000aa36a70000";
    expect(formatHandle(handle)).toBe("0x830a61b3…a70000");
  });
});
