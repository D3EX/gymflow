# backend/app/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - use SQLite for development
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gymflow.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database with default data"""
    from app.models.models import User, Plan, Class
    from app.utils.auth import get_password_hash
    from datetime import datetime
    
    db = SessionLocal()
    try:
        # Create admin user if not exists
        admin = db.query(User).filter(User.email == "admin@gymflow.com").first()
        if not admin:
            admin = User(
                name="Admin",
                email="admin@gymflow.com",
                password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created: admin@gymflow.com / admin123")
        
        # Create default plans if not exists
        default_plans = [
            {"name": "Monthly Basic", "price": 3500, "duration_days": 30, "description": "Basic gym access"},
            {"name": "Monthly Premium", "price": 5500, "duration_days": 30, "description": "Full gym access + classes"},
            {"name": "Quarterly", "price": 14000, "duration_days": 90, "description": "3 months premium access"},
            {"name": "Yearly", "price": 48000, "duration_days": 365, "description": "Full year access"},
        ]
        for p in default_plans:
            plan = db.query(Plan).filter(Plan.name == p["name"]).first()
            if not plan:
                plan = Plan(**p, is_active=True)
                db.add(plan)
        db.commit()
        print("✅ Default plans created")
        
        # Create sample classes if not exists
        sample_classes = [
            {"name": "HIIT Power", "coach": "John Coach", "time": "06:00 AM", "end_time": "07:00 AM", 
             "day_of_week": "Monday", "max_capacity": 20, "location": "Studio A", "type": "cardio"},
            {"name": "Yoga Flow", "coach": "Sarah Trainer", "time": "08:00 AM", "end_time": "09:00 AM",
             "day_of_week": "Monday", "max_capacity": 15, "location": "Studio B", "type": "yoga"},
            {"name": "Strength Training", "coach": "John Coach", "time": "10:00 AM", "end_time": "11:00 AM",
             "day_of_week": "Monday", "max_capacity": 12, "location": "Weight Room", "type": "strength"},
            {"name": "Pilates", "coach": "Sarah Trainer", "time": "12:00 PM", "end_time": "01:00 PM",
             "day_of_week": "Tuesday", "max_capacity": 10, "location": "Studio B", "type": "yoga"},
            {"name": "Boxing Basics", "coach": "David Chen", "time": "05:00 PM", "end_time": "06:00 PM",
             "day_of_week": "Tuesday", "max_capacity": 15, "location": "Ring Area", "type": "boxing"},
            {"name": "Spin Class", "coach": "Emma Watts", "time": "06:30 AM", "end_time": "07:30 AM",
             "day_of_week": "Wednesday", "max_capacity": 18, "location": "Spin Room", "type": "cardio"},
            {"name": "Core & Abs", "coach": "John Coach", "time": "09:00 AM", "end_time": "10:00 AM",
             "day_of_week": "Wednesday", "max_capacity": 12, "location": "Studio A", "type": "strength"},
            {"name": "Zumba", "coach": "Sarah Trainer", "time": "07:00 PM", "end_time": "08:00 PM",
             "day_of_week": "Thursday", "max_capacity": 20, "location": "Studio B", "type": "cardio"},
            {"name": "Leg Day", "coach": "David Chen", "time": "05:00 PM", "end_time": "06:00 PM",
             "day_of_week": "Friday", "max_capacity": 8, "location": "Weight Room", "type": "strength"},
        ]
        for c in sample_classes:
            existing = db.query(Class).filter(
                Class.name == c["name"],
                Class.day_of_week == c["day_of_week"]
            ).first()
            if not existing:
                cls = Class(**c, is_active=True)
                db.add(cls)
        db.commit()
        print("✅ Sample classes created")
        
    except Exception as e:
        print(f"⚠️ Error initializing database: {e}")
    finally:
        db.close()