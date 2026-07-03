# backend/scripts/run_migrations.py

from sqlalchemy import text
from app.database import engine

# Add gym_id to all tables that need it
migrations = [
    # Equipment
    "ALTER TABLE equipment ADD COLUMN gym_id INTEGER REFERENCES gyms(id)",
    "UPDATE equipment SET gym_id = (SELECT id FROM gyms LIMIT 1) WHERE gym_id IS NULL",
    "ALTER TABLE equipment ALTER COLUMN gym_id SET NOT NULL",

    # Campaigns
    "ALTER TABLE campaigns ADD COLUMN gym_id INTEGER REFERENCES gyms(id)",
    "UPDATE campaigns SET gym_id = (SELECT id FROM gyms LIMIT 1) WHERE gym_id IS NULL",
    "ALTER TABLE campaigns ALTER COLUMN gym_id SET NOT NULL",

    # Plans
    "ALTER TABLE plans ADD COLUMN gym_id INTEGER REFERENCES gyms(id)",
    "UPDATE plans SET gym_id = (SELECT id FROM gyms LIMIT 1) WHERE gym_id IS NULL",
    "ALTER TABLE plans ALTER COLUMN gym_id SET NOT NULL",

    # Classes
    "ALTER TABLE classes ADD COLUMN gym_id INTEGER REFERENCES gyms(id)",
    "UPDATE classes SET gym_id = (SELECT id FROM gyms LIMIT 1) WHERE gym_id IS NULL",
    "ALTER TABLE classes ALTER COLUMN gym_id SET NOT NULL",

    # Staff phone (from your example)
    "ALTER TABLE staff ADD COLUMN phone VARCHAR",
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"✅ OK: {sql}")
        except Exception as e:
            # Column already exists — safe to skip
            print(f"⚠️ SKIP ({e}): {sql}")
    conn.commit()

print("✅ All migrations completed.")