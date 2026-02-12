# Product Requirements and Features

## Goal
Provide a simple portfolio tracker where users can:
- register investment products,
- add multiple investment operations per product,
- set current value and expected due date,
- view totals, performance, and allocation charts.

## Functional Requirements
- Products support these types: Bank Deposit, Remunerated Account, Investment Fund, ETF, Roboadvisor, Gold, Crowdfunding, Crowdlending, Stock, Other.
- Product creation requires:
  - name,
  - type (or custom type if `Other`),
  - invested amount (mandatory, > 0),
  - current value.
- Product creation supports optional fields:
  - extra info (e.g., ISIN, project identifier),
  - platform,
  - expected due date,
  - time horizon label (`Long term`, `Mid/Long term`, `Mid term`, `Short term`),
  - initial investment date.
- Users can add more investments to an existing product (amount + date).
- Users can update current value per product from the dashboard.

## Dashboard Features
- KPIs:
  - total invested,
  - total current value,
  - total benefit.
- Tables:
  - By Product (includes horizon and due date status),
  - Grouped by Type,
  - Product Details screen (operations, average operation, weighted average buy date, first/last investment).
- Charts:
  - total invested by product (bar),
  - allocation by product type (bar),
  - allocation by platform (pie),
  - fixed vs variable investments (pie),
  - allocation by horizon label (pie).

## Product Editing
- Editable fields (from Product Details screen): type, extra info, platform, expected due date, horizon label, current value.

## Classification Rules
- Fixed investments: `Bank Deposit`, `Remunerated Account`.
- Variable investments: all other types.
- Due date status:
  - overdue (red),
  - today (amber),
  - upcoming (green).
