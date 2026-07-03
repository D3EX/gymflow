# backend/app/main.py
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth, members, attendance, nutrition, programs, payments, 
    schedule, subscriptions, dashboard, staff, equipment, 
    notifications, campaigns, plans, coach, personal_sessions, messages ,super_admin
)
from app.database import engine, Base, init_db, get_db
from app.utils.subscription_expiry_checker import start_expiry_scheduler

# Create all tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and start background schedulers on startup"""
    init_db()
    print("✅ Database initialized with all tables")

    # Start daily subscription expiry checker (runs at 08:00 server time)
    # Also fires once ~5 seconds after startup to catch anything missed
    start_expiry_scheduler(get_db, run_hour=8)
    print("✅ Subscription expiry scheduler started (daily at 08:00)")

    yield
    # Add any shutdown cleanup here if needed

app = FastAPI(
    title="GymFlow API",
    description="Gym Management System API",
    version="1.0.0",
    lifespan=lifespan
)



allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(attendance.router)
app.include_router(nutrition.router)
app.include_router(programs.router)
app.include_router(payments.router)
app.include_router(schedule.router)
app.include_router(subscriptions.router)
app.include_router(dashboard.router)
app.include_router(staff.router)
app.include_router(equipment.router)
app.include_router(notifications.router)
app.include_router(campaigns.router)
app.include_router(plans.router)
app.include_router(coach.router)  # ADD THIS LINE
app.include_router(personal_sessions.router)
app.include_router(messages.router)
# Include the public router for campaigns
app.include_router(campaigns.public_router)
app.include_router(super_admin.router)

@app.get("/")
def root():
    return {"message": "GymFlow API", "status": "running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

@app.get("/api/test")
def test_api():
    return {"message": "API is working!"}