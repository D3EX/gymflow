# backend/app/models/models.py

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from ..database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="client")  # admin, client, coach, receptionist, manager
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Password reset fields
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # Presence
    last_seen_at = Column(DateTime, nullable=True)
    
    # Relationships
    member_profile = relationship("Member", back_populates="user", uselist=False)
    staff_profile = relationship("Staff", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    availability_overrides = relationship("CoachAvailabilityOverride", back_populates="coach")
    coach_breaks = relationship("CoachBreak", back_populates="coach")
    coach_settings = relationship("CoachSettings", back_populates="coach", uselist=False)
    gym = relationship("Gym", back_populates="users")

class Member(Base):
    __tablename__ = "members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    phone = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    status = Column(String, default="active")
    date_of_birth = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="member_profile")
    subscriptions = relationship("Subscription", back_populates="member")
    payments = relationship("Payment", back_populates="member")
    attendance = relationship("Attendance", back_populates="member")
    notifications = relationship("Notification", back_populates="member", cascade="all, delete-orphan")
    programs = relationship("Program", back_populates="member", cascade="all, delete-orphan")
    meal_plans = relationship("MealPlan", back_populates="member", cascade="all, delete-orphan")
    class_bookings = relationship("ClassBooking", back_populates="member", cascade="all, delete-orphan")
    personal_sessions = relationship("PersonalSession", back_populates="client", cascade="all, delete-orphan")


class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    features = Column(JSON, default=[])  # <--- ADD THIS
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
    gym = relationship("Gym")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, default="active")  # active, expired, suspended
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    member = relationship("Member", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")


class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    check_in_time = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    member = relationship("Member", back_populates="attendance")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # paid, pending, overdue
    payment_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    member = relationship("Member", back_populates="payments")


class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)  # NEW
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    audience = Column(String, nullable=False)
    status = Column(String, default="draft")
    sent_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    converted_count = Column(Integer, default=0)
    scheduled_date = Column(DateTime, nullable=True)
    scheduled_time = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))

    gym = relationship("Gym")  # NEW

# ============================================================
# NOTIFICATION MODEL
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Campaign/Offer fields
    cover_image = Column(String, nullable=True)
    action_link = Column(String, nullable=True)
    action_label = Column(String, default="View Offer")
    
    # Relationships
    member = relationship("Member", back_populates="notifications")
    user = relationship("User", back_populates="notifications")


class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    role = Column(String, nullable=False)  # coach, receptionist, manager, admin
    phone = Column(String, nullable=True)        # ADD THIS
    specialty = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    experience = Column(String, nullable=True)
    certifications = Column(Text, nullable=True)
    hire_date = Column(Date, nullable=True)
    salary = Column(Float, default=0)
    avatar = Column(String, nullable=True)
    social_links = Column(JSON, default={})
    achievements = Column(Text, nullable=True)
    clients_count = Column(Integer, default=0)
    rating = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="staff_profile")
class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # cardio, strength, free_weights, stretching, other
    quantity = Column(Integer, default=1)
    status = Column(String, default="good")  # good, maintenance, needs_repair
    purchase_date = Column(Date, nullable=True)
    last_maintenance = Column(Date, nullable=True)
    price = Column(Float, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    gym = relationship("Gym") 

# ============================================================
# COACH MODELS
# ============================================================

class CoachClient(Base):
    __tablename__ = "coach_clients"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="pending")  # pending, approved, declined
    
    # Relationships
    coach = relationship("User", foreign_keys=[coach_id])
    client = relationship("Member", foreign_keys=[client_id])


