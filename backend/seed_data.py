"""
seed_data.py
================================================================
Realistic seed / fixture data generator for the Gym Flow backend.

WHERE TO PUT THIS FILE
-----------------------
Drop this file at the root of your `backend/` folder (next to the `app/`
package), so the imports below resolve exactly like your other modules do:

    backend/
      app/
        database.py      -> exposes SessionLocal, engine, Base
        models/models.py -> your SQLAlchemy models
      seed_data.py        <-- this file

RUN IT
------
    cd backend
    python seed_data.py

It is fully idempotent-safe to re-run on a fresh DB, but it does NOT
delete existing data first. If you want a clean slate, drop your DB
file / schema before running, or uncomment the "reset" block below.

WHAT IT DOES
------------
Builds a coherent, believable dataset for a single (well, five, since
the app is multi-tenant-ready) gym(s):

  - 5 gyms
  - Users: admins, coaches/staff, members (18+ total)
  - 10 members with realistic bios, subscriptions tied to real plans
  - 5 plans, subscriptions whose status/dates are logically derived
  - Payments that match subscription/plan prices and follow logically
    from subscription status (active -> paid, expired -> paid/overdue mix)
  - Attendance history correlated with member status (active members
    check in recently and often, expired/suspended members do not)
  - 6 staff profiles (5 coaches + 1 manager), coach-client assignments,
    coach availability, personal training sessions with feedback/ratings
  - Client progress logs that trend sensibly over time
  - Workout programs -> weeks -> days -> exercises (nested, realistic)
  - Exercise library
  - Meal plans -> days -> meals with macros that roughly sum to goals
  - Group fitness classes + bookings that respect max_capacity
  - Equipment inventory
  - Marketing campaigns + notifications generated FROM those campaigns
    and from real payment/subscription events (renewal reminders,
    overdue payment alerts, etc.)
  - Client notes from coaches
  - Coach/member direct messages forming real back-and-forth threads

Every table has at least 5 rows, and every foreign key points at data
that makes sense together (e.g. a payment's amount matches its plan's
price, a "completed" personal session has a rating + feedback, an
"expired" subscription's end_date is in the past, etc).

NOTE ON EMAILS / PASSWORDS
--------------------------
All seeded accounts use the @gymflow.com domain:
  - Admins  -> password: admin123   (admin@gymflow.com is reused/reset,
               since your server already creates it on startup)
  - Coaches/staff -> password: coach123
  - Members -> password: membre123

Passwords are hashed with passlib's bcrypt scheme (the most common setup
for FastAPI + SQLAlchemy auth). If your `app/auth.py` (or wherever you
verify passwords) uses a different scheme, swap out `hash_password()`
below to match it exactly, otherwise these users won't be able to log in.
"""

import random
from datetime import datetime, timedelta, date

from faker import Faker

from app.database import SessionLocal, engine, Base
from app.models import models as m

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash_password(raw: str) -> str:
        return pwd_context.hash(raw)
except ImportError:
    # Fallback so the script still runs even without passlib installed.
    # Replace this with your real hashing function before using these
    # accounts to actually log in.
    def hash_password(raw: str) -> str:
        return f"unhashed::{raw}"

fake = Faker()
Faker.seed(42)
random.seed(42)

TODAY = date.today()
NOW = datetime.utcnow()

ADMIN_PASSWORD = "admin123"
COACH_PASSWORD = "coach123"
MEMBER_PASSWORD = "membre123"

EMAIL_DOMAIN = "gymflow.com"
DEFAULT_ADMIN_EMAIL = f"admin@{EMAIL_DOMAIN}"


def days_ago(n):
    return TODAY - timedelta(days=n)


def days_ago_dt(n):
    return NOW - timedelta(days=n)


def days_from_now(n):
    return TODAY + timedelta(days=n)


# ================================================================
# 0. SETUP
# ================================================================

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def commit_all(objs):
    db.add_all(objs)
    db.commit()
    for o in objs:
        db.refresh(o)
    return objs


# ================================================================
# 1. GYMS
# ================================================================
# Your server already bootstraps a default gym + admin (admin@gymflow.com)
# on startup. We reuse that gym/admin instead of creating duplicates -
# duplicating would violate the unique email constraint on `users` anyway.
# We only create the 4 *additional* satellite gyms fresh.

existing_default_admin = db.query(m.User).filter(m.User.email == DEFAULT_ADMIN_EMAIL).first()

if existing_default_admin and existing_default_admin.gym_id:
    MAIN_GYM = db.query(m.Gym).filter(m.Gym.id == existing_default_admin.gym_id).first()
    print(f"Reusing existing default gym: {MAIN_GYM.name!r} (id={MAIN_GYM.id})")
else:
    MAIN_GYM = db.query(m.Gym).first()
    if MAIN_GYM:
        print(f"No default admin found, but reusing existing gym: {MAIN_GYM.name!r} (id={MAIN_GYM.id})")
    else:
        MAIN_GYM = m.Gym(name="PowerHouse Fitness", owner_email=DEFAULT_ADMIN_EMAIL,
                          subscription_tier="enterprise", is_active=True,
                          created_at=days_ago_dt(400))
        db.add(MAIN_GYM); db.commit(); db.refresh(MAIN_GYM)
        print(f"No existing gym found - created {MAIN_GYM.name!r} (id={MAIN_GYM.id})")

satellite_gyms_data = [
    ("Iron Temple Gym", "owner@irontemple.com", "pro"),
    ("FlexFit Studio", "owner@flexfitstudio.com", "basic"),
    ("Titan Strength Club", "owner@titanstrength.com", "pro"),
    ("UrbanBurn Gym", "owner@urbanburn.com", "basic"),
]
satellite_gyms = [
    m.Gym(name=name, owner_email=email, subscription_tier=tier, is_active=True,
          created_at=days_ago_dt(random.randint(200, 700)))
    for name, email, tier in satellite_gyms_data
]
commit_all(satellite_gyms)
gyms = [MAIN_GYM] + satellite_gyms
print(f"Seeded {len(satellite_gyms)} additional satellite gyms ({len(gyms)} total)")


