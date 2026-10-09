// Presentation of supplied, previously published evidence only.
// No issuance, RPC calls, live verification or business-rule evaluation.
export const homeV5 = {
  passport: "v5",
  status: "VALID",
  validUntil: "31/03/2027",
  predecessor: "v4",
  predecessorStatus: "SUPERSEDED",
  evidenceHash: "2b5be7307a7a05e4bf172cee4eb35224daa4dbb83d13f60aa0b7e955dfcfba04",
  transaction: "4J1X8yB27qoBeAkKfe3FxDGsNabP9BVMUCrHA2QRKfpXvGbTkfRtxVu3vePcyQvPLhLjcRWzRnMFXDksdCXU3SJk",
  attestation: "F1UXy1rNDidp7KvrYCZb3esMXuLSBFA2yLGNjxGgukrT",
  authority: "Au5FknzLgSaf4dnQvPyEnRTH4Sz8C4N8waco12sJQdqV",
  credential: "BZbh9qDQJv7tgrs8pZXoSC9GdPhNjHvLHuRNxYeDX3ds",
  schema: "D5aStC2T3cXyzCE481WE9ubR21t7v2dzEmJA4f8vP6h6",
  transactionStatus: "FINALIZED",
  readBack: "MATCH",
  outcomes: [
    { percent: 5, exception: false, result: "AUTHORIZED" },
    { percent: 8, exception: false, result: "BLOCKED" },
    { percent: 10, exception: true, result: "AUTHORIZED" },
    { percent: 12, exception: false, result: "BLOCKED" },
  ],
} as const;

export const homeV5ProofDetails = [
  ["Evidence hash", homeV5.evidenceHash, null],
  ["Transaction", homeV5.transaction, `https://explorer.solana.com/tx/${homeV5.transaction}?cluster=devnet`],
  ["Attestation", homeV5.attestation, `https://explorer.solana.com/address/${homeV5.attestation}?cluster=devnet`],
  ["Authority", homeV5.authority, `https://explorer.solana.com/address/${homeV5.authority}?cluster=devnet`],
  ["Credential", homeV5.credential, `https://explorer.solana.com/address/${homeV5.credential}?cluster=devnet`],
  ["Schema", homeV5.schema, `https://explorer.solana.com/address/${homeV5.schema}?cluster=devnet`],
] as const;