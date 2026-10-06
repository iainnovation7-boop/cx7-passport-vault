// E2 — Explicit Decision Passport versioning and anti-reissue (pure, no network, no transactions).
import { PROTOCOL_VERSION, sha256Bytes, sha256Hex } from "./passport-hash";

/** Lifecycle of a single passport version. Only VALID versions may ever be (re)issued. */
export type VersionState = "VALID" | "PREMISE_CHANGED" | "REVOKED" | "SUPERSEDED";

/** On-chain-ready identity of one passport version (pseudonymous ids and hashes only). */
export type PassportVersion = {
  protocol_version: number;
  /** Pseudonymous id of the passport lineage (HMAC of the business passport id). */
  lineage_id: string;
  /** 1-based, strictly increasing within the lineage. */
  version: number;
  decision_hash: string;
  /** Link to the predecessor (null for N1). */
  previous_version_id: string | null;
  previous_decision_hash: string | null;
};

/** Stable identity of a version: differs for every (lineage, version, decision_hash). */
export function versionId(v: Pick<PassportVersion, "protocol_version" | "lineage_id" | "version" | "decision_hash">) {
  return sha256Hex(`cx7-version|v${v.protocol_version}|${v.lineage_id}|n${v.version}|${v.decision_hash}`);
}

/** 32-byte seed for the attestation nonce of this version (same inputs → same nonce → idempotent). */
export function versionNonceSeed(v: Pick<PassportVersion, "protocol_version" | "lineage_id" | "version" | "decision_hash">) {
  return sha256Bytes(`cx7-nonce|v${v.protocol_version}|${v.lineage_id}|n${v.version}|${v.decision_hash}`);
}

export function firstVersion(lineage_id: string, decision_hash: string): PassportVersion {
  return { protocol_version: PROTOCOL_VERSION, lineage_id, version: 1, decision_hash, previous_version_id: null, previous_decision_hash: null };
}

/** Builds N(k+1) referencing N(k). */
export async function successorOf(prev: PassportVersion, decision_hash: string): Promise<PassportVersion> {
  return {
    protocol_version: prev.protocol_version,
    lineage_id: prev.lineage_id,
    version: prev.version + 1,
    decision_hash,
    previous_version_id: await versionId(prev),
    previous_decision_hash: prev.decision_hash,
  };
}

export type LedgerEntry = { id: string; version: PassportVersion; state: VersionState };

export class ReissueError extends Error {}

/**
 * Decides whether a version may be issued, given the known versions of its lineage.
 * - same id already VALID → idempotent (returns "EXISTING")
 * - any REVOKED/SUPERSEDED/PREMISE_CHANGED version with the same number → refused forever
 * - version number not strictly greater than the highest known → refused
 * - successor must reference the current head
 */
export async function assertIssuable(candidate: PassportVersion, known: LedgerEntry[]): Promise<"NEW" | "EXISTING"> {
  const id = await versionId(candidate);
  const lineage = known.filter((k) => k.version.lineage_id === candidate.lineage_id);
  const same = lineage.find((k) => k.id === id);
  if (same) {
    if (same.state === "VALID") return "EXISTING";
    throw new ReissueError(`Version n${candidate.version} is ${same.state} and can never be reissued.`);
  }
  if (lineage.some((k) => k.version.version === candidate.version)) {
    throw new ReissueError(`Version n${candidate.version} already exists in this lineage; issue a new version instead.`);
  }
  const head = lineage.reduce<LedgerEntry | null>((a, b) => (!a || b.version.version > a.version.version ? b : a), null);
  if (!head) {
    if (candidate.version !== 1 || candidate.previous_version_id !== null) throw new ReissueError("A new lineage must start at n1 with no predecessor.");
    return "NEW";
  }
  if (candidate.version !== head.version.version + 1) throw new ReissueError(`Next version must be n${head.version.version + 1}.`);
  if (candidate.previous_version_id !== head.id || candidate.previous_decision_hash !== head.version.decision_hash) {
    throw new ReissueError("Successor must reference the current head version.");
  }
  return "NEW";
}