class CoachAvailability(Base):
    __tablename__ = "coach_availability"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(String(20), nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    is_available = Column(Boolean, default=True)
    
    # Relationships
    coach = relationship("User", foreign_keys=[coach_id])


class CoachAvailabilityOverride(Base):
    __tablename__ = "coach_availability_overrides"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    coach = relationship("User", foreign_keys=[coach_id], back_populates="availability_overrides")


class CoachBreak(Base):
    __tablename__ = "coach_breaks"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(String(20), nullable=True)  # For recurring breaks
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    is_recurring = Column(Boolean, default=True)  # True = weekly pattern, False = one-time
    is_active = Column(Boolean, default=True)
    date = Column(Date, nullable=True)  # For one-time breaks (specific date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    coach = relationship("User", foreign_keys=[coach_id], back_populates="coach_breaks")


class CoachSettings(Base):
    __tablename__ = "coach_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    max_sessions_per_day = Column(Integer, default=8)
    session_duration = Column(Integer, default=60)  # minutes
    buffer_between_sessions = Column(Integer, default=15)  # minutes
    allow_auto_approval = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    coach = relationship("User", foreign_keys=[coach_id], back_populates="coach_settings")


class ClientProgress(Base):
    __tablename__ = "client_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    weight = Column(Float, nullable=True)
    body_fat = Column(Float, nullable=True)
    muscle_mass = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("Member", foreign_keys=[client_id])
    coach = relationship("User", foreign_keys=[coach_id])


# ============================================================
# PERSONAL SESSIONS MODEL - UPDATED
# ============================================================

class PersonalSession(Base):
    __tablename__ = "personal_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    status = Column(String(20), default="pending")
    notes = Column(Text, nullable=True)
    
    # Recurring fields
    is_recurring = Column(Boolean, default=False)
    recurring_group_id = Column(String(50), nullable=True)
    recurring_parent_id = Column(Integer, nullable=True)
    recurring_day_of_week = Column(String(20), nullable=True)
    recurring_end_date = Column(Date, nullable=True)
    
    # NEW FIELDS
    coach_notes = Column(Text, nullable=True)  # Private coach notes
    client_notes = Column(Text, nullable=True)  # Notes visible to client
    feedback = Column(Text, nullable=True)  # Post-session feedback
    rating = Column(Integer, nullable=True)  # 1-5 star rating
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    rescheduled_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    
    # Metadata
    cancelled_by = Column(String(20), nullable=True)  # coach, member, admin
    cancellation_reason = Column(Text, nullable=True)
    reschedule_reason = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Relationships
    client = relationship("Member", foreign_keys=[client_id], back_populates="personal_sessions")
    coach = relationship("User", foreign_keys=[coach_id])


# ============================================================
# PROGRAM MODELS
# ============================================================

class Program(Base):
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    coach_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    member = relationship("Member", back_populates="programs")
    weeks = relationship("ProgramWeek", back_populates="program", cascade="all, delete-orphan")


class ProgramWeek(Base):
    __tablename__ = "program_weeks"
    
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"))
    week_number = Column(Integer, nullable=False)
    focus = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    program = relationship("Program", back_populates="weeks")
    days = relationship("ProgramDay", back_populates="week", cascade="all, delete-orphan")


class ProgramDay(Base):
    __tablename__ = "program_days"
    
    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey("program_weeks.id"))
    day_of_week = Column(String(20), nullable=False)
    is_rest_day = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    week = relationship("ProgramWeek", back_populates="days")
    exercises = relationship("Exercise", back_populates="day", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("program_days.id"))
    name = Column(String(100), nullable=False)
    sets = Column(String(20))
    reps = Column(String(20))
    weight = Column(String(20))
    duration = Column(String(20))
    is_custom = Column(Boolean, default=False)
    done = Column(Boolean, default=False)
    targets = Column(JSON)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    day = relationship("ProgramDay", back_populates="exercises")


class ExerciseLibrary(Base):
    __tablename__ = "exercise_library"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))
    muscle_groups = Column(JSON)
    default_sets = Column(String(20))
    default_reps = Column(String(20))
    instructions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
# NUTRITION MODELS
# ============================================================

class MealPlan(Base):
    __tablename__ = "meal_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    name = Column(String(100))
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    daily_calorie_goal = Column(Integer, default=2000)
    daily_water_goal = Column(Float, default=2.5)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    member = relationship("Member", back_populates="meal_plans")
    days = relationship("MealDay", back_populates="meal_plan", cascade="all, delete-orphan")


class MealDay(Base):
    __tablename__ = "meal_days"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"))
    day_of_week = Column(String(20), nullable=False)
    protein_goal = Column(Float, default=0)
    carbs_goal = Column(Float, default=0)
    fat_goal = Column(Float, default=0)
    water_goal = Column(Float, default=2.5)
    water = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    meal_plan = relationship("MealPlan", back_populates="days")
    meals = relationship("Meal", back_populates="day", cascade="all, delete-orphan")


class Meal(Base):
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("meal_days.id"))
    name = Column(String(100), nullable=False)
    meal_type = Column(String(20))
    meal_time = Column(String(20))
    calories = Column(Integer)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)
    items = Column(JSON)
    is_custom = Column(Boolean, default=False)
    done = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    day = relationship("MealDay", back_populates="meals")


# ============================================================
# SCHEDULE / CLASSES MODELS
# ============================================================

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)  # NEW
    name = Column(String(100), nullable=False)
    coach = Column(String(100), nullable=False)
    time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    day_of_week = Column(String(20), nullable=False)
    max_capacity = Column(Integer, default=20)
    location = Column(String(100))
    type = Column(String(50))
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bookings = relationship("ClassBooking", back_populates="class_item", cascade="all, delete-orphan")
    gym = relationship("Gym")  # NEW
class ClassBooking(Base):
    __tablename__ = "class_bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    member_id = Column(Integer, ForeignKey("members.id"))
    booked_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")
    
    # Relationships
    class_item = relationship("Class", back_populates="bookings")
    member = relationship("Member", back_populates="class_bookings")


class ClientNote(Base):
    __tablename__ = "client_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client = relationship("Member", foreign_keys=[client_id])
    coach = relationship("User", foreign_keys=[coach_id])

# ============================================================
# MESSAGING MODEL
# ============================================================

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    # sender / receiver are both users (coach or client's user)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Denormalised for fast conversation lookup:
    # coach_user_id = the coach's user id
    # member_id     = the member's id (members table)
    coach_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)

    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    attachment_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    member = relationship("Member", foreign_keys=[member_id])


class Gym(Base):
    __tablename__ = "gyms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    subscription_tier = Column(String, default="basic")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="gym")
    __tablename__ = "gyms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    subscription_tier = Column(String, default="basic")  # basic, pro, enterprise
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="gym")