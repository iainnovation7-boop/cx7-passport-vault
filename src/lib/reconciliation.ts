// Process Reconciliation — pure, browser/server-safe logic. Never touches Solana.
// Detects divergences between independently captured versions of a process.
// It NEVER chooses which version is correct: every divergence starts UNRESOLVED
// and only an explicit human validation can turn it into governed authority.
import { type PassportRecord } from "./passport-hash";

export type ProcessRole = { id: string; label: string; isValidator: boolean };
export type ProcessDef = { name: string; policy: string; roles: ProcessRole[] };
export type ProcessVersion = { roleId: string; text: string; sealedAt: string };

export type DivergenceCategory =
  | "conflicting_rule"
  | "approval_limit"
  | "informal_exception"
  | "informal_authority"
  | "missing_owner"
  | "asymmetric_knowledge"
  | "clarification";

export type Divergence = {
  id: string;
  topic: string;
  category: DivergenceCategory;
  statements: { source: string; statement: string }[];
  whyItMatters: string;
  risk: string;
  question: string;
  origin: "rules" | "ai";
  status: "UNRESOLVED";
};

export type Agreement = { topic: string; statement: string };
export type Comparison = { agreements: Agreement[]; divergences: Divergence[] };

const NUM_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  um: 1, dois: 2, "três": 3, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};
const INFORMAL = [
  { key: "WhatsApp", re: /whats\s?app/i },
  { key: "phone call", re: /\b(phone|telefone|ligação|call)\b/i },
  { key: "verbal", re: /\b(verbal|verbally|de boca)\b/i },
  { key: "e-mail", re: /\be-?mail\b/i },
];
const FORMAL = /\b(formal system|in the system|no sistema|sistema formal|erp|workflow)\b/i;
const APPROVERS = [
  { key: "manager", re: /\b(manager|gerente)\b/i },
  { key: "coordinator", re: /\b(coordinator|coordenador[a]?)\b/i },
  { key: "director", re: /\b(director|diretor[a]?)\b/i },
  { key: "finance", re: /\b(finance|financeiro)\b/i },
];
const EXCEPTION = /\b(unless|except|exceto|a menos que|may receive|podem receber|pode receber|up to|até)\b/i;
const CONDITION = /\b(more than|over|above|mais de|acima de)\s+(\w+)\s+(years?|anos)\b/i;

function sentences(t: string) {
  return t.split(/(?<=[.!?;\n])\s+/).map((s) => s.trim()).filter(Boolean);
}
function find(t: string, re: RegExp) {
  return sentences(t).find((s) => re.test(s)) ?? t.trim();
}

export type Facts = {
  limits: number[];
  informalChannels: string[];
  formalChannel: boolean;
  approvers: string[];
  conditions: string[];
  hasException: boolean;
};

export function extractFacts(text: string): Facts {
  const limits = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)].map((m) => Number((m[1] ?? "").replace(",", ".")));
  const conditions: string[] = [];
  const c = text.match(CONDITION);
  if (c) {
    const n = NUM_WORDS[(c[2] ?? "").toLowerCase()] ?? Number(c[2]);
    conditions.push(`customer history > ${Number.isFinite(n) ? n : c[2]} years`);
  }
  return {
    limits: [...new Set(limits)].sort((a, b) => a - b),
    informalChannels: INFORMAL.filter((i) => i.re.test(text)).map((i) => i.key),
    formalChannel: FORMAL.test(text),
    approvers: APPROVERS.filter((a) => a.re.test(text)).map((a) => a.key),
    conditions,
    hasException: EXCEPTION.test(text) || conditions.length > 0,
  };
}

const eq = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

