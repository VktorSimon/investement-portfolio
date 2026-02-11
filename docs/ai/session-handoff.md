# AI Session Handoff

Use this file to resume work quickly across chat sessions.

## Last Updated
2026-02-11

## Current State
- Repo initialized and pushed to GitHub:
  - `git@github.com:VktorSimon/investement-portfolio.git`
- Local SQLite persistence is active.
- Publishing safeguards are configured (`.gitignore`, `.env.example`, publish checklist).

## Completed Recently
- Added optional product metadata:
  - `extraInfo`
  - `expectedDueDate` (+ status display)
  - `horizonLabel`
- Added dashboard improvements:
  - separate screens (Manage / Dashboard)
  - full-width By Product table
  - grouped/details panels beneath
  - pie charts for fixed vs variable and horizon allocation
- Added human + AI docs under `docs/`.

## Open Work
- No edit/delete flows yet for products/investments.
- No automated tests yet.
- No backup/export workflow yet (CSV/JSON/DB snapshots).

## Constraints
- Do not commit `portfolio.db` or `.env`.
- Preserve existing API casing (`camelCase` in JSON).
- When adding DB fields, include migration in `server.py`.

## Quick Validation Commands
```bash
node --check app.js
PYTHONPYCACHEPREFIX=/tmp python3 -m py_compile server.py
python3 server.py
```

## Next-Session Prompt Template
```
Continue from docs/ai/session-handoff.md and PROJECT_CONTEXT.md.
Task: <describe next feature/fix>.
Please implement directly and update docs if needed.
```
