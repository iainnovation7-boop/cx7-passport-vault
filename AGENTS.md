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
- Proof idempotency lives on-chain: the attestation nonce is derived from protocol version + pseudonymous passport id + decision_hash, so no database is needed to avoid duplicates.