# ================================================================
# 2. USERS (admins, staff/coaches, members) + STAFF + MEMBER profiles
# ================================================================

users = []
members = []
staff = []

# --- Admins ---
# The first admin (admin@gymflow.com) is the one your server already
# creates on startup - we reuse it here (and reset its password to
# admin123 so it matches the rest of the seeded accounts) rather than
# inserting a duplicate. The second admin is created fresh.
admins = []

if existing_default_admin:
    existing_default_admin.password = hash_password(ADMIN_PASSWORD)
    existing_default_admin.is_active = True
    db.commit()
    db.refresh(existing_default_admin)
    admins.append(existing_default_admin)
    print(f"Reset password for existing default admin: {DEFAULT_ADMIN_EMAIL}")
else:
    u = m.User(
        name="Admin User", email=DEFAULT_ADMIN_EMAIL, password=hash_password(ADMIN_PASSWORD),
        role="admin", gym_id=MAIN_GYM.id, is_active=True,
        created_at=days_ago_dt(400), last_seen_at=days_ago_dt(0),
    )
    db.add(u); db.commit(); db.refresh(u)
    admins.append(u)

second_admin_email = f"marcus.ortega@{EMAIL_DOMAIN}"
existing_second_admin = db.query(m.User).filter(m.User.email == second_admin_email).first()
if existing_second_admin:
    existing_second_admin.password = hash_password(ADMIN_PASSWORD)
    db.commit()
    db.refresh(existing_second_admin)
    admins.append(existing_second_admin)
else:
    u2 = m.User(
        name="Marcus Ortega", email=second_admin_email, password=hash_password(ADMIN_PASSWORD),
        role="admin", gym_id=MAIN_GYM.id, is_active=True,
        created_at=days_ago_dt(random.randint(300, 600)),
        last_seen_at=days_ago_dt(random.randint(0, 2)),
    )
    db.add(u2); db.commit(); db.refresh(u2)
    admins.append(u2)

users.extend(admins)

# --- Staff: 5 coaches + 1 manager/receptionist ---
staff_defs = [
    # name, email, role, specialty, experience, certifications, hire_days_ago, salary, rating, clients_count
    ("Jake Coleman", f"jake.coleman@{EMAIL_DOMAIN}", "coach", "Strength & Powerlifting",
     "8 years", "NASM-CPT, USA Powerlifting Coach", 620, 4200, 4.8, 0),
    ("Elena Vasquez", f"elena.vasquez@{EMAIL_DOMAIN}", "coach", "HIIT & Weight Loss",
     "5 years", "ACE-CPT, Precision Nutrition L1", 410, 3800, 4.9, 0),
    ("David Kim", f"david.kim@{EMAIL_DOMAIN}", "coach", "Bodybuilding & Hypertrophy",
     "10 years", "ISSA-CPT, NASM-CES", 900, 4500, 4.7, 0),
    ("Priya Nair", f"priya.nair@{EMAIL_DOMAIN}", "coach", "Yoga & Mobility",
     "6 years", "RYT-500, FRC Mobility Specialist", 500, 3600, 4.9, 0),
    ("Marcus Bell", f"marcus.bell@{EMAIL_DOMAIN}", "coach", "CrossFit & Conditioning",
     "7 years", "CrossFit L2, CF-L1", 550, 4000, 4.6, 0),
    ("Olivia Grant", f"olivia.grant@{EMAIL_DOMAIN}", "manager", None,
     "4 years", None, 700, 3400, 0, 0),
]
coaches = []
for name, email, role, specialty, exp, certs, hire_days, salary, rating, cc in staff_defs:
    staff_password = COACH_PASSWORD  # used for coaches and other staff roles alike
    existing = db.query(m.User).filter(m.User.email == email).first()
    if existing:
        existing.password = hash_password(staff_password)
        db.commit()
        db.refresh(existing)
        u = existing
    else:
        u = m.User(
            name=name, email=email, password=hash_password(staff_password),
            role=role, gym_id=MAIN_GYM.id, is_active=True,
            created_at=days_ago_dt(hire_days + 5),
            last_seen_at=days_ago_dt(random.randint(0, 3)),
        )
        db.add(u)
        db.commit()
        db.refresh(u)
    users.append(u)

    existing_staff_profile = db.query(m.Staff).filter(m.Staff.user_id == u.id).first()
    if existing_staff_profile:
        s = existing_staff_profile
        if role == "coach":
            coaches.append((u, s))
        continue  # already has a Staff row from a prior run - don't duplicate

    s = m.Staff(
        user_id=u.id, role=role, phone=fake.phone_number(),
        specialty=specialty, bio=(fake.paragraph(nb_sentences=3) if specialty else "Keeps the gym running smoothly day to day."),
        experience=exp, certifications=certs,
        hire_date=days_ago(hire_days), salary=salary,
        avatar=None,
        social_links={"instagram": f"@{name.split()[0].lower()}fit", "linkedin": None},
        achievements=(fake.sentence(nb_words=10) if role == "coach" else None),
        clients_count=cc, rating=rating,
        created_at=days_ago_dt(hire_days),
    )
    staff.append(s)
    if role == "coach":
        coaches.append((u, s))

commit_all(staff)
print(f"Seeded {len(users)} staff/admin users and {len(staff)} staff profiles ({len(coaches)} coaches)")


