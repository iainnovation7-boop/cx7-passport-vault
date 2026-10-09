import { expect, it } from "vitest";
import { referencePayloadMatches, referenceStatus } from "./reference-verification";
import { firstVersion } from "./passport-version";
import type { V2Payload } from "./schema-v2";
it("never treats account absence alone as revocation", () => {
  expect(referenceStatus(false, 1, "REVOKED", false)).toBe("UNAVAILABLE");
  expect(referenceStatus(false, 1, "REVOKED", true)).toBe("REVOKED");
});
it("retains expired state and fails closed without matching successor evidence", () => {
  expect(referenceStatus(true, 2, "EXPIRED", true)).toBe("EXPIRED");
  expect(referenceStatus(true, 2, "VALID", false)).toBe("VERIFICATION FAILED");
});
it("requires exact on-chain version, authority, predecessor, hash, status and expiry", () => {
  const v = firstVersion("lineage", "hash");
  const p: V2Payload = { protocol_version: 1, passport_id: "lineage", passport_version: 1, decision_hash: "hash", previous_version_id: "", previous_decision_hash: "", authority: "expected", issued_at: 10, valid_until: 20, premise_id: "premise", premise_condition_hash: "condition", status: "VALID" };
  expect(referencePayloadMatches(p,v,"expected",20)).toBe(true);
  expect(referencePayloadMatches({...p, decision_hash:"different"},v,"expected",20)).toBe(false);
  expect(referencePayloadMatches({...p, previous_version_id:"fake"},v,"expected",20)).toBe(false);
  expect(referencePayloadMatches(p,v,"imposter",20)).toBe(false);
  expect(referencePayloadMatches(p,v,"expected",21)).toBe(false);
});