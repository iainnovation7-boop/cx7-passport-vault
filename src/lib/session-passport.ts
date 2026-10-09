import { canonicalize, sha256Hex } from "./passport-hash";
import type { ProcessDef, ProcessVersion, ReconciledAuthorityDraft } from "./reconciliation";

export type SessionPassport = {
  passport_id: string; process: string; decision_type: string; authorized_role: string;
  allowed_action: string; confirmed_rule: string; limits: string; premises: string;
  exceptions: string; escalation_rule: string; version: 1; predecessor_id: null;
  created_at: string; valid_until: string | null; source_evidence_hashes: string[];
  reconciliation_hash: string; human_confirmation_timestamp: string;
  confirmation_scope: "CURRENT_SESSION_UNAUTHENTICATED"; status: "DRAFT";
};

export function expirationError(value: string, now = new Date()): string | null {
  if (!value.trim()) return null;
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return "Expiration must be an ISO timestamp with timezone.";
  if (Date.parse(value) <= now.getTime()) return "Expiration must be in the future.";
  return null;
}

/** Off-chain only. No transaction or server request, no business texts in proof metadata. */
export async function sessionPassport(d: ReconciledAuthorityDraft): Promise<SessionPassport> {
  if (d.confirmation_scope !== "CURRENT_SESSION_UNAUTHENTICATED" || !d.validated_at || !d.reconciliation_hash || d.source_evidence_hashes.length < 2) throw new Error("Complete session human confirmation and two source evidence hashes are required.");
  const error = expirationError(d.validity_period, new Date(d.validated_at));
  if (error) throw new Error(error);
  const body = {
    process: d.process, decision_type: d.decision_type, authorized_role: d.authorized_role,
    allowed_action: d.allowed_action, confirmed_rule: d.valid_rule, limits: d.limits, premises: d.premises,
    exceptions: d.exceptions, escalation_rule: d.escalation_rule, version: 1 as const, predecessor_id: null,
    created_at: d.validated_at, valid_until: d.validity_period || null,
    source_evidence_hashes: d.source_evidence_hashes, reconciliation_hash: d.reconciliation_hash,
    human_confirmation_timestamp: d.validated_at, confirmation_scope: d.confirmation_scope,
    status: "DRAFT" as const,
  };
  return { passport_id: `CX7-${await sha256Hex(canonicalize(body))}`, ...body };
}

export async function evidenceHashes(def: ProcessDef, versions: ProcessVersion[]) {
  return Promise.all(versions.map(v => sha256Hex(canonicalize({ role: def.roles.find(r => r.id === v.roleId)?.label ?? v.roleId, text: v.text, sealed_at: v.sealedAt }))));
}

/** Exportable commitment, not an issued proof. Deliberate allowlist excludes all raw sensitive text. */
export async function draftCommitment(p: SessionPassport) {
  return { protocol_version: 1, passport_id_hash: await sha256Hex(p.passport_id), decision_hash: await sha256Hex(canonicalize(p)), version: p.version, predecessor_id: p.predecessor_id, premise_hash: await sha256Hex(p.premises), source_evidence_hashes: p.source_evidence_hashes, reconciliation_hash: p.reconciliation_hash, confirmed_at: p.human_confirmation_timestamp, valid_until: p.valid_until };
}