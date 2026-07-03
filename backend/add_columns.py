# backend/add_columns.py

import sqlite3
import os

def add_columns():
    """Add missing columns to personal_sessions table"""
    
    db_path = "gymflow.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Database file '{db_path}' not found!")
        return
    
    print(f"📁 Using database: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # First, check what columns already exist
        cursor.execute("PRAGMA table_info(personal_sessions)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        print(f"\n📋 Existing columns: {existing_columns}")
        print(f"📋 Found {len(existing_columns)} columns\n")
        
        # Define all new columns we need - including recurring fields
        new_columns = [
            ("is_recurring", "BOOLEAN DEFAULT 0"),
            ("recurring_group_id", "VARCHAR(50)"),
            ("recurring_parent_id", "INTEGER"),
            ("recurring_day_of_week", "VARCHAR(20)"),
            ("recurring_end_date", "DATE"),
        ]
        
        # Add each missing column
        added_count = 0
        for col_name, col_type in new_columns:
            if col_name not in existing_columns:
                try:
                    sql = f'ALTER TABLE personal_sessions ADD COLUMN {col_name} {col_type}'
                    cursor.execute(sql)
                    print(f"✅ Added column: {col_name} ({col_type})")
                    added_count += 1
                except sqlite3.OperationalError as e:
                    print(f"⚠️ Could not add column {col_name}: {e}")
            else:
                print(f"⏭️ Column already exists: {col_name}")
        
        # Verify the changes
        cursor.execute("PRAGMA table_info(personal_sessions)")
        all_columns = [col[1] for col in cursor.fetchall()]
        
        print(f"\n📋 Final columns in personal_sessions ({len(all_columns)} total):")
        for i, col in enumerate(all_columns, 1):
            print(f"  {i}. {col}")
        
        conn.commit()
        conn.close()
        
        if added_count > 0:
            print(f"\n✅ Done! Added {added_count} new columns to personal_sessions.")
        else:
            print("\n✅ All columns already exist! No changes needed.")
        
        print("\n🔄 Please restart your backend server:")
        print("   Press Ctrl+C to stop, then run: uvicorn app.main:app --reload")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    add_columns()