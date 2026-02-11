# Repository Guidelines

## Project Structure & Module Organization
This is a small full-stack app with a static frontend and Python backend:

- `index.html`: UI structure (screens, forms, dashboard sections).
- `styles.css`: all styling and responsive layout rules.
- `app.js`: frontend state, API calls, calculations, and chart rendering.
- `server.py`: HTTP server, API routes, SQLite schema/migrations.
- `portfolio.db`: local SQLite database (runtime artifact).
- `docs/`: human-facing and AI-facing documentation.

Keep frontend logic in `app.js` and backend/data logic in `server.py`.

## Build, Test, and Development Commands
No package manager/build step is required.

- `python3 server.py`: start app server on `http://localhost:8000`.
- `node --check app.js`: JavaScript syntax check.
- `PYTHONPYCACHEPREFIX=/tmp python3 -m py_compile server.py`: Python syntax check.

Run syntax checks before opening a PR.

## Coding Style & Naming Conventions
- Use 2 spaces for HTML/CSS/JS indentation; 4 spaces for Python.
- In JS, use `camelCase` for identifiers and `UPPER_SNAKE_CASE` for constants.
- Keep API JSON fields in `camelCase` (`currentValue`, `expectedDueDate`, `horizonLabel`).
- Keep SQL column names in `snake_case` (`current_value`, `expected_due_date`).
- Prefer small, focused functions (rendering, formatting, API access, persistence).

## Testing Guidelines
Automated tests are not yet set up. Minimum validation for changes:

- Run JS and Python syntax checks (commands above).
- Manually verify key flows:
  - create product,
  - add investment,
  - update current value,
  - dashboard charts and grouped tables.
- For schema changes, verify migration works with an existing `portfolio.db`.

## Commit & Pull Request Guidelines
Use Conventional Commits:

- `feat: add horizon-label pie chart`
- `fix: align grouped-by-type panel`
- `docs: add AI evolution playbook`

PRs should include:
- clear summary and motivation,
- impacted files/areas (`app.js`, `server.py`, schema, docs),
- validation evidence (syntax checks + manual test notes),
- screenshots/GIFs for UI changes.

Keep PRs small and avoid mixing unrelated refactors.

## Database & API Notes
- Never remove/rename SQLite columns without explicit migration handling.
- When adding product fields, update:
  - `init_db()`/`ensure_products_columns(...)` in `server.py`,
  - API read/write paths (`fetch_portfolio`, `create_product`, `import_legacy`),
  - frontend form/payload/rendering in `index.html` + `app.js`.
