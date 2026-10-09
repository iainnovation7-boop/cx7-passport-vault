import { describe, expect, it } from "vitest";
import { checkV5Payload, V5, V5_AUTHORITY_CHECKS } from "./hackathon-v5";

const payload = { protocol_version: 1, passport_version: 5, authority: V5.authority, valid_until: BigInt(1806537599), status: "VALID", decision_hash: "2b5be7307a7a05e4bf172cee4eb35224daa4dbb83d13f60aa0b7e955dfcfba04" };
describe("v5 evidence boundaries", () => {
  it("matches only the exact v5 evidence hash", () => {
    expect(checkV5Payload(payload, 1806537599, 1791560127).match).toBe(true);
    expect(checkV5Payload({ ...payload, decision_hash: "different" }, 1806537599, 1791560127).match).toBe(false);
  });
  it("does not substitute another authority or version", () => {
    expect(checkV5Payload({ ...payload, authority: "other" }, 1806537599, 1791560127).match).toBe(false);
    expect(checkV5Payload({ ...payload, passport_version: 4 }, 1806537599, 1791560127).match).toBe(false);
  });
  it("retains March 31 2027 expiry and never extends validity", () => {
    expect(new Date(V5.expiry * 1000).toISOString()).toBe("2027-03-31T23:59:59.000Z");
    expect(checkV5Payload(payload, 1806537599, 1806537599).timeStatus).toBe("EXPIRED");
    expect(checkV5Payload(payload, 1806537600, 1791560127).match).toBe(false);
  });
  it.each([[5, "AUTHORIZED"], [8, "BLOCKED"], [10, "AUTHORIZED"], [12, "BLOCKED"]])("preserves supplied %s%% snapshot outcome %s", (discount, outcome) => {
    expect(V5_AUTHORITY_CHECKS.find(check => check.discount === discount)?.outcome).toBe(outcome);
  });
});