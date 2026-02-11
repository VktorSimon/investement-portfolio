# User Guide

## Start the app
```bash
python3 server.py
```
Open `http://localhost:8000`.

## Screen Overview
- `Dashboard` (default): analysis, charts, grouped views, product details.
- `Manage Investments`: add products and add additional investments.

## Add a Product
1. Go to `Manage Investments`.
2. Fill required fields: product name, product type, invested amount, current value.
3. Optionally add:
   - extra info (`ISIN`, project ID, etc.),
   - expected due date,
   - horizon label,
   - initial investment date.
4. Submit `Add Product`.

## Add More Investment to a Product
1. In `Add Investment to Existing Product`, choose product.
2. Enter amount and date.
3. Submit.

## Read the Dashboard
- `By Product`: each product totals, benefit, due status, and investment history.
- `Grouped by Type`: aggregate invested/current/benefit by product type.
- `Product Details`: deep view for one selected product.
- Charts show allocations and composition across products, types, fixed/variable split, and horizon labels.

## Data Persistence
- Data is stored in local SQLite DB `portfolio.db`.
- Browser refresh does not remove data.
- A one-time migration imports old `localStorage` data (if present) into SQLite.
