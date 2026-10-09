import { readFileSync } from "node:fs";
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
    expect(() => compareVersions(def, [versions[0]!])).toThrow();
    expect(() => compareVersions(def, [versions[0]!, { ...versions[0]!, text: "other" }])).toThrow();
  });
  it("2. detects conflicting 5% / 10% approval limits", () => {
    const d = c.divergences.find((x) => x.category === "approval_limit")!;
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
  it("5. human validation is mandatory and only by an authorized validator", () => {
    expect(() => buildAuthorityDraft(def, versions, c.divergences, validation)).toThrow(/Human validation/);
    expect(validationErrors(def, c.divergences, { ...resolved(), validatorRoleId: "sales" })).toContain("Role “Sales coordinator” is not authorized to validate.");
    expect(validationErrors(def, c.divergences, { ...resolved(), confirmed: false })).toContain("Explicit confirmation is required.");
    expect(validationErrors(def, c.divergences, resolved())).toEqual([]);
  });
  it("6. creates a Decision Passport DRAFT only", async () => {
    const p = await createPassportDraft(buildAuthorityDraft(def, versions, c.divergences, resolved()));
    expect(p.status).toBe("DRAFT");
    expect(p.record.authority_state).toBe("DRAFT");
    expect(p.onchain).toBe(false);
    expect(p.draft_hash).toMatch(/^[0-9a-f]{64}$/);
  });
  it("7. reconciliation code has no Solana dependency", () => {
    for (const f of ["reconciliation.ts", "reconciliation-ai.functions.ts", "../routes/reconciliation.tsx"]) {
      const src = readFileSync(new URL(f, import.meta.url), "utf8");
      expect(src).not.toMatch(/solana|sas-lib|@solana|issueProof|revoke/i);
    }
  });
});
