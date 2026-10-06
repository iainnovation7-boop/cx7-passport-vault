import {
  address,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createSolanaRpc,
  createTransactionMessage,
  getAddressDecoder,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Instruction,
  type KeyPairSigner,
  type Signature,
} from "@solana/kit";
import {
  deriveAttestationPda,
  deriveCredentialPda,
  deriveSchemaPda,
  fetchMaybeAttestation,
  fetchMaybeCredential,
  fetchMaybeSchema,
  fetchSchema,
  getCreateAttestationInstruction,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  serializeAttestationData,
} from "sas-lib";
import { hashPassport, PROTOCOL_VERSION, scenarioPassports, sha256Bytes, toHex } from "./passport-hash";
import { assertIssuable, versionNonceSeed, type LedgerEntry } from "./passport-version";
import { buildV2Payload, SCHEMA_V2_DESCRIPTION, SCHEMA_V2_FIELDS, SCHEMA_V2_NAME, SCHEMA_V2_VERSION } from "./schema-v2";

export const CREDENTIAL_NAME = "CX7_DECISION_AUTHORITY";
/** Legacy V1 (read compatibility only; never created or issued). */
export const SCHEMA_NAME = "CX7_DECISION_PASSPORT_V1";
export const SCHEMA_VERSION = 1;
const DAY = 86400;

/** On-chain schema: only technical, non-sensitive fields. Order is the Borsh layout. */
export const SCHEMA_FIELDS: [name: string, layout: number][] = [
  ["protocol_version", 0], // u8
  ["pseudonymous_passport_id", 12], // String
  ["pseudonymous_organization_id", 12],
  ["decision_hash", 12],
  ["previous_passport_hash", 12],
  ["authority_state", 12],
  ["valid_from", 8], // i64
  ["valid_until", 8],
  ["premise_state", 12],
  ["timestamp", 8],
];

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

async function hmacHex(key: string, message: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(message)));
}

/** Stable Devnet authority: Ed25519 seed = SHA-256(secret). Never leaves the server. */
export async function getAuthority(): Promise<KeyPairSigner> {
  const seed = await sha256Bytes(`cx7-devnet-authority|${env("SOLANA_AUTHORITY_SECRET_KEY")}`);
  return createKeyPairSignerFromPrivateKeyBytes(seed);
}

export function getRpc() {
  return createSolanaRpc(process.env["SOLANA_RPC_URL"] || "https://api.devnet.solana.com");
}

/** Builds the exact on-chain payload for the final passport of the Live Scenario. */
export async function buildOnchainPayload(issuedAtSec: number) {
  const pseudoKey = env("CX7_PSEUDONYMIZATION_KEY");
  const { current, previous } = scenarioPassports;
  // Validity: exactly 24h counted from issuance.
  const valid_from = Math.floor(issuedAtSec);
  const valid_until = valid_from + DAY;
  const decision_hash = await hashPassport({ ...current, valid_from, valid_until });
  const previous_passport_hash = await hashPassport({ ...previous, valid_from, valid_until });
  const payload = {
    protocol_version: PROTOCOL_VERSION,
    pseudonymous_passport_id: await hmacHex(pseudoKey, `passport|${current.passport_id}`),
    pseudonymous_organization_id: await hmacHex(pseudoKey, `organization|${current.organization_id}`),
    decision_hash,
    previous_passport_hash,
    authority_state: "VALID_NOW",
    valid_from,
    valid_until,
    premise_state: "REVIEWED",
    timestamp: valid_from,
  };
  return payload;
}

/** Nonce derived only from protocol version + pseudonymous passport id + decision_hash. */
export async function deriveNonce(p: { protocol_version: number; pseudonymous_passport_id: string; decision_hash: string }) {
  const bytes = await sha256Bytes(`cx7-nonce|v${p.protocol_version}|${p.pseudonymous_passport_id}|${p.decision_hash}`);
  return getAddressDecoder().decode(bytes);
}

async function send(rpc: ReturnType<typeof getRpc>, signer: KeyPairSigner, ixs: Instruction[]): Promise<Signature> {
  const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: "confirmed" }).send();
  const msg = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
    (m) => appendTransactionMessageInstructions(ixs, m),
  );
  const tx = await signTransactionMessageWithSigners(msg);
  const sig = getSignatureFromTransaction(tx);
  await rpc.sendTransaction(getBase64EncodedWireTransaction(tx), { encoding: "base64", preflightCommitment: "confirmed" }).send();
  for (let i = 0; i < 40; i++) {
    const { value } = await rpc.getSignatureStatuses([sig]).send();
    const s = value[0];
    if (s?.err) throw new Error(`Transaction failed: ${JSON.stringify(s.err, (_k, v) => (typeof v === "bigint" ? v.toString() : v))}`);
    if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) return sig;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Transaction not confirmed in time");
}

/** Ensures the CX7 credential and the V2 schema exist (created only if missing). V1 is never created. */
export async function ensureCredentialAndSchema(rpc: ReturnType<typeof getRpc>, authority: KeyPairSigner) {
  const [credential] = await deriveCredentialPda({ authority: authority.address, name: CREDENTIAL_NAME });
  const [schema] = await deriveSchemaPda({ credential, name: SCHEMA_V2_NAME, version: SCHEMA_V2_VERSION });
  if (!(await fetchMaybeCredential(rpc, credential)).exists) {
    await send(rpc, authority, [getCreateCredentialInstruction({ payer: authority, credential, authority, name: CREDENTIAL_NAME, signers: [authority.address] })]);
  }
  if (!(await fetchMaybeSchema(rpc, schema)).exists) {
    await send(rpc, authority, [
      getCreateSchemaInstruction({
        payer: authority,
        authority,
        credential,
        schema,
        name: SCHEMA_V2_NAME,
        description: SCHEMA_V2_DESCRIPTION,
        layout: Uint8Array.from(SCHEMA_V2_FIELDS.map(([, l]) => l)),
        fieldNames: SCHEMA_V2_FIELDS.map(([n]) => n),
      }),
    ]);
  }
  return { credential, schema };
}

