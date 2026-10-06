// CX7_DECISION_PASSPORT_V2 — the first schema used on-chain (pure; no network).
import { canonicalize, PROTOCOL_VERSION, sha256Hex } from "./passport-hash";
import { versionId, type PassportVersion } from "./passport-version";
import { PYTH_SOL_USD_ACCOUNT, PYTH_SOL_USD_FEED_ID, type PremiseCondition } from "./pyth-premise";

export const SCHEMA_V2_NAME = "CX7_DECISION_PASSPORT_V2";
export const SCHEMA_V2_VERSION = 1;
export const SCHEMA_V2_DESCRIPTION = "CX7 Decision Passport v2 - versioned, premise-bound, pseudonymous hash-only authority";

/** SAS layout codes: 0=u8, 2=u32, 8=i64, 12=String. Order is the Borsh layout. */
export const SCHEMA_V2_FIELDS: [name: string, layout: number][] = [
  ["protocol_version", 0],
  ["passport_id", 12], // pseudonymous lineage id (HMAC)
  ["passport_version", 2],
  ["decision_hash", 12],
  ["previous_version_id", 12], // "" for n1
  ["previous_decision_hash", 12], // "" for n1
  ["authority", 12], // issuer public address
  ["issued_at", 8],
  ["valid_until", 8],
  ["premise_id", 12],
  ["premise_condition_hash", 12],
  ["status", 12],
];

/** Only states that may ever be written on-chain. Revocation is expressed by closing the account. */
export const ONCHAIN_STATUS = "VALID" as const;
const DAY = 86400;

export type PremiseSpec = { id: string; source: string; account: string; feedId: string; condition: PremiseCondition };

export function solUsdPremise(condition: PremiseCondition): PremiseSpec {
  return { id: `pyth:SOL/USD:${PYTH_SOL_USD_FEED_ID}`, source: "Pyth Network", account: PYTH_SOL_USD_ACCOUNT, feedId: PYTH_SOL_USD_FEED_ID, condition };
}

/** Hash binding the passport to the exact premise source and condition it depends on. */
export function premiseConditionHash(p: PremiseSpec) {
  return sha256Hex(canonicalize({ id: p.id, account: p.account, feedId: p.feedId, op: p.condition.op, threshold: p.condition.threshold, maxAgeSec: p.condition.maxAgeSec }));
}

export type V2Payload = {
  protocol_version: number;
  passport_id: string;
  passport_version: number;
  decision_hash: string;
  previous_version_id: string;
  previous_decision_hash: string;
  authority: string;
  issued_at: number;
  valid_until: number;
  premise_id: string;
  premise_condition_hash: string;
  status: typeof ONCHAIN_STATUS;
};

/** Builds the V2 payload. Validity is exactly 24h from issued_at. */
export async function buildV2Payload(v: PassportVersion, authority: string, issuedAtSec: number, premise: PremiseSpec): Promise<V2Payload> {
  const issued_at = Math.floor(issuedAtSec);
  return {
    protocol_version: PROTOCOL_VERSION,
    passport_id: v.lineage_id,
    passport_version: v.version,
    decision_hash: v.decision_hash,
    previous_version_id: v.previous_version_id ?? "",
    previous_decision_hash: v.previous_decision_hash ?? "",
    authority,
    issued_at,
    valid_until: issued_at + DAY,
    premise_id: premise.id,
    premise_condition_hash: await premiseConditionHash(premise),
    status: ONCHAIN_STATUS,
  };
}

/** Checks that a decoded V2 payload really is the expected version (used before trusting it). */
export async function payloadMatchesVersion(p: V2Payload, v: PassportVersion) {
  return (
    p.passport_id === v.lineage_id &&
    p.passport_version === v.version &&
    p.decision_hash === v.decision_hash &&
    p.previous_version_id === (v.previous_version_id ?? "") &&
    p.previous_decision_hash === (v.previous_decision_hash ?? "") &&
    (v.previous_version_id === null || v.previous_version_id.length === 64) &&
    (await versionId(v)).length === 64
  );
}
