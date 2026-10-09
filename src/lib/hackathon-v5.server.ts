import { address, createSolanaRpc, signature } from "@solana/kit";
import { deserializeAttestationData, fetchMaybeAttestation, fetchMaybeCredential, fetchMaybeSchema, SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS } from "sas-lib";
import { checkV5Payload, V5 } from "./hackathon-v5";

/** Independent read-only verifier: never imports authority secrets, signers or historical writers. */
export async function readHackathonV5() {
  const url = process.env["SOLANA_RPC_URL"];
  if (!url) throw new Error("Read unavailable");
  const rpc = createSolanaRpc(url);
  if (await rpc.getGenesisHash().send() !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG") throw new Error("Wrong network");
  const [a, s, c, statuses, tx] = await Promise.all([
    fetchMaybeAttestation(rpc, address(V5.attestation), { commitment: "finalized" }),
    fetchMaybeSchema(rpc, address(V5.schema), { commitment: "finalized" }),
    fetchMaybeCredential(rpc, address(V5.credential), { commitment: "finalized" }),
    rpc.getSignatureStatuses([signature(V5.transaction)], { searchTransactionHistory: true }).send(),
    rpc.getTransaction(signature(V5.transaction), { commitment: "finalized", maxSupportedTransactionVersion: 0 }).send(),
  ]);
  if (!a.exists || !s.exists || !c.exists || !tx || tx.meta?.err !== null || statuses.value[0]?.confirmationStatus !== "finalized" || statuses.value[0]?.err !== null) throw new Error("Unverified references");
  if ([a, s, c].some(account => account.programAddress !== SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS) || a.data.credential !== V5.credential || a.data.schema !== V5.schema || a.data.signer !== V5.authority || s.data.credential !== V5.credential || c.data.authority !== V5.authority || !c.data.authorizedSigners.includes(address(V5.authority)) || new TextDecoder().decode(Uint8Array.from(s.data.name)) !== "CX7_DECISION_PASSPORT_V2") throw new Error("Unverified binding");
  const keys = tx.transaction.message.accountKeys;
  if (![V5.attestation, V5.authority, V5.credential, V5.schema, SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS].every(key => keys.some(k => String(k) === key))) throw new Error("Unrelated transaction");
  const p = deserializeAttestationData<Record<string, unknown>>(s.data, Uint8Array.from(a.data.data));
  const checks = checkV5Payload(p, Number(a.data.expiry), Math.floor(Date.now() / 1000));
  // Only publish allowlisted evidence metadata, never the raw payload or pseudonymous internal IDs.
  return { ...checks, hash: typeof p["decision_hash"] === "string" ? p["decision_hash"] : null, transactionStatus: "FINALIZED", readAt: new Date().toISOString(), validUntil: new Date(Number(a.data.expiry) * 1000).toISOString() };
}