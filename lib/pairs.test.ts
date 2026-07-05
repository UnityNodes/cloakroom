import { describe, expect, it } from "vitest";
import { mergePairs, type PairView } from "./pairs";

function pair(cAddr: string, source: "registry" | "custom", isValid = true): PairView {
  return {
    underlying: {
      address: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
      name: "Mock",
      symbol: "MOCK",
      decimals: 6,
      totalSupply: 0n,
    },
    confidential: {
      address: cAddr as PairView["confidential"]["address"],
      name: "cMock",
      symbol: "cMOCK",
      decimals: 6,
    },
    isValid,
    rate: 1n,
    source,
  };
}

describe("mergePairs", () => {
  it("appends custom pairs after registry pairs", () => {
    const merged = mergePairs(
      [pair("0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639", "registry")],
      [pair("0x167DC962808B32CFFFc7e14B5018c0bE06A3A208", "custom")],
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].source).toBe("registry");
    expect(merged[1].source).toBe("custom");
  });

  it("drops custom entries that duplicate a registry wrapper, case-insensitively", () => {
    const merged = mergePairs(
      [pair("0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639", "registry")],
      [pair("0x7c5bf43b851c1dff1a4fee8db225b87f2c223639", "custom")],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe("registry");
  });

  it("keeps registry validity flags untouched when merging", () => {
    const merged = mergePairs(
      [pair("0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639", "registry", false)],
      [pair("0x167DC962808B32CFFFc7e14B5018c0bE06A3A208", "custom")],
    );
    expect(merged[0].isValid).toBe(false);
    expect(merged[1].isValid).toBe(true);
  });

  it("handles empty inputs", () => {
    expect(mergePairs([], [])).toEqual([]);
    const onlyCustom = mergePairs([], [pair("0x167DC962808B32CFFFc7e14B5018c0bE06A3A208", "custom")]);
    expect(onlyCustom).toHaveLength(1);
  });
});
