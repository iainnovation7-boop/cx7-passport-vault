import { describe, expect, it } from "vitest";
import { homeV5, homeV5ProofDetails } from "./home-v5";

describe("supplied v5 Home evidence", () => {
  it("preserves the supplied version, validity and predecessor", () => {
    expect([homeV5.passport, homeV5.status, homeV5.validUntil, homeV5.predecessor, homeV5.predecessorStatus]).toEqual(["v5", "VALID", "31/03/2027", "v4", "SUPERSEDED"]);
  });
  it.each([
    [5, false, "AUTHORIZED"], [8, false, "BLOCKED"],
    [10, true, "AUTHORIZED"], [12, false, "BLOCKED"],
  ])("preserves the recorded %s percent case", (percent, exception, result) => {
    expect(homeV5.outcomes.find((entry) => entry.percent === percent)).toEqual({ percent, exception, result });
  });
  it("preserves the exact published hash and transaction", () => {
    expect(homeV5.evidenceHash).toBe("2b5be7307a7a05e4bf172cee4eb35224daa4dbb83d13f60aa0b7e955dfcfba04");
    expect(homeV5.transaction).toBe("4J1X8yB27qoBeAkKfe3FxDGsNabP9BVMUCrHA2QRKfpXvGbTkfRtxVu3vePcyQvPLhLjcRWzRnMFXDksdCXU3SJk");
    expect([homeV5.transactionStatus, homeV5.readBack]).toEqual(["FINALIZED", "MATCH"]);
  });
  it("keeps the supplied attestation and authority identities", () => {
    expect(homeV5.attestation).toBe("F1UXy1rNDidp7KvrYCZb3esMXuLSBFA2yLGNjxGgukrT");
    expect(homeV5.authority).toBe("Au5FknzLgSaf4dnQvPyEnRTH4Sz8C4N8waco12sJQdqV");
    expect(homeV5.credential).toBe("BZbh9qDQJv7tgrs8pZXoSC9GdPhNjHvLHuRNxYeDX3ds");
    expect(homeV5.schema).toBe("D5aStC2T3cXyzCE481WE9ubR21t7v2dzEmJA4f8vP6h6");
  });
  it("links only to the exact recorded Devnet transaction and accounts", () => {
    for (const [, id, url] of homeV5ProofDetails) {
      if (url === null) continue;
      const link = new URL(url);
      expect(link.hostname).toBe("explorer.solana.com");
      expect(link.searchParams.get("cluster")).toBe("devnet");
      expect(link.pathname.split("/").at(-1)).toBe(id);
    }
  });
});