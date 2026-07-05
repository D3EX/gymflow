"""
Migrate GymFlow data from local SQLite (gymflow.db) into Neon Postgres.

USAGE:
    1. pip install sqlalchemy psycopg2-binary
    2. Edit the two variables below (SQLITE_PATH and NEON_URL)
    3. Run:  python migrate_to_neon.py

WHAT IT DOES:
    - Reads the schema + all rows from your local SQLite database
    - Creates matching tables in your Neon Postgres database (if they don't already exist)
    - Copies every row over, in an order that respects foreign keys
"""

from sqlalchemy import create_engine, MetaData, Table, select

# ---------------------------------------------------------------------------
# 1. CONFIGURE THESE TWO LINES
# ---------------------------------------------------------------------------

# Path to your local SQLite file (use forward slashes even on Windows)
SQLITE_PATH = "sqlite:///C:/Users/House Computer/Desktop/gym-management-system/backend/gymflow.db"

# Your Neon connection string (from the Neon dashboard)
NEON_URL = "postgresql://neondb_owner:npg_TmutaZRhiC75@ep-square-cherry-adr90qgn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ---------------------------------------------------------------------------
# 2. Don't need to touch anything below this line
# ---------------------------------------------------------------------------

def main():
    print("Connecting to SQLite source...")
    sqlite_engine = create_engine(SQLITE_PATH)

    print("Connecting to Neon (Postgres) destination...")
    pg_engine = create_engine(NEON_URL)

    print("Reading schema from SQLite...")
    metadata = MetaData()
    metadata.reflect(bind=sqlite_engine)

    if not metadata.sorted_tables:
        print("No tables found in the SQLite database. Nothing to migrate.")
        return

    print(f"Found {len(metadata.sorted_tables)} tables: "
          f"{[t.name for t in metadata.sorted_tables]}")

    print("Creating matching tables in Neon (skips tables that already exist)...")
    metadata.create_all(bind=pg_engine)

    with sqlite_engine.connect() as sqlite_conn, pg_engine.begin() as pg_conn:
        # Clear existing rows first, in REVERSE dependency order (children before parents)
        # so foreign key constraints don't block the deletes.
        print("Clearing any existing rows in Neon (children before parents)...")
        for table in reversed(metadata.sorted_tables):
            pg_conn.execute(table.delete())

        # Now insert fresh data in normal dependency order (parents before children)
        for table in metadata.sorted_tables:
            rows = sqlite_conn.execute(select(table)).mappings().all()
            if not rows:
                print(f"  {table.name}: 0 rows, skipping")
                continue

            pg_conn.execute(table.insert(), [dict(row) for row in rows])
            print(f"  {table.name}: migrated {len(rows)} rows")

    print("\nDone! All data has been copied to Neon.")


if __name__ == "__main__":
    main()