# CX7 Decision Passport

> Permission expires when reality changes.

Powered by the CX7 Decision Authority Engine.

## Implemented competition scope

- `/reconciliation`: independent session versions, deterministic comparison, unresolved divergences, explicit human resolution, and an off-chain content-derived Decision Passport Draft.
- `/evidence`: read-only Solana Devnet reference lifecycle, not proof of the visitor's current Draft.
- `/premise`: read-only Pyth SOL/USD PriceUpdateV2 observation with publication time, freshness checks and TRUE/FALSE/UNAVAILABLE evaluation. It does not govern discount reconciliation.

Human confirmation is **CURRENT_SESSION_UNAUTHENTICATED**. It neither verifies organizational identity nor grants enterprise authority. Comparison does not choose which participant is correct. Business text remains in volatile browser state; refreshing loses it. No Cloud, database, login or external AI is used.

## Actual end-to-end flow

Define process → capture at least two independent sealed versions → rules-based comparison → resolve every divergence and confirm human decision → create off-chain DRAFT with source evidence hashes, reconciliation hash and content-derived ID.

**There is no current-session Draft → Solana issuance flow.** Public historical issuance/revocation endpoints fail closed because funded signing requires verified issuer authorization and abuse controls. No issuance button is shown. Historical SAS writer code is retained but is not part of the public competition flow.

## Reference evidence, observed 2026-10-09

Network: Solana Devnet, genesis checked before reading. Schema: `CX7_DECISION_PASSPORT_V2`.

Authority: `BSjrPNLtyBKfh2xW1QLwRDceU2zcnmzqayv3rJpY6i1K`; observed balance 9.9921772 SOL.

- n1: `EHQWmk8bK2zmK182szJc4t16mm582XRf4z37r9WLB3vg`, REVOKED based on a verified successor, not absence alone.
- n2: `Gg3U2nNnDKmMKr5EMsdL8b1ccJPrhs9wUbUrz8TW1htN`, EXPIRED; historical expiry `2026-10-08T15:14:56Z` is not extended.
- n1 historical issuance signature: `2GAAiF2hKEF4AfEfZvyZzGFDWRL3wJFxSAMQMxFShyKGcyDvSEaYR7PuX5ihAcL8GsBKQU8f2FPzTJWojGVc1Njg`.
- n2 historical issuance signature: `2aPPTZys6LxCoBs8Jiy6yW87TajoWUAcPMdzDw1kJL8uTU63iDnrthP7gV4psiYHhKjFJ1tXNq3nk5migNvXJC1E`.

The evidence page rereads accounts, checks expected payload and predecessor references, and links actual recovered signatures to Solana Explorer Devnet. A signature is transaction history, not automatically a revocation signature. No new transaction was needed for this restructuring.

Pyth account: `7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE`. At `2026-10-09T05:40:08Z`, observed SOL/USD was 110.636974; publication `05:38:00Z`; condition `>= 100`, maximum age 300 seconds; evaluation TRUE. This is a time-bound observation, not a continuous monitor or current-price guarantee. Stale or partially verified values cannot evaluate TRUE.

## Data and security boundaries

Canonical JSON + Web Crypto SHA-256 derive Draft/evidence hashes. The proof commitment allowlists hashes, IDs, version/predecessor and timestamps; raw business text is excluded. A commitment is not an issued proof.

`SOLANA_RPC_URL`, `SOLANA_AUTHORITY_SECRET_KEY` and pseudonymisation secrets stay server-side. RPC reads have no public-endpoint fallback. Failed reads never become successful verification.

## Removed public experiences

Mock platform/passport catalogues, illustrative Gate/log/timeline, simulated Verify Proof, old Live Scenario actions and static Home metrics are no longer public experiences. Legacy URLs redirect to retained capabilities; historical modules are not exposed.

## Development and verification

TanStack Start v1, React 19, Tailwind v4; server functions run in the Worker runtime. Existing historical SAS integration uses `sas-lib` and `@solana/kit` 5.x, Devnet only.

```sh
bun install
bun run dev
bunx vitest run
```

67 tests pass, covering session capture, two-version comparison gate, human resolution, Draft derivation, expiration validation, metadata exclusion, fail-closed writers, reference lineage and existing cryptographic rules. Desktop 1280×1800 and mobile 390×844 verified without hydration errors or horizontal overflow. Automatic build: OK.

No public feature is presented as real without technical evidence.
