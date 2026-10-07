import { describe, expect, it } from "vitest";
import { assertRevocable, RevokeError } from "./passport-revoke";
import { assertIssuable, firstVersion, successorOf, versionId } from "./passport-version";
import { classifyPassport } from "./passport-verify";

const n1 = firstVersion("lineage-a", "h1");
const base = { target: n1, expectedN1: n1, derivedAttestation: "ATT1", verifiedAttestation: "ATT1", status: "VALID" as const, successorStatus: "NOT_FOUND" as const };

describe("revocation guards", () => {
  it("allows only a real VALID n1 with matching address", () => {
    expect(assertRevocable(base)).toBe("ATT1");
  });
  it("refuses arbitrary address", () => {
    expect(() => assertRevocable({ ...base, verifiedAttestation: "OTHER" })).toThrow(RevokeError);
  });
  it("refuses n2 or other lineages/hashes", async () => {
    const n2 = await successorOf(n1, "h2");
    expect(() => assertRevocable({ ...base, target: n2 })).toThrow(RevokeError);
    expect(() => assertRevocable({ ...base, target: firstVersion("other", "h1") })).toThrow(RevokeError);
    expect(() => assertRevocable({ ...base, target: firstVersion("lineage-a", "hX") })).toThrow(RevokeError);
  });
  it("refuses NOT_FOUND, REVOKED, EXPIRED and when a successor exists", () => {
    for (const status of ["NOT_FOUND", "REVOKED", "EXPIRED"] as const) expect(() => assertRevocable({ ...base, status })).toThrow(RevokeError);
    expect(() => assertRevocable({ ...base, successorStatus: "VALID" })).toThrow(RevokeError);
  });
});

describe("n1 → REVOKED → n2", () => {
  it("closed n1 reads REVOKED only with create+close history", () => {
    const exp = { authority: "A", credential: "C", schema: "S", lineage_id: "lineage-a", version: 1, decision_hash: "h1" };
    expect(classifyPassport({ expected: exp, account: null, history: [{ signature: "create", ok: true, blockTime: 1 }], nowSec: 2 }).status).toBe("NOT_FOUND");
    const r = classifyPassport({ expected: exp, account: null, history: [{ signature: "close", ok: true, blockTime: 2 }, { signature: "create", ok: true, blockTime: 1 }], nowSec: 3 });
    expect(r.status).toBe("REVOKED");
    expect(r.evidence?.signature).toBe("close");
  });
  it("n2 is issuable only after n1 is REVOKED, and n1 is never reissued", async () => {
    const n2 = await successorOf(n1, "h2");
    const id1 = await versionId(n1);
    await expect(assertIssuable(n2, [])).rejects.toThrow();
    expect(await assertIssuable(n2, [{ id: id1, version: n1, state: "REVOKED" }])).toBe("NEW");
    await expect(assertIssuable(n1, [{ id: id1, version: n1, state: "REVOKED" }])).rejects.toThrow();
  });
});
