import { describe, expect, it } from "vitest";
import { classifyPassport, type VerifyInput } from "./passport-verify";
import { assertIssuable, firstVersion, ReissueError, successorOf, versionId, versionNonceSeed, type LedgerEntry } from "./passport-version";
import { decodePriceUpdateV2, evaluatePremise } from "./pyth-premise";
import { readSolUsdPremise } from "./pyth-premise.server";
import { sha256Hex } from "./passport-hash";

const H1 = "a".repeat(64);
const H2 = "b".repeat(64);
const exp = { authority: "AUTH", credential: "CRED", schema: "SCH", lineage_id: "L", version: 1, decision_hash: H1 };
const acc = { signer: "AUTH", credential: "CRED", schema: "SCH", expiry: 2000, lineage_id: "L", version: 1, decision_hash: H1 };
const base = (o: Partial<VerifyInput>): VerifyInput => ({ expected: exp, account: acc, history: [], nowSec: 1000, ...o });

describe("E1 verification", () => {
  it("VALID when issued by authority, matching and in time", () => expect(classifyPassport(base({})).status).toBe("VALID"));
  it("EXPIRED after expiry", () => expect(classifyPassport(base({ nowSec: 2000 })).status).toBe("EXPIRED"));
  it("REVOKED only with on-chain create+close history", () => {
    const r = classifyPassport(base({ account: null, history: [{ signature: "close", ok: true, blockTime: 2 }, { signature: "create", ok: true, blockTime: 1 }] }));
    expect(r.status).toBe("REVOKED");
    expect(r.evidence?.signature).toBe("close");
  });
  it("REVOKED when a verified successor references it", () => {
    const r = classifyPassport(base({ supersededBy: { version: 2, attestation: "N2", previous_version_id: "id1", expectedPreviousId: "id1" } }));
    expect(r.status).toBe("REVOKED");
  });
  it("absence alone is NOT_FOUND, never REVOKED", () => {
    expect(classifyPassport(base({ account: null })).status).toBe("NOT_FOUND");
    expect(classifyPassport(base({ account: null, history: [{ signature: "x", ok: true, blockTime: 1 }] })).status).toBe("NOT_FOUND");
    expect(classifyPassport(base({ account: null, history: [{ signature: "x", ok: false, blockTime: 1 }, { signature: "y", ok: false, blockTime: 1 }] })).status).toBe("NOT_FOUND");
  });
  it("wrong issuer or content is NOT_FOUND", () => {
    expect(classifyPassport(base({ account: { ...acc, signer: "EVIL" } })).status).toBe("NOT_FOUND");
    expect(classifyPassport(base({ account: { ...acc, decision_hash: H2 } })).status).toBe("NOT_FOUND");
  });
});

describe("E2 versioning", () => {
  it("different versions → different identities and nonces", async () => {
    const n1 = firstVersion("L", H1);
    const n2 = await successorOf(n1, H2);
    expect(await versionId(n1)).not.toBe(await versionId(n2));
    expect(Buffer.from(await versionNonceSeed(n1)).toString("hex")).not.toBe(Buffer.from(await versionNonceSeed(n2)).toString("hex"));
  });
  it("N2 references N1", async () => {
    const n1 = firstVersion("L", H1);
    const n2 = await successorOf(n1, H2);
    expect(n2.version).toBe(2);
    expect(n2.previous_version_id).toBe(await versionId(n1));
    expect(n2.previous_decision_hash).toBe(H1);
  });
  it("revoked/superseded version can never be reissued", async () => {
    const n1 = firstVersion("L", H1);
    for (const state of ["REVOKED", "SUPERSEDED", "PREMISE_CHANGED"] as const) {
      const ledger: LedgerEntry[] = [{ id: await versionId(n1), version: n1, state }];
      await expect(assertIssuable(n1, ledger)).rejects.toBeInstanceOf(ReissueError);
      await expect(assertIssuable(firstVersion("L", H2), ledger)).rejects.toBeInstanceOf(ReissueError);
    }
  });
  it("idempotent within the same valid version; N2 accepted after N1", async () => {
    const n1 = firstVersion("L", H1);
    const id1 = await versionId(n1);
    expect(await assertIssuable(n1, [])).toBe("NEW");
    expect(await assertIssuable(n1, [{ id: id1, version: n1, state: "VALID" }])).toBe("EXISTING");
    expect(Buffer.from(await versionNonceSeed(n1)).equals(Buffer.from(await versionNonceSeed(firstVersion("L", H1))))).toBe(true);
    const n2 = await successorOf(n1, H2);
    expect(await assertIssuable(n2, [{ id: id1, version: n1, state: "SUPERSEDED" }])).toBe("NEW");
    const forged = { ...n2, previous_version_id: await sha256Hex("other") };
    await expect(assertIssuable(forged, [{ id: id1, version: n1, state: "SUPERSEDED" }])).rejects.toBeInstanceOf(ReissueError);
  });
});

describe("E3 Pyth premise", () => {
  it("rejects bytes that are not a Pyth price update", () => expect(() => decodePriceUpdateV2(new Uint8Array(134))).toThrow());
  it("stale price never evaluates TRUE", () => {
    const r = evaluatePremise({ feedId: "f", price: 200, conf: 0.1, publishTime: 0, verification: "Full" }, { op: ">=", threshold: 100, maxAgeSec: 60 }, 1000);
    expect(r.stale).toBe(true);
    expect(r.result).toBe(false);
  });
  it("reads the REAL SOL/USD from Pyth on Solana Devnet (network)", async () => {
    const probe = await readSolUsdPremise({ op: ">=", threshold: 1, maxAgeSec: 86400 });
    console.log("[pyth live]", JSON.stringify(probe));
    expect(probe.value).toBeGreaterThan(0);
    const above = await readSolUsdPremise({ op: ">=", threshold: Math.floor(probe.value) + 1, maxAgeSec: 86400 });
    expect(above.condition).toContain(">=");
  }, 30000);
});
