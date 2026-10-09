<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep competition Home in a dedicated component using the existing visual identity and only working links; historical image-embedded mock modules must not appear public.
- The root always renders Outlet and only hides shared navigation and footer on Home; other pages retain their existing layout.
- Solana proofs use the Solana Attestation Service (sas-lib + @solana/kit 5.x, Devnet only) inside a createServerFn; keys stay in project secrets and the Devnet authority keypair is derived deterministically from SOLANA_AUTHORITY_SECRET_KEY so it never changes or leaves the server.
- Passport authority is versioned (lineage + version + decision_hash → id/nonce); revoked/superseded versions are never reissued, and "REVOKED" requires on-chain evidence (create+close history or a verified successor), never mere absence — so state can't be faked by a missing account.
- External premises are read from the Pyth SOL/USD PriceUpdateV2 account on Solana Devnet (read-only RPC); stale or partially verified prices never evaluate TRUE — the public Hermes HTTP API now requires auth.
- On-chain proofs use schema CX7_DECISION_PASSPORT_V2 only (V1 kept for read compatibility, never created); issuance goes n1 → (n1 revoked on-chain) → n2, and the UI shows VERIFIED/VALID ON-CHAIN only through the onchain-display guards so no on-chain status can be shown without a real read.
- Reconciliation uses volatile page state and deterministic comparison; session human confirmation produces only an off-chain content-derived draft, never authenticated enterprise authority.
- Historical catalogue routes redirect to retained capabilities; no mock catalogues or disabled product promises are public.

- Public issuance and revocation wrappers fail closed; no signing endpoint may spend the authority balance without verified issuer authorization and abuse controls.
- Competition evidence reads are isolated from historical writers and validate Devnet genesis and successor references; absence alone cannot establish revocation.
- The hackathon v5 case uses an independent read-only verifier and a shared proof presentation on Home and Evidence; supplied business snapshot outcomes are separated from chain integrity and never invoke the principal engine.
- Draft hashing uses Web Crypto canonical JSON and an allowlisted commitment; raw business content stays in session memory.
