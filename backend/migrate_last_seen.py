# backend/migrate_messages_v2.py
# Run from the backend/ directory: python -m migrate_messages_v2

from sqlalchemy import text
from app.database import engine

migrations = [
    "ALTER TABLE staff ADD COLUMN phone VARCHAR"
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"OK: {sql}")
        except Exception as e:
            # Column already exists — safe to skip
            print(f"SKIP ({e}): {sql}")
    conn.commit()

print("Done.")