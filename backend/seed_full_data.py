# backend/seed_full_data.py

"""
Complete seed script with fully populated data
Run with: python seed_full_data.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.models import *
from app.utils.auth import get_password_hash
from datetime import datetime, date, timedelta
import random
import json

# ─── REAL DATA ─────────────────────────────────────────────────────

# Algerian names for members
MEMBER_FIRST_NAMES = [
    "Mohamed", "Ahmed", "Ali", "Karim", "Yacine", "Rachid", "Nabil", "Sofiane",
    "Sami", "Amine", "Khaled", "Hakim", "Djamel", "Mourad", "Said", "Mustapha",
    "Abdelkader", "Abdelhamid", "Adel", "Fouad", "Hassan", "Yazid", "Zinedine",
    "Fatima", "Sarah", "Nadia", "Leila", "Samira", "Karima", "Djamila",
    "Zohra", "Malika", "Yasmine", "Houda", "Nassima", "Meriem", "Kenza",
    "Ines", "Chahrazed", "Sana", "Yasmina", "Nora", "Latifa", "Souad"
]

MEMBER_LAST_NAMES = [
    "Benzema", "Amraoui", "Adel", "Ait", "Amara", "Ammari", "Amrani",
    "Arab", "Arioua", "Bachir", "Bahloul", "Bektache", "Belhadi", "Belhaj",
    "Bensalah", "Benachour", "Benali", "Benhadj", "Benmoussa", "Bennaceur",
    "Bensaid", "Bentaleb", "Benyoucef", "Berbachi", "Berkani", "Bouabdallah",
    "Bouazza", "Bouchakour", "Boukhari", "Boumediene", "Bouras", "Boutaleb",
    "Brahimi", "Chabane", "Dahmani", "Dehbi", "Djebbour", "Djebbar",
    "El-Mansour", "Farhi", "Ferhat", "Gacem", "Guechir", "Hadj"
]

# Real meal data with full details
MEAL_DATA = [
    {"name": "Oatmeal with Berries", "type": "breakfast", "calories": 350, "protein": 12, "carbs": 45, "fat": 8, "items": ["Oats 50g", "Mixed Berries 100g", "Honey 1tbsp", "Almond Milk 200ml"]},
    {"name": "Egg White Omelette", "type": "breakfast", "calories": 280, "protein": 25, "carbs": 5, "fat": 10, "items": ["Egg Whites 4", "Spinach 50g", "Tomatoes 2", "Mushrooms 50g"]},
    {"name": "Avocado Toast", "type": "breakfast", "calories": 320, "protein": 10, "carbs": 30, "fat": 18, "items": ["Whole Grain Bread 2 slices", "Avocado 1/2", "Egg 1", "Red Pepper Flakes"]},
    {"name": "Green Smoothie", "type": "breakfast", "calories": 200, "protein": 8, "carbs": 25, "fat": 5, "items": ["Spinach 50g", "Banana 1", "Green Apple 1", "Ginger"]},
    {"name": "Grilled Chicken Salad", "type": "lunch", "calories": 420, "protein": 35, "carbs": 15, "fat": 18, "items": ["Chicken Breast 150g", "Lettuce", "Avocado 1/2", "Cherry Tomatoes", "Olive Oil 1tbsp"]},
    {"name": "Quinoa Bowl", "type": "lunch", "calories": 450, "protein": 20, "carbs": 55, "fat": 12, "items": ["Quinoa 150g", "Black Beans 100g", "Corn", "Bell Peppers", "Avocado"]},
    {"name": "Tuna Sandwich", "type": "lunch", "calories": 380, "protein": 30, "carbs": 35, "fat": 12, "items": ["Whole Grain Bread 2", "Tuna 100g", "Lettuce", "Tomato", "Light Mayo"]},
    {"name": "Lentil Soup", "type": "lunch", "calories": 300, "protein": 18, "carbs": 40, "fat": 6, "items": ["Lentils 150g", "Carrots", "Celery", "Onions", "Vegetable Broth"]},
    {"name": "Salmon with Vegetables", "type": "dinner", "calories": 480, "protein": 40, "carbs": 20, "fat": 22, "items": ["Salmon 200g", "Asparagus", "Sweet Potato", "Lemon", "Dill"]},
    {"name": "Chicken Breast with Rice", "type": "dinner", "calories": 520, "protein": 45, "carbs": 50, "fat": 10, "items": ["Chicken Breast 200g", "Brown Rice 150g", "Broccoli", "Carrots"]},
    {"name": "Beef Stir-Fry", "type": "dinner", "calories": 500, "protein": 38, "carbs": 35, "fat": 20, "items": ["Beef Strips 150g", "Mixed Vegetables", "Soy Sauce", "Rice 100g"]},
    {"name": "Vegetable Pasta", "type": "dinner", "calories": 400, "protein": 15, "carbs": 60, "fat": 12, "items": ["Whole Wheat Pasta 150g", "Zucchini", "Bell Peppers", "Tomato Sauce", "Parmesan"]},
    {"name": "Greek Yogurt with Nuts", "type": "snack", "calories": 200, "protein": 15, "carbs": 10, "fat": 12, "items": ["Greek Yogurt 200g", "Walnuts 20g", "Honey 1tsp"]},
    {"name": "Protein Shake", "type": "snack", "calories": 150, "protein": 25, "carbs": 5, "fat": 3, "items": ["Whey Protein 30g", "Water 300ml", "Ice"]},
    {"name": "Apple with Peanut Butter", "type": "snack", "calories": 180, "protein": 6, "carbs": 20, "fat": 10, "items": ["Apple 1", "Peanut Butter 1tbsp"]},
    {"name": "Hummus with Veggies", "type": "snack", "calories": 160, "protein": 5, "carbs": 15, "fat": 8, "items": ["Hummus 50g", "Carrot Sticks", "Celery Sticks", "Cucumber"]},
]

# Real exercise data
EXERCISE_DATA = [
    {"name": "Bench Press", "category": "strength", "muscle_groups": ["chest", "shoulders", "triceps"], "sets": "4×10", "reps": "10", "weight": "60 kg", "instructions": "Keep your back flat on the bench, lower the bar to your chest, press up explosively."},
    {"name": "Squats", "category": "strength", "muscle_groups": ["quads", "glutes", "hamstrings"], "sets": "4×12", "reps": "12", "weight": "80 kg", "instructions": "Keep your chest up, drive through your heels, go below parallel."},
    {"name": "Deadlifts", "category": "strength", "muscle_groups": ["back", "hamstrings", "glutes"], "sets": "3×8", "reps": "8", "weight": "100 kg", "instructions": "Keep your back straight, drive through your heels, engage your core."},
    {"name": "Pull-ups", "category": "strength", "muscle_groups": ["back", "biceps"], "sets": "3×8", "reps": "8", "weight": "bodyweight", "instructions": "Start from a dead hang, pull yourself up until your chin clears the bar."},
    {"name": "Dumbbell Curls", "category": "strength", "muscle_groups": ["biceps"], "sets": "3×12", "reps": "12", "weight": "15 kg", "instructions": "Keep your elbows pinned to your sides, curl the dumbbells up with control."},
    {"name": "Tricep Pushdowns", "category": "strength", "muscle_groups": ["triceps"], "sets": "3×12", "reps": "12", "weight": "30 kg", "instructions": "Keep your elbows pinned to your sides, push the bar down to your thighs."},
    {"name": "Shoulder Press", "category": "strength", "muscle_groups": ["shoulders"], "sets": "3×10", "reps": "10", "weight": "40 kg", "instructions": "Press the weight overhead, keep your core tight, don't arch your back."},
    {"name": "Lunges", "category": "strength", "muscle_groups": ["quads", "glutes"], "sets": "3×12", "reps": "12", "weight": "20 kg", "instructions": "Step forward with one leg, lower your hips until both knees are at 90 degrees."},
    {"name": "Planks", "category": "strength", "muscle_groups": ["core", "abs"], "sets": "3×60s", "reps": "60s", "weight": "bodyweight", "instructions": "Keep your body in a straight line, engage your core, don't let your hips sag."},
    {"name": "Russian Twists", "category": "strength", "muscle_groups": ["core", "abs"], "sets": "3×15", "reps": "15", "weight": "5 kg", "instructions": "Sit with your feet off the ground, twist your torso from side to side."},
    {"name": "Treadmill Run", "category": "cardio", "muscle_groups": ["legs", "heart"], "sets": "30 min", "reps": "30 min", "weight": "0", "instructions": "Maintain a steady pace, keep your posture upright, swing your arms naturally."},
    {"name": "Stationary Bike", "category": "cardio", "muscle_groups": ["legs", "heart"], "sets": "20 min", "reps": "20 min", "weight": "0", "instructions": "Keep a steady cadence, adjust resistance for intensity, stay hydrated."},
    {"name": "Rowing Machine", "category": "cardio", "muscle_groups": ["back", "legs", "heart"], "sets": "15 min", "reps": "15 min", "weight": "0", "instructions": "Drive with your legs, lean back slightly, pull with your arms."},
    {"name": "Battle Ropes", "category": "cardio", "muscle_groups": ["shoulders", "arms", "core"], "sets": "3×30s", "reps": "30s", "weight": "0", "instructions": "Create waves with the ropes, keep your core tight, breathe steadily."},
]

# Birthday notifications
BIRTHDAY_MESSAGES = [
    "Happy Birthday! Enjoy a free smoothie at our cafe today! 🎉",
    "Happy Birthday! Get 20% off your next personal training session! 🎂",
    "Happy Birthday! Enjoy a free guest pass for a friend! 🎈",
    "Happy Birthday! Here's a free supplement pack waiting for you at the front desk! 🎁",
    "Happy Birthday! Enjoy a free yoga mat with your next purchase! 🧘",
    "Happy Birthday! Get a free protein shake after your workout today! 💪",
    "Happy Birthday! Here's a 15% discount on all gym merchandise! 🛍️",
    "Happy Birthday! Enjoy a free massage session with our therapist! 💆",
]

# Real gym classes
CLASS_DATA = [
    {"name": "HIIT Power", "type": "cardio", "day": "Monday", "time": "06:00", "end_time": "07:00", "capacity": 20, "location": "Studio A", "description": "High intensity interval training for maximum calorie burn."},
    {"name": "Yoga Flow", "type": "yoga", "day": "Monday", "time": "08:00", "end_time": "09:00", "capacity": 15, "location": "Studio B", "description": "Vinyasa flow for flexibility and mindfulness."},
    {"name": "Strength Training", "type": "strength", "day": "Monday", "time": "10:00", "end_time": "11:00", "capacity": 12, "location": "Weight Room", "description": "Full body strength workout with weights."},
    {"name": "Pilates", "type": "yoga", "day": "Tuesday", "time": "12:00", "end_time": "13:00", "capacity": 10, "location": "Studio B", "description": "Core strengthening and body conditioning."},
    {"name": "Boxing Basics", "type": "boxing", "day": "Tuesday", "time": "17:00", "end_time": "18:00", "capacity": 15, "location": "Ring Area", "description": "Learn boxing fundamentals and get a great workout."},
    {"name": "Spin Class", "type": "cardio", "day": "Wednesday", "time": "06:30", "end_time": "07:30", "capacity": 18, "location": "Spin Room", "description": "High energy cycling workout with great music."},
    {"name": "Core & Abs", "type": "strength", "day": "Wednesday", "time": "09:00", "end_time": "10:00", "capacity": 12, "location": "Studio A", "description": "Focused core training for a stronger midsection."},
    {"name": "Zumba", "type": "cardio", "day": "Thursday", "time": "19:00", "end_time": "20:00", "capacity": 20, "location": "Studio B", "description": "Dance-based fitness class that's fun and effective."},
    {"name": "Leg Day", "type": "strength", "day": "Friday", "time": "17:00", "end_time": "18:00", "capacity": 8, "location": "Weight Room", "description": "Intense leg workout for strength and growth."},
    {"name": "CrossFit WOD", "type": "strength", "day": "Saturday", "time": "09:00", "end_time": "10:00", "capacity": 10, "location": "Studio A", "description": "CrossFit style workout of the day."},
    {"name": "Stretching & Recovery", "type": "yoga", "day": "Sunday", "time": "10:00", "end_time": "11:00", "capacity": 15, "location": "Studio B", "description": "Active recovery and stretching session."},
    {"name": "Kettlebell Circuit", "type": "strength", "day": "Sunday", "time": "16:00", "end_time": "17:00", "capacity": 10, "location": "Weight Room", "description": "Full body workout using kettlebells."},
]

# Program templates
PROGRAM_TEMPLATES = [
    {
        "name": "Strength Training Program",
        "description": "Build muscle and increase strength",
        "focus": ["Strength", "Hypertrophy"],
        "weeks": 4,
        "days_per_week": 4,
        "exercises": [0, 1, 2, 3, 4, 5, 6, 7]
    },
    {
        "name": "Weight Loss Program",
        "description": "Burn fat and get lean",
        "focus": ["Cardio", "HIIT"],
        "weeks": 6,
        "days_per_week": 5,
        "exercises": [8, 9, 10, 11, 12, 13]
    },
    {
        "name": "Full Body Workout",
        "description": "Complete full body conditioning",
        "focus": ["Strength", "Endurance"],
        "weeks": 3,
        "days_per_week": 3,
        "exercises": [0, 1, 2, 4, 5, 6, 7, 8, 9]
    },
    {
        "name": "Endurance Program",
        "description": "Build stamina and cardiovascular fitness",
        "focus": ["Endurance", "Cardio"],
        "weeks": 8,
        "days_per_week": 6,
        "exercises": [10, 11, 12, 13, 1, 2]
    },
]


# ─── SEED FUNCTION ──────────────────────────────────────────────

def seed_full_data():
    print("🌱 Starting full data seeding...")
    db = SessionLocal()
    
    try:
        # ─── 1. CHECK IF ADMIN EXISTS ──────────────────────────
        print("🔍 Checking existing admin...")
        existing_admin = db.query(User).filter(User.email == "admin@gymflow.com").first()
        if existing_admin:
            print(f"✅ Admin already exists: admin@gymflow.com / admin123")
            admin = existing_admin
        else:
            print("👤 Creating admin user...")
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
            print("✅ Admin created")

        # ─── 2. CLEAR NON-ADMIN DATA ────────────────────────────
        print("🧹 Clearing existing non-admin data...")
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
        db.query(User).filter(User.role != 'admin').filter(User.id != admin.id).delete()
        db.query(Plan).delete()
        db.query(Equipment).delete()
        db.query(Campaign).delete()
        db.query(ExerciseLibrary).delete()
        db.commit()
        print("✅ Existing non-admin data cleared")

        # ─── 3. CREATE PLANS ────────────────────────────────────
        print("\n📋 Creating plans...")
        plans = [
            Plan(name="Basic Monthly", price=3500, duration_days=30, description="Access to all gym facilities, basic classes included", is_active=True),
            Plan(name="Premium Monthly", price=5500, duration_days=30, description="Full gym access + all classes + personal training sessions", is_active=True),
            Plan(name="Quarterly", price=14000, duration_days=90, description="3 months premium access with 1 free personal training session", is_active=True),
            Plan(name="Semi-Annual", price=26000, duration_days=180, description="6 months premium access + 3 free personal training sessions", is_active=True),
            Plan(name="Yearly", price=48000, duration_days=365, description="Full year access + 6 free personal training sessions + exclusive discounts", is_active=True),
        ]
        for p in plans:
            db.add(p)
        db.flush()
        print(f"✅ Created {len(plans)} plans")

        # ─── 4. CREATE STAFF (COACHES) ─────────────────────────
        print("\n👨‍🏫 Creating staff...")
        coaches = [
            {"name": "Karim Benali", "specialty": "HIIT & CrossFit", "experience": "7 years", "bio": "Former competitive athlete, certified CrossFit trainer"},
            {"name": "Sarah Amrani", "specialty": "Yoga & Pilates", "experience": "5 years", "bio": "Yoga instructor with specialization in Vinyasa and Hatha"},
            {"name": "Yacine Bensalah", "specialty": "Strength & Bodybuilding", "experience": "8 years", "bio": "National bodybuilding champion, powerlifting coach"},
            {"name": "Nadia Bouazza", "specialty": "Boxing & Martial Arts", "experience": "6 years", "bio": "Former boxing champion, certified martial arts instructor"},
            {"name": "Amine Bouchakour", "specialty": "Cardio & Endurance", "experience": "4 years", "bio": "Marathon runner, certified endurance coach"},
        ]
        staff_members = []
        for coach in coaches:
            email = coach["name"].lower().replace(' ', '.') + '@gymflow.com'
            user = User(
                name=coach["name"],
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
                specialty=coach["specialty"],
                bio=coach["bio"],
                experience=coach["experience"],
                hire_date=date.today() - timedelta(days=random.randint(200, 1500)),
                salary=random.randint(25000, 60000),
                rating=random.uniform(4.5, 5.0),
                clients_count=random.randint(8, 25),
                social_links={
                    "instagram": coach["name"].lower().replace(' ', '_'),
                    "linkedin": coach["name"].lower().replace(' ', '_'),
                }
            )
            db.add(staff)
            staff_members.append(staff)
        db.flush()
        print(f"✅ Created {len(staff_members)} staff members")

        # ─── 5. CREATE MEMBERS ──────────────────────────────────
        print("\n👥 Creating members...")
        members = []
        for i in range(30):
            first = random.choice(MEMBER_FIRST_NAMES)
            last = random.choice(MEMBER_LAST_NAMES)
            name = f"{first} {last}"
            gender = random.choice(['male', 'female'])
            age = random.randint(18, 60)
            weight = random.randint(55, 110) if gender == 'male' else random.randint(50, 85)
            height = random.randint(165, 190) if gender == 'male' else random.randint(155, 175)
            
            email = f"{first.lower()}.{last.lower()}{random.randint(1, 99)}@gymflow.com"
            
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
            
            status = random.choices(['active', 'active', 'active', 'inactive'], weights=[75, 20, 4, 1])[0]
            
            member = Member(
                user_id=user.id,
                phone=f"+213{random.choice(['0555','0556','0557','0558','0559','0660','0661','0662','0663','0664'])}{''.join([str(random.randint(0,9)) for _ in range(6)])}",
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
                plan = random.choice(plans)
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
        statuses = ['paid', 'paid', 'paid', 'paid', 'pending', 'overdue']
        for member in members:
            for _ in range(random.randint(2, 6)):
                amount = random.choice([3500, 5500, 7000, 14000, 20000, 25000, 48000])
                payment = Payment(
                    member_id=member.id,
                    amount=amount,
                    status=random.choice(statuses),
                    payment_date=date.today() - timedelta(days=random.randint(1, 120)),
                    notes=random.choice(['', 'Monthly subscription', 'Renewal', 'Annual payment']),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 100))
                )
                db.add(payment)
                payments.append(payment)
        db.flush()
        print(f"✅ Created {len(payments)} payments")

        # ─── 8. CREATE ATTENDANCE ──────────────────────────────
        print("\n📊 Creating attendance...")
        attendance_records = []
        for member in members:
            for _ in range(random.randint(5, 30)):
                checkin_date = date.today() - timedelta(days=random.randint(1, 90))
                checkin_time = datetime(
                    checkin_date.year, checkin_date.month, checkin_date.day,
                    random.randint(6, 21), random.randint(0, 59)
                )
                attendance = Attendance(member_id=member.id, check_in_time=checkin_time)
                db.add(attendance)
                attendance_records.append(attendance)
        db.flush()
        print(f"✅ Created {len(attendance_records)} attendance records")

        # ─── 9. CREATE CLASSES ──────────────────────────────────
        print("\n🏋️ Creating classes...")
        class_objects = []
        for class_data in CLASS_DATA:
            cls = Class(
                name=class_data["name"],
                coach=random.choice(staff_members).user.name,
                time=class_data["time"],
                end_time=class_data["end_time"],
                day_of_week=class_data["day"],
                max_capacity=class_data["capacity"],
                location=class_data["location"],
                type=class_data["type"],
                description=class_data["description"],
                is_active=True,
                created_at=datetime.now() - timedelta(days=random.randint(1, 180))
            )
            db.add(cls)
            class_objects.append(cls)
        db.flush()
        print(f"✅ Created {len(class_objects)} classes")

        # ─── 10. CREATE CLASS BOOKINGS ──────────────────────────
        print("\n📝 Creating class bookings...")
        bookings = []
        for cls in class_objects:
            num_bookings = random.randint(int(cls.max_capacity * 0.3), int(cls.max_capacity * 0.8))
            available = random.sample(members, min(num_bookings, len(members)))
            for member in available[:num_bookings]:
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
        equipment_data = [
            {"name": "Treadmill Pro", "category": "cardio", "quantity": 5, "price": 2500},
            {"name": "Elliptical Machine", "category": "cardio", "quantity": 4, "price": 2200},
            {"name": "Stationary Bike", "category": "cardio", "quantity": 8, "price": 1500},
            {"name": "Rowing Machine", "category": "cardio", "quantity": 3, "price": 1800},
            {"name": "Smith Machine", "category": "strength", "quantity": 2, "price": 3200},
            {"name": "Squat Rack", "category": "strength", "quantity": 3, "price": 2800},
            {"name": "Bench Press", "category": "strength", "quantity": 4, "price": 1800},
            {"name": "Dumbbell Set (5-50kg)", "category": "free_weights", "quantity": 10, "price": 3500},
            {"name": "Barbell Set", "category": "free_weights", "quantity": 6, "price": 2800},
            {"name": "Kettlebell Set", "category": "free_weights", "quantity": 8, "price": 2000},
            {"name": "Yoga Mats", "category": "stretching", "quantity": 20, "price": 500},
            {"name": "Medicine Balls", "category": "other", "quantity": 6, "price": 300},
        ]
        for eq in equipment_data:
            equipment = Equipment(
                name=eq["name"],
                category=eq["category"],
                quantity=eq["quantity"],
                status=random.choices(['good', 'good', 'good', 'maintenance', 'needs_repair'], weights=[70, 20, 5, 4, 1])[0],
                purchase_date=date.today() - timedelta(days=random.randint(30, 1095)),
                last_maintenance=date.today() - timedelta(days=random.randint(1, 180)),
                price=eq["price"],
                notes=f"{eq['category']} equipment"
            )
            db.add(equipment)
        db.flush()
        print(f"✅ Created {len(equipment_data)} equipment items")

        # ─── 12. CREATE EXERCISE LIBRARY ────────────────────────
        print("\n📚 Creating exercise library...")
        for ex in EXERCISE_DATA:
            exercise = ExerciseLibrary(
                name=ex["name"],
                category=ex["category"],
                muscle_groups=ex["muscle_groups"],
                default_sets=ex["sets"],
                default_reps=ex["reps"],
                instructions=ex["instructions"]
            )
            db.add(exercise)
        db.flush()
        print(f"✅ Created {len(EXERCISE_DATA)} exercise library items")

        # ─── 13. CREATE MEAL PLANS WITH FULL MEALS ─────────────
        print("\n🍎 Creating meal plans with full meals...")
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        meal_plan_count = 0
        
        for member in random.sample(members, min(15, len(members))):
            if random.random() < 0.6:
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
                meal_plan_count += 1
                
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
                    
                    num_meals = random.randint(3, 5)
                    selected_meals = random.sample(MEAL_DATA, min(num_meals, len(MEAL_DATA)))
                    for meal_data in selected_meals:
                        meal = Meal(
                            day_id=meal_day.id,
                            name=meal_data["name"],
                            meal_type=meal_data["type"],
                            meal_time=random.choice(['7:00 AM', '8:00 AM', '12:00 PM', '1:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']),
                            calories=meal_data["calories"] + random.randint(-30, 30),
                            protein=meal_data["protein"] + random.randint(-3, 3),
                            carbs=meal_data["carbs"] + random.randint(-5, 5),
                            fat=meal_data["fat"] + random.randint(-2, 2),
                            items=meal_data["items"],
                            is_custom=random.choice([True, False]),
                            done=random.choice([True, False, True, True]),
                            notes=random.choice(['', 'Delicious!', 'Healthy option', 'Quick meal', 'Perfect portion'])
                        )
                        db.add(meal)
        db.flush()
        print(f"✅ Created {meal_plan_count} meal plans with full meals")

        # ─── 14. CREATE WORKOUT PROGRAMS ────────────────────────
        print("\n📋 Creating workout programs with exercises...")
        program_count = 0
        for member in random.sample(members, min(12, len(members))):
            if random.random() < 0.5:
                template = random.choice(PROGRAM_TEMPLATES)
                program = Program(
                    member_id=member.id,
                    name=template["name"],
                    description=template["description"],
                    start_date=date.today() - timedelta(days=random.randint(1, 30)),
                    end_date=date.today() + timedelta(days=random.randint(14, 60)),
                    coach_name=random.choice(staff_members).user.name,
                    is_active=random.choice([True, True, False]),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 20))
                )
                db.add(program)
                db.flush()
                program_count += 1
                
                for week_num in range(1, template["weeks"] + 1):
                    week = ProgramWeek(
                        program_id=program.id,
                        week_number=week_num,
                        focus=random.choice(template["focus"])
                    )
                    db.add(week)
                    db.flush()
                    
                    selected_days = random.sample(days_of_week, min(template["days_per_week"], 7))
                    for day_name in selected_days:
                        day = ProgramDay(
                            week_id=week.id,
                            day_of_week=day_name,
                            is_rest_day=False
                        )
                        db.add(day)
                        db.flush()
                        
                        num_exercises = random.randint(4, 7)
                        for ex_idx in random.sample(template["exercises"], min(num_exercises, len(template["exercises"]))):
                            ex_data = EXERCISE_DATA[ex_idx] if ex_idx < len(EXERCISE_DATA) else EXERCISE_DATA[0]
                            exercise = Exercise(
                                day_id=day.id,
                                name=ex_data["name"],
                                sets=ex_data["sets"],
                                reps=ex_data["reps"],
                                weight=ex_data["weight"],
                                is_custom=False,
                                done=random.choice([True, False, True, True]),
                                targets=ex_data["muscle_groups"],
                                notes=random.choice(['', 'Focus on form', 'Controlled tempo', 'Good job!'])
                            )
                            db.add(exercise)
        db.flush()
        print(f"✅ Created {program_count} workout programs with exercises")

        # ─── 15. CREATE NOTIFICATIONS ──────────────────────────
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
            "Progress Milestone",
            "Achievement Unlocked",
            "Membership Expiring Soon"
        ]
        
        notifications = []
        for member in members:
            for _ in range(random.randint(3, 8)):
                notif = Notification(
                    member_id=member.id,
                    title=random.choice(notification_titles),
                    message=f"Hello {member.user.name}, important update about your gym membership and classes.",
                    type=random.choice(notification_types),
                    is_read=random.choice([True, True, True, False]),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                db.add(notif)
                notifications.append(notif)
            
            if random.random() < 0.3:
                birthday_msg = random.choice(BIRTHDAY_MESSAGES)
                notif = Notification(
                    member_id=member.id,
                    title="Happy Birthday! 🎂",
                    message=birthday_msg,
                    type="birthday",
                    is_read=False,
                    created_at=datetime.now() - timedelta(days=random.randint(1, 5))
                )
                db.add(notif)
                notifications.append(notif)
        
        db.flush()
        print(f"✅ Created {len(notifications)} notifications (including birthday notifications)")

        # ─── 16. CREATE CAMPAIGNS ──────────────────────────────
        print("\n📣 Creating campaigns...")
        campaign_data = [
            {"title": "Summer Body Challenge", "type": "email", "content": "Get ready for summer! Join our 8-week transformation challenge. Limited spots available.", "audience": "all", "status": "sent"},
            {"title": "New HIIT Classes", "type": "push", "content": "We're excited to announce new HIIT classes starting this week! Book your spot now.", "audience": "active", "status": "sent"},
            {"title": "Weekend Special", "type": "sms", "content": "This weekend only: 20% off personal training sessions. Offer valid Sat-Sun.", "audience": "all", "status": "sent"},
            {"title": "Membership Renewal", "type": "email", "content": "Don't lose your gym access! Renew your membership now and get 2 weeks free.", "audience": "expiring", "status": "sent"},
            {"title": "Yoga Workshop", "type": "email", "content": "Join our special weekend yoga workshop with guest instructor. All levels welcome.", "audience": "active", "status": "draft"},
            {"title": "Nutrition Seminar", "type": "email", "content": "Free nutrition seminar this Saturday! Learn about meal planning and supplements.", "audience": "all", "status": "draft"},
            {"title": "New Year Special", "type": "sms", "content": "Start the year strong! 30% off annual memberships for the first 10 sign-ups.", "audience": "all", "status": "scheduled"},
        ]
        
        for camp in campaign_data:
            campaign = Campaign(
                title=camp["title"],
                type=camp["type"],
                content=camp["content"],
                audience=camp["audience"],
                status=camp["status"],
                sent_count=random.randint(10, 50) if camp["status"] == "sent" else 0,
                opened_count=random.randint(5, 35) if camp["status"] == "sent" else 0,
                clicked_count=random.randint(3, 20) if camp["status"] == "sent" else 0,
                converted_count=random.randint(1, 10) if camp["status"] == "sent" else 0,
                scheduled_date=date.today() + timedelta(days=random.randint(1, 30)) if camp["status"] == "scheduled" else None,
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
        print(f"✅ Created {len(campaign_data)} campaigns")

        # ─── COMMIT ─────────────────────────────────────────────
        db.commit()
        
        print("\n" + "="*60)
        print("🎉 DATABASE FULL SEEDING COMPLETE!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"  • Admin: 1")
        print(f"  • Staff: {len(staff_members)}")
        print(f"  • Members: {len(members)}")
        print(f"  • Plans: {len(plans)}")
        print(f"  • Subscriptions: {len(subscriptions)}")
        print(f"  • Payments: {len(payments)}")
        print(f"  • Attendance Records: {len(attendance_records)}")
        print(f"  • Classes: {len(class_objects)}")
        print(f"  • Class Bookings: {len(bookings)}")
        print(f"  • Equipment: {len(equipment_data)}")
        print(f"  • Notifications: {len(notifications)} (including birthdays)")
        print(f"  • Meal Plans: {meal_plan_count} with full meals")
        print(f"  • Programs: {program_count} with exercises")
        print(f"  • Exercise Library: {len(EXERCISE_DATA)}")
        print(f"  • Campaigns: {len(campaign_data)}")
        print("\n🔑 Login Credentials:")
        print("  • Admin: admin@gymflow.com / admin123")
        print("  • Coach: [coach email] / coach123")
        print(f"  • Members: {len(members)} members / password: member123")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 GymFlow Full Database Seeder")
    print("="*60)
    seed_full_data()