# --- Members: 10 members with realistic demographics ---
member_defs = [
    # name, email, gender, age, weight_kg, height_cm, status, signup_days_ago
    ("Ryan Mitchell", f"ryan.mitchell@{EMAIL_DOMAIN}", "male", 28, 82.5, 180, "active", 260),
    ("Sophia Turner", f"sophia.turner@{EMAIL_DOMAIN}", "female", 34, 63.0, 165, "active", 400),
    ("Daniel Brooks", f"daniel.brooks@{EMAIL_DOMAIN}", "male", 41, 95.0, 178, "active", 150),
    ("Grace Lin", f"grace.lin@{EMAIL_DOMAIN}", "female", 24, 58.5, 162, "active", 90),
    ("Marcus Johnson", f"marcus.johnson@{EMAIL_DOMAIN}", "male", 31, 88.0, 183, "suspended", 500),
    ("Amelia Rossi", f"amelia.rossi@{EMAIL_DOMAIN}", "female", 29, 61.0, 168, "active", 45),
    ("Tom Fischer", f"tom.fischer@{EMAIL_DOMAIN}", "male", 45, 91.5, 176, "expired", 620),
    ("Nadia Hassan", f"nadia.hassan@{EMAIL_DOMAIN}", "female", 37, 67.0, 170, "active", 210),
    ("Leo Martinez", f"leo.martinez@{EMAIL_DOMAIN}", "male", 22, 75.0, 174, "active", 20),
    ("Hannah Cooper", f"hannah.cooper@{EMAIL_DOMAIN}", "female", 52, 70.0, 163, "expired", 730),
]
for name, email, gender, age, weight, height, status, signup_days in member_defs:
    existing_member_user = db.query(m.User).filter(m.User.email == email).first()
    if existing_member_user:
        existing_member_user.password = hash_password(MEMBER_PASSWORD)
        db.commit()
        db.refresh(existing_member_user)
        u = existing_member_user
        existing_member_profile = db.query(m.Member).filter(m.Member.user_id == u.id).first()
        if existing_member_profile:
            members.append(existing_member_profile)
            continue  # already fully seeded from a prior run
    else:
        u = m.User(
            name=name, email=email, password=hash_password(MEMBER_PASSWORD),
            role="client", gym_id=MAIN_GYM.id, is_active=(status != "expired"),
            created_at=days_ago_dt(signup_days),
            last_seen_at=days_ago_dt(0 if status == "active" else random.randint(15, 60)),
        )
        db.add(u)
        db.commit()
        db.refresh(u)

    dob = date(TODAY.year - age, random.randint(1, 12), random.randint(1, 28))
    mem = m.Member(
        user_id=u.id, phone=fake.phone_number(), age=age, weight=weight, height=height,
        gender=gender, status=status, date_of_birth=dob,
        created_at=days_ago_dt(signup_days),
    )
    members.append(mem)

commit_all(members)
print(f"Seeded {len(members)} members")


# ================================================================
# 3. PLANS
# ================================================================

plans_data = [
    ("Basic Monthly", 29.99, 30, "Gym floor access during standard hours.",
     ["Gym floor access", "Locker room", "1 free fitness assessment"]),
    ("Standard Monthly", 49.99, 30, "Full access plus group classes.",
     ["24/7 gym access", "Unlimited group classes", "Locker room", "Guest pass (1/month)"]),
    ("Premium Monthly", 79.99, 30, "Everything, plus personal training credits.",
     ["24/7 gym access", "Unlimited group classes", "2 PT sessions/month", "Nutrition plan", "Guest pass (2/month)"]),
    ("Standard Annual", 479.99, 365, "Standard plan billed yearly (2 months free).",
     ["24/7 gym access", "Unlimited group classes", "Locker room", "Priority class booking"]),
    ("Premium Annual", 799.99, 365, "Premium plan billed yearly (2 months free).",
     ["24/7 gym access", "Unlimited group classes", "4 PT sessions/month", "Nutrition plan", "Priority booking"]),
]
plans = [
    m.Plan(gym_id=MAIN_GYM.id, name=n, price=p, duration_days=d, description=desc,
           features=feat, is_active=True, created_at=days_ago_dt(random.randint(300, 500)))
    for n, p, d, desc, feat in plans_data
]
commit_all(plans)
PLAN_BASIC, PLAN_STANDARD, PLAN_PREMIUM, PLAN_STD_ANNUAL, PLAN_PREM_ANNUAL = plans
print(f"Seeded {len(plans)} plans")


# ================================================================
# 4. SUBSCRIPTIONS + PAYMENTS (logically linked)
# ================================================================
# Each member gets a subscription history consistent with their `status`:
#   - active members  -> current subscription with end_date in the future, fully paid
#   - expired members -> most recent subscription's end_date is in the past
#   - suspended member -> currently active-dated subscription but marked suspended
#     (e.g. paused for a payment dispute / injury), with an overdue payment

member_plan_assignment = [
    PLAN_STANDARD, PLAN_PREMIUM, PLAN_PREMIUM, PLAN_BASIC, PLAN_STD_ANNUAL,
    PLAN_STANDARD, PLAN_BASIC, PLAN_PREM_ANNUAL, PLAN_BASIC, PLAN_STANDARD,
]

subscriptions = []
payments = []

for mem, plan in zip(members, member_plan_assignment):
    if mem.status == "active":
        start = days_ago(random.randint(5, plan.duration_days - 5))
        end = start + timedelta(days=plan.duration_days)
        sub = m.Subscription(member_id=mem.id, plan_id=plan.id, start_date=start,
                              end_date=end, status="active",
                              created_at=datetime.combine(start, datetime.min.time()))
        subscriptions.append(sub)
        db.add(sub); db.commit(); db.refresh(sub)
        pay = m.Payment(member_id=mem.id, amount=plan.price, status="paid",
                         payment_date=start, notes=f"Payment for {plan.name}",
                         created_at=datetime.combine(start, datetime.min.time()))
        payments.append(pay)

    elif mem.status == "expired":
        # A subscription that ran out and was never renewed
        end = days_ago(random.randint(20, 90))
        start = end - timedelta(days=plan.duration_days)
        sub = m.Subscription(member_id=mem.id, plan_id=plan.id, start_date=start,
                              end_date=end, status="expired",
                              created_at=datetime.combine(start, datetime.min.time()))
        subscriptions.append(sub)
        db.add(sub); db.commit(); db.refresh(sub)
        pay = m.Payment(member_id=mem.id, amount=plan.price, status="paid",
                         payment_date=start, notes=f"Final payment for {plan.name} before lapsing",
                         created_at=datetime.combine(start, datetime.min.time()))
        payments.append(pay)

    elif mem.status == "suspended":
        start = days_ago(random.randint(10, 20))
        end = start + timedelta(days=plan.duration_days)
        sub = m.Subscription(member_id=mem.id, plan_id=plan.id, start_date=start,
                              end_date=end, status="suspended",
                              created_at=datetime.combine(start, datetime.min.time()))
        subscriptions.append(sub)
        db.add(sub); db.commit(); db.refresh(sub)
        # Suspended because the renewal payment is overdue
        pay = m.Payment(member_id=mem.id, amount=plan.price, status="overdue",
                         payment_date=None, notes="Payment overdue - membership suspended pending payment",
                         created_at=datetime.combine(start, datetime.min.time()))
        payments.append(pay)

