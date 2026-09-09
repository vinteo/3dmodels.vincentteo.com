# Pull Request and Formatting Workflow

When working on feature branches and preparing to create a Pull Request, always adhere to the following rules:

1. **Keep branch up to date:** Ensure the feature branch is fully up to date with `main` before pushing any commits. (e.g., `git fetch origin main && git rebase origin/main` or `git merge main`).
2. **Pre-PR checks:** Always run `npm run format`, `npm run lint`, and `npm run test` before creating a Pull Request.
3. **Squash minor fixes:** Any automatic formatting changes, autofixes, or minor linting resolutions must be squashed into the main feature commit rather than being added as separate "style: run prettier" or "fix: linting" commits. Use `git commit --amend` or interactive rebase.
