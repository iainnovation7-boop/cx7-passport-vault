# CX7 Decision Passport

> **Permission expires when reality changes.**

CX7 Decision Passport is a verifiable authority layer for automated and AI-driven execution. An approval is not a permanent key: it is a bounded, versioned *passport* tied to the premises under which it was granted. When those premises change, the authority stops being valid, and execution is blocked until a human re-approves a new version.

---

## The problem

Automated systems (and increasingly AI agents) execute payments, purchases and operational actions using static permissions. An approval granted under one set of conditions (risk level, price, deadline) keeps working after those conditions have changed. Nothing in the permission itself records *why* it was granted, so nothing can invalidate it when the reason disappears.

## The solution

Every approved decision becomes a **Decision Passport** that records:

- the authority granted (limit, validity window, approval state);
- the premises it depends on;
- a deterministic hash of the decision;
- its version and the version it supersedes.

An **Execution Gate** checks the passport before any action. If the passport is expired, revoked, superseded, or its premises changed, the gate blocks execution. A cryptographic proof of the passport (never its confidential content) is recorded on Solana.

## Architecture

```text
Your Platform  →  Decision Passport  →  Execution Gate  →  Solana Proof
 (request)         (authority +          (allow / block)    (SAS attestation,
                    premises + hash)                          Devnet)
```

- **Frontend:** TanStack Start + React 19, Tailwind CSS v4.
- **Server:** TanStack server functions (Cloudflare Workers runtime). All Solana signing happens here.
- **Chain:** Solana **Devnet only**, via `@solana/kit` 5.x and `sas-lib` (Solana Attestation Service).

## What uses Solana

| Capability | Status |
|---|---|
| Live SOL/USD premise read from Pyth on Devnet | **Real, working** |
| Reading authority balance / attestation accounts on Devnet | **Real, working** |
| SAS Credential + Schema `CX7_DECISION_PASSPORT_V2` derivation | Implemented |
| Attestation issuance (n1, n2) | **Executed on-chain (Devnet)** — n1 and n2 issued, VALID confirmed |
| On-chain revocation of n1 (`closeAttestation`) | **Executed on-chain (Devnet)** — REVOKED confirmed |

### Pyth on Devnet (real)

The premise monitor reads the Pyth `PriceUpdateV2` account for SOL/USD directly from Solana Devnet over read-only RPC (account `7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE`, receiver program `rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ`). The account is decoded on the server. Stale or only partially verified prices are never evaluated as TRUE. (The public Hermes HTTP API was not used because it now requires authentication.)

### Solana Attestation Service

- One Credential: `CX7_DECISION_AUTHORITY`.
- One versioned Schema: `CX7_DECISION_PASSPORT_V2` (V1 kept only for read compatibility, never created).
- Credential and Schema are reused, never recreated per call.
- Attestation expiry equals the passport validity (`issued_at + 24h`).

### Deterministic hash

The passport is serialised canonically (stable key order, normalised values) and hashed with SHA-256. The same passport always yields the same `decision_hash`, on screen and on the server. Covered by tests.

### Pseudonymisation

`passport_id` and `organization_id` are HMAC-SHA256 values keyed by the server secret `CX7_PSEUDONYMIZATION_KEY`. **No names, amounts, supplier details, documents or confidential text go on-chain** — only hashes, pseudonymous IDs, states and timestamps.

### Versioning n1 → n2

Authority is versioned by `lineage + version + decision_hash`, from which the attestation id/nonce is derived deterministically. Issuing the same version twice returns the existing proof (idempotent). A revoked or superseded version is never reissued. n2 records the hash of n1 as its predecessor.

### On-chain revocation

n1 is revoked by closing its attestation on-chain (the rent returns to the authority wallet; this is expected). `REVOKED` is only reported with on-chain evidence — create + close history or a verified successor — never from mere account absence.

### Proof verification

A passport is classified as `VALID`, `EXPIRED`, `REVOKED` or `NOT_FOUND` from real reads. The UI can only show "VALID ON-CHAIN" through display guards that require a genuine on-chain observation.

### Key handling

- `SOLANA_AUTHORITY_SECRET_KEY` and `CX7_PSEUDONYMIZATION_KEY` exist only as server secrets.
- The Devnet authority keypair is derived deterministically from that secret, so it never changes and never leaves the server.
- Public authority address (Devnet): `BSjrPNLtyBKfh2xW1QLwRDceU2zcnmzqayv3rJpY6i1K`.

## Real vs Demonstrated (transparent)

