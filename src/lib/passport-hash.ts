// Deterministic, browser- and server-safe passport hashing (Web Crypto only).

export const PROTOCOL_VERSION = 1;

export type PassportRecord = Record<string, string | number | null>;

/** Canonical JSON: keys sorted recursively, no whitespace. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(",")}}`;
}

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Bytes(input: string | Uint8Array): Promise<Uint8Array> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data as BufferSource));
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await sha256Bytes(input));
}

export async function hashPassport(passport: PassportRecord): Promise<string> {
  return sha256Hex(canonicalize(passport));
}

/** The two passports of the Live Scenario (off-chain business data, never sent on-chain). */
export const scenarioPassports = {
  previous: {
    passport_id: "CX7-PP-0001",
    organization_id: "CX7-ORG-DEMO",
    authorized_amount_brl: 1800000,
    validity_hours: 24,
    supplier_risk: "LOW",
    human_authority: "APPROVED",
    authority_state: "SUPERSEDED",
  },
  current: {
    passport_id: "CX7-PP-0002",
    organization_id: "CX7-ORG-DEMO",
    authorized_amount_brl: 1600000,
    validity_hours: 24,
    supplier_risk: "REVIEWED",
    human_authority: "REAPPROVED",
    authority_state: "VALID_NOW",
  },
} satisfies Record<string, PassportRecord>;
