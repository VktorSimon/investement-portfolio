# GitHub Publish Checklist

Use this before your first push.

## Keep local data, avoid publishing it
- Ensure `.gitignore` includes DB files (`portfolio.db`, `*.db`, `*.sqlite*`).
- Keep using your local `portfolio.db` for testing; it will stay on disk but out of git.

## Prevent secret leaks
- Keep secrets only in `.env` (ignored by git).
- Never hardcode tokens/passwords in source files.
- Run a quick scan before push:
  ```bash
  rg -n "(API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE KEY|AKIA|GITHUB_TOKEN|GH_TOKEN)" -S .
  ```

## If a private file was already staged/tracked
- Remove it from git index without deleting local file:
  ```bash
  git rm --cached <file>
  ```
- Then commit the `.gitignore` update.

## Optional safety check before push
```bash
git status
git diff --staged
```
