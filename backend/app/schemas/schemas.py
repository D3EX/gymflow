# backend/app/schemas/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date as date_type, datetime
from enum import Enum

# ============================================================
# ENUMS
# ============================================================

class RoleEnum(str, Enum):
    admin = "admin"
    client = "client"

class GenderEnum(str, Enum):
    male = "male"
    female = "female"

class SubscriptionStatusEnum(str, Enum):
    active = "active"
    expired = "expired"
    suspended = "suspended"

class PaymentStatusEnum(str, Enum):
    paid = "paid"
    pending = "pending"
    overdue = "overdue"

# ============================================================
# AUTH SCHEMAS
# ============================================================

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    user_id: int
    status: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ============================================================
# USER SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.client

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# MEMBER SCHEMAS
# ============================================================

class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    gender: Optional[GenderEnum] = None

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    gender: Optional[GenderEnum] = None
    status: Optional[str] = None
    date_of_birth: Optional[date_type] = None

class MemberOut(BaseModel):
    id: int
    user_id: int
    user: Optional[UserOut]
    phone: Optional[str]
    age: Optional[int]
    weight: Optional[float]
    height: Optional[float]
    gender: Optional[str]
    status: Optional[str]
    date_of_birth: Optional[date_type] = None
    created_at: datetime
    user: UserOut
    
    # Calculated fields
    total_checkins: Optional[int] = 0
    checkins_this_month: Optional[int] = 0
    streak: Optional[int] = 0
    days_left: Optional[int] = 0
    membership: Optional[dict] = None

    class Config:
        from_attributes = True

# ============================================================
# PLAN SCHEMAS
# ============================================================

class PlanCreate(BaseModel):
    name: str
    price: float
    duration_days: int
    description: Optional[str] = None
    features: Optional[List[str]] = []

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    duration_days: Optional[int] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None

class PlanOut(BaseModel):
    id: int
    name: str
    price: float
    duration_days: int
    description: Optional[str] = None
    features: List[str] = []  # <--- ADD THIS
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# SUBSCRIPTION SCHEMAS
# ============================================================

class SubscriptionCreate(BaseModel):
    member_id: int
    plan_id: int
    start_date: date_type

class SubscriptionUpdate(BaseModel):
    status: Optional[SubscriptionStatusEnum] = None

class SubscriptionOut(BaseModel):
    id: int
    member_id: int
    plan_id: int
    start_date: date_type
    end_date: date_type
    status: str
    plan: Optional[PlanOut]
    member: Optional[MemberOut]

    class Config:
        from_attributes = True

# ============================================================
# ATTENDANCE SCHEMAS
# ============================================================

class AttendanceCreate(BaseModel):
    member_id: int

class AttendanceOut(BaseModel):
    id: int
    member_id: int
    check_in_time: datetime
    member: Optional[MemberOut]

    class Config:
        from_attributes = True

# ============================================================
# PAYMENT SCHEMAS
# ============================================================

class PaymentCreate(BaseModel):
    member_id: int
    amount: float
    status: PaymentStatusEnum = PaymentStatusEnum.pending
    payment_date: Optional[date_type] = None
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    status: Optional[PaymentStatusEnum] = None
    payment_date: Optional[date_type] = None
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    member_id: int
    amount: float
    status: str
    payment_date: Optional[date_type]
    notes: Optional[str]
    created_at: datetime
    member: Optional[MemberOut]

    class Config:
        from_attributes = True

# ============================================================
# DASHBOARD SCHEMAS
# ============================================================

class DashboardStats(BaseModel):
    total_members: int
    active_subscriptions: int
    expired_subscriptions: int
    monthly_revenue: float
    new_registrations_this_month: int
    todays_attendance: int

# ============================================================
# CAMPAIGN SCHEMAS
# ============================================================

class CampaignCreate(BaseModel):
    title: str
    type: str
    content: str
    audience: str
    scheduled_date: Optional[date_type] = None
    scheduled_time: Optional[str] = None
    cover_image: Optional[str] = None

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    scheduled_date: Optional[date_type] = None
    scheduled_time: Optional[str] = None

class CampaignOut(BaseModel):
    id: int
    title: str
    type: str
    content: str
    audience: str
    status: str
    sent_count: int
    opened_count: int
    clicked_count: int
    converted_count: int
    scheduled_date: Optional[date_type]
    scheduled_time: Optional[str]
    cover_image: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# NOTIFICATION SCHEMAS - ✅ UPDATED WITH NEW FIELDS
# ============================================================

class NotificationCreate(BaseModel):
    member_id: int
    title: str
    message: str
    type: str = "info"
    cover_image: Optional[str] = None      # ✅ NEW - for campaign images
    action_link: Optional[str] = None      # ✅ NEW - for campaign links
    action_label: Optional[str] = "View Offer"  # ✅ NEW - button text

