---
description: Lint, typecheck and build, fix issues, then propose a commit message
---

Run these in order and fix any errors you find (do not suppress them with ignores or `any`):

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm build`

Then:
- Report the first-load JS size for `/` and any route that grew noticeably.
- Run `git status` and summarise what changed in 2–4 bullets.
- List anything I should check by hand in the browser (mobile + desktop, both themes, reduced motion).
- Propose a single Conventional Commit message for this step. **Do not commit**; wait for me to say "commit".
