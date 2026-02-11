# Investment Portfolio Tracker

SQLite-backed web app to track:
- multiple investment products,
- multiple investment entries per product,
- current value per product,
- total invested, current value, and benefit,
- grouped dashboard by product type.

## Run locally

Start the app server:

```bash
python3 server.py
```

Then open `http://localhost:8000`.

## Files

- `index.html`: app layout and forms.
- `styles.css`: visual style and responsive layout.
- `app.js`: UI state, API calls, calculations, and rendering.
- `server.py`: HTTP server + SQLite API.
- `portfolio.db`: SQLite database file (created automatically).

## Documentation

- `PROJECT_CONTEXT.md`: high-level project snapshot and priorities.
- `docs/README.md`: docs index by audience.
- `docs/human/requirements-and-features.md`: product scope and behavior.
- `docs/human/user-guide.md`: usage walkthrough.
- `docs/human/github-publish-checklist.md`: safe GitHub publish steps (no data/secrets).
- `docs/ai/system-context.md`: architecture, schema, API contracts.
- `docs/ai/evolution-playbook.md`: implementation rules for future changes.
- `docs/ai/session-handoff.md`: cross-session handoff for AI tools.

## Notes

- Data is saved in `portfolio.db` (SQLite), so it is not tied to browser storage.
- On first run, if old local data exists (`portfolio_tracker_v1`), it is imported once into SQLite automatically.
- Currency is currently shown as EUR.
