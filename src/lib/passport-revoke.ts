// Revocation guards (pure, no network). Only the scenario's n1, really issued and VALID on-chain, may be revoked.
import type { PassportStatus } from "./passport-verify";
import type { PassportVersion } from "./passport-version";

export class RevokeError extends Error {}

export type RevokeCheck = {
  /** The version the caller asks to revoke (always resolved server-side, never from client input). */
  target: PassportVersion;
  /** Expected scenario n1 (lineage + hash). */
  expectedN1: PassportVersion;
  /** Attestation PDA derived from the target's versioned nonce. */
  derivedAttestation: string;
  /** Attestation the on-chain read actually verified. */
  verifiedAttestation: string;
  /** Real on-chain classification of the target. */
  status: PassportStatus;
  /** Real on-chain classification of the successor n2. */
  successorStatus: PassportStatus;
};

/** Throws unless revoking is legitimate. Returns the single attestation address that may be closed. */
export function assertRevocable(c: RevokeCheck): string {
  const t = c.target;
  const e = c.expectedN1;
  if (t.version !== 1 || t.lineage_id !== e.lineage_id || t.decision_hash !== e.decision_hash || t.previous_version_id !== null) {
    throw new RevokeError("Only passport n1 of the scenario lineage can be revoked.");
  }
  if (c.derivedAttestation !== c.verifiedAttestation) throw new RevokeError("Attestation address does not match the n1 versioned nonce.");
  if (c.status === "REVOKED") throw new RevokeError("Passport n1 is already REVOKED on-chain.");
  if (c.status === "NOT_FOUND") throw new RevokeError("Passport n1 was never issued on-chain; nothing to revoke.");
  if (c.status === "EXPIRED") throw new RevokeError("Passport n1 has already expired on-chain.");
  if (c.successorStatus !== "NOT_FOUND") throw new RevokeError("A successor already exists; n1 cannot be revoked again.");
  return c.derivedAttestation;
}
