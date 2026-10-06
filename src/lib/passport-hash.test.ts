import { describe, expect, it } from "vitest";
import { canonicalize, hashPassport, scenarioPassports } from "./passport-hash";
import { buildOnchainPayload, deriveNonce, SCHEMA_FIELDS } from "./solana-proof.server";

process.env["CX7_PSEUDONYMIZATION_KEY"] ||= "test-key-only-for-vitest";
const NOW = 1_790_000_000;

describe("passport hash", () => {
  it("is deterministic regardless of key order", async () => {
    const a = await hashPassport({ a: 1, b: "x" });
    const b = await hashPassport({ b: "x", a: 1 });
    expect(a).toBe(b);
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
  it("changes when the passport changes", async () => {
    const h1 = await hashPassport(scenarioPassports.current);
    const h2 = await hashPassport({ ...scenarioPassports.current, authorized_amount_brl: 1600001 });
    expect(h1).not.toBe(h2);
  });
});

describe("on-chain payload", () => {
  it("contains only the approved fields and no sensitive data", async () => {
    const p = await buildOnchainPayload(NOW);
    expect(Object.keys(p).sort()).toEqual(SCHEMA_FIELDS.map(([n]) => n).sort());
    const raw = JSON.stringify(p);
    for (const forbidden of ["CX7-PP-0002", "CX7-ORG-DEMO", "1600000", "1800000", "REAPPROVED", "supplier"]) expect(raw).not.toContain(forbidden);
    expect(p.valid_until - p.valid_from).toBe(86400);
  });
  it("derives the same nonce for the same passport and a new one when the hash changes", async () => {
    const p = await buildOnchainPayload(NOW);
    expect(await deriveNonce(p)).toBe(await deriveNonce(await buildOnchainPayload(NOW)));
    expect(await deriveNonce({ ...p, decision_hash: "0".repeat(64) })).not.toBe(await deriveNonce(p));
  });
});
