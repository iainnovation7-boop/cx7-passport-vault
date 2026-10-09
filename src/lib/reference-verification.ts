import type { V2Payload } from "./schema-v2";
import type { PassportVersion } from "./passport-version";
export function referencePayloadMatches(p: V2Payload, v: PassportVersion, authority: string, expiry: number) {
  return Number(p.protocol_version) === v.protocol_version && p.passport_id === v.lineage_id && Number(p.passport_version) === v.version && p.decision_hash === v.decision_hash && p.previous_version_id === (v.previous_version_id ?? "") && p.previous_decision_hash === (v.previous_decision_hash ?? "") && p.authority === authority && p.status === "VALID" && Number(p.valid_until) === expiry;
}
export function referenceStatus(accountExists: boolean, version: number, observedStatus: string, successorVerified: boolean) {
  if (version === 1 && !accountExists) return successorVerified ? "REVOKED" : "UNAVAILABLE";
  if (version === 2 && !successorVerified) return "VERIFICATION FAILED";
  return observedStatus;
}