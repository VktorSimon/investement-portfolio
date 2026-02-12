# Project Context

## Project
Investment Portfolio Tracker (local-first web app with SQLite persistence).

## Goal
Track multiple investment products and operations, then analyze allocation and performance through dashboard views/charts.

## Current Scope
- Product creation with required fields:
  - name, type, invested amount, current value
- Optional product fields:
  - extra info (e.g., ISIN/project ID)
  - platform
  - expected due date
  - horizon label (`Long term`, `Mid/Long term`, `Mid term`, `Short term`)
- Multiple investment operations per product (amount + date)
- Dashboard:
  - KPIs, product table, grouped-by-type table
  - product details tab
  - charts (by product, by type, fixed vs variable pie, horizon pie)

## Architecture
- Frontend: `index.html`, `styles.css`, `app.js`
- Backend/API + SQLite schema/migrations: `server.py`
- DB file: `portfolio.db` (ignored by git)

## Important Rules
- Keep local data private: `portfolio.db` must never be committed.
- Keep secrets private: use `.env` (ignored), never hardcode tokens.
- JSON API fields use `camelCase`; SQLite columns use `snake_case`.

## Current Priorities (Suggested)
1. Add edit/delete actions for products and investment operations.
2. Add tests (API and key calculation logic).
3. Add export/import (CSV and optional DB backup).

## Run
```bash
python3 server.py
```
Open `http://localhost:8000`.
