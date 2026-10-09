import { describe, expect, it } from "vitest";
import { buildAuthorityDraft, compareVersions, createPassportDraft, validationErrors, type HumanValidation, type ProcessDef, type ProcessVersion } from "./reconciliation";
import { draftCommitment, expirationError } from "./session-passport";
const def: ProcessDef = { name: "Private discount policy", policy: "Above 5% requires manager approval.", roles: [{ id: "c", label: "Coordinator", isValidator: false }, { id: "f", label: "Finance", isValidator: false }] };
const versions: ProcessVersion[] = [{ roleId: "c", text: "Customers with more than five years may receive up to 10% through WhatsApp, approved by coordinator.", sealedAt: "2026-10-09T00:00:00Z" }, { roleId: "f", text: "Above 5% must be rejected unless manager approval is in the formal system.", sealedAt: "2026-10-09T00:01:00Z" }];
const comparison = compareVersions(def, versions);
const confirmed: HumanValidation = { validatorName: "Private person", validatorRoleId: "c", decisionType: "Discount", validRule: "Manager approval above 5%", validException: "None", authorizedRole: "Manager", allowedAction: "Approve discount", premises: "Formal approval", approvalLimit: "5%", validityPeriod: "", escalation: "Escalate above 5%", resolutions: Object.fromEntries(comparison.divergences.map(d => [d.id, "Explicitly confirmed in this session"])), confirmed: true };
describe("session passport commitments", () => {
  it("requires an explicit resolution for every divergence", () => {
    const first = comparison.divergences[0];
    if (!first) throw new Error("No divergences");
    expect(validationErrors(def, comparison.divergences, { ...confirmed, resolutions: { ...confirmed.resolutions, [first.id]: "" } })).toContain(`Resolve divergence “${first.topic}”.`);
  });
  it("produces deterministic evidence hashes and a session-derived draft identity", async () => {
    const now = new Date("2026-10-09T05:00:00Z");
    const a = await createPassportDraft(await buildAuthorityDraft(def, versions, comparison.divergences, confirmed, now));
    const b = await createPassportDraft(await buildAuthorityDraft(def, versions, comparison.divergences, confirmed, now));
    expect(a).toEqual(b);
    const changed = await createPassportDraft(await buildAuthorityDraft(def, versions, comparison.divergences, { ...confirmed, approvalLimit: "10%" }, now));
    expect(changed.record.passport_id).not.toBe(a.record.passport_id);
  });
  it("excludes raw sensitive fields from the exportable commitment", async () => {
    const p = await createPassportDraft(await buildAuthorityDraft(def, versions, comparison.divergences, confirmed));
    const commitment = await draftCommitment(p.record);
    const json = JSON.stringify(commitment);
    for (const sensitive of [def.name, versions[0]?.text, confirmed.validatorName, confirmed.authorizedRole, confirmed.premises]) {
      if (!sensitive) throw new Error("Missing sensitive test input");
      expect(json).not.toContain(sensitive);
    }
    expect(commitment.source_evidence_hashes).toHaveLength(2);
    expect(commitment.decision_hash).toMatch(/^[a-f0-9]{64}$/);
  });
  it("rejects expired and ambiguous expiration instead of inventing validity", () => {
    const now = new Date("2026-10-09T05:00:00Z");
    expect(expirationError("2026-10-08T05:00:00Z", now)).toBe("Expiration must be in the future.");
    expect(expirationError("tomorrow", now)).toBe("Expiration must be an ISO timestamp with timezone.");
    expect(expirationError("2026-10-10T05:00:00Z", now)).toBeNull();
    expect(expirationError("", now)).toBeNull();
  });
});