db.add_all(payments)
db.commit()

# A few members also get an OLDER, already-completed subscription cycle before
# their current one, so there's real renewal history (and a couple of extra
# pending payments to round things out logically).
renewal_members = [members[0], members[1], members[7]]
for mem in renewal_members:
    plan = random.choice([PLAN_BASIC, PLAN_STANDARD])
    end = days_ago(random.randint(100, 200))
    start = end - timedelta(days=plan.duration_days)
    old_sub = m.Subscription(member_id=mem.id, plan_id=plan.id, start_date=start,
                              end_date=end, status="expired",
                              created_at=datetime.combine(start, datetime.min.time()))
    db.add(old_sub); db.commit(); db.refresh(old_sub)
    old_pay = m.Payment(member_id=mem.id, amount=plan.price, status="paid",
                         payment_date=start, notes=f"Payment for {plan.name} (previous cycle)",
                         created_at=datetime.combine(start, datetime.min.time()))
    db.add(old_pay)
    subscriptions.append(old_sub)
    payments.append(old_pay)
db.commit()

# One pending payment: a member whose renewal invoice just went out, not due yet
pending_member = members[3]
pending_pay = m.Payment(member_id=pending_member.id, amount=PLAN_BASIC.price, status="pending",
                         payment_date=days_from_now(3), notes="Upcoming renewal invoice",
                         created_at=days_ago_dt(1))
db.add(pending_pay); db.commit()
payments.append(pending_pay)

print(f"Seeded {len(subscriptions)} subscriptions and {len(payments)} payments")


# ================================================================
# 5. ATTENDANCE (correlated with member status)
# ================================================================
# Active members check in frequently and recently. Suspended/expired
# members have older, sparser (or no recent) check-in history.

attendance_records = []
for mem in members:
    if mem.status == "active":
        num_checkins = random.randint(10, 22)
        for _ in range(num_checkins):
            day_offset = random.randint(0, 29)
            hour = random.choice([6, 7, 8, 12, 17, 18, 19, 20])
            check_in = days_ago_dt(day_offset).replace(hour=hour, minute=random.randint(0, 59))
            attendance_records.append(m.Attendance(member_id=mem.id, check_in_time=check_in))
    elif mem.status == "suspended":
        # Checked in a bit before getting suspended, nothing recent
        for _ in range(random.randint(2, 4)):
            day_offset = random.randint(15, 35)
            check_in = days_ago_dt(day_offset).replace(hour=random.choice([7, 18]))
            attendance_records.append(m.Attendance(member_id=mem.id, check_in_time=check_in))
    else:  # expired
        for _ in range(random.randint(1, 3)):
            day_offset = random.randint(95, 140)
            check_in = days_ago_dt(day_offset).replace(hour=random.choice([9, 19]))
            attendance_records.append(m.Attendance(member_id=mem.id, check_in_time=check_in))

commit_all(attendance_records)
print(f"Seeded {len(attendance_records)} attendance records")


# ================================================================
# 6. EQUIPMENT
# ================================================================

equipment_data = [
    ("Life Fitness Treadmill T5", "cardio", 8, "good", 500, 20, 2899.00),
    ("Concept2 RowErg", "cardio", 4, "good", 420, 45, 999.00),
    ("Olympic Barbell 20kg", "free_weights", 12, "good", 600, 90, 189.00),
    ("Rubber Bumper Plates Set", "free_weights", 10, "maintenance", 600, 180, 1200.00),
    ("Smith Machine", "strength", 2, "good", 700, 60, 3499.00),
    ("Cable Crossover Machine", "strength", 2, "needs_repair", 650, 10, 4200.00),
    ("Foam Rollers", "stretching", 15, "good", 200, 200, 25.00),
    ("Assault AirBike", "cardio", 5, "good", 300, 30, 799.00),
]
equipment = [
    m.Equipment(gym_id=MAIN_GYM.id, name=n, category=cat, quantity=qty, status=status,
                purchase_date=days_ago(purchased), last_maintenance=days_ago(maint),
                price=price, notes=None, created_at=days_ago_dt(purchased))
    for n, cat, qty, status, purchased, maint, price in equipment_data
]
commit_all(equipment)
print(f"Seeded {len(equipment)} equipment items")


# ================================================================
# 7. COACH <-> CLIENT ASSIGNMENTS, AVAILABILITY, SETTINGS
# ================================================================

# Assign each active/suspended member to a coach (expired members lose
# their assigned coach access, so we skip them here - logical!)
coach_clients = []
assignable_members = [mm for mm in members if mm.status in ("active", "suspended")]
for i, mem in enumerate(assignable_members):
    coach_user, coach_staff = coaches[i % len(coaches)]
    cc = m.CoachClient(coach_id=coach_user.id, client_id=mem.id,
                        assigned_date=days_ago_dt(random.randint(10, 200)),
                        is_active=True, status="approved")
    coach_clients.append(cc)
db.add_all(coach_clients)
db.commit()

# Bump each coach's clients_count on their Staff profile to match reality
for coach_user, coach_staff in coaches:
    count = sum(1 for cc in coach_clients if cc.coach_id == coach_user.id)
    coach_staff.clients_count = count
db.commit()
print(f"Seeded {len(coach_clients)} coach-client assignments")

# Coach weekly availability - each coach has a few available blocks
availability = []
days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
for coach_user, _ in coaches:
    for d in random.sample(days_of_week, 3):
        availability.append(m.CoachAvailability(
            coach_id=coach_user.id, day_of_week=d,
            start_time="06:00", end_time="14:00", is_available=True,
        ))