async function findCreationSignature(rpc: ReturnType<typeof getRpc>, account: string): Promise<{ signature: string; blockTime: number | null } | null> {
  const list = await rpc.getSignaturesForAddress(address(account), { limit: 1000, commitment: "confirmed" }).send();
  const ok = list.filter((s) => !s.err);
  const first = ok[ok.length - 1];
  return first ? { signature: first.signature, blockTime: first.blockTime == null ? null : Number(first.blockTime) } : null;
}

export const INSUFFICIENT_SOL = "Insufficient Devnet SOL to issue the verifiable proof.";
const MIN_LAMPORTS = 20_000_000n; // 0.02 SOL covers credential + schema + attestation rent and fees

function humanize(e: unknown): Error {
  const msg = e instanceof Error ? `${e.message} ${JSON.stringify((e as { context?: unknown }).context ?? "", (_k, v) => (typeof v === "bigint" ? v.toString() : v))}` : String(e);
  if (/insufficient|no record of a prior credit|AccountNotFound|InsufficientFundsForRent/i.test(msg)) return new Error(INSUFFICIENT_SOL);
  return e instanceof Error ? e : new Error(msg);
}

export async function issueOrFetchProof() {
  try {
    return await issueOrFetchProofInner();
  } catch (e) {
    throw humanize(e);
  }
}

/**
 * V2 issuance of the next issuable version of the scenario lineage:
 * N1 if it was never issued; existing N1 while VALID (idempotent); N2 only after N1 is REVOKED on-chain.
 */
async function issueOrFetchProofInner() {
  const { verifyPassportVersion } = await import("./passport-verify.server");
  const { scenarioVersions } = await import("./scenario-authority.server");
  const rpc = getRpc();
  const authority = await getAuthority();
  const { n1, n2, n1Id, premise } = await scenarioVersions();

  const s1 = await verifyPassportVersion(n1);
  const ledger: LedgerEntry[] = [];
  let target = n1;
  if (s1.status === "EXPIRED") throw new Error("Passport n1 has expired on-chain; a new version must follow the revocation flow.");
  if (s1.status === "REVOKED") {
    ledger.push({ id: n1Id, version: n1, state: "REVOKED" });
    target = n2;
  } else if (s1.status === "VALID") {
    ledger.push({ id: n1Id, version: n1, state: "VALID" });
  }
  const mode = await assertIssuable(target, ledger);

  const [credential] = await deriveCredentialPda({ authority: authority.address, name: CREDENTIAL_NAME });
  const [schemaAddr] = await deriveSchemaPda({ credential, name: SCHEMA_V2_NAME, version: SCHEMA_V2_VERSION });
  const nonce = getAddressDecoder().decode(await versionNonceSeed(target));
  const [attestation] = await deriveAttestationPda({ credential, schema: schemaAddr, nonce });

  let created = false;
  if (mode === "NEW" && !(await fetchMaybeAttestation(rpc, attestation)).exists) {
    const { value: lamports } = await rpc.getBalance(authority.address).send();
    if (lamports < MIN_LAMPORTS) throw new Error(INSUFFICIENT_SOL);
    const { schema } = await ensureCredentialAndSchema(rpc, authority);
    const payload = await buildV2Payload(target, authority.address, Math.floor(Date.now() / 1000), premise);
    const schemaAcc = await fetchSchema(rpc, schema);
    const data = serializeAttestationData(schemaAcc.data, payload);
    await send(rpc, authority, [
      getCreateAttestationInstruction({ payer: authority, authority, credential, schema, attestation, nonce, data, expiry: payload.valid_until }),
    ]);
    created = true;
  }
  const att = await fetchMaybeAttestation(rpc, attestation);
  if (!att.exists) throw new Error("Attestation not found after confirmation");
  const creation = await findCreationSignature(rpc, attestation);
  if (!creation) throw new Error("Creation transaction not found");
  return {
    created,
    network: "Solana Devnet" as const,
    schemaName: SCHEMA_V2_NAME,
    passportVersion: target.version,
    authority: authority.address,
    credential,
    schema: schemaAddr,
    attestation,
    nonce,
    signature: creation.signature,
    anchoredAt: creation.blockTime ? new Date(creation.blockTime * 1000).toISOString() : null,
    expiry: Number(att.data.expiry),
    decisionHash: target.decision_hash,
    explorerUrl: `https://explorer.solana.com/tx/${creation.signature}?cluster=devnet`,
  };
}

export async function getAuthorityInfo() {
  const rpc = getRpc();
  const authority = await getAuthority();
  const { value } = await rpc.getBalance(authority.address).send();
  const [credential] = await deriveCredentialPda({ authority: authority.address, name: CREDENTIAL_NAME });
  const [schema] = await deriveSchemaPda({ credential, name: SCHEMA_V2_NAME, version: SCHEMA_V2_VERSION });
  return { authority: authority.address, lamports: Number(value), credential, schema, schemaName: SCHEMA_V2_NAME };
}
