# System Context for AI Tools

## Stack
- Frontend: vanilla HTML/CSS/JS (`index.html`, `styles.css`, `app.js`)
- Backend: Python stdlib HTTP server (`server.py`)
- Persistence: SQLite (`portfolio.db`)

## Runtime Flow
1. `python3 server.py` initializes DB schema and starts server.
2. Frontend loads `/api/portfolio`.
3. Frontend renders all screens/charts from in-memory `state.products`.
4. Mutations call API endpoints and reload from server.

## SQLite Schema
`products`:
- `id` TEXT PK
- `name` TEXT NOT NULL
- `extra_info` TEXT NOT NULL DEFAULT ''
- `expected_due_date` TEXT NOT NULL DEFAULT ''
- `horizon_label` TEXT NOT NULL DEFAULT ''
- `type` TEXT NOT NULL
- `current_value` REAL NOT NULL DEFAULT 0
- `created_at` TEXT

`investments`:
- `id` TEXT PK
- `product_id` TEXT FK -> `products.id` (cascade delete)
- `amount` REAL NOT NULL
- `date` TEXT NOT NULL
- `created_at` TEXT

Schema migration is handled in `init_db()` via `ensure_products_columns(...)`.

## API Contracts
- `GET /api/portfolio` -> `{ products: Product[] }`
- `POST /api/products` body:
  - `name`, `type`, `currentValue`
  - optional: `extraInfo`, `expectedDueDate`, `horizonLabel`
- `POST /api/products/{id}/investments` body: `amount`, `date`
- `PATCH /api/products/{id}/current-value` body: `currentValue`
- `POST /api/import` (legacy migration payload)

## Frontend Notes
- `render()` is the main recomposition entry point.
- All financial chart/group calculations use invested amounts (`sum(investments.amount)`).
- Product type classification for fixed vs variable is in `FIXED_PRODUCT_TYPES`.

## Known Constraints
- No auth/users; single local dataset.
- No delete/edit endpoints for investments/products yet.
- Dates stored as text (`YYYY-MM-DD`) and interpreted client-side.