commit_all(availability)
print(f"Seeded {len(availability)} coach availability blocks")

# Coach settings - one per coach
coach_settings = [
    m.CoachSettings(coach_id=coach_user.id, max_sessions_per_day=random.choice([6, 8, 10]),
                     session_duration=60, buffer_between_sessions=15,
                     allow_auto_approval=random.choice([True, False]))
    for coach_user, _ in coaches
]
commit_all(coach_settings)
print(f"Seeded {len(coach_settings)} coach settings rows")

# A handful of recurring coach breaks (e.g. lunch) and one-off overrides
coach_breaks = [
    m.CoachBreak(coach_id=coach_user.id, day_of_week="Monday", start_time="12:00",
                 end_time="13:00", is_recurring=True, is_active=True)
    for coach_user, _ in coaches
]
commit_all(coach_breaks)

coach_overrides = [
    m.CoachAvailabilityOverride(coach_id=coach_user.id, date=days_from_now(7 + i),
                                 start_time="09:00", end_time="11:00", is_available=False)
    for i, (coach_user, _) in enumerate(coaches)
]
commit_all(coach_overrides)
print(f"Seeded {len(coach_breaks)} coach breaks and {len(coach_overrides)} availability overrides")


# ================================================================
# 8. PERSONAL TRAINING SESSIONS + CLIENT PROGRESS + CLIENT NOTES
# ================================================================

coach_client_pairs = [(cc.coach_id, cc.client_id) for cc in coach_clients]

# --- Personal sessions: mix of completed (past, with feedback/rating),
#     pending/approved (future), and one cancelled/one rejected for realism
personal_sessions = []
session_statuses_timeline = [
    ("completed", -14), ("completed", -7), ("completed", -3),
    ("approved", 2), ("pending", 5), ("cancelled", -10), ("rejected", -20),
]
for i, (status, offset) in enumerate(session_statuses_timeline):
    coach_id, client_id = coach_client_pairs[i % len(coach_client_pairs)]
    sess_date = days_from_now(offset) if offset > 0 else days_ago(-offset)
    kwargs = dict(
        client_id=client_id, coach_id=coach_id, date=sess_date,
        time="09:00", end_time="10:00", status=status,
        notes="Focus on lower body strength and mobility.",
        created_at=datetime.combine(sess_date, datetime.min.time()) - timedelta(days=3),
    )
    if status == "completed":
        kwargs.update(
            coach_notes="Client showed good form on squats, increased weight by 5kg.",
            client_notes="Felt strong today, knee felt fine.",
            feedback="Great session, hit a new PR on squats!",
            rating=random.choice([4, 5]),
            approved_at=datetime.combine(sess_date, datetime.min.time()) - timedelta(days=2),
            completed_at=datetime.combine(sess_date, datetime.min.time()) + timedelta(hours=10),
        )
    elif status == "approved":
        kwargs.update(approved_at=datetime.combine(sess_date, datetime.min.time()) - timedelta(days=1))
    elif status == "cancelled":
        kwargs.update(
            cancelled_by="member", cancellation_reason="Family emergency, needed to reschedule.",
            cancelled_at=datetime.combine(sess_date, datetime.min.time()) - timedelta(hours=5),
        )
    elif status == "rejected":
        kwargs.update(
            rejection_reason="Coach fully booked that day.",
            rejected_at=datetime.combine(sess_date, datetime.min.time()) - timedelta(days=1),
        )
    personal_sessions.append(m.PersonalSession(**kwargs))

commit_all(personal_sessions)
print(f"Seeded {len(personal_sessions)} personal training sessions")

# --- Client progress: 3 logical checkpoints per tracked client, weight
#     trending down for a "weight loss" style client, mostly stable/up
#     (muscle gain) for others - realistic small deltas
client_progress = []
for coach_id, client_id in coach_client_pairs[:5]:
    mem = next(mm for mm in members if mm.id == client_id)
    base_weight = mem.weight or 75.0
    trend = random.choice([-1, -1, 1])  # most clients here are cutting slightly
    for step, days_back in enumerate([60, 30, 5]):
        weight = round(base_weight + trend * step * random.uniform(0.5, 1.2), 1)
        client_progress.append(m.ClientProgress(
            client_id=client_id, coach_id=coach_id, date=days_ago(days_back),
            weight=weight,
            body_fat=round(random.uniform(14, 26), 1),
            muscle_mass=round(weight * random.uniform(0.4, 0.48), 1),
            notes=random.choice([
                "Good progress, keep up the consistency.",
                "Slight plateau, adjusting macros next block.",
                "Great improvement in strength and body composition.",
            ]),
            created_at=days_ago_dt(days_back),
        ))
commit_all(client_progress)
print(f"Seeded {len(client_progress)} client progress entries")

# --- Client notes (coach's private/pinned notes about clients)
client_notes_data = [
    "Recovering from minor knee strain - avoid heavy leg press for 2 weeks.",
    "Very motivated, aiming for a 100kg deadlift by end of quarter.",
    "Prefers early morning sessions, works night shifts on weekends.",
    "Vegetarian - keep meal plan suggestions plant-based.",
    "Training for a half marathon in 3 months, prioritize conditioning.",
    "Pinned: emergency contact updated, see admin file.",
]
client_notes = []
for i, text in enumerate(client_notes_data):
    coach_id, client_id = coach_client_pairs[i % len(coach_client_pairs)]
    client_notes.append(m.ClientNote(
        client_id=client_id, coach_id=coach_id, text=text,
        pinned=(i == len(client_notes_data) - 1),
        created_at=days_ago_dt(random.randint(1, 60)),
    ))
commit_all(client_notes)
print(f"Seeded {len(client_notes)} client notes")


# ================================================================
# 9. EXERCISE LIBRARY
# ================================================================

