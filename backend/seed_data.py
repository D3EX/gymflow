# backend/seed_data.py - FIXED VERSION

"""
Seed script to populate the database with realistic data.
Run with: python seed_data.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.models import (
    User, Member, Plan, Subscription, Attendance, Payment,
    Staff, Class, ClassBooking, Equipment, Notification,
    Program, ProgramWeek, ProgramDay, Exercise,
    MealPlan, MealDay, Meal, Campaign, ExerciseLibrary
)
from app.utils.auth import get_password_hash
from datetime import datetime, date, timedelta
import random
import json

# ─── REAL DATA ─────────────────────────────────────────────────────

# Algerian names
ALGERIAN_FIRST_NAMES = [
    "Mohamed", "Ahmed", "Ali", "Karim", "Yacine", "Rachid", "Nabil", "Sofiane",
    "Sami", "Amine", "Khaled", "Hakim", "Djamel", "Mourad", "Said", "Mustapha",
    "Abdelkader", "Abdelhamid", "Adel", "Fouad", "Hassan", "Yazid", "Zinedine",
    "Fatima", "Sarah", "Nadia", "Leila", "Samira", "Karima", "Djamila",
    "Zohra", "Malika", "Yasmine", "Houda", "Nassima", "Meriem", "Kenza",
    "Ines", "Chahrazed", "Sana", "Yasmina", "Nora", "Latifa", "Souad"
]

ALGERIAN_LAST_NAMES = [
    "Benzema", "Amraoui", "Adel", "Ait", "Amara", "Ammari", "Amrani",
    "Arab", "Arioua", "Bachir", "Bahloul", "Bektache", "Belhadi", "Belhaj",
    "Bensalah", "Benachour", "Benali", "Benhadj", "Benmoussa", "Bennaceur",
    "Bensaid", "Bentaleb", "Benyoucef", "Berbachi", "Berkani", "Bouabdallah",
    "Bouazza", "Bouchakour", "Boukhari", "Boumediene", "Bouras", "Boutaleb",
    "Brahimi", "Chabane", "Dahmani", "Dehbi", "Djebbour", "Djebbar",
    "El-Mansour", "Farhi", "Ferhat", "Gacem", "Guechir", "Hadj"
]

# Real gym class names
CLASS_NAMES = [
    "HIIT Power", "Yoga Flow", "Strength Training", "Pilates Core",
    "Boxing Basics", "Spin Cycle", "Zumba Party", "Full Body Workout",
    "Leg Day", "Upper Body Strength", "Cardio Blast", "Stretching & Recovery",
    "CrossFit WOD", "Functional Training", "Kettlebell Circuit"
]

# Real coaches
COACHES = [
    {"name": "Karim Benali", "specialty": "HIIT & CrossFit", "experience": "7 years", "bio": "Former competitive athlete, certified CrossFit trainer"},
    {"name": "Sarah Amrani", "specialty": "Yoga & Pilates", "experience": "5 years", "bio": "Yoga instructor with specialization in Vinyasa and Hatha"},
    {"name": "Yacine Bensalah", "specialty": "Strength & Bodybuilding", "experience": "8 years", "bio": "National bodybuilding champion, powerlifting coach"},
    {"name": "Nadia Bouazza", "specialty": "Boxing & Martial Arts", "experience": "6 years", "bio": "Former boxing champion, certified martial arts instructor"},
    {"name": "Amine Bouchakour", "specialty": "Cardio & Endurance", "experience": "4 years", "bio": "Marathon runner, certified endurance coach"}
]

# Real plans
PLANS = [
    {"name": "Basic Monthly", "price": 3500, "duration_days": 30, "description": "Access to all gym facilities, basic classes included"},
    {"name": "Premium Monthly", "price": 5500, "duration_days": 30, "description": "Full gym access + all classes + personal training sessions"},
    {"name": "Quarterly", "price": 14000, "duration_days": 90, "description": "3 months premium access with 1 free personal training session"},
    {"name": "Semi-Annual", "price": 26000, "duration_days": 180, "description": "6 months premium access + 3 free personal training sessions"},
    {"name": "Yearly", "price": 48000, "duration_days": 365, "description": "Full year access + 6 free personal training sessions + exclusive discounts"}
]

# Equipment
EQUIPMENT = [
    {"name": "Treadmill Pro", "category": "cardio", "quantity": 5, "status": "good", "price": 2500},
    {"name": "Elliptical Machine", "category": "cardio", "quantity": 4, "status": "good", "price": 2200},
    {"name": "Stationary Bike", "category": "cardio", "quantity": 8, "status": "good", "price": 1500},
    {"name": "Rowing Machine", "category": "cardio", "quantity": 3, "status": "good", "price": 1800},
    {"name": "Smith Machine", "category": "strength", "quantity": 2, "status": "good", "price": 3200},
    {"name": "Squat Rack", "category": "strength", "quantity": 3, "status": "good", "price": 2800},
    {"name": "Bench Press", "category": "strength", "quantity": 4, "status": "good", "price": 1800},
    {"name": "Dumbbell Set (5-50kg)", "category": "free_weights", "quantity": 10, "status": "good", "price": 3500},
    {"name": "Barbell Set", "category": "free_weights", "quantity": 6, "status": "good", "price": 2800},
    {"name": "Kettlebell Set", "category": "free_weights", "quantity": 8, "status": "good", "price": 2000},
    {"name": "Yoga Mats", "category": "stretching", "quantity": 20, "status": "good", "price": 500},
    {"name": "Medicine Balls", "category": "other", "quantity": 6, "status": "good", "price": 300}
]

# Exercise Library
EXERCISES = [
    {"name": "Bench Press", "category": "strength", "muscle_groups": ["chest", "shoulders", "triceps"], "default_sets": "4×10", "default_reps": "10"},
    {"name": "Squats", "category": "strength", "muscle_groups": ["quads", "glutes", "hamstrings"], "default_sets": "4×12", "default_reps": "12"},
    {"name": "Deadlifts", "category": "strength", "muscle_groups": ["back", "hamstrings", "glutes"], "default_sets": "3×8", "default_reps": "8"},
    {"name": "Pull-ups", "category": "strength", "muscle_groups": ["back", "biceps"], "default_sets": "3×8", "default_reps": "8"},
    {"name": "Dumbbell Curls", "category": "strength", "muscle_groups": ["biceps"], "default_sets": "3×12", "default_reps": "12"},
    {"name": "Tricep Pushdowns", "category": "strength", "muscle_groups": ["triceps"], "default_sets": "3×12", "default_reps": "12"},
    {"name": "Shoulder Press", "category": "strength", "muscle_groups": ["shoulders"], "default_sets": "3×10", "default_reps": "10"},
    {"name": "Lunges", "category": "strength", "muscle_groups": ["quads", "glutes"], "default_sets": "3×12", "default_reps": "12"},
    {"name": "Planks", "category": "strength", "muscle_groups": ["core", "abs"], "default_sets": "3×60s", "default_reps": "60s"},
    {"name": "Russian Twists", "category": "strength", "muscle_groups": ["core", "abs"], "default_sets": "3×15", "default_reps": "15"},
    {"name": "Treadmill Run", "category": "cardio", "muscle_groups": ["legs", "heart"], "default_sets": "30 min", "default_reps": "30 min"},
    {"name": "Stationary Bike", "category": "cardio", "muscle_groups": ["legs", "heart"], "default_sets": "20 min", "default_reps": "20 min"},
]

# Meal data
MEALS = [
    {"name": "Oatmeal with Berries", "type": "breakfast", "calories": 350, "protein": 12, "carbs": 45, "fat": 8, "items": ["Oats", "Mixed Berries", "Honey", "Almond Milk"]},
    {"name": "Egg White Omelette", "type": "breakfast", "calories": 280, "protein": 25, "carbs": 5, "fat": 10, "items": ["Egg Whites", "Spinach", "Tomatoes", "Mushrooms"]},
    {"name": "Grilled Chicken Salad", "type": "lunch", "calories": 420, "protein": 35, "carbs": 15, "fat": 18, "items": ["Chicken Breast", "Lettuce", "Avocado", "Cherry Tomatoes", "Olive Oil"]},
    {"name": "Quinoa Bowl", "type": "lunch", "calories": 450, "protein": 20, "carbs": 55, "fat": 12, "items": ["Quinoa", "Black Beans", "Corn", "Bell Peppers", "Avocado"]},
    {"name": "Salmon with Vegetables", "type": "dinner", "calories": 480, "protein": 40, "carbs": 20, "fat": 22, "items": ["Salmon", "Asparagus", "Sweet Potato", "Lemon"]},
    {"name": "Chicken Breast with Rice", "type": "dinner", "calories": 520, "protein": 45, "carbs": 50, "fat": 10, "items": ["Chicken Breast", "Brown Rice", "Broccoli", "Carrots"]},
    {"name": "Greek Yogurt with Nuts", "type": "snack", "calories": 200, "protein": 15, "carbs": 10, "fat": 12, "items": ["Greek Yogurt", "Walnuts", "Honey"]},
    {"name": "Protein Shake", "type": "snack", "calories": 150, "protein": 25, "carbs": 5, "fat": 3, "items": ["Whey Protein", "Water", "Ice"]},
    {"name": "Avocado Toast", "type": "breakfast", "calories": 320, "protein": 10, "carbs": 30, "fat": 18, "items": ["Whole Grain Bread", "Avocado", "Egg", "Red Pepper Flakes"]},
    {"name": "Beef Stir-Fry", "type": "dinner", "calories": 500, "protein": 38, "carbs": 35, "fat": 20, "items": ["Beef Strips", "Mixed Vegetables", "Soy Sauce", "Rice"]},
]

# Campaigns
CAMPAIGNS = [
    {"title": "Summer Body Challenge", "type": "email", "content": "Get ready for summer! Join our 8-week transformation challenge. Limited spots available.", "audience": "all", "status": "sent", "sent_count": 45, "opened_count": 32, "clicked_count": 18},
    {"title": "New HIIT Classes", "type": "push", "content": "We're excited to announce new HIIT classes starting this week! Book your spot now.", "audience": "active", "status": "sent", "sent_count": 30, "opened_count": 25, "clicked_count": 15},
    {"title": "Weekend Special", "type": "sms", "content": "This weekend only: 20% off personal training sessions. Offer valid Sat-Sun.", "audience": "all", "status": "sent", "sent_count": 50, "opened_count": 40, "clicked_count": 22},
    {"title": "Membership Renewal", "type": "email", "content": "Don't lose your gym access! Renew your membership now and get 2 weeks free.", "audience": "expiring", "status": "sent", "sent_count": 15, "opened_count": 12, "clicked_count": 8},
    {"title": "Yoga Workshop", "type": "email", "content": "Join our special weekend yoga workshop with guest instructor. All levels welcome.", "audience": "active", "status": "draft", "sent_count": 0, "opened_count": 0, "clicked_count": 0},
]


# ─── HELPER FUNCTIONS ────────────────────────────────────────────

def get_random_date(start_date, end_date):
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randint(0, days_between)
    return start_date + timedelta(days=random_days)

def get_random_phone():
    prefixes = ['0555', '0556', '0557', '0558', '0559', '0660', '0661', '0662', '0663', '0664']
    return f"+213{random.choice(prefixes)}{''.join([str(random.randint(0, 9)) for _ in range(6)])}"

def get_random_gender():
    return random.choice(['male', 'female'])

def get_random_name():
    first = random.choice(ALGERIAN_FIRST_NAMES)
    last = random.choice(ALGERIAN_LAST_NAMES)
    return f"{first} {last}"

def get_random_email(name):
    domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'gymflow.com']
    clean_name = name.lower().replace(' ', '.')
    return f"{clean_name}{random.randint(1, 99)}@{random.choice(domains)}"


# ─── MAIN SEED FUNCTION ──────────────────────────────────────────

def seed_database():
    print("🌱 Starting database seeding...")
    db = SessionLocal()
    
    try:
        # ─── 1. CHECK IF DATA EXISTS ──────────────────────────────
        print("🔍 Checking existing data...")
        existing_users = db.query(User).count()
        existing_members = db.query(Member).count()
        
        if existing_users > 0 or existing_members > 0:
            print(f"⚠️  Found {existing_users} users and {existing_members} members in the database.")
            response = input("❓  Data already exists. Clear and re-seed? (y/n): ")
            if response.lower() != 'y':
                print("❌ Seeding cancelled.")
                return
            
            # Clear existing data
            print("🧹 Clearing existing data...")
            db.query(ClassBooking).delete()
            db.query(Attendance).delete()
            db.query(Payment).delete()
            db.query(Subscription).delete()
            db.query(Notification).delete()
            db.query(Meal).delete()
            db.query(MealDay).delete()
            db.query(MealPlan).delete()
            db.query(Exercise).delete()
            db.query(ProgramDay).delete()
            db.query(ProgramWeek).delete()
            db.query(Program).delete()
            db.query(Class).delete()
            db.query(Staff).delete()
            db.query(Member).delete()
            db.query(User).filter(User.role != 'admin').delete()
            db.query(Plan).delete()
            db.query(Equipment).delete()
            db.query(Campaign).delete()
            db.query(ExerciseLibrary).delete()
            db.commit()
            print("✅ Existing data cleared")

        # ─── 2. CREATE ADMIN USER ──────────────────────────────
        print("\n👤 Creating admin user...")
        admin = User(
            name="Admin",
            email="admin@gymflow.com",
            password=get_password_hash("admin123"),
            role="admin",
            is_active=True,
            created_at=datetime.now()
        )
        db.add(admin)
        db.flush()
        print(f"✅ Admin created: admin@gymflow.com / admin123")

        # ─── 3. CREATE STAFF (COACHES) ──────────────────────────
        print("\n👨‍🏫 Creating staff members...")
        staff_members = []
        for coach_data in COACHES:
            email = coach_data['name'].lower().replace(' ', '.') + '@gymflow.com'
            user = User(
                name=coach_data['name'],
                email=email,
                password=get_password_hash("coach123"),
                role="client",
                is_active=True,
                created_at=datetime.now() - timedelta(days=random.randint(100, 500))
            )
            db.add(user)
            db.flush()
            
            staff = Staff(
                user_id=user.id,
                role="coach",
                specialty=coach_data['specialty'],
                bio=coach_data['bio'],
                experience=coach_data['experience'],
                hire_date=date.today() - timedelta(days=random.randint(200, 1500)),
                salary=random.randint(25000, 60000),
                rating=random.uniform(4.5, 5.0),
                clients_count=random.randint(8, 25),
                social_links={
                    "instagram": coach_data['name'].lower().replace(' ', '_'),
                    "linkedin": coach_data['name'].lower().replace(' ', '_'),
                }
            )
            db.add(staff)
            staff_members.append(staff)
        db.flush()
        print(f"✅ Created {len(staff_members)} staff members")

        # ─── 4. CREATE PLANS ────────────────────────────────────
        print("\n📋 Creating plans...")
        plan_objects = []
        for plan_data in PLANS:
            plan = Plan(**plan_data, is_active=True)
            db.add(plan)
            plan_objects.append(plan)
        db.flush()
        print(f"✅ Created {len(plan_objects)} plans")

        # ─── 5. CREATE MEMBERS ──────────────────────────────────
        print("\n👥 Creating members...")
        members = []
        for i in range(25):
            name = get_random_name()
            email = get_random_email(name)
            gender = get_random_gender()
            age = random.randint(18, 60)
            weight = random.randint(55, 110) if gender == 'male' else random.randint(50, 85)
            height = random.randint(165, 190) if gender == 'male' else random.randint(155, 175)
            
            user = User(
                name=name,
                email=email,
                password=get_password_hash("member123"),
                role="client",
                is_active=True,
                created_at=datetime.now() - timedelta(days=random.randint(1, 365))
            )
            db.add(user)
            db.flush()
            
            # ✅ FIXED: weights match population (4 items, 4 weights)
            status = random.choices(['active', 'active', 'active', 'inactive'], weights=[75, 20, 4, 1])[0]
            
            member = Member(
                user_id=user.id,
                phone=get_random_phone(),
                age=age,
                weight=weight,
                height=height,
                gender=gender,
                status=status,
                date_of_birth=date.today() - timedelta(days=age*365 + random.randint(1, 365)),
                created_at=user.created_at
            )
            db.add(member)
            members.append(member)
        db.flush()
        print(f"✅ Created {len(members)} members")

        # ─── 6. CREATE SUBSCRIPTIONS ────────────────────────────
        print("\n📅 Creating subscriptions...")
        subscriptions = []
        for member in members:
            if random.random() < 0.85:
                plan = random.choice(plan_objects)
                start_date = date.today() - timedelta(days=random.randint(1, 365))
                end_date = start_date + timedelta(days=plan.duration_days)
                
                status = 'active' if end_date > date.today() else random.choice(['expired', 'suspended'])
                
                sub = Subscription(
                    member_id=member.id,
                    plan_id=plan.id,
                    start_date=start_date,
                    end_date=end_date,
                    status=status,
                    created_at=datetime.now() - timedelta(days=random.randint(1, 100))
                )
                db.add(sub)
                subscriptions.append(sub)
        db.flush()
        print(f"✅ Created {len(subscriptions)} subscriptions")

        # ─── 7. CREATE PAYMENTS ──────────────────────────────────
        print("\n💳 Creating payments...")
        payments = []
        payment_statuses = ['paid', 'paid', 'paid', 'pending', 'overdue']
        for member in members:
            for _ in range(random.randint(2, 6)):
                amount = random.choice([3500, 5500, 7000, 14000, 20000, 25000, 48000])
                status = random.choice(payment_statuses)
                payment_date = date.today() - timedelta(days=random.randint(1, 120))
                
                payment = Payment(
                    member_id=member.id,
                    amount=amount,
                    status=status,
                    payment_date=payment_date,
                    notes=random.choice(['', 'Monthly subscription', 'Renewal', 'Annual payment', 'Late payment fee']),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 100))
                )
                db.add(payment)
                payments.append(payment)
        db.flush()
        print(f"✅ Created {len(payments)} payments")

        # ─── 8. CREATE ATTENDANCE ──────────────────────────────
        print("\n📊 Creating attendance records...")
        attendance_records = []
        for member in members:
            num_checkins = random.randint(5, 30)
            for _ in range(num_checkins):
                checkin_date = get_random_date(
                    date.today() - timedelta(days=90),
                    date.today()
                )
                checkin_time = datetime(
                    checkin_date.year, checkin_date.month, checkin_date.day,
                    random.randint(6, 21), random.randint(0, 59)
                )
                
                attendance = Attendance(
                    member_id=member.id,
                    check_in_time=checkin_time
                )
                db.add(attendance)
                attendance_records.append(attendance)
        db.flush()
        print(f"✅ Created {len(attendance_records)} attendance records")

        # ─── 9. CREATE CLASSES ──────────────────────────────────
        print("\n🏋️ Creating classes...")
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        class_types = ['cardio', 'yoga', 'strength', 'boxing', 'hiit']
        locations = ['Studio A', 'Studio B', 'Weight Room', 'Ring Area', 'Spin Room']
        
        classes = []
        for i in range(12):
            coach = random.choice(staff_members)
            coach_name = coach.user.name
            class_name = random.choice(CLASS_NAMES)
            day = random.choice(days)
            hour = random.randint(6, 20)
            minute = random.choice([0, 30])
            time = f"{hour:02d}:{minute:02d}"
            end_hour = hour + random.randint(1, 2)
            end_time = f"{end_hour:02d}:{minute:02d}"
            
            cls = Class(
                name=class_name,
                coach=coach_name,
                time=time,
                end_time=end_time,
                day_of_week=day,
                max_capacity=random.randint(10, 25),
                location=random.choice(locations),
                type=random.choice(class_types),
                description=f"{class_name} class with {coach_name}. All levels welcome.",
                is_active=True,
                created_at=datetime.now() - timedelta(days=random.randint(1, 180))
            )
            db.add(cls)
            classes.append(cls)
        db.flush()
        print(f"✅ Created {len(classes)} classes")

        # ─── 10. CREATE CLASS BOOKINGS ──────────────────────────
        print("\n📝 Creating class bookings...")
        bookings = []
        for cls in classes:
            num_bookings = random.randint(int(cls.max_capacity * 0.3), int(cls.max_capacity * 0.8))
            available_members = random.sample(members, min(num_bookings, len(members)))
            for member in available_members[:num_bookings]:
                booking = ClassBooking(
                    class_id=cls.id,
                    member_id=member.id,
                    booked_at=datetime.now() - timedelta(days=random.randint(1, 14)),
                    status=random.choices(['active', 'active', 'cancelled'], weights=[80, 15, 5])[0]
                )
                db.add(booking)
                bookings.append(booking)
        db.flush()
        print(f"✅ Created {len(bookings)} class bookings")

        # ─── 11. CREATE EQUIPMENT ──────────────────────────────
        print("\n⚙️ Creating equipment...")
        for eq in EQUIPMENT:
            equipment = Equipment(
                name=eq['name'],
                category=eq['category'],
                quantity=eq['quantity'],
                status=random.choices(['good', 'good', 'good', 'maintenance', 'needs_repair'], weights=[70, 20, 5, 4, 1])[0],
                purchase_date=date.today() - timedelta(days=random.randint(30, 1095)),
                last_maintenance=date.today() - timedelta(days=random.randint(1, 180)),
                price=eq['price'],
                notes=f"{eq['category']} equipment for {eq['name']}"
            )
            db.add(equipment)
        db.flush()
        print(f"✅ Created {len(EQUIPMENT)} equipment items")

        # ─── 12. CREATE NOTIFICATIONS ──────────────────────────
        print("\n🔔 Creating notifications...")
        notification_types = ['info', 'success', 'warning', 'announcement', 'birthday']
        notification_titles = [
            "Welcome to GymFlow!",
            "Payment Received",
            "Class Booking Confirmed",
            "New Schedule Available",
            "Special Offer for You",
            "Membership Update",
            "Class Reminder",
            "Progress Milestone"
        ]
        
        notifications = []
        for member in members:
            for _ in range(random.randint(3, 10)):
                notif = Notification(
                    member_id=member.id,
                    title=random.choice(notification_titles),
                    message=f"Notification for {member.user.name} about your membership and classes.",
                    type=random.choice(notification_types),
                    is_read=random.choice([True, True, True, False]),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                db.add(notif)
                notifications.append(notif)
        db.flush()
        print(f"✅ Created {len(notifications)} notifications")

        # ─── 13. CREATE MEAL PLANS ─────────────────────────────
        print("\n🍎 Creating meal plans...")
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for member in random.sample(members, min(12, len(members))):
            if random.random() < 0.5:
                week_start = date.today() - timedelta(days=random.randint(1, 30))
                week_end = week_start + timedelta(days=6)
                
                meal_plan = MealPlan(
                    member_id=member.id,
                    name=f"{member.user.name}'s Meal Plan",
                    week_start=week_start,
                    week_end=week_end,
                    daily_calorie_goal=random.choice([1800, 2000, 2200, 2500]),
                    daily_water_goal=random.uniform(2.0, 3.5),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 20))
                )
                db.add(meal_plan)
                db.flush()
                
                for day_name in days_of_week:
                    meal_day = MealDay(
                        meal_plan_id=meal_plan.id,
                        day_of_week=day_name,
                        protein_goal=random.randint(100, 180),
                        carbs_goal=random.randint(150, 250),
                        fat_goal=random.randint(50, 80),
                        water_goal=random.uniform(2.0, 3.5),
                        water=random.uniform(0.5, 3.0)
                    )
                    db.add(meal_day)
                    db.flush()
                    
                    for _ in range(random.randint(2, 4)):
                        meal_data = random.choice(MEALS)
                        meal = Meal(
                            day_id=meal_day.id,
                            name=meal_data['name'],
                            meal_type=meal_data['type'],
                            meal_time=random.choice(['7:00 AM', '8:00 AM', '12:00 PM', '1:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']),
                            calories=meal_data['calories'] + random.randint(-30, 30),
                            protein=meal_data['protein'] + random.randint(-3, 3),
                            carbs=meal_data['carbs'] + random.randint(-5, 5),
                            fat=meal_data['fat'] + random.randint(-2, 2),
                            items=meal_data['items'],
                            is_custom=random.choice([True, False]),
                            done=random.choice([True, False]),
                            notes=random.choice(['', 'Delicious!', 'Healthy option', 'Quick meal'])
                        )
                        db.add(meal)
        db.flush()
        print(f"✅ Created meal plans for multiple members")

        # ─── 14. CREATE PROGRAMS ────────────────────────────────
        print("\n📋 Creating workout programs...")
        program_names = ["Strength Training", "Weight Loss", "Muscle Building", "Endurance", "Full Body", "Advanced"]
        
        for member in random.sample(members, min(10, len(members))):
            if random.random() < 0.4:
                program = Program(
                    member_id=member.id,
                    name=random.choice(program_names),
                    description=f"Personalized program for {member.user.name}",
                    start_date=date.today() - timedelta(days=random.randint(1, 60)),
                    end_date=date.today() + timedelta(days=random.randint(1, 60)),
                    coach_name=random.choice(staff_members).user.name,
                    is_active=random.choice([True, False]),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                db.add(program)
                db.flush()
                
                for week_num in range(1, random.randint(2, 5)):
                    week = ProgramWeek(
                        program_id=program.id,
                        week_number=week_num,
                        focus=random.choice(['Strength', 'Cardio', 'Recovery', 'Hypertrophy', 'Power'])
                    )
                    db.add(week)
                    db.flush()
                    
                    for day_name in random.sample(days_of_week, random.randint(3, 5)):
                        day = ProgramDay(
                            week_id=week.id,
                            day_of_week=day_name,
                            is_rest_day=random.choice([True, False])
                        )
                        db.add(day)
                        db.flush()
                        
                        if not day.is_rest_day:
                            for _ in range(random.randint(3, 6)):
                                exercise_data = random.choice(EXERCISES)
                                exercise = Exercise(
                                    day_id=day.id,
                                    name=exercise_data['name'],
                                    sets=f"{random.randint(3, 5)}x{random.choice([8, 10, 12])}",
                                    reps=str(random.randint(8, 15)),
                                    weight=f"{random.randint(10, 80)} kg",
                                    is_custom=random.choice([True, False]),
                                    done=random.choice([True, False]),
                                    targets=exercise_data['muscle_groups'],
                                    notes=random.choice(['', 'Focus on form', 'Controlled tempo', 'Increase weight'])
                                )
                                db.add(exercise)
        db.flush()
        print(f"✅ Created workout programs")

        # ─── 15. CREATE EXERCISE LIBRARY ──────────────────────
        print("\n📚 Creating exercise library...")
        for ex in EXERCISES:
            exercise_lib = ExerciseLibrary(
                name=ex['name'],
                category=ex['category'],
                muscle_groups=ex['muscle_groups'],
                default_sets=ex['default_sets'],
                default_reps=ex['default_reps'],
                instructions=random.choice([
                    "Keep your back straight and core engaged.",
                    "Maintain proper form throughout the movement.",
                    "Controlled tempo with full range of motion.",
                    "Focus on the muscle contraction."
                ])
            )
            db.add(exercise_lib)
        db.flush()
        print(f"✅ Created {len(EXERCISES)} exercise library items")

        # ─── 16. CREATE CAMPAIGNS ──────────────────────────────
        print("\n📣 Creating campaigns...")
        for camp_data in CAMPAIGNS:
            campaign = Campaign(
                title=camp_data['title'],
                type=camp_data['type'],
                content=camp_data['content'],
                audience=camp_data['audience'],
                status=camp_data['status'],
                sent_count=camp_data['sent_count'],
                opened_count=camp_data['opened_count'],
                clicked_count=camp_data['clicked_count'],
                converted_count=random.randint(0, camp_data['clicked_count']),
                scheduled_date=date.today() + timedelta(days=random.randint(1, 30)) if camp_data['status'] == 'draft' else None,
                created_at=datetime.now() - timedelta(days=random.randint(1, 60)),
                created_by=admin.id,
                cover_image=random.choice([
                    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop",
                    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop",
                    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop"
                ])
            )
            db.add(campaign)
        db.flush()
        print(f"✅ Created {len(CAMPAIGNS)} campaigns")

        # ─── COMMIT EVERYTHING ──────────────────────────────────
        db.commit()
        
        print("\n" + "="*60)
        print("🎉 DATABASE SEEDING COMPLETE!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"  • Admin: 1")
        print(f"  • Staff: {len(staff_members)}")
        print(f"  • Members: {len(members)}")
        print(f"  • Plans: {len(plan_objects)}")
        print(f"  • Subscriptions: {len(subscriptions)}")
        print(f"  • Payments: {len(payments)}")
        print(f"  • Attendance Records: {len(attendance_records)}")
        print(f"  • Classes: {len(classes)}")
        print(f"  • Class Bookings: {len(bookings)}")
        print(f"  • Equipment: {len(EQUIPMENT)}")
        print(f"  • Notifications: {len(notifications)}")
        print(f"  • Meal Plans: Created for multiple members")
        print(f"  • Programs: Created for multiple members")
        print(f"  • Exercise Library: {len(EXERCISES)}")
        print(f"  • Campaigns: {len(CAMPAIGNS)}")
        print("\n🔑 Login Credentials:")
        print("  • Admin: admin@gymflow.com / admin123")
        print("  • Coach: [coach email] / coach123")
        print("  • Member: [member email] / member123")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 GymFlow Database Seeder")
    print("="*60)
    seed_database()