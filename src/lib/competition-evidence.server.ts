import { deserializeAttestationData, fetchMaybeAttestation, fetchMaybeSchema } from "sas-lib";
import { getAuthorityInfo, getRpc } from "./solana-proof.server";
import { scenarioVersions, SCENARIO_PREMISE } from "./scenario-authority.server";
import { verifyPassportVersion } from "./passport-verify.server";
import { type V2Payload } from "./schema-v2";
import { readSolUsdPremise } from "./pyth-premise.server";
import { address } from "@solana/kit";

/** Independent, read-only reference evidence. No historical issuance or revocation functions are called. */
export async function readCompetitionEvidence() {
  const rpc = getRpc();
  if (await rpc.getGenesisHash().send() !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG") throw new Error("Expected Solana Devnet.");
  const { n1, n2, n1Id } = await scenarioVersions();
  const [one, two, info] = await Promise.all([verifyPassportVersion(n1), verifyPassportVersion(n2), getAuthorityInfo()]);
  const [acc1, acc2, schema] = await Promise.all([fetchMaybeAttestation(rpc, address(one.attestation)), fetchMaybeAttestation(rpc, address(two.attestation)), fetchMaybeSchema(rpc, address(info.schema))]);
  let successorVerified = false;
  if (acc2.exists && schema.exists && (two.status === "VALID" || two.status === "EXPIRED")) {
    const p = deserializeAttestationData<V2Payload>(schema.data, Uint8Array.from(acc2.data.data));
    successorVerified = p.previous_version_id === n1Id && p.previous_decision_hash === n1.decision_hash && p.authority === info.authority && Number(p.protocol_version) === 1 && p.status === "VALID" && Number(p.valid_until) === Number(acc2.data.expiry);
  }
  const rows = await Promise.all([{ v: n1, r: one }, { v: n2, r: two }].map(async ({ v, r }) => {
    const history = (await rpc.getSignaturesForAddress(address(r.attestation), { limit: 50, commitment: "confirmed" }).send()).filter(s => !s.err);
    let status: string = r.status;
    if (v.version === 1 && !acc1.exists) status = successorVerified ? "REVOKED" : "UNAVAILABLE";
    if (v.version === 2 && !successorVerified) status = "VERIFICATION FAILED";
    const signature = history.at(-1)?.signature ?? null;
    return { version: v.version, attestation: r.attestation, status, decisionHash: v.decision_hash, previousVersionId: v.previous_version_id, signature, explorerUrl: signature ? `https://explorer.solana.com/tx/${signature}?cluster=devnet` : null, accountUrl: `https://explorer.solana.com/address/${r.attestation}?cluster=devnet`, issuedAt: r.issuedAt, validUntil: r.validUntil, revocationEvidence: v.version === 1 && status === "REVOKED" ? two.attestation : null };
  }));
  return { network: "Solana Devnet", readAt: new Date().toISOString(), authority: info.authority, balanceSol: info.lamports / 1e9, credential: info.credential, schema: info.schema, schemaName: info.schemaName, rows };
}

export async function readCompetitionPyth() {
  if (await getRpc().getGenesisHash().send() !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG") throw new Error("Expected Solana Devnet.");
  return readSolUsdPremise(SCENARIO_PREMISE);
}