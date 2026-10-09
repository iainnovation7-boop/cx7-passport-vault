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

- Keep the approved image-based Home in a dedicated React component with scoped CSS and local dialog state; this preserves the supplied composition without changing data or existing routes.
- The root always renders Outlet and only hides shared navigation and footer on Home; other pages retain their existing layout.
- Solana proofs use the Solana Attestation Service (sas-lib + @solana/kit 5.x, Devnet only) inside a createServerFn; keys stay in project secrets and the Devnet authority keypair is derived deterministically from SOLANA_AUTHORITY_SECRET_KEY so it never changes or leaves the server.
- Passport authority is versioned (lineage + version + decision_hash → id/nonce); revoked/superseded versions are never reissued, and "REVOKED" requires on-chain evidence (create+close history or a verified successor), never mere absence — so state can't be faked by a missing account.
- External premises are read from the Pyth SOL/USD PriceUpdateV2 account on Solana Devnet (read-only RPC); stale or partially verified prices never evaluate TRUE — the public Hermes HTTP API now requires auth.
- On-chain proofs use schema CX7_DECISION_PASSPORT_V2 only (V1 kept for read compatibility, never created); issuance goes n1 → (n1 revoked on-chain) → n2, and the UI shows VERIFIED/VALID ON-CHAIN only through the onchain-display guards so no on-chain status can be shown without a real read.
- Process Reconciliation is isolated from issuance modules and uses volatile page state; fail closed on governed output until server-verified validator authorization exists, because browser-declared roles are not a security boundary.
- Static passport catalogue expiration is presentation-only and isolated from authority/verification modules; unavailable catalogue operations stay disabled because illustrative IDs are not on-chain issuance targets.
- Restored Home evidence is isolated in a presentation-only module and displayed through existing dialogs; supplied historical statuses never trigger RPC, issuance or live-verification claims, preserving all authority modules.
- Home START traverses the four existing evidence dialogs in order, never the separate transactional LiveScenario; this keeps the v5 experience presentation-only.
