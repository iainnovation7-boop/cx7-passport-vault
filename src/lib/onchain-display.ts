// Guards that prevent the UI from ever showing an on-chain status that was not actually observed.

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function isBase58Address(s: unknown): s is string {
  return typeof s === "string" && s.length >= 32 && s.length <= 44 && BASE58.test(s);
}
export function isBase58Signature(s: unknown): s is string {
  return typeof s === "string" && s.length >= 64 && s.length <= 90 && BASE58.test(s);
}

export type ProofLike = { ok: boolean; attestation?: string; signature?: string; explorerUrl?: string; network?: string };

/** VERIFIED only when the server returned a real-looking attestation + signature and a matching Devnet Explorer URL. */
export function isGenuineProof(p: ProofLike | null | undefined): boolean {
  if (!p || p.ok !== true) return false;
  if (!isBase58Address(p.attestation) || !isBase58Signature(p.signature)) return false;
  return p.explorerUrl === `https://explorer.solana.com/tx/${p.signature}?cluster=devnet` && p.network === "Solana Devnet";
}

export type OnchainRead = { ok: true; status: "VALID" | "EXPIRED" | "REVOKED" | "NOT_FOUND"; attestation: string } | { ok: false; error: string } | null;

/** Executive label for the on-chain state of a passport version. Never claims VALID ON-CHAIN without a VALID read. */
export function onchainLabel(r: OnchainRead): string {
  if (!r) return "CHECKING…";
  if (!r.ok) return "UNVERIFIED (READ FAILED)";
  switch (r.status) {
    case "VALID":
      return isBase58Address(r.attestation) ? "VALID ON-CHAIN" : "UNVERIFIED";
    case "EXPIRED":
      return "EXPIRED ON-CHAIN";
    case "REVOKED":
      return "REVOKED ON-CHAIN";
    default:
      return "NOT YET ISSUED (NOT_FOUND)";
  }
}

export const AWAITING_FUNDING = "ISSUANCE UNAVAILABLE (DEVNET BALANCE)";
