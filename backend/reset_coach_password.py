# backend/reset_coach_password.py

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.models import User
from app.utils.auth import get_password_hash

def reset_coach_password():
    db = SessionLocal()
    
    try:
        # Find coach user
        coach = db.query(User).filter(User.email == "coach@gymflow.com").first()
        
        if coach:
            # Reset password
            coach.password = get_password_hash("coach123")
            db.commit()
            print(f"Password reset for: {coach.name} ({coach.email})")
            print("New password: coach123")
        else:
            print("Coach not found. Creating new coach...")
            
            # Create new coach
            new_coach = User(
                name="Coach John",
                email="coach@gymflow.com",
                password=get_password_hash("coach123"),
                role="coach",
                is_active=True
            )
            db.add(new_coach)
            db.commit()
            db.refresh(new_coach)
            print(f"Coach created: {new_coach.name} ({new_coach.email})")
            print("Password: coach123")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_coach_password()