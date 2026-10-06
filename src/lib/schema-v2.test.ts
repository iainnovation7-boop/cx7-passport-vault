import { describe, expect, it } from "vitest";
import { serializeAttestationData, deserializeAttestationData } from "sas-lib";
import { buildV2Payload, payloadMatchesVersion, premiseConditionHash, SCHEMA_V2_FIELDS, SCHEMA_V2_NAME, solUsdPremise } from "./schema-v2";
import { firstVersion, successorOf } from "./passport-version";
import { isGenuineProof, onchainLabel, AWAITING_FUNDING } from "./onchain-display";
import { readSolUsdPremise } from "./pyth-premise.server";
import { premiseRows } from "@/components/cx7/premise-view";
import { scenarioVersions, SCENARIO_PREMISE } from "./scenario-authority.server";
import { SCHEMA_NAME } from "./solana-proof.server";

process.env["CX7_PSEUDONYMIZATION_KEY"] ||= "test-key-only-for-vitest";
const AUTH = "BSjrPNLtyBKfh2xW1QLwRDceU2zcnmzqayv3rJpY6i1K";
const NOW = 1_791_300_000;
const premise = solUsdPremise({ op: ">=", threshold: 100, maxAgeSec: 300 });
// On-chain Schema representation: fieldNames is a joined vec (u32 LE length + UTF-8 bytes per name).
const joined = SCHEMA_V2_FIELDS.flatMap(([n]) => {
  const b = new TextEncoder().encode(n);
  return [b.length & 255, (b.length >> 8) & 255, 0, 0, ...b];
});
const schemaData = { layout: Uint8Array.from(SCHEMA_V2_FIELDS.map(([, l]) => l)), fieldNames: Uint8Array.from(joined) };

describe("Schema V2", () => {
  it("is V2, distinct from V1, and has every required field", () => {
    expect(SCHEMA_V2_NAME).toBe("CX7_DECISION_PASSPORT_V2");
    expect(SCHEMA_V2_NAME).not.toBe(SCHEMA_NAME);
    const names = SCHEMA_V2_FIELDS.map(([n]) => n);
    for (const f of ["passport_id", "passport_version", "decision_hash", "previous_version_id", "previous_decision_hash", "authority", "issued_at", "valid_until", "premise_id", "premise_condition_hash", "status"]) expect(names).toContain(f);
  });
  it("payload matches schema keys, 24h validity, no sensitive data", async () => {
    const { n2 } = await scenarioVersions();
    const p = await buildV2Payload(n2, AUTH, NOW, premise);
    expect(Object.keys(p).sort()).toEqual(SCHEMA_V2_FIELDS.map(([n]) => n).sort());
    expect(p.valid_until - p.issued_at).toBe(86400);
    expect(p.status).toBe("VALID");
    for (const bad of ["CX7-PP", "CX7-ORG-DEMO", "1600000", "1800000", "REAPPROVED", "supplier"]) expect(JSON.stringify(p)).not.toContain(bad);
  });
  it("serializes and deserializes losslessly with the SAS Borsh layout", async () => {
    const n1 = firstVersion("a".repeat(64), "b".repeat(64));
    const p = await buildV2Payload(n1, AUTH, NOW, premise);
    const bytes = serializeAttestationData(schemaData as never, p);
    const back = deserializeAttestationData<Record<string, unknown>>(schemaData as never, bytes);
    expect(back["passport_version"]).toBe(1);
    expect(Number(back["issued_at"])).toBe(NOW);
    expect(back["premise_condition_hash"]).toBe(p.premise_condition_hash);
    expect(back["previous_version_id"]).toBe("");
  });
  it("versioning: n2 references n1 and both are matched only by their own payload", async () => {
    const { n1, n2, n1Id } = await scenarioVersions();
    expect(n2.previous_version_id).toBe(n1Id);
    const p1 = await buildV2Payload(n1, AUTH, NOW, premise);
    const p2 = await buildV2Payload(n2, AUTH, NOW, premise);
    expect(await payloadMatchesVersion(p1, n1)).toBe(true);
    expect(await payloadMatchesVersion(p2, n2)).toBe(true);
    expect(await payloadMatchesVersion(p1, n2)).toBe(false);
    expect(await payloadMatchesVersion({ ...p2, previous_decision_hash: "" }, n2)).toBe(false);
  });
  it("premise hash changes when the condition changes", async () => {
    expect(await premiseConditionHash(premise)).not.toBe(await premiseConditionHash(solUsdPremise({ op: ">=", threshold: 101, maxAgeSec: 300 })));
  });
});

describe("No fabricated on-chain status", () => {
  const sig = "5".repeat(88);
  const att = "3JWqbPjgi8sbGky23wRgCf25PnRMtqfr3PzJemsv6XCB";
  it("VERIFIED only for a genuine-looking proof with matching Devnet Explorer URL", () => {
    expect(isGenuineProof({ ok: true, attestation: att, signature: sig, network: "Solana Devnet", explorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=devnet` })).toBe(true);
    expect(isGenuineProof(null)).toBe(false);
    expect(isGenuineProof({ ok: false })).toBe(false);
    expect(isGenuineProof({ ok: true, attestation: att, signature: "fake-signature", network: "Solana Devnet", explorerUrl: "x" })).toBe(false);
    expect(isGenuineProof({ ok: true, attestation: att, signature: sig, network: "Solana Devnet", explorerUrl: `https://explorer.solana.com/tx/${sig}` })).toBe(false);
    expect(isGenuineProof({ ok: true, attestation: att, signature: sig, network: "Solana Mainnet", explorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=devnet` })).toBe(false);
  });
  it("never labels VALID ON-CHAIN unless the read says VALID", () => {
    expect(onchainLabel({ ok: true, status: "NOT_FOUND", attestation: att })).toBe("NOT YET ISSUED (NOT_FOUND)");
    expect(onchainLabel({ ok: false, error: "rpc" })).not.toContain("VALID");
    expect(onchainLabel(null)).not.toContain("VALID");
    expect(onchainLabel({ ok: true, status: "VALID", attestation: "not-an-address" })).toBe("UNVERIFIED");
    expect(onchainLabel({ ok: true, status: "VALID", attestation: att })).toBe("VALID ON-CHAIN");
    expect(AWAITING_FUNDING).toBe("AWAITING DEVNET FUNDING");
  });
});

describe("Premise Monitor ↔ Pyth (live)", () => {
  it("renders the real SOL/USD reading with source, value, time, condition and TRUE/FALSE", async () => {
    const r = await readSolUsdPremise(SCENARIO_PREMISE);
    const rows = Object.fromEntries(premiseRows(r).map(([k, v]) => [k, v]));
    expect(rows["Source"]).toBe("Pyth Network");
    expect(rows["Pair"]).toBe("SOL/USD");
    expect(rows["Live value"]).toBe(`US$ ${r.value.toFixed(4)}`);
    expect(rows["Condition"]).toBe("SOL/USD >= 100");
    expect(["TRUE", "FALSE", "FALSE (STALE PRICE)"]).toContain(rows["Premise result"]);
    expect(rows["Premise result"] === "TRUE").toBe(r.result);
  }, 30000);
});
