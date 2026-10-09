/** Public references only. Business outcomes are supplied CX7 snapshot evidence, not a live engine call. */
export const V5 = {
  hash: "2b5be7307a7a05e4bf172cee4eb35224daa4dbb83d13f60aa0b7e955dfcfba04",
  transaction: "4J1X8yB27qoBeAkKfe3FxDGsNabP9BVMUCrHA2QRKfpXvGbTkfRtxVu3vePcyQvPLhLjcRWzRnMFXDksdCXU3SJk",
  attestation: "F1UXy1rNDidp7KvrYCZb3esMXuLSBFA2yLGNjxGgukrT",
  authority: "Au5FknzLgSaf4dnQvPyEnRTH4Sz8C4N8waco12sJQdqV",
  credential: "BZbh9qDQJv7tgrs8pZXoSC9GdPhNjHvLHuRNxYeDX3ds",
  schema: "D5aStC2T3cXyzCE481WE9ubR21t7v2dzEmJA4f8vP6h6",
  expiry: 1806537599,
} as const;
export const V5_TRANSACTION_URL = `https://explorer.solana.com/tx/${V5.transaction}?cluster=devnet`;
export const V5_ATTESTATION_URL = `https://explorer.solana.com/address/${V5.attestation}?cluster=devnet`;
export const V5_AUTHORITY_CHECKS = [
  { discount: 5, condition: "5% discount", outcome: "AUTHORIZED" },
  { discount: 8, condition: "8% discount without valid exception", outcome: "BLOCKED" },
  { discount: 10, condition: "10% discount with valid >5-year customer exception", outcome: "AUTHORIZED" },
  { discount: 12, condition: "12% discount", outcome: "BLOCKED" },
] as const;

export function checkV5Payload(p: Record<string, unknown>, expiry: number, now: number) {
  const bound = p["protocol_version"] === 1 && p["passport_version"] === 5 && p["authority"] === V5.authority && p["valid_until"] === BigInt(V5.expiry) && expiry === V5.expiry && p["status"] === "VALID";
  const match = bound && p["decision_hash"] === V5.hash;
  return { match, snapshotStatus: match ? "VALID" : "UNVERIFIED", timeStatus: match ? (now >= expiry ? "EXPIRED" : "WITHIN RECORDED VALIDITY") : "UNVERIFIED" };
}