exercise_library_data = [
    ("Barbell Back Squat", "legs", ["quads", "glutes", "hamstrings"], "4", "6-8",
     "Keep chest up, brace core, squat to parallel or below."),
    ("Bench Press", "chest", ["chest", "triceps", "shoulders"], "4", "6-10",
     "Retract shoulder blades, controlled descent, drive through feet."),
    ("Deadlift", "back", ["hamstrings", "glutes", "lower back"], "3", "5",
     "Keep bar close to shins, neutral spine throughout the pull."),
    ("Pull-Up", "back", ["lats", "biceps"], "4", "AMRAP",
     "Full range of motion, avoid kipping unless doing CrossFit-style sets."),
    ("Overhead Press", "shoulders", ["shoulders", "triceps", "core"], "4", "8-10",
     "Brace core, press bar in straight line overhead."),
    ("Romanian Deadlift", "hamstrings", ["hamstrings", "glutes"], "3", "10-12",
     "Hinge at hips, slight knee bend, feel stretch in hamstrings."),
    ("Plank", "core", ["core", "shoulders"], "3", "45-60s hold",
     "Keep hips level, avoid sagging or piking."),
    ("Dumbbell Lunges", "legs", ["quads", "glutes"], "3", "12 per leg",
     "Step forward, lower back knee toward floor, drive through front heel."),
]
exercise_library = [
    m.ExerciseLibrary(name=n, category=cat, muscle_groups=mg, default_sets=s,
                       default_reps=r, instructions=instr)
    for n, cat, mg, s, r, instr in exercise_library_data
]
commit_all(exercise_library)
print(f"Seeded {len(exercise_library)} exercise library entries")


# ================================================================
# 10. WORKOUT PROGRAMS -> WEEKS -> DAYS -> EXERCISES
# ================================================================

program_defs = [
    # member_idx, program name, description, coach_name, duration_weeks, focus per week
    (0, "Strength Foundations", "12-week progressive strength program.", "Jake Coleman", 2,
     ["Foundation - Learning Movement Patterns", "Progressive Overload Week 1"]),
    (1, "Fat Loss Accelerator", "High-intensity program for sustainable fat loss.", "Elena Vasquez", 2,
     ["Metabolic Conditioning Block 1", "Metabolic Conditioning Block 2"]),
    (2, "Hypertrophy Block A", "Bodybuilding-style split for muscle growth.", "David Kim", 2,
     ["Upper/Lower Split Week 1", "Upper/Lower Split Week 2"]),
    (3, "Mobility & Movement", "Mobility-focused program to build a resilient base.", "Priya Nair", 2,
     ["Foundational Mobility", "Active Recovery & Flow"]),
    (5, "CrossFit Conditioning", "Functional conditioning inspired by CrossFit methodology.", "Marcus Bell", 2,
     ["Base Conditioning", "Intensity Ramp-Up"]),
]

day_templates = {
    "strength": [
        ("Monday", False, [("Barbell Back Squat", "4", "6-8", "80kg"), ("Plank", "3", "45s", None)]),
        ("Tuesday", True, []),
        ("Wednesday", False, [("Bench Press", "4", "6-10", "60kg"), ("Pull-Up", "4", "AMRAP", None)]),
        ("Thursday", True, []),
        ("Friday", False, [("Deadlift", "3", "5", "100kg"), ("Overhead Press", "4", "8-10", "35kg")]),
    ],
    "fatloss": [
        ("Monday", False, [("Dumbbell Lunges", "3", "12/leg", "12kg"), ("Plank", "3", "60s", None)]),
        ("Tuesday", False, [("Romanian Deadlift", "3", "10-12", "40kg")]),
        ("Wednesday", True, []),
        ("Thursday", False, [("Barbell Back Squat", "3", "10", "50kg"), ("Pull-Up", "3", "AMRAP", None)]),
        ("Friday", False, [("Bench Press", "3", "10-12", "40kg")]),
    ],
}

programs = []
for member_idx, name, desc, coach_name, num_weeks, week_focuses in program_defs:
    mem = members[member_idx]
    template_key = "fatloss" if "Fat Loss" in name or "Conditioning" in name else "strength"
    start = days_ago(random.randint(10, 40))
    end = start + timedelta(weeks=num_weeks * 2)
    prog = m.Program(member_id=mem.id, name=name, description=desc, start_date=start,
                      end_date=end, coach_name=coach_name, is_active=True,
                      created_at=datetime.combine(start, datetime.min.time()))
    db.add(prog); db.commit(); db.refresh(prog)

    for wk_num, focus in enumerate(week_focuses, start=1):
        week = m.ProgramWeek(program_id=prog.id, week_number=wk_num, focus=focus,
                              created_at=datetime.combine(start, datetime.min.time()))
        db.add(week); db.commit(); db.refresh(week)

        for day_name, is_rest, exercises_list in day_templates[template_key]:
            day = m.ProgramDay(week_id=week.id, day_of_week=day_name, is_rest_day=is_rest,
                                created_at=datetime.combine(start, datetime.min.time()))
            db.add(day); db.commit(); db.refresh(day)

            for ex_name, sets, reps, weight in exercises_list:
                lib_entry = next((e for e in exercise_library if e.name == ex_name), None)
                targets = lib_entry.muscle_groups if lib_entry else None
                # First week exercises marked done (completed), second week not yet
                done_flag = (wk_num == 1)
                ex = m.Exercise(day_id=day.id, name=ex_name, sets=sets, reps=reps,
                                 weight=weight, duration=None, is_custom=False,
                                 done=done_flag, targets=targets,
                                 notes=(lib_entry.instructions if lib_entry else None),
                                 created_at=datetime.combine(start, datetime.min.time()))
                db.add(ex)
        db.commit()
    programs.append(prog)

print(f"Seeded {len(programs)} full workout programs (with nested weeks/days/exercises)")


# ================================================================
# 11. MEAL PLANS -> MEAL DAYS -> MEALS
# ================================================================

