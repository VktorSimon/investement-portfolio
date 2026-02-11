# Evolution Playbook for AI Tools

## Safe Change Sequence
When adding a product attribute:
1. Add DB column + migration in `server.py` (`ensure_products_columns`).
2. Include field in:
   - `fetch_portfolio()`,
   - `create_product(...)`,
   - `import_legacy(...)`.
3. Add form control in `index.html`.
4. Add payload/read/render support in `app.js`.
5. Run checks:
   - `PYTHONPYCACHEPREFIX=/tmp python3 -m py_compile server.py`
   - `node --check app.js`

## UI Organization Rules
- Two top screens:
  - `Manage Investments`
  - `Dashboard` (default)
- Dashboard should prioritize:
  - KPIs,
  - charts,
  - full-width `By Product`,
  - grouped/detail tables beneath.

## Data/Calculation Rules
- Invested amount per product = sum of all investment operations.
- Benefit = current value - invested amount.
- Fixed types only:
  - `Bank Deposit`
  - `Remunerated Account`
- Horizon labels:
  - `Long term`, `Mid/Long term`, `Mid term`, `Short term`.
- Due date status:
  - overdue, today, upcoming.

## Suggested Next Features
- CRUD for products and operations (edit/delete).
- Timeline chart (monthly invested/current evolution).
- Export/import CSV and DB backup workflow.
- Multi-currency support and FX conversion.
- Basic automated tests:
  - backend API tests,
  - frontend pure-calculation tests.

## Avoid
- Breaking API field casing (`camelCase` in JSON).
- Introducing non-migrated DB columns.
- Adding heavy frontend dependencies unless required.
