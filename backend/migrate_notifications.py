# backend/migrate_notifications.py

import sqlite3
import os

def migrate_notifications():
    """Migrate notifications table to add user_id column"""
    
    # Your database file
    db_path = "gymflow.db"
    
    # Check if database exists
    if not os.path.exists(db_path):
        print(f"❌ Database '{db_path}' not found!")
        print(f"Current directory: {os.getcwd()}")
        print("Files in directory:")
        for file in os.listdir('.'):
            print(f"  - {file}")
        return
    
    print(f"📂 Using database: {db_path}")
    print(f"📂 Full path: {os.path.abspath(db_path)}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if notifications table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("📋 Notifications table does not exist!")
            print("Creating notifications table...")
            
            # Create the notifications table with user_id
            cursor.execute("""
                CREATE TABLE notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    user_id INTEGER,
                    title VARCHAR NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR DEFAULT 'info',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    cover_image VARCHAR,
                    action_link VARCHAR,
                    action_label VARCHAR DEFAULT 'View Offer',
                    FOREIGN KEY (member_id) REFERENCES members(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            conn.commit()
            print("✅ Notifications table created!")
            
            # Show the table structure
            cursor.execute("PRAGMA table_info(notifications)")
            columns = cursor.fetchall()
            print("📋 Table columns:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            return
        
        # Check if user_id column exists
        cursor.execute("PRAGMA table_info(notifications)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print("📋 Current notifications table columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        if 'user_id' in column_names:
            print("\n✅ user_id column already exists in notifications table")
            return
        
        print("\n🔧 Adding user_id column to notifications table...")
        
        # SQLite doesn't support ADD COLUMN with FOREIGN KEY directly
        # We need to recreate the table
        
        # 1. Create new table with user_id
        cursor.execute("""
            CREATE TABLE notifications_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER,
                user_id INTEGER,
                title VARCHAR NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                cover_image VARCHAR,
                action_link VARCHAR,
                action_label VARCHAR DEFAULT 'View Offer',
                FOREIGN KEY (member_id) REFERENCES members(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # 2. Copy data from old table
        cursor.execute("""
            INSERT INTO notifications_new (
                id, member_id, title, message, type, is_read, created_at,
                cover_image, action_link, action_label
            )
            SELECT 
                id, member_id, title, message, type, is_read, created_at,
                cover_image, action_link, action_label
            FROM notifications
        """)
        
        # 3. Drop old table
        cursor.execute("DROP TABLE notifications")
        
        # 4. Rename new table
        cursor.execute("ALTER TABLE notifications_new RENAME TO notifications")
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(notifications)")
        columns = cursor.fetchall()
        print("\n📋 Updated notifications table columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        if 'user_id' in [col[1] for col in columns]:
            print("\n✅ user_id column successfully added!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()
        print("\n✨ Migration script finished!")

if __name__ == "__main__":
    print("🚀 Starting notification migration...")
    print(f"📁 Current directory: {os.getcwd()}")
    migrate_notifications()