# backend/app/routers/nutrition.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, timedelta
from ..database import get_db
from ..models.models import User, Member, MealPlan, MealDay, Meal
from ..schemas.schemas import (
    MealPlanCreate, MealPlanUpdate, MealDayCreate, MealCreate,
    MealUpdate, MealPlanOut, MealDayOut, MealOut, WaterUpdate
)
from ..utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/nutrition", tags=["Nutrition"])


# ============================================================
# ADMIN ENDPOINTS (literal paths first)
# ============================================================

@router.get("/", response_model=List[MealPlanOut])
def get_all_meal_plans(
    member_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get all meal plans for members in the admin's gym"""
    query = (
        db.query(MealPlan)
        .join(Member, MealPlan.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
    )
    if member_id:
        # Verify the member belongs to the admin's gym
        member = db.query(Member).join(User, Member.user_id == User.id).filter(
            Member.id == member_id,
            User.gym_id == admin.gym_id
        ).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found in your gym")
        query = query.filter(MealPlan.member_id == member_id)
    return query.order_by(MealPlan.created_at.desc()).all()


# ============================================================
# MEMBER ENDPOINTS - literal "/my*" paths MUST be declared
# before "/{meal_plan_id}" below
# ============================================================

@router.get("/my", response_model=MealPlanOut)
def get_my_meal_plan(
    week_start: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get current member's meal plan for the week with calculated totals"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # If no week_start provided, use current week (Monday to Sunday)
    if not week_start:
        today = date.today()
        week_start_date = today - timedelta(days=today.weekday())
    else:
        week_start_date = date.fromisoformat(week_start)

    meal_plan = db.query(MealPlan).filter(
        MealPlan.member_id == member.id,
        MealPlan.week_start == week_start_date
    ).first()

    if not meal_plan:
        raise HTTPException(status_code=404, detail="No meal plan found for this week")

    # Calculate totals for each day and add them to the day object
    for day in meal_plan.days:
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0

        for meal in day.meals:
            total_calories += meal.calories or 0
            total_protein += meal.protein or 0
            total_carbs += meal.carbs or 0
            total_fat += meal.fat or 0

        # Add calculated fields as attributes that the schema expects
        day.totalCalories = total_calories
        day.protein = total_protein
        day.carbs = total_carbs
        day.fat = total_fat

    return meal_plan


@router.get("/my/current")
def get_my_current_meal_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get quick meal stats for today
    Returns today's meal progress
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"has_meal_plan": False}

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    meal_plan = db.query(MealPlan).filter(
        MealPlan.member_id == member.id,
        MealPlan.week_start == week_start
    ).first()

    if not meal_plan:
        return {"has_meal_plan": False}

    # Get today's day
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_name = day_names[today.weekday()]

    day = db.query(MealDay).filter(
        MealDay.meal_plan_id == meal_plan.id,
        MealDay.day_of_week == today_name
    ).first()

    if not day:
        return {"has_meal_plan": True, "meals_today": 0, "meals_done": 0, "calories_consumed": 0}

    meals = db.query(Meal).filter(Meal.day_id == day.id).all()
    meals_done = sum(1 for m in meals if m.done)
    calories_consumed = sum(m.calories or 0 for m in meals if m.done)

    return {
        "has_meal_plan": True,
        "meals_today": len(meals),
        "meals_done": meals_done,
        "calories_consumed": calories_consumed,
        "calorie_goal": meal_plan.daily_calorie_goal,
        "day": today_name
    }


@router.post("/meal-plans", response_model=MealPlanOut)
def create_meal_plan(
    data: MealPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Create a new meal plan"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Check if meal plan already exists for this week
    existing = db.query(MealPlan).filter(
        MealPlan.member_id == member.id,
        MealPlan.week_start == data.week_start
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Meal plan already exists for this week")

    # Calculate week end (7 days later)
    week_end = data.week_start + timedelta(days=6)

    meal_plan = MealPlan(
        member_id=member.id,
        week_start=data.week_start,
        week_end=week_end,
        daily_calorie_goal=data.daily_calorie_goal or 2000,
        daily_water_goal=data.daily_water_goal or 2.5
    )
    db.add(meal_plan)
    db.commit()
    db.refresh(meal_plan)

    # Create empty days for the week
    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for day_name in days_of_week:
        meal_day = MealDay(
            meal_plan_id=meal_plan.id,
            day_of_week=day_name,
            water_goal=data.daily_water_goal or 2.5
        )
        db.add(meal_day)

    db.commit()
    db.refresh(meal_plan)
    return meal_plan


@router.put("/days/{day_id}/water")
def update_water(
    day_id: int,
    data: WaterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Log water intake for a specific day"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    day = db.query(MealDay).filter(MealDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    # Verify this day belongs to the member's meal plan
    meal_plan = db.query(MealPlan).filter(MealPlan.id == day.meal_plan_id).first()
    if not meal_plan or meal_plan.member_id != member.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this day")

    if data.water < 0:
        raise HTTPException(status_code=400, detail="Water intake cannot be negative")

    day.water = data.water
    db.commit()
    db.refresh(day)

    return {
        "id": day.id,
        "water": day.water,
        "water_goal": day.water_goal
    }


# ============================================================
# MEALS - MEMBER ENDPOINTS
# ============================================================

@router.post("/meals", response_model=MealOut)
def create_meal(
    data: MealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Create a new meal for a day"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Verify the day exists and belongs to the member
    day = db.query(MealDay).filter(MealDay.id == data.day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    # Verify this day belongs to the member's meal plan
    meal_plan = db.query(MealPlan).filter(MealPlan.id == day.meal_plan_id).first()
    if not meal_plan or meal_plan.member_id != member.id:
        raise HTTPException(status_code=403, detail="Not authorized to add meals to this day")

    meal = Meal(
        day_id=day.id,
        name=data.name,
        meal_type=data.meal_type,
        meal_time=data.meal_time,
        calories=data.calories or 0,
        protein=data.protein or 0,
        carbs=data.carbs or 0,
        fat=data.fat or 0,
        items=data.items or [],
        notes=data.notes,
        is_custom=True
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.put("/meals/{meal_id}", response_model=MealOut)
def update_meal(
    meal_id: int,
    data: MealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Update a meal"""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    # Verify the meal belongs to the member
    day = db.query(MealDay).filter(MealDay.id == meal.day_id).first()
    meal_plan = db.query(MealPlan).filter(MealPlan.id == day.meal_plan_id).first()
    member = db.query(Member).filter(Member.id == meal_plan.member_id).first()
    if member.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this meal")

    if data.name is not None:
        meal.name = data.name
    if data.meal_type is not None:
        meal.meal_type = data.meal_type
    if data.meal_time is not None:
        meal.meal_time = data.meal_time
    if data.calories is not None:
        meal.calories = data.calories
    if data.protein is not None:
        meal.protein = data.protein
    if data.carbs is not None:
        meal.carbs = data.carbs
    if data.fat is not None:
        meal.fat = data.fat
    if data.items is not None:
        meal.items = data.items
    if data.notes is not None:
        meal.notes = data.notes

    db.commit()
    db.refresh(meal)
    return meal


@router.put("/meals/{meal_id}/toggle")
def toggle_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Toggle meal done status
    Returns simple response for frontend
    """
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    # Verify the meal belongs to the member
    day = db.query(MealDay).filter(MealDay.id == meal.day_id).first()
    meal_plan = db.query(MealPlan).filter(MealPlan.id == day.meal_plan_id).first()
    member = db.query(Member).filter(Member.id == meal_plan.member_id).first()
    if member.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to toggle this meal")

    meal.done = not meal.done
    db.commit()

    return {
        "success": True,
        "meal_id": meal.id,
        "done": meal.done,
        "message": "Meal marked as done" if meal.done else "Meal unmarked"
    }


@router.delete("/meals/{meal_id}")
def delete_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Delete a meal"""
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    # Verify the meal belongs to the member
    day = db.query(MealDay).filter(MealDay.id == meal.day_id).first()
    meal_plan = db.query(MealPlan).filter(MealPlan.id == day.meal_plan_id).first()
    member = db.query(Member).filter(Member.id == meal_plan.member_id).first()
    if member.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this meal")

    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted"}


# ============================================================
# ADMIN ENDPOINTS (parameterized paths LAST)
# ============================================================

@router.get("/{meal_plan_id}", response_model=MealPlanOut)
def get_meal_plan(
    meal_plan_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get a specific meal plan (must belong to a member in the admin's gym)"""
    meal_plan = (
        db.query(MealPlan)
        .join(Member, MealPlan.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            MealPlan.id == meal_plan_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return meal_plan


@router.delete("/{meal_plan_id}")
def delete_meal_plan(
    meal_plan_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Delete a meal plan (must belong to a member in the admin's gym)"""
    meal_plan = (
        db.query(MealPlan)
        .join(Member, MealPlan.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            MealPlan.id == meal_plan_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")

    db.delete(meal_plan)
    db.commit()
    return {"message": "Meal plan deleted"}