meal_templates = {
    "breakfast": [
        ("Oats with Berries & Whey", 420, 32, 55, 8, ["Rolled oats", "Whey protein", "Mixed berries", "Almond milk"]),
        ("Greek Yogurt Parfait", 350, 28, 40, 7, ["Greek yogurt", "Granola", "Honey", "Blueberries"]),
        ("Veggie Egg Scramble", 380, 30, 15, 22, ["Eggs", "Spinach", "Bell pepper", "Feta cheese"]),
    ],
    "lunch": [
        ("Grilled Chicken & Rice Bowl", 550, 45, 55, 12, ["Chicken breast", "Jasmine rice", "Broccoli", "Olive oil"]),
        ("Turkey Wrap & Salad", 480, 38, 40, 15, ["Whole wheat wrap", "Turkey breast", "Mixed greens", "Hummus"]),
        ("Salmon Quinoa Bowl", 520, 40, 42, 20, ["Salmon fillet", "Quinoa", "Avocado", "Cherry tomatoes"]),
    ],
    "dinner": [
        ("Lean Beef Stir Fry", 500, 42, 35, 18, ["Lean beef strips", "Mixed vegetables", "Brown rice", "Soy sauce"]),
        ("Baked Cod & Sweet Potato", 460, 38, 40, 10, ["Cod fillet", "Sweet potato", "Asparagus", "Lemon"]),
        ("Tofu Veggie Curry", 440, 24, 45, 16, ["Tofu", "Coconut milk", "Mixed vegetables", "Basmati rice"]),
    ],
    "snack": [
        ("Protein Shake & Banana", 250, 25, 28, 4, ["Whey protein", "Banana", "Almond milk"]),
        ("Almonds & Apple", 200, 6, 22, 11, ["Almonds", "Apple"]),
    ],
}

meal_plan_members = [members[0], members[1], members[2], members[3], members[5]]
meal_plans = []
for mem in meal_plan_members:
    week_start = days_ago(TODAY.weekday())  # most recent Monday
    week_end = week_start + timedelta(days=6)
    calorie_goal = random.choice([2000, 2200, 2400, 1800])
    mp = m.MealPlan(member_id=mem.id, name=f"{mem.user.name.split()[0]}'s Weekly Plan",
                     week_start=week_start, week_end=week_end,
                     daily_calorie_goal=calorie_goal, daily_water_goal=2.5,
                     created_at=datetime.combine(week_start, datetime.min.time()),
                     updated_at=datetime.combine(week_start, datetime.min.time()))
    db.add(mp); db.commit(); db.refresh(mp)

    for i, day_name in enumerate(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]):
        day_date = week_start + timedelta(days=i)
        is_past = day_date <= TODAY
        meal_day = m.MealDay(meal_plan_id=mp.id, day_of_week=day_name,
                              protein_goal=round(calorie_goal * 0.3 / 4, 1),
                              carbs_goal=round(calorie_goal * 0.4 / 4, 1),
                              fat_goal=round(calorie_goal * 0.3 / 9, 1),
                              water_goal=2.5, water=(round(random.uniform(1.5, 2.6), 1) if is_past else 0),
                              created_at=datetime.combine(day_date, datetime.min.time()))
        db.add(meal_day); db.commit(); db.refresh(meal_day)

        for meal_type in ["breakfast", "lunch", "dinner", "snack"]:
            name, cal, prot, carb, fat, items = random.choice(meal_templates[meal_type])
            meal_time = {"breakfast": "08:00", "lunch": "13:00", "dinner": "19:30", "snack": "16:00"}[meal_type]
            meal = m.Meal(day_id=meal_day.id, name=name, meal_type=meal_type, meal_time=meal_time,
                          calories=cal, protein=prot, carbs=carb, fat=fat, items=items,
                          is_custom=False, done=is_past,
                          notes=None, created_at=datetime.combine(day_date, datetime.min.time()))
            db.add(meal)
        db.commit()
    meal_plans.append(mp)

print(f"Seeded {len(meal_plans)} full meal plans (with nested days/meals)")


# ================================================================
# 12. GROUP FITNESS CLASSES + BOOKINGS
# ================================================================

classes_data = [
    ("Sunrise Yoga", "Priya Nair", "06:30", "07:30", "Monday", 15, "Studio A", "yoga",
     "Gentle vinyasa flow to start your day."),
    ("HIIT Blast", "Elena Vasquez", "12:00", "12:45", "Tuesday", 20, "Main Floor", "hiit",
     "High-intensity intervals for max calorie burn."),
    ("CrossFit WOD", "Marcus Bell", "17:30", "18:30", "Wednesday", 12, "CrossFit Box", "crossfit",
     "Workout of the day - scaled options available."),
    ("Powerlifting Fundamentals", "Jake Coleman", "18:00", "19:00", "Thursday", 8, "Strength Room", "strength",
     "Technique-focused squat, bench, deadlift session."),
    ("Zumba Dance Party", "Elena Vasquez", "19:00", "20:00", "Friday", 25, "Studio B", "dance",
     "High-energy dance cardio for all levels."),
    ("Mobility & Recovery", "Priya Nair", "10:00", "10:45", "Saturday", 15, "Studio A", "mobility",
     "Foam rolling, stretching, and breathwork."),
]
classes = [
    m.Class(gym_id=MAIN_GYM.id, name=n, coach=coach, time=t, end_time=et, day_of_week=dow,
            max_capacity=cap, location=loc, type=typ, description=desc, is_active=True,
            created_at=days_ago_dt(random.randint(100, 300)))
    for n, coach, t, et, dow, cap, loc, typ, desc in classes_data
]
commit_all(classes)
print(f"Seeded {len(classes)} group classes")

# Bookings - respect max_capacity, only active members book
class_bookings = []
bookable_members = [mm for mm in members if mm.status == "active"]
for cls in classes:
    num_bookings = min(random.randint(3, 6), cls.max_capacity, len(bookable_members))
    booked_members = random.sample(bookable_members, num_bookings)
    for mem in booked_members:
        class_bookings.append(m.ClassBooking(
            class_id=cls.id, member_id=mem.id,
            booked_at=days_ago_dt(random.randint(0, 6)),
            status=random.choice(["active", "active", "active", "cancelled"]),
        ))
commit_all(class_bookings)
print(f"Seeded {len(class_bookings)} class bookings")


