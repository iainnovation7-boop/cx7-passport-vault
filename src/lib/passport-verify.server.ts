import { address, getAddressDecoder } from "@solana/kit";
import { deriveAttestationPda, deriveCredentialPda, deriveSchemaPda, deserializeAttestationData, fetchMaybeAttestation, fetchMaybeSchema } from "sas-lib";
import { CREDENTIAL_NAME, SCHEMA_NAME, SCHEMA_VERSION, getAuthority, getRpc } from "./solana-proof.server";
import { classifyPassport, type AttestationObservation } from "./passport-verify";
import { versionNonceSeed, type PassportVersion } from "./passport-version";

/** Read-only verification of one passport version on Solana Devnet. Sends no transaction. */
export async function verifyPassportVersion(v: PassportVersion) {
  const rpc = getRpc();
  const authority = (await getAuthority()).address;
  const [credential] = await deriveCredentialPda({ authority, name: CREDENTIAL_NAME });
  const [schema] = await deriveSchemaPda({ credential, name: SCHEMA_NAME, version: SCHEMA_VERSION });
  const nonce = getAddressDecoder().decode(await versionNonceSeed(v));
  const [attestation] = await deriveAttestationPda({ credential, schema, nonce });

  const acc = await fetchMaybeAttestation(rpc, attestation);
  let account: AttestationObservation | null = null;
  if (acc.exists) {
    const schemaAcc = await fetchMaybeSchema(rpc, schema);
    let d: Record<string, unknown> = {};
    try {
      if (schemaAcc.exists) d = deserializeAttestationData(schemaAcc.data, Uint8Array.from(acc.data.data));
    } catch {
      /* undecodable → content mismatch below */
    }
    account = {
      signer: acc.data.signer,
      credential: acc.data.credential,
      schema: acc.data.schema,
      expiry: Number(acc.data.expiry),
      lineage_id: String(d["lineage_id"] ?? d["pseudonymous_passport_id"] ?? ""),
      version: Number(d["passport_version"] ?? 0),
      decision_hash: String(d["decision_hash"] ?? ""),
    };
  }
  const sigs = await rpc.getSignaturesForAddress(address(attestation), { limit: 50, commitment: "confirmed" }).send();
  const history = sigs.map((s) => ({ signature: s.signature, ok: !s.err, blockTime: s.blockTime == null ? null : Number(s.blockTime) }));
  const result = classifyPassport({
    expected: { authority, credential, schema, lineage_id: v.lineage_id, version: v.version, decision_hash: v.decision_hash },
    account,
    history,
    nowSec: Math.floor(Date.now() / 1000),
  });
  return { ...result, attestation, network: "Solana Devnet" as const };
}
