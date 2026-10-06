import { createServerFn } from "@tanstack/react-start";

export type ProofResult =
  | { ok: true; created: boolean; network: string; attestation: string; signature: string; anchoredAt: string | null; expiry: number; explorerUrl: string }
  | { ok: false; error: string };

export const issueVerifiableProof = createServerFn({ method: "POST" }).handler(async (): Promise<ProofResult> => {
  try {
    const { issueOrFetchProof } = await import("./solana-proof.server");
    const p = await issueOrFetchProof();
    return { ok: true, created: p.created, network: p.network, attestation: p.attestation, signature: p.signature, anchoredAt: p.anchoredAt, expiry: p.expiry, explorerUrl: p.explorerUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[solana-proof]", msg);
    return { ok: false, error: msg.slice(0, 300) };
  }
});

export const getSolanaAuthorityInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { getAuthorityInfo } = await import("./solana-proof.server");
  return getAuthorityInfo();
});
