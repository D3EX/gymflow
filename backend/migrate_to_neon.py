"""
Migrate GymFlow data from local SQLite (gymflow.db) into Neon Postgres.

This version uses your ACTUAL backend SQLAlchemy models (app/models/models.py)
to create the tables in Neon. This avoids type-mismatch errors that happen when
reflecting SQLite's schema directly (e.g. SQLite's internal DATETIME type isn't
a real Postgres type).

USAGE:
    1. Run this script from inside the `backend` folder:
           cd backend
           python migrate_to_neon.py
    2. Make sure your normal backend dependencies are installed (the ones
       your FastAPI app needs), since this script imports your real models.

WHAT IT DOES:
    - Loads your real SQLAlchemy models to know the correct schema/types
    - Drops and recreates matching tables in Neon using that correct schema
    - Reads all rows from SQLite and copies them into Neon, in FK-safe order
"""

import sys
import os

# Make sure "app" is importable when running this script from the backend/ folder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, MetaData, Table, select

# ---------------------------------------------------------------------------
# 1. CONFIGURE THESE TWO LINES
# ---------------------------------------------------------------------------

SQLITE_PATH = "sqlite:///C:/Users/House Computer/Desktop/gym-management-system/backend/gymflow.db"
NEON_URL = "postgresql://neondb_owner:npg_TmutaZRhiC75@ep-square-cherry-adr90qgn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ---------------------------------------------------------------------------
# 2. Don't need to touch anything below this line
# ---------------------------------------------------------------------------

def main():
    print("Loading your real SQLAlchemy models (for correct schema/types)...")
    from app.database import Base
    import app.models.models  # noqa: F401  (importing registers all models onto Base.metadata)

    print("Connecting to SQLite source...")
    sqlite_engine = create_engine(SQLITE_PATH)

    print("Connecting to Neon (Postgres) destination...")
    pg_engine = create_engine(NEON_URL)

    model_metadata = Base.metadata
    if not model_metadata.sorted_tables:
        print("No tables found in your models. Nothing to migrate.")
        return

    print(f"Found {len(model_metadata.sorted_tables)} model tables: "
          f"{[t.name for t in model_metadata.sorted_tables]}")

    print("Dropping any existing tables in Neon with matching names...")
    with pg_engine.begin() as pg_conn:
        for table in reversed(model_metadata.sorted_tables):
            pg_conn.exec_driver_sql(f'DROP TABLE IF EXISTS "{table.name}" CASCADE')

    print("Creating fresh tables in Neon using your real model schema...")
    model_metadata.create_all(bind=pg_engine)

    print("Reflecting SQLite schema so we can read the raw data...")
    sqlite_metadata = MetaData()
    sqlite_metadata.reflect(bind=sqlite_engine)

    with sqlite_engine.connect() as sqlite_conn, pg_engine.begin() as pg_conn:
        for table in model_metadata.sorted_tables:
            if table.name not in sqlite_metadata.tables:
                print(f"  {table.name}: not found in SQLite, skipping")
                continue

            sqlite_table = sqlite_metadata.tables[table.name]
            rows = sqlite_conn.execute(select(sqlite_table)).mappings().all()
            if not rows:
                print(f"  {table.name}: 0 rows, skipping")
                continue

            # Only keep columns that actually exist on the destination table
            valid_columns = {c.name for c in table.columns}
            cleaned_rows = [
                {k: v for k, v in dict(row).items() if k in valid_columns}
                for row in rows
            ]

            pg_conn.execute(table.insert(), cleaned_rows)
            print(f"  {table.name}: migrated {len(cleaned_rows)} rows")

    print("\nDone! All data has been copied to Neon.")


if __name__ == "__main__":
    main()