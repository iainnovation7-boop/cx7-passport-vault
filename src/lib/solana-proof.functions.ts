import { createServerFn } from "@tanstack/react-start";

export type ProofResult =
  | { ok: true; created: boolean; network: string; schemaName: string; passportVersion: number; attestation: string; signature: string; anchoredAt: string | null; expiry: number; explorerUrl: string }
  | { ok: false; error: string };

export const issueVerifiableProof = createServerFn({ method: "POST" }).handler(async (): Promise<ProofResult> => {
  try {
    const { issueOrFetchProof } = await import("./solana-proof.server");
    const p = await issueOrFetchProof();
    return { ok: true, created: p.created, network: p.network, schemaName: p.schemaName, passportVersion: p.passportVersion, attestation: p.attestation, signature: p.signature, anchoredAt: p.anchoredAt, expiry: p.expiry, explorerUrl: p.explorerUrl };
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

type VersionView = { version: number; id: string; predecessor: string | null; read: { ok: true; status: "VALID" | "EXPIRED" | "REVOKED" | "NOT_FOUND"; attestation: string; validUntil: number | null } | { ok: false; error: string } };

export type ScenarioAuthority =
  | { ok: true; lineage: string; schemaName: string; premiseId: string; premiseCondition: string; lamports: number; n1: VersionView; n2: VersionView }
  | { ok: false; error: string };

/** Read-only snapshot of the scenario lineage on Solana Devnet (no transaction). */
export const getScenarioAuthority = createServerFn({ method: "GET" }).handler(async (): Promise<ScenarioAuthority> => {
  try {
    const { scenarioVersions } = await import("./scenario-authority.server");
    const { verifyPassportVersion } = await import("./passport-verify.server");
    const { getAuthorityInfo } = await import("./solana-proof.server");
    const { n1, n2, n1Id, n2Id, premise } = await scenarioVersions();
    const read = async (v: typeof n1): Promise<VersionView["read"]> => {
      try {
        const r = await verifyPassportVersion(v);
        return { ok: true, status: r.status, attestation: r.attestation, validUntil: r.validUntil };
      } catch (e) {
        return { ok: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 200) };
      }
    };
    const [r1, r2, info] = await Promise.all([read(n1), read(n2), getAuthorityInfo()]);
    return {
      ok: true,
      lineage: n1.lineage_id,
      schemaName: info.schemaName,
      premiseId: premise.id,
      premiseCondition: `SOL/USD ${premise.condition.op} ${premise.condition.threshold}`,
      lamports: info.lamports,
      n1: { version: 1, id: n1Id, predecessor: null, read: r1 },
      n2: { version: 2, id: n2Id, predecessor: n2.previous_version_id, read: r2 },
    };
  } catch (e) {
    return { ok: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 300) };
  }
});

/** Real SOL/USD premise for the scenario condition (read-only). */
export const getScenarioPremise = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { readSolUsdPremise } = await import("./pyth-premise.server");
    const { SCENARIO_PREMISE } = await import("./scenario-authority.server");
    return { ok: true as const, reading: await readSolUsdPremise(SCENARIO_PREMISE) };
  } catch (e) {
    return { ok: false as const, error: (e instanceof Error ? e.message : String(e)).slice(0, 300) };
  }
});

export type RevokeResult = { ok: true; attestation: string; signature: string; status: "REVOKED"; explorerUrl: string } | { ok: false; error: string };

/** Revokes scenario n1 on Solana Devnet. No client input is accepted: the target is fixed server-side. */
export const revokePassportN1 = createServerFn({ method: "POST" }).handler(async (): Promise<RevokeResult> => {
  try {
    const { revokeScenarioN1 } = await import("./solana-proof.server");
    const r = await revokeScenarioN1();
    return { ok: true, attestation: r.attestation, signature: r.signature, status: "REVOKED", explorerUrl: r.explorerUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[solana-revoke]", msg);
    return { ok: false, error: msg.slice(0, 300) };
  }
});
