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

- Use GameProvider for shared account, case-settings and player-progress state; it keeps all game screens consistent without device-only saves.
- Keep gameplay rules in the pure game engine and perform mutations through authenticated server functions with revision checks; clients cannot grant rewards or bypass case progression.
- Store admin privileges only in user_roles and check them on every edit; no signup or client storage may confer admin access.
- Keep case stories bundled and store editable metadata in case_settings; this preserves the Phase 1 case catalogue while sharing admin changes.
