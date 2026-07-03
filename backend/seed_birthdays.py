# backend/seed_birthdays.py

"""
Seed script to add members with birthdays today
Run with: python seed_birthdays.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.models import User, Member, Notification
from app.utils.auth import get_password_hash
from datetime import datetime, date, timedelta
import random

def seed_birthdays():
    print("🎂 Adding members with birthdays today...")
    db = SessionLocal()
    
    try:
        # Birthday members data
        birthday_members = [
            {'name': 'Yasmine Amrani', 'email': 'yasmine.amrani@birthday.com', 'age': 25, 'gender': 'female', 'weight': 62, 'height': 168, 'phone': '+213555123456'},
            {'name': 'Karim Benzema', 'email': 'karim.benzema@birthday.com', 'age': 32, 'gender': 'male', 'weight': 78, 'height': 182, 'phone': '+213555789012'},
            {'name': 'Leila Bensaid', 'email': 'leila.bensaid@birthday.com', 'age': 28, 'gender': 'female', 'weight': 58, 'height': 165, 'phone': '+213555345678'}
        ]
        
        birthday_messages = [
            'Happy Birthday! Enjoy a free smoothie at our cafe today! 🎉',
            'Happy Birthday! Get 20% off your next personal training session! 🎂',
            'Happy Birthday! Enjoy a free guest pass for a friend! 🎈',
            'Happy Birthday! Here is a free supplement pack waiting for you at the front desk! 🎁',
            'Happy Birthday! Enjoy a free yoga mat with your next purchase! 🧘',
        ]
        
        today = date.today()
        created = 0
        
        for m in birthday_members:
            # Check if user already exists
            existing = db.query(User).filter(User.email == m['email']).first()
            if existing:
                print(f"⏭️  {m['name']} already exists, skipping...")
                continue
            
            # Create user
            user = User(
                name=m['name'],
                email=m['email'],
                password=get_password_hash('birthday123'),
                role='client',
                is_active=True,
                created_at=datetime.now()
            )
            db.add(user)
            db.flush()
            
            # Create member with birthday TODAY
            birth_year = today.year - m['age']
            birth_date = date(birth_year, today.month, today.day)
            
            member = Member(
                user_id=user.id,
                phone=m['phone'],
                age=m['age'],
                weight=m['weight'],
                height=m['height'],
                gender=m['gender'],
                status='active',
                date_of_birth=birth_date,
                created_at=datetime.now()
            )
            db.add(member)
            db.flush()
            
            # Create birthday notification
            notification = Notification(
                member_id=member.id,
                title='🎂 Happy Birthday!',
                message=f"Happy Birthday {m['name']}! {random.choice(birthday_messages)}",
                type='birthday',
                is_read=False,
                created_at=datetime.now()
            )
            db.add(notification)
            
            created += 1
            print(f"✅ Created {m['name']} (Age: {m['age']}) with birthday today!")
        
        db.commit()
        
        print("\n" + "="*60)
        print(f"🎉 Added {created} members with birthdays today!")
        print("="*60)
        print("\n📋 Birthday Members:")
        for m in birthday_members:
            print(f"  • {m['name']} ({m['email']}) - {m['age']} years old")
        print("\n🔑 Login Credentials:")
        print("  • Email: [member email] / Password: birthday123")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 GymFlow Birthday Members Seeder")
    print("="*60)
    seed_birthdays()