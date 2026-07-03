# add_features.py
from sqlalchemy import text
from app.database import engine

print("🚀 Adding features column to plans table...")

try:
    with engine.connect() as conn:
        # Use IF NOT EXISTS so it doesn't crash if it already exists
        conn.execute(text("ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSON DEFAULT '[]'::json;"))
        conn.commit()
    print("✅ Features column added successfully!")
except Exception as e:
    print(f"❌ Error: {e}")