/** Deterministic comparison. Returns divergences only; never a verdict. */
export function compareVersions(def: ProcessDef, versions: ProcessVersion[]): Comparison {
  const independent = versions.filter((v) => v.text.trim());
  if (new Set(independent.map((v) => v.roleId)).size < 2) {
    throw new Error("At least two independent versions from different roles are required.");
  }
  const label = (id: string) => def.roles.find((r) => r.id === id)?.label ?? id;
  const sources = [
    ...(def.policy.trim() ? [{ source: "Official policy", text: def.policy }] : []),
    ...independent.map((v) => ({ source: label(v.roleId), text: v.text })),
  ];
  const facts = sources.map((s) => ({ ...s, f: extractFacts(s.text) }));
  const divergences: Divergence[] = [];
  const agreements: Agreement[] = [];
  const push = (d: Omit<Divergence, "id" | "origin" | "status">) =>
    divergences.push({ ...d, id: `R${divergences.length + 1}`, origin: "rules", status: "UNRESOLVED" });

  // Approval limits
  const withLimits = facts.filter((x) => x.f.limits.length);
  if (withLimits.length && !withLimits.every((x) => eq(x.f.limits, (withLimits[0]?.f.limits ?? [])))) {
    push({
      topic: "Approval limit",
      category: "approval_limit",
      statements: withLimits.map((x) => ({ source: x.source, statement: `${x.f.limits.join("% / ")}% — “${find(x.text, /%/)}”` })),
      whyItMatters: "Different roles are applying different numeric limits to the same decision.",
      risk: "Decisions above the formal limit may be executed without valid authority.",
      question: "Which limit is valid, and under which conditions may it be exceeded?",
    });
  } else if (withLimits.length === facts.length && withLimits.length) {
    agreements.push({ topic: "Approval limit", statement: `${(withLimits[0]?.f.limits ?? []).join("% / ")}%` });
  }

  // Informal exceptions (condition known by only some sources)
  const cond = facts.filter((x) => x.f.conditions.length);
  if (cond.length && cond.length < facts.length) {
    push({
      topic: "Informal exception",
      category: "informal_exception",
      statements: facts.map((x) => ({
        source: x.source,
        statement: x.f.conditions.length ? `${x.f.conditions.join(", ")} — “${find(x.text, CONDITION)}”` : "No such exception described.",
      })),
      whyItMatters: "An exception is applied by some roles but is not part of the shared or formal rule.",
      risk: "Unwritten exceptions grant authority that cannot be audited or revoked.",
      question: "Is this exception valid? If yes, what are its exact conditions and limit?",
    });
    push({
      topic: "Asymmetric knowledge",
      category: "asymmetric_knowledge",
      statements: facts.map((x) => ({ source: x.source, statement: x.f.conditions.length ? "Knows / applies the exception." : "Does not mention the exception." })),
      whyItMatters: "Information is known by one role but not by another.",
      risk: "The same request receives different outcomes depending on who handles it.",
      question: "Who must know this rule, and where will it be documented?",
    });
  }

  // Approval channel / authority outside the formal system
  const informal = facts.filter((x) => x.f.informalChannels.length);
  const formal = facts.filter((x) => x.f.formalChannel);
  if (informal.length) {
    push({
      topic: "Approval channel",
      category: "informal_authority",
      statements: facts.map((x) => ({
        source: x.source,
        statement: x.f.informalChannels.length
          ? `Via ${x.f.informalChannels.join(", ")} — “${find(x.text, (INFORMAL.find((i) => x.f.informalChannels.includes(i.key))?.re ?? /$^/))}”`
          : x.f.formalChannel ? `Formal system — “${find(x.text, FORMAL)}”` : "Channel not specified.",
      })),
      whyItMatters: "Authority is being exercised outside the formal system of record.",
      risk: "Approvals cannot be evidenced, verified or revoked.",
      question: "Is an approval via this channel valid authority? If not, what is the required channel?",
    });
  } else if (formal.length === facts.length) {
    agreements.push({ topic: "Approval channel", statement: "Formal system" });
  }

  // Approver / authorized role
  const withApprovers = facts.filter((x) => x.f.approvers.length);
  if (withApprovers.length && !withApprovers.every((x) => eq(x.f.approvers, (withApprovers[0]?.f.approvers ?? [])))) {
    push({
      topic: "Authorized approver",
      category: "conflicting_rule",
      statements: facts.map((x) => ({ source: x.source, statement: x.f.approvers.length ? x.f.approvers.join(", ") : "No approver named." })),
      whyItMatters: "Roles disagree on who holds approval authority.",
      risk: "Approvals may come from a role without delegated authority.",
      question: "Which role or person is authorized to approve, and up to which limit?",
    });
  } else if (withApprovers.length === facts.length && withApprovers.length) {
    agreements.push({ topic: "Authorized approver", statement: (withApprovers[0]?.f.approvers ?? []).join(", ") });
  }
  const noOwner = facts.filter((x) => !x.f.approvers.length && x.source !== "Official policy");
  if (noOwner.length) {
    push({
      topic: "Missing owner",
      category: "missing_owner",
      statements: noOwner.map((x) => ({ source: x.source, statement: "Describes the process without naming who decides." })),
      whyItMatters: "A step has no identified decision owner.",
      risk: "Nobody is accountable for the decision.",
      question: "Who owns this decision step?",
    });
  }
  return { agreements, divergences };
}

