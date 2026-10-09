import { describe, expect, it } from "vitest";
import {
  buildAuthorityDraft, compareVersions, createPassportDraft, validationErrors,
  type HumanValidation, type ProcessDef, type ProcessVersion,
} from "./reconciliation";

const def: ProcessDef = {
  name: "Customer discount approval",
  policy: "Discounts above 5% require manager approval.",
  roles: [
    { id: "sales", label: "Sales coordinator", isValidator: false },
    { id: "fin", label: "Finance analyst", isValidator: false },
    { id: "dir", label: "Commercial director", isValidator: true },
  ],
};
const versions: ProcessVersion[] = [
  { roleId: "sales", text: "Customers with more than five years of history may receive up to 10%, and the coordinator approves it through WhatsApp.", sealedAt: "2026-10-09T00:00:00Z" },
  { roleId: "fin", text: "Anything above 5% must be rejected unless manager approval exists in the formal system.", sealedAt: "2026-10-09T00:01:00Z" },
];
const validation: HumanValidation = {
  validatorName: "Ana", validatorRoleId: "dir", decisionType: "Discount", validRule: "Above 5% needs manager approval in the formal system",
  validException: "none", authorizedRole: "Manager", allowedAction: "Approve discount", premises: "Approval recorded in system",
  approvalLimit: "5%", validityPeriod: "", escalation: "Above 5%", resolutions: {}, confirmed: true,
};
const c = compareVersions(def, versions);
const resolved = () => ({ ...validation, resolutions: Object.fromEntries(c.divergences.map((d) => [d.id, "decided"])) });

describe("process reconciliation", () => {
  it("1. requires two independent versions from different roles", () => {
    expect(() => compareVersions(def, [(versions[0] as ProcessVersion)])).toThrow();
    expect(() => compareVersions(def, [(versions[0] as ProcessVersion), { ...(versions[0] as ProcessVersion), text: "other" }])).toThrow();
  });
  it("2. detects conflicting 5% / 10% approval limits", () => {
    const d = c.divergences.find((x) => x.category === "approval_limit");
    if (!d) throw new Error("Approval limit conflict missing");
    expect(d.statements.map((s) => s.statement).join(" ")).toMatch(/10%/);
    expect(d.statements.map((s) => s.statement).join(" ")).toMatch(/5%/);
  });
  it("3. detects the informal >5-year exception and WhatsApp authority", () => {
    expect(c.divergences.some((x) => x.category === "informal_exception" && /> 5 years/.test(JSON.stringify(x)))).toBe(true);
    expect(c.divergences.some((x) => x.category === "informal_authority" && /WhatsApp/.test(JSON.stringify(x)))).toBe(true);
    expect(c.divergences.some((x) => x.topic === "Authorized approver")).toBe(true);
  });
  it("4. never chooses a correct rule: all divergences unresolved", () => {
    expect(c.divergences.length).toBeGreaterThanOrEqual(4);
    expect(c.divergences.every((x) => x.status === "UNRESOLVED")).toBe(true);
  });
  it("5. requires every human resolution and explicit current-session confirmation", async () => {
    await expect(buildAuthorityDraft(def, versions, c.divergences, validation)).rejects.toThrow(/Human validation/);
    expect(validationErrors(def, c.divergences, { ...resolved(), confirmed: false })).toContain("Explicit confirmation is required.");
    expect(validationErrors(def, c.divergences, { ...resolved(), validatorRoleId: "sales" })).toEqual([]);
    const draft = await buildAuthorityDraft(def, versions, c.divergences, resolved());
    expect(draft.confirmation_scope).toBe("CURRENT_SESSION_UNAUTHENTICATED");
  });
  it("6. creates only a real session-derived off-chain draft", async () => {
    const authority = await buildAuthorityDraft(def, versions, c.divergences, resolved());
    const draft = await createPassportDraft(authority);
    expect(draft.status).toBe("DRAFT");
    expect(draft.onchain).toBe(false);
    expect(draft.record.limits).toBe("5%");
    expect(draft.record.authorized_role).toBe("Manager");
    expect(draft.record.source_evidence_hashes).toHaveLength(2);
    expect(draft.record.passport_id).toMatch(/^CX7-[a-f0-9]{64}$/);
    expect(draft.record.predecessor_id).toBeNull();
  });
  it("7. keeps independent versions unchanged during comparison", () => {
    const snapshot = structuredClone(versions);
    compareVersions(def, versions);
    expect(versions).toEqual(snapshot);
    expect(versions[0]?.text).toContain("10%");
    expect(versions[1]?.text).toContain("5%");
  });
});