class NotificationOut(BaseModel):
    id: int
    member_id: Optional[int] = None   # None for admin notifications
    user_id: Optional[int] = None     # set for admin notifications
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    cover_image: Optional[str] = None
    action_link: Optional[str] = None
    action_label: Optional[str] = None

    class Config:
        from_attributes = True

# ============================================================
# STAFF SCHEMAS
# ============================================================

class StaffCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    certifications: Optional[str] = None
    hire_date: Optional[date_type] = None
    salary: Optional[float] = None
    avatar: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    achievements: Optional[str] = None
    clients_count: Optional[int] = 0
    rating: Optional[float] = 0

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    certifications: Optional[str] = None
    hire_date: Optional[date_type] = None
    salary: Optional[float] = None
    avatar: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    achievements: Optional[str] = None
    clients_count: Optional[int] = None
    rating: Optional[float] = None

class StaffOut(BaseModel):
    id: int
    user_id: int
    role: str
    phone: Optional[str] = None
    specialty: Optional[str]
    bio: Optional[str]
    experience: Optional[str]
    certifications: Optional[str]
    hire_date: Optional[date_type]
    salary: Optional[float]
    avatar: Optional[str]
    social_links: Optional[dict]
    achievements: Optional[str]
    clients_count: Optional[int]
    rating: Optional[float]
    user: UserOut

    class Config:
        from_attributes = True
# ============================================================
# EQUIPMENT SCHEMAS
# ============================================================

class EquipmentCreate(BaseModel):
    name: str
    category: str
    quantity: int = 1
    status: str = "good"
    purchase_date: Optional[date_type] = None
    last_maintenance: Optional[date_type] = None
    price: float = 0
    notes: Optional[str] = None

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    status: Optional[str] = None
    purchase_date: Optional[date_type] = None
    last_maintenance: Optional[date_type] = None
    price: Optional[float] = None
    notes: Optional[str] = None

class EquipmentOut(BaseModel):
    id: int
    name: str
    category: str
    quantity: int
    status: str
    purchase_date: Optional[date_type]
    last_maintenance: Optional[date_type]
    price: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# NUTRITION SCHEMAS
# ============================================================

class MealCreate(BaseModel):
    day_id: int
    name: str
    meal_type: Optional[str] = None
    meal_time: Optional[str] = None
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    items: Optional[List[str]] = None
    notes: Optional[str] = None

class MealUpdate(BaseModel):
    name: Optional[str] = None
    meal_type: Optional[str] = None
    meal_time: Optional[str] = None
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    items: Optional[List[str]] = None
    notes: Optional[str] = None
    done: Optional[bool] = None

class MealOut(BaseModel):
    id: int
    day_id: int
    name: str
    meal_type: Optional[str]
    meal_time: Optional[str]
    calories: Optional[int]
    protein: Optional[float]
    carbs: Optional[float]
    fat: Optional[float]
    items: Optional[List[str]]
    is_custom: bool
    done: bool
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class MealDayCreate(BaseModel):
    meal_plan_id: int
    day_of_week: str
    water_goal: Optional[float] = 2.5

class MealDayOut(BaseModel):
    id: int
    meal_plan_id: int
    day_of_week: str
    protein_goal: float = 0
    carbs_goal: float = 0
    fat_goal: float = 0
    water_goal: float = 2.5
    water: float = 0
    created_at: datetime
    meals: List[MealOut] = []
    
    totalCalories: Optional[int] = 0
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0
    
    class Config:
        from_attributes = True

class WaterUpdate(BaseModel):
    water: float

class MealPlanCreate(BaseModel):
    week_start: date_type
    daily_calorie_goal: Optional[int] = 2000
    daily_water_goal: Optional[float] = 2.5

class MealPlanUpdate(BaseModel):
    name: Optional[str] = None
    daily_calorie_goal: Optional[int] = None
    daily_water_goal: Optional[float] = None

class MealPlanOut(BaseModel):
    id: int
    member_id: int
    name: Optional[str]
    week_start: date_type
    week_end: date_type
    daily_calorie_goal: int
    daily_water_goal: float = 2.5
    created_at: datetime
    updated_at: datetime
    days: List[MealDayOut] = []

    class Config:
        from_attributes = True

# ============================================================
# PROGRAM SCHEMAS
# ============================================================

class ExerciseCreate(BaseModel):
    day_id: int
    name: str
    sets: Optional[str] = None
    reps: Optional[str] = None
    weight: Optional[str] = None
    duration: Optional[str] = None
    targets: Optional[List[str]] = None
    notes: Optional[str] = None
    is_custom: Optional[bool] = False

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    sets: Optional[str] = None
    reps: Optional[str] = None
    weight: Optional[str] = None
    duration: Optional[str] = None
    targets: Optional[List[str]] = None
    notes: Optional[str] = None
    done: Optional[bool] = None
    is_custom: Optional[bool] = None