/** Merge AI-suggested divergences without overriding rule-based findings. */
export function mergeDivergences(rules: Divergence[], ai: Omit<Divergence, "id" | "origin" | "status">[]): Divergence[] {
  const topics = new Set(rules.map((d) => d.topic.toLowerCase()));
  const extra = ai
    .filter((d) => !topics.has(d.topic.toLowerCase()))
    .map((d, i) => ({ ...d, id: `A${i + 1}`, origin: "ai" as const, status: "UNRESOLVED" as const }));
  return [...rules, ...extra];
}

export type HumanValidation = {
  validatorName: string;
  validatorRoleId: string;
  decisionType: string;
  validRule: string;
  validException: string;
  authorizedRole: string;
  allowedAction: string;
  premises: string;
  approvalLimit: string;
  validityPeriod: string;
  escalation: string;
  resolutions: Record<string, string>;
  confirmed: boolean;
};

/** Returns the list of reasons validation is not yet acceptable (empty = valid). */
export function validationErrors(def: ProcessDef, divergences: Divergence[], v: HumanValidation): string[] {
  const errs: string[] = ["Verified validator authorization is unavailable in session-only mode."];
  const role = def.roles.find((r) => r.id === v.validatorRoleId);
  if (!role) errs.push("Select the validator role.");
  else if (!role.isValidator) errs.push(`Role “${role.label}” is not authorized to validate.`);
  if (!v.validatorName.trim()) errs.push("Validator name is required.");
  const req: [keyof HumanValidation, string][] = [
    ["decisionType", "Decision type"], ["validRule", "Valid rule"], ["validException", "Valid exception (or “none”)"],
    ["authorizedRole", "Authorized role/person"], ["allowedAction", "Allowed action"], ["premises", "Conditions / premises"],
    ["approvalLimit", "Approval limit"], ["escalation", "Escalation / review rule"],
  ];
  for (const [k, l] of req) if (!String(v[k]).trim()) errs.push(`${l} is required.`);
  for (const d of divergences) if (!v.resolutions[d.id]?.trim()) errs.push(`Resolve divergence “${d.topic}”.`);
  if (!v.confirmed) errs.push("Explicit confirmation is required.");
  return errs;
}

export type ReconciledAuthorityDraft = {
  process: string;
  decision_type: string;
  authorized_role: string;
  allowed_action: string;
  limits: string;
  premises: string;
  exceptions: string;
  valid_rule: string;
  validity_period: string;
  escalation_rule: string;
  resolutions: { topic: string; resolution: string }[];
  evidence: { source: string; sealed_at: string }[];
  validated_at: string;
  validator: string;
};

export function buildAuthorityDraft(def: ProcessDef, versions: ProcessVersion[], divergences: Divergence[], v: HumanValidation, now = new Date()): ReconciledAuthorityDraft {
  const errs = validationErrors(def, divergences, v);
  if (errs.length) throw new Error(`Human validation incomplete: ${errs[0]}`);
  const label = (id: string) => def.roles.find((r) => r.id === id)?.label ?? id;
  return {
    process: def.name,
    decision_type: v.decisionType,
    authorized_role: v.authorizedRole,
    allowed_action: v.allowedAction,
    limits: v.approvalLimit,
    premises: v.premises,
    exceptions: v.validException,
    valid_rule: v.validRule,
    validity_period: v.validityPeriod || "not specified",
    escalation_rule: v.escalation,
    resolutions: divergences.map((d) => ({ topic: d.topic, resolution: v.resolutions[d.id] ?? "" })),
    evidence: versions.map((x) => ({ source: label(x.roleId), sealed_at: x.sealedAt })),
    validated_at: now.toISOString(),
    validator: `${v.validatorName} (${label(v.validatorRoleId)})`,
  };
}

/** Builds an OFF-CHAIN Decision Passport DRAFT using the existing PassportRecord shape. Never issues. */
export async function createPassportDraft(_d: ReconciledAuthorityDraft): Promise<{ record: PassportRecord; draft_hash: string; onchain: false; status: "DRAFT" }> {
  throw new Error("Verified validator authorization is required before creating a Decision Passport Draft.");
  /* Reserved mapping for the existing PassportRecord; not an issuance path.
  const record: PassportRecord = {
    passport_id: null,
    organization_id: null,
    decision_type: d.decision_type,
    authorized_role: d.authorized_role,
    allowed_action: d.allowed_action,
    limit: d.limits,
    premises: d.premises,
    exceptions: d.exceptions,
    escalation_rule: d.escalation_rule,
    validity: d.validity_period,
    human_authority: `VALIDATED_BY ${d.validator}`,
    validated_at: d.validated_at,
    authority_state: "DRAFT",
  };
  return { record, draft_hash: await hashPassport(record), onchain: false as const, status: "DRAFT" as const }; */
}