# ================================================================
# 13. CAMPAIGNS
# ================================================================

campaigns_data = [
    ("Summer Shred Challenge", "email", "all", "sent", -20, 3,
     "Join our 6-week Summer Shred Challenge - sign up now for a free assessment!"),
    ("New Year, New You - 20% Off", "email", "expired_members", "sent", -60, 4,
     "We miss you! Come back and get 20% off your first month back."),
    ("Refer a Friend Bonus", "sms", "active_members", "sent", -10, 1,
     "Refer a friend this month and both of you get a free PT session!"),
    ("New CrossFit Class Launch", "push", "all", "scheduled", 5, None,
     "Exciting news - our new CrossFit WOD class launches next week!"),
    ("Payment Reminder Blast", "email", "overdue_members", "draft", None, None,
     "Friendly reminder: your membership payment is overdue. Please update your billing."),
]
campaigns = []
for title, typ, audience, status, sched_offset, sched_hour, content in campaigns_data:
    sched_date = None
    if sched_offset is not None:
        sched_date = days_from_now(sched_offset) if sched_offset > 0 else days_ago(-sched_offset)
    sent = random.randint(150, 400) if status == "sent" else 0
    campaigns.append(m.Campaign(
        gym_id=MAIN_GYM.id, title=title, type=typ, content=content, audience=audience,
        status=status, sent_count=sent,
        opened_count=int(sent * random.uniform(0.3, 0.5)) if sent else 0,
        clicked_count=int(sent * random.uniform(0.08, 0.15)) if sent else 0,
        converted_count=int(sent * random.uniform(0.01, 0.04)) if sent else 0,
        scheduled_date=sched_date, scheduled_time=(f"{sched_hour:02d}:00" if sched_hour else None),
        cover_image=None, created_at=days_ago_dt(random.randint(5, 65)),
        created_by=admins[0].id,
    ))
commit_all(campaigns)
print(f"Seeded {len(campaigns)} campaigns")


# ================================================================
# 14. NOTIFICATIONS (derived from real payments/subscriptions/campaigns)
# ================================================================

notifications = []

# Member-facing: renewal reminders / overdue alerts tied to real payments
overdue_payment = next((p for p in payments if p.status == "overdue"), None)
if overdue_payment:
    notifications.append(m.Notification(
        member_id=overdue_payment.member_id, title="Payment Overdue",
        message=f"Your payment of ${overdue_payment.amount:.2f} is overdue. Please settle it to reactivate your membership.",
        type="warning", is_read=False, created_at=days_ago_dt(2),
    ))

pending_payment = next((p for p in payments if p.status == "pending"), None)
if pending_payment:
    notifications.append(m.Notification(
        member_id=pending_payment.member_id, title="Upcoming Renewal",
        message=f"Your membership renewal of ${pending_payment.amount:.2f} is due on {pending_payment.payment_date}.",
        type="info", is_read=False, created_at=days_ago_dt(1),
    ))

# Notifications generated from the two "sent" marketing campaigns, targeted
# at a few real members each
sent_campaigns = [c for c in campaigns if c.status == "sent"]
for camp in sent_campaigns:
    targets = random.sample(members, 2)
    for mem in targets:
        notifications.append(m.Notification(
            member_id=mem.id, title=camp.title, message=camp.content[:150],
            type="promo", is_read=random.choice([True, False]),
            cover_image=camp.cover_image, action_link="/offers",
            action_label="View Offer", created_at=camp.created_at,
        ))

# Admin-facing notification about a low-stock / needs-repair equipment item
broken_equipment = next((e for e in equipment if e.status == "needs_repair"), None)
if broken_equipment:
    notifications.append(m.Notification(
        user_id=admins[1].id, title="Equipment Needs Attention",
        message=f"{broken_equipment.name} has been flagged as needing repair.",
        type="alert", is_read=False, created_at=days_ago_dt(3),
    ))

# A simple welcome notification for the newest member
newest_member = max(members, key=lambda mm: mm.created_at)
notifications.append(m.Notification(
    member_id=newest_member.id, title="Welcome to PowerHouse Fitness!",
    message="We're thrilled to have you. Check out our class schedule to book your first session.",
    type="info", is_read=True, created_at=newest_member.created_at,
))

commit_all(notifications)
print(f"Seeded {len(notifications)} notifications")


# ================================================================
# 15. MESSAGES (coach <-> member conversation threads)
# ================================================================

messages = []
message_threads = coach_client_pairs[:5]
sample_conversations = [
    [
        ("coach", "Hey! Just checking in - how did the new leg day routine feel?"),
        ("member", "Honestly tough but good! Squats felt heavy but I got all my reps."),
        ("coach", "Nice work. Let's bump the weight slightly next week then."),
        ("member", "Sounds good, see you Thursday!"),
    ],
    [
        ("coach", "Reminder: your session tomorrow is at 9am, still good?"),
        ("member", "Yes, I'll be there!"),
    ],
    [
        ("coach", "How's the meal plan working out for you this week?"),
        ("member", "Pretty well, I'm hitting my protein goal most days."),
        ("coach", "That's great progress, keep it up."),
    ],
]
for i, (coach_id, client_id) in enumerate(message_threads):
    mem = next(mm for mm in members if mm.id == client_id)
    convo = sample_conversations[i % len(sample_conversations)]
    base_time = days_ago_dt(len(convo))
    for j, (sender_role, content) in enumerate(convo):
        sender_id = coach_id if sender_role == "coach" else mem.user_id
        receiver_id = mem.user_id if sender_role == "coach" else coach_id
        messages.append(m.Message(
            sender_id=sender_id, receiver_id=receiver_id,
            coach_user_id=coach_id, member_id=client_id, content=content,
            is_read=(j < len(convo) - 1), is_deleted=False,
            created_at=base_time + timedelta(hours=j * 3),
        ))
commit_all(messages)
print(f"Seeded {len(messages)} messages across {len(message_threads)} conversations")


# ================================================================
# DONE
# ================================================================

db.close()
print("\nSeeding complete! All tables populated with logically-consistent data.")