# backend/migrate_coach.py

import sqlite3
import os

def migrate_coach_tables():
    db_path = "gymflow.db"
    
    if not os.path.exists(db_path):
        print(f"Database '{db_path}' not found!")
        return
    
    print(f"Using database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create coach_clients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coach_clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                coach_id INTEGER NOT NULL,
                client_id INTEGER NOT NULL,
                assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (coach_id) REFERENCES users(id),
                FOREIGN KEY (client_id) REFERENCES members(id),
                UNIQUE(coach_id, client_id)
            )
        """)
        print("Created coach_clients table")
        
        # Create coach_availability table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coach_availability (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                coach_id INTEGER NOT NULL,
                day_of_week VARCHAR(20) NOT NULL,
                start_time VARCHAR(10) NOT NULL,
                end_time VARCHAR(10) NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (coach_id) REFERENCES users(id)
            )
        """)
        print("Created coach_availability table")
        
        # Create client_progress table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS client_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                coach_id INTEGER NOT NULL,
                date DATE NOT NULL,
                weight FLOAT,
                body_fat FLOAT,
                muscle_mass FLOAT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES members(id),
                FOREIGN KEY (coach_id) REFERENCES users(id)
            )
        """)
        print("Created client_progress table")
        
        conn.commit()
        print("Coach tables migration complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_coach_tables()