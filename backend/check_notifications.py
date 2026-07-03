# backend/test_notification.py

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.models import User, Notification
from app.routers.notifications import notify_admins

def test_notification():
    db = SessionLocal()
    
    try:
        print("🔍 Testing notification creation...")
        
        # Check admin users
        admins = db.query(User).filter(User.role == "admin").all()
        print(f"Found {len(admins)} admin users:")
        for admin in admins:
            print(f"  - {admin.id}: {admin.name} ({admin.email})")
        
        # Create test notification
        result = notify_admins(
            db,
            title="🧪 Test Notification",
            message="This is a test notification created at " + str(datetime.now()),
            notification_type="info"
        )
        
        print(f"\n✅ Created {len(result)} notifications")
        
        # Check notifications for admin
        for admin in admins:
            count = db.query(Notification).filter(Notification.user_id == admin.id).count()
            print(f"📊 Admin {admin.name} has {count} notifications")
            
            # Show latest notifications
            notifications = db.query(Notification).filter(
                Notification.user_id == admin.id
            ).order_by(Notification.created_at.desc()).limit(3).all()
            
            for n in notifications:
                print(f"  - {n.id}: {n.title} - {n.message[:50]}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    from datetime import datetime
    test_notification()