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
| Attestation issuance (n1, n2) | Implemented — **PENDING DEVNET SOL** |
| On-chain revocation of n1 (`closeAttestation`) | Implemented — **PENDING DEVNET SOL** |

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

## Current state of the demo (transparent)

- **Live Scenario steps 1–5** (Authority valid → Premise changed → Execution blocked → Human review → Execution approved) are a **demonstrative narrative of the business process** with illustrative data, labelled `DEMO` in the UI. Step 4 shows human review and the *conceptual* authorization of supersession; no on-chain revocation or issuance happens in steps 1–5.
- **Step 6 is where the real cryptographic operations live**: SAS issuance of n1, verification, on-chain revocation of n1 and issuance of n2.
- **Pyth SOL/USD and Solana Devnet reads are real**, labelled `REAL DATA`.
- **SAS issuance and revocation are implemented in code but have not yet run on-chain.** The authority wallet currently holds 0 Devnet SOL, so real execution is **PENDING DEVNET SOL**. n1 has not been revoked and n2 has not been issued on-chain; no transaction signature or Explorer link exists yet, and none is shown.

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

_To be added after the first real Devnet run: n1 issued → n1 VALID → n1 revoked → REVOKED → n2 issued (signatures + Solana Explorer Devnet links)._