class ExerciseOut(BaseModel):
    id: int
    day_id: int
    name: str
    sets: Optional[str]
    reps: Optional[str]
    weight: Optional[str]
    duration: Optional[str]
    is_custom: bool
    done: bool
    targets: Optional[List[str]]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ProgramDayCreate(BaseModel):
    week_id: int
    day_of_week: str
    is_rest_day: Optional[bool] = False

class ProgramDayUpdate(BaseModel):
    is_rest_day: Optional[bool] = None

class ProgramDayOut(BaseModel):
    id: int
    week_id: int
    day_of_week: str
    is_rest_day: bool
    created_at: datetime
    exercises: List[ExerciseOut] = []

    class Config:
        from_attributes = True

class ProgramWeekCreate(BaseModel):
    program_id: int
    week_number: int
    focus: Optional[str] = None

class ProgramWeekUpdate(BaseModel):
    focus: Optional[str] = None

class ProgramWeekOut(BaseModel):
    id: int
    program_id: int
    week_number: int
    focus: Optional[str]
    created_at: datetime
    days: List[ProgramDayOut] = []

    class Config:
        from_attributes = True

class ProgramCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date_type
    end_date: date_type
    coach_name: Optional[str] = None
    client_id: Optional[int] = None  


# Also update ProgramUpdate if needed:
class ProgramUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    coach_name: Optional[str] = None
    is_active: Optional[bool] = None
    client_id: Optional[int] = None  

class ProgramOut(BaseModel):
    id: int
    member_id: Optional[int] = None
    name: str
    description: Optional[str]
    start_date: Optional[date_type]
    end_date: Optional[date_type]
    coach_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    weeks: List[ProgramWeekOut] = []

    class Config:
        from_attributes = True

# ============================================================
# EXERCISE LIBRARY SCHEMAS
# ============================================================

class ExerciseLibraryCreate(BaseModel):
    name: str
    category: Optional[str] = None
    muscle_groups: Optional[List[str]] = None
    default_sets: Optional[str] = None
    default_reps: Optional[str] = None
    instructions: Optional[str] = None

class ExerciseLibraryOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    muscle_groups: Optional[List[str]]
    default_sets: Optional[str]
    default_reps: Optional[str]
    instructions: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# SCHEDULE / CLASSES SCHEMAS
# ============================================================

class ClassCreate(BaseModel):
    name: str
    coach: str
    time: str
    end_time: str
    day_of_week: str
    max_capacity: Optional[int] = 20
    location: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    coach: Optional[str] = None
    time: Optional[str] = None
    end_time: Optional[str] = None
    day_of_week: Optional[str] = None
    max_capacity: Optional[int] = None
    location: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ClassOut(BaseModel):
    id: int
    name: str
    coach: str
    time: str
    end_time: str
    day_of_week: str
    max_capacity: int
    spots_left: Optional[int] = 0
    location: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class ClassBookingCreate(BaseModel):
    class_id: int
    member_id: int

class ClassBookingOut(BaseModel):
    id: int
    class_id: int
    member_id: int
    booked_at: datetime
    status: str
    class_item: Optional[ClassOut] = None

    class Config:
        from_attributes = True
# ============================================================
# COACH SCHEMAS
# ============================================================

class CoachClientCreate(BaseModel):
    coach_id: int
    client_id: int

class CoachClientOut(BaseModel):
    id: int
    coach_id: int
    client_id: int
    assigned_date: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class CoachAvailabilityCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    is_available: bool = True

class CoachAvailabilityUpdate(BaseModel):
    is_available: Optional[bool] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class CoachAvailabilityOut(BaseModel):
    id: int
    coach_id: int
    day_of_week: str
    start_time: str
    end_time: str
    is_available: bool
    
    class Config:
        from_attributes = True


class ClientProgressCreate(BaseModel):
    client_id: int
    date: Optional[date_type] = None
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = None

class ClientProgressOut(BaseModel):
    id: int
    client_id: int
    coach_id: int
    date: date_type
    weight: Optional[float]
    body_fat: Optional[float]
    muscle_mass: Optional[float]
    notes: Optional[str]
    created_at: datetime
    coach_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class CoachMessageSend(BaseModel):
    client_id: int
    message: str


class CoachStatsOut(BaseModel):
    total_clients: int
    total_coaches: int
    upcoming_classes: int
# ============================================================
# MESSAGING SCHEMAS
# ============================================================

class MessageSend(BaseModel):
    """Body for POST /messages/send  (coach or member)"""
    content: str


class MessageEdit(BaseModel):
    """Body for PATCH /messages/{id}"""
    content: str


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    coach_user_id: int
    member_id: int
    content: str
    is_read: bool
    is_deleted: bool = False
    edited_at: Optional[datetime] = None
    attachment_url: Optional[str] = None
    created_at: datetime

    # Enriched sender info
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    """Summary row shown in the coach conversation list."""
    member_id: int
    member_name: str
    member_initials: str
    coach_user_id: int
    last_message: Optional[str] = None
    last_time: Optional[datetime] = None
    unread_count: int = 0
    is_online: bool = False