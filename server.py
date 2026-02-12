#!/usr/bin/env python3
import json
import os
import sqlite3
import uuid
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "portfolio.db")


def db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with db_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                extra_info TEXT NOT NULL DEFAULT '',
                platform TEXT NOT NULL DEFAULT '',
                expected_due_date TEXT NOT NULL DEFAULT '',
                horizon_label TEXT NOT NULL DEFAULT '',
                type TEXT NOT NULL,
                current_value REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS investments (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
            )
            """
        )
        ensure_products_columns(conn)


def ensure_products_columns(conn):
    columns = conn.execute("PRAGMA table_info(products)").fetchall()
    column_names = {row["name"] for row in columns}
    if "extra_info" not in column_names:
        conn.execute("ALTER TABLE products ADD COLUMN extra_info TEXT NOT NULL DEFAULT ''")
    if "platform" not in column_names:
        conn.execute("ALTER TABLE products ADD COLUMN platform TEXT NOT NULL DEFAULT ''")
    if "expected_due_date" not in column_names:
        conn.execute("ALTER TABLE products ADD COLUMN expected_due_date TEXT NOT NULL DEFAULT ''")
    if "horizon_label" not in column_names:
        conn.execute("ALTER TABLE products ADD COLUMN horizon_label TEXT NOT NULL DEFAULT ''")


def fetch_portfolio():
    with db_conn() as conn:
        product_rows = conn.execute(
            """
            SELECT id, name, extra_info, platform, expected_due_date, horizon_label, type, current_value
            FROM products
            ORDER BY created_at ASC
            """
        ).fetchall()
        investment_rows = conn.execute(
            """
            SELECT id, product_id, amount, date
            FROM investments
            ORDER BY date ASC, created_at ASC
            """
        ).fetchall()

    investments_by_product = {}
    for row in investment_rows:
        investments_by_product.setdefault(row["product_id"], []).append(
            {
                "id": row["id"],
                "amount": float(row["amount"]),
                "date": row["date"],
            }
        )

    products = []
    for row in product_rows:
        products.append(
            {
                "id": row["id"],
                "name": row["name"],
                "extraInfo": row["extra_info"] or "",
                "platform": row["platform"] or "",
                "expectedDueDate": row["expected_due_date"] or "",
                "horizonLabel": row["horizon_label"] or "",
                "type": row["type"],
                "currentValue": float(row["current_value"]),
                "investments": investments_by_product.get(row["id"], []),
            }
        )

    return {"products": products}


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/portfolio":
            return self.send_json(HTTPStatus.OK, fetch_portfolio())
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        parts = self.route_parts(path)
        body = self.read_json_body()
        if body is None:
            return

        if parts == ["api", "products"]:
            return self.create_product(body)
        if len(parts) == 4 and parts[:2] == ["api", "products"] and parts[3] == "investments":
            return self.create_investment(parts[2], body)
        if parts == ["api", "import"]:
            return self.import_legacy(body)
        return self.send_error_json(HTTPStatus.NOT_FOUND, "Endpoint not found")

    def do_PATCH(self):
        path = urlparse(self.path).path
        parts = self.route_parts(path)
        body = self.read_json_body()
        if body is None:
            return

        if len(parts) == 4 and parts[:2] == ["api", "products"] and parts[3] == "current-value":
            return self.update_current_value(parts[2], body)
        if len(parts) == 4 and parts[:2] == ["api", "products"] and parts[3] == "platform":
            return self.update_platform(parts[2], body)
        if len(parts) == 3 and parts[:2] == ["api", "products"]:
            return self.update_product(parts[2], body)
        return self.send_error_json(HTTPStatus.NOT_FOUND, "Endpoint not found")

    def create_product(self, body):
        name = str(body.get("name", "")).strip()
        extra_info = str(body.get("extraInfo", "")).strip()
        platform = str(body.get("platform", "")).strip()
        expected_due_date = str(body.get("expectedDueDate", "")).strip()
        horizon_label = str(body.get("horizonLabel", "")).strip()
        kind = str(body.get("type", "")).strip()
        current_value = parse_amount(body.get("currentValue"))
        if not name or not kind:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "name and type are required")

        product_id = str(uuid.uuid4())
        with db_conn() as conn:
            conn.execute(
                """
                INSERT INTO products (id, name, extra_info, platform, expected_due_date, horizon_label, type, current_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (product_id, name, extra_info, platform, expected_due_date, horizon_label, kind, current_value),
            )
        return self.send_json(HTTPStatus.CREATED, {"id": product_id})

    def create_investment(self, product_id, body):
        amount = parse_amount(body.get("amount"))
        date = str(body.get("date", "")).strip()
        if amount <= 0 or not date:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "amount and date are required")

        with db_conn() as conn:
            product_exists = conn.execute(
                "SELECT 1 FROM products WHERE id = ?",
                (product_id,),
            ).fetchone()
            if not product_exists:
                return self.send_error_json(HTTPStatus.NOT_FOUND, "Product not found")

            conn.execute(
                """
                INSERT INTO investments (id, product_id, amount, date)
                VALUES (?, ?, ?, ?)
                """,
                (str(uuid.uuid4()), product_id, amount, date),
            )
        return self.send_json(HTTPStatus.CREATED, {"ok": True})

    def update_current_value(self, product_id, body):
        current_value = max(0.0, parse_amount(body.get("currentValue")))
        with db_conn() as conn:
            updated = conn.execute(
                "UPDATE products SET current_value = ? WHERE id = ?",
                (current_value, product_id),
            )
            if updated.rowcount == 0:
                return self.send_error_json(HTTPStatus.NOT_FOUND, "Product not found")
        return self.send_json(HTTPStatus.OK, {"ok": True})

    def update_platform(self, product_id, body):
        platform = str(body.get("platform", "")).strip()
        with db_conn() as conn:
            updated = conn.execute(
                "UPDATE products SET platform = ? WHERE id = ?",
                (platform, product_id),
            )
            if updated.rowcount == 0:
                return self.send_error_json(HTTPStatus.NOT_FOUND, "Product not found")
        return self.send_json(HTTPStatus.OK, {"ok": True})

    def update_product(self, product_id, body):
        kind = str(body.get("type", "")).strip()
        if not kind:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "type is required")

        extra_info = str(body.get("extraInfo", "")).strip()
        platform = str(body.get("platform", "")).strip()
        expected_due_date = str(body.get("expectedDueDate", "")).strip()
        horizon_label = str(body.get("horizonLabel", "")).strip()
        current_value = max(0.0, parse_amount(body.get("currentValue")))

        with db_conn() as conn:
            updated = conn.execute(
                """
                UPDATE products
                SET type = ?, extra_info = ?, platform = ?, expected_due_date = ?, horizon_label = ?, current_value = ?
                WHERE id = ?
                """,
                (kind, extra_info, platform, expected_due_date, horizon_label, current_value, product_id),
            )
            if updated.rowcount == 0:
                return self.send_error_json(HTTPStatus.NOT_FOUND, "Product not found")
        return self.send_json(HTTPStatus.OK, {"ok": True})

    def import_legacy(self, body):
        products = body.get("products")
        if not isinstance(products, list):
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "products must be an array")

        with db_conn() as conn:
            for product in products:
                product_id = str(product.get("id") or uuid.uuid4())
                name = str(product.get("name", "")).strip()
                extra_info = str(product.get("extraInfo", "")).strip()
                platform = str(product.get("platform", "")).strip()
                expected_due_date = str(product.get("expectedDueDate", "")).strip()
                horizon_label = str(product.get("horizonLabel", "")).strip()
                kind = str(product.get("type", "")).strip()
                current_value = parse_amount(product.get("currentValue"))
                if not name or not kind:
                    continue

                conn.execute(
                    """
                    INSERT OR IGNORE INTO products (id, name, extra_info, platform, expected_due_date, horizon_label, type, current_value)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (product_id, name, extra_info, platform, expected_due_date, horizon_label, kind, current_value),
                )

                investments = product.get("investments", [])
                if not isinstance(investments, list):
                    continue
                for inv in investments:
                    amount = parse_amount(inv.get("amount"))
                    date = str(inv.get("date", "")).strip()
                    if amount <= 0 or not date:
                        continue
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO investments (id, product_id, amount, date)
                        VALUES (?, ?, ?, ?)
                        """,
                        (str(inv.get("id") or uuid.uuid4()), product_id, amount, date),
                    )
        return self.send_json(HTTPStatus.CREATED, {"ok": True})

    def route_parts(self, path):
        return [part for part in path.strip("/").split("/") if part]

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_error_json(HTTPStatus.BAD_REQUEST, "Invalid JSON body")
            return None

    def send_json(self, status, payload):
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_error_json(self, status, message):
        self.send_json(status, {"error": message})


def parse_amount(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def main():
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    print("Serving on http://localhost:8000")
    server.serve_forever()


if __name__ == "__main__":
    main()
