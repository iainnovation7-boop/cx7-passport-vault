// E1 — Decision Passport verification (pure classification of on-chain observations).

export type PassportStatus = "VALID" | "EXPIRED" | "REVOKED" | "NOT_FOUND";

/** What was read from Solana for the attestation PDA of one passport version. */
export type AttestationObservation = {
  signer: string;
  credential: string;
  schema: string;
  /** Unix seconds; 0 = no expiry. */
  expiry: number;
  /** Decoded attestation fields relevant to identity. */
  lineage_id: string;
  version: number;
  decision_hash: string;
};

/** Transaction history of the attestation PDA (getSignaturesForAddress). */
export type PdaHistoryEntry = { signature: string; ok: boolean; blockTime: number | null };

export type VerifyInput = {
  expected: { authority: string; credential: string; schema: string; lineage_id: string; version: number; decision_hash: string };
  account: AttestationObservation | null;
  history: PdaHistoryEntry[];
  /** A verified on-chain successor that references this version (supersession evidence). */
  supersededBy?: { version: number; attestation: string; previous_version_id: string; expectedPreviousId: string } | null;
  nowSec: number;
};

export type VerifyResult = { status: PassportStatus; reason: string; evidence?: { signature?: string; attestation?: string } };

export function classifyPassport(i: VerifyInput): VerifyResult {
  const e = i.expected;
  if (i.account) {
    const a = i.account;
    if (a.credential !== e.credential || a.schema !== e.schema || a.signer !== e.authority) {
      return { status: "NOT_FOUND", reason: "An account exists but it was not issued by the CX7 authority/credential/schema." };
    }
    if (a.lineage_id !== e.lineage_id || a.version !== e.version || a.decision_hash !== e.decision_hash) {
      return { status: "NOT_FOUND", reason: "Attestation content does not match the requested passport version." };
    }
    if (i.supersededBy && i.supersededBy.previous_version_id === i.supersededBy.expectedPreviousId && i.supersededBy.version > e.version) {
      return { status: "REVOKED", reason: `Superseded by verified version n${i.supersededBy.version}.`, evidence: { attestation: i.supersededBy.attestation } };
    }
    if (a.expiry !== 0 && a.expiry <= i.nowSec) return { status: "EXPIRED", reason: "Attestation expiry has passed." };
    return { status: "VALID", reason: "Issued by the CX7 authority, content matches and within validity." };
  }
  // No account: absence alone is NEVER revocation. Require proof the PDA existed and was closed.
  const okTxs = i.history.filter((h) => h.ok);
  if (okTxs.length >= 2) {
    // history is newest-first; the newest successful tx after creation is the closing one.
    return { status: "REVOKED", reason: "The attestation was created and later closed on-chain.", evidence: { signature: okTxs[0].signature } };
  }
  return { status: "NOT_FOUND", reason: okTxs.length === 1 ? "History is inconclusive (single transaction); not treated as revoked." : "No attestation and no on-chain history for this version." };
}
