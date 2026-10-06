import { address, getAddressDecoder } from "@solana/kit";
import { deriveAttestationPda, deriveCredentialPda, deriveSchemaPda, deserializeAttestationData, fetchMaybeAttestation, fetchMaybeSchema } from "sas-lib";
import { CREDENTIAL_NAME, getAuthority, getRpc } from "./solana-proof.server";
import { classifyPassport, type AttestationObservation } from "./passport-verify";
import { versionNonceSeed, type PassportVersion } from "./passport-version";
import { SCHEMA_V2_NAME, SCHEMA_V2_VERSION, type V2Payload } from "./schema-v2";

/** Read-only verification of one passport version against the V2 schema on Solana Devnet. Sends no transaction. */
export async function verifyPassportVersion(v: PassportVersion) {
  const rpc = getRpc();
  const authority = (await getAuthority()).address;
  const [credential] = await deriveCredentialPda({ authority, name: CREDENTIAL_NAME });
  const [schema] = await deriveSchemaPda({ credential, name: SCHEMA_V2_NAME, version: SCHEMA_V2_VERSION });
  const nonce = getAddressDecoder().decode(await versionNonceSeed(v));
  const [attestation] = await deriveAttestationPda({ credential, schema, nonce });

  const acc = await fetchMaybeAttestation(rpc, attestation);
  let account: AttestationObservation | null = null;
  let payload: V2Payload | null = null;
  if (acc.exists) {
    const schemaAcc = await fetchMaybeSchema(rpc, schema);
    try {
      if (schemaAcc.exists) payload = deserializeAttestationData<V2Payload>(schemaAcc.data, Uint8Array.from(acc.data.data));
    } catch {
      payload = null; // undecodable → content mismatch below
    }
    account = {
      signer: acc.data.signer,
      credential: acc.data.credential,
      schema: acc.data.schema,
      expiry: Number(acc.data.expiry),
      lineage_id: String(payload?.passport_id ?? ""),
      version: Number(payload?.passport_version ?? 0),
      decision_hash: String(payload?.decision_hash ?? ""),
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
  return {
    ...result,
    attestation,
    schema,
    network: "Solana Devnet" as const,
    issuedAt: payload ? Number(payload.issued_at) : null,
    validUntil: account ? account.expiry : null,
    creationSignature: history.length ? history[history.length - 1]!.signature : null,
  };
}
