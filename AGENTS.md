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