- **Live Scenario steps 1–5** (Authority valid → Premise changed → Execution blocked → Human review → Execution approved) remain a **controlled, demonstrative business scenario** with illustrative data, labelled `DEMO` in the UI. Step 4 shows human review and the *conceptual* authorization of supersession; no on-chain operation happens in steps 1–5.
- **Pyth SOL/USD read is real** (Devnet `PriceUpdateV2` account), labelled `REAL DATA`.
- **Solana Devnet state reads are real** (authority, attestation accounts, verification states).
- **Deterministic hashing, HMAC pseudonymisation and versioning are real** and covered by tests.
- **SAS issuance of n1 was executed on-chain.**
- **SAS revocation of n1 was executed on-chain, and REVOKED was confirmed** by an independent post-transaction read.
- **SAS issuance of n2 was executed on-chain, and VALID was confirmed** by an independent post-transaction read.
- **The n1 → n2 lineage was verified**: n2 carries n1's version id and decision hash as its predecessor (see On-chain evidence).

## Differentiator

CX7 introduces a dynamic, premise-bounded authority model in which execution permission can be invalidated as real-world conditions change, with cryptographic lineage and on-chain supersession.

## Running locally

Requires Bun (or Node.js 20+).

```sh
bun install
bun run dev
```

For on-chain features, set server secrets `SOLANA_AUTHORITY_SECRET_KEY` and `CX7_PSEUDONYMIZATION_KEY`. The authority wallet needs Devnet SOL (≈0.02+) to issue proofs.

## Tests

```sh
bun run test
```

Covers deterministic hashing, versioning/nonce derivation, verification states, revocation safety rules, Schema V2 encoding and on-chain display guards.

## On-chain evidence

Real cycle executed on **Solana Devnet** via the Solana Attestation Service (Schema `CX7_DECISION_PASSPORT_V2`, Credential `CX7_DECISION_AUTHORITY`, authority `BSjrPNLtyBKfh2xW1QLwRDceU2zcnmzqayv3rJpY6i1K`).

**n1 ISSUED → VALID → REVOKED → n2 ISSUED → VALID**

### 1. n1 — ISSUED → VALID

- Attestation: `EHQWmk8bK2zmK182szJc4t16mm582XRf4z37r9WLB3vg`
- Decision Hash: `93439792fecb33d3f67c748d3ce489bf0ed134cde09dd4253b7758408c01d3bf`
- Transaction: `2GAAiF2hKEF4AfEfZvyZzGFDWRL3wJFxSAMQMxFShyKGcyDvSEaYR7PuX5ihAcL8GsBKQU8f2FPzTJWojGVc1Njg`
- Explorer: https://explorer.solana.com/tx/2GAAiF2hKEF4AfEfZvyZzGFDWRL3wJFxSAMQMxFShyKGcyDvSEaYR7PuX5ihAcL8GsBKQU8f2FPzTJWojGVc1Njg?cluster=devnet
- Post-transaction read: `VALID`

### 2. n1 — VALID → REVOKED

- Attestation: same n1 attestation (`EHQWmk8bK2zmK182szJc4t16mm582XRf4z37r9WLB3vg`)
- Transaction: `PRvfiykWTGQcyQK5Xy8Fn55hDMKiAcnRaRhyPi3SgEAFSGS7VR1ESa7ZZzVwrkLNWufXUvY3bDQUv61jtjzTEop`
- Explorer: https://explorer.solana.com/tx/PRvfiykWTGQcyQK5Xy8Fn55hDMKiAcnRaRhyPi3SgEAFSGS7VR1ESa7ZZzVwrkLNWufXUvY3bDQUv61jtjzTEop?cluster=devnet
- Independent post-transaction read: `REVOKED` (create + close history on-chain)

### 3. n2 — ISSUED → VALID

- Attestation: `Gg3U2nNnDKmMKr5EMsdL8b1ccJPrhs9wUbUrz8TW1htN`
- Decision Hash: `ddc72df74f82fab97a9e0eb32ed26fceecb9b0ede5636c8a0dc16a3ffa524d32`
- Transaction: `2aPPTZys6LxCoBs8Jiy6yW87TajoWUAcPMdzDw1kJL8uTU63iDnrthP7gV4psiYHhKjFJ1tXNq3nk5migNvXJC1E`
- Explorer: https://explorer.solana.com/tx/2aPPTZys6LxCoBs8Jiy6yW87TajoWUAcPMdzDw1kJL8uTU63iDnrthP7gV4psiYHhKjFJ1tXNq3nk5migNvXJC1E?cluster=devnet
- Post-transaction read: `VALID`

### Verified n2 lineage

- `lineage_id`: `3c1e2fec66679b9f6ad4e68e432e7ceb8ab36e118df601e7c2d2840a7665bc92`
- `previous_version_id`: `6c97f7d711fc8d5615166b8efa6ba4a98b2810be2ecb248f77b123d03ed6d6b7` (n1 version id)
- `previous_decision_hash`: `93439792fecb33d3f67c748d3ce489bf0ed134cde09dd4253b7758408c01d3bf` (n1 decision hash)

> Permission expires when reality changes.
