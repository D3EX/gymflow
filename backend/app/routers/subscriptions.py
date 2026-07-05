# backend/app/routers/subscriptions.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, timedelta, datetime
from ..database import get_db
from ..models.models import Subscription, Member, Plan, User, Payment, Notification
from ..schemas.schemas import (
    SubscriptionCreate, 
    SubscriptionUpdate, 
    SubscriptionOut, 
    PlanOut,
    MemberOut,
    UserOut
)
from ..utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])

# helper: build MemberOut from a Member ORM object
def _member_out(member):
    return MemberOut(
        id=member.id,
        user_id=member.user_id,
        phone=member.phone,
        age=member.age,
        weight=member.weight,
        height=member.height,
        gender=member.gender,
        status=member.status,
        date_of_birth=member.date_of_birth,
        created_at=member.created_at,
        user=UserOut(
            id=member.user.id,
            name=member.user.name,
            email=member.user.email,
            role=member.user.role,
            created_at=member.user.created_at
        ),
        total_checkins=0,
        checkins_this_month=0,
        streak=0,
        days_left=0,
        membership=None
    )

# helper: build PlanOut from a Plan ORM object
def _plan_out(plan):
    if not plan:
        return None
    return PlanOut(
        id=plan.id,
        name=plan.name,
        price=plan.price,
        duration_days=plan.duration_days,
        description=plan.description,
        created_at=plan.created_at
    )


# ============================================================
# ADMIN ENDPOINTS
# ============================================================

@router.get("/", response_model=List[SubscriptionOut])
def get_subscriptions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get all subscriptions for the admin's gym with optional status filter"""
    query = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
    )
    if status:
        query = query.filter(Subscription.status == status)
    
    subscriptions = query.order_by(Subscription.end_date).all()
    
    result = []
    for sub in subscriptions:
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        member = db.query(Member).filter(Member.id == sub.member_id).first()
        
        plan_id_value = sub.plan_id if sub.plan_id is not None else 0
        
        result.append(SubscriptionOut(
            id=sub.id,
            member_id=sub.member_id,
            plan_id=plan_id_value,
            start_date=sub.start_date,
            end_date=sub.end_date,
            status=sub.status,
            created_at=sub.created_at,
            plan=PlanOut(
                id=plan.id if plan else 0,
                name=plan.name if plan else "Unknown Plan",
                price=plan.price if plan else 0,
                duration_days=plan.duration_days if plan else 0,
                description=plan.description if plan else None,
                created_at=plan.created_at if plan else sub.created_at
            ) if plan else None,
            member=MemberOut(
                id=member.id,
                user_id=member.user_id,
                phone=member.phone,
                age=member.age,
                weight=member.weight,
                height=member.height,
                gender=member.gender,
                status=member.status,
                date_of_birth=member.date_of_birth,
                created_at=member.created_at,
                user=UserOut(
                    id=member.user.id,
                    name=member.user.name,
                    email=member.user.email,
                    role=member.user.role,
                    created_at=member.user.created_at
                ),
                total_checkins=0,
                checkins_this_month=0,
                streak=0,
                days_left=0,
                membership=None
            ) if member else None
        ))
    
    return result


@router.post("/", response_model=SubscriptionOut)
def create_subscription(
    data: SubscriptionCreate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """ADMIN: Create a new subscription for a member in the admin's gym"""
    # Verify member belongs to admin's gym
    member = db.query(Member).join(User, Member.user_id == User.id).filter(
        Member.id == data.member_id,
        User.gym_id == admin.gym_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your gym")
    
    # Verify plan belongs to admin's gym
    plan = db.query(Plan).filter(
        Plan.id == data.plan_id,
        Plan.gym_id == admin.gym_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found in your gym")
    
    existing_active = db.query(Subscription).filter(
        Subscription.member_id == data.member_id,
        Subscription.status == "active"
    ).first()
    if existing_active:
        existing_active.status = "expired"
    
    end_date = data.start_date + timedelta(days=plan.duration_days)
    subscription = Subscription(
        member_id=data.member_id,
        plan_id=data.plan_id,
        start_date=data.start_date,
        end_date=end_date,
        status="active"
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    payment = Payment(
        member_id=data.member_id,
        amount=plan.price,
        status="paid",
        payment_date=date.today(),
        notes=f"Payment for {plan.name} subscription (Start: {data.start_date})"
    )
    db.add(payment)
    db.commit()
    
    notification = Notification(
        member_id=member.id,
        title="New Membership Activated",
        message=f"You have been assigned the '{plan.name}' plan. Valid until {end_date.strftime('%d %B %Y')}.",
        type="success"
    )
    db.add(notification)
    db.commit()
    
    print(f"Subscription notification created for member: {member.id}")
    
    # Re-query member with user relationship loaded
    member = db.query(Member).filter(Member.id == subscription.member_id).first()

    return SubscriptionOut(
        id=subscription.id,
        member_id=subscription.member_id,
        plan_id=subscription.plan_id,
        start_date=subscription.start_date,
        end_date=subscription.end_date,
        status=subscription.status,
        created_at=subscription.created_at,
        plan=_plan_out(plan),
        member=_member_out(member) if member else None
    )


@router.put("/{sub_id}", response_model=SubscriptionOut)
def update_subscription(
    sub_id: int, 
    data: SubscriptionUpdate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """ADMIN: Update a subscription status (must belong to admin's gym)"""
    sub = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            Subscription.id == sub_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    old_status = sub.status
    
    if data.status is not None:
        sub.status = data.status
    
    db.commit()
    db.refresh(sub)
    
    if old_status != sub.status:
        member = db.query(Member).filter(Member.id == sub.member_id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        if member and plan:
            status_messages = {
                "active": f"Your '{plan.name}' membership is now active.",
                "expired": f"Your '{plan.name}' membership has expired.",
                "suspended": f"Your '{plan.name}' membership has been suspended."
            }
            
            notification = Notification(
                member_id=member.id,
                title=f"Membership {sub.status.title()}",
                message=status_messages.get(sub.status, f"Your membership status is now: {sub.status}"),
                type="success" if sub.status == "active" else "warning" if sub.status == "expired" else "info"
            )
            db.add(notification)
            db.commit()
            print(f"Status change notification created for subscription: {sub.id}")
    
    member = db.query(Member).filter(Member.id == sub.member_id).first()
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return SubscriptionOut(
        id=sub.id,
        member_id=sub.member_id,
        plan_id=sub.plan_id,
        start_date=sub.start_date,
        end_date=sub.end_date,
        status=sub.status,
        created_at=sub.created_at,
        plan=_plan_out(plan),
        member=_member_out(member) if member else None
    )


@router.delete("/{sub_id}")
def delete_subscription(
    sub_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """ADMIN: Delete a subscription (must belong to admin's gym)"""
    sub = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            Subscription.id == sub_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    db.delete(sub)
    db.commit()
    return {"message": "Subscription deleted"}


@router.post("/{sub_id}/renew")
def renew_subscription(
    sub_id: int,
    request: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Renew a subscription (must belong to admin's gym)"""
    subscription = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            Subscription.id == sub_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    plan_id = request.get("plan_id")
    if plan_id:
        plan = db.query(Plan).filter(Plan.id == plan_id, Plan.gym_id == admin.gym_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found in your gym")
        subscription.plan_id = plan_id
    else:
        plan = db.query(Plan).filter(Plan.id == subscription.plan_id, Plan.gym_id == admin.gym_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found in your gym")
    
    new_end_date = subscription.end_date + timedelta(days=plan.duration_days)
    subscription.end_date = new_end_date
    subscription.status = "active"
    
    payment = Payment(
        member_id=subscription.member_id,
        amount=plan.price,
        status="paid",
        payment_date=date.today(),
        notes=f"Renewal payment for {plan.name} subscription (New end date: {new_end_date})"
    )
    db.add(payment)
    
    member = db.query(Member).filter(Member.id == subscription.member_id).first()
    if member:
        notification = Notification(
            member_id=member.id,
            title="Membership Renewed",
            message=f"Your '{plan.name}' membership has been renewed. New expiry date: {new_end_date.strftime('%d %B %Y')}",
            type="success"
        )
        db.add(notification)
        db.commit()
        print(f"Renewal notification created for member: {member.id}")
    
    db.commit()
    
    return {
        "message": "Subscription renewed successfully",
        "new_end_date": new_end_date.isoformat(),
        "subscription_id": subscription.id,
        "plan_name": plan.name,
        "amount": plan.price
    }


@router.post("/{sub_id}/extend")
def extend_subscription(
    sub_id: int,
    request: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Extend a subscription by X days (must belong to admin's gym)"""
    subscription = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            Subscription.id == sub_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    days = request.get("days", 30)
    subscription.end_date = subscription.end_date + timedelta(days=days)
    subscription.status = "active"
    
    member = db.query(Member).filter(Member.id == subscription.member_id).first()
    plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()
    if member and plan:
        notification = Notification(
            member_id=member.id,
            title="Membership Extended",
            message=f"Your '{plan.name}' membership has been extended by {days} days. New expiry date: {subscription.end_date.strftime('%d %B %Y')}",
            type="info"
        )
        db.add(notification)
        db.commit()
        print(f"Extension notification created for member: {member.id}")
    
    db.commit()
    
    return {
        "message": f"Subscription extended by {days} days",
        "new_end_date": subscription.end_date.isoformat()
    }


@router.get("/expiring")
def get_expiring_subscriptions(
    days: int = 7,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get subscriptions expiring within X days for the admin's gym"""
    target_date = date.today() + timedelta(days=days)
    subs = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            User.gym_id == admin.gym_id,
            Subscription.status == "active",
            Subscription.end_date <= target_date
        )
        .all()
    )
    
    result = []
    for sub in subs:
        member = db.query(Member).filter(Member.id == sub.member_id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        days_left = (sub.end_date - date.today()).days
        result.append({
            "id": sub.id,
            "member_id": sub.member_id,
            "member_name": member.user.name if member else "Unknown",
            "plan": plan.name if plan else "Unknown",
            "end_date": sub.end_date,
            "daysLeft": days_left,
            "status": sub.status,
            "amount": plan.price if plan else 0
        })
    
    return result


# ============================================================
# MEMBER ENDPOINTS
# ============================================================

@router.get("/my", response_model=List[SubscriptionOut])
def my_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get current user's subscription history
    """
    try:
        print(f"Fetching subscriptions for user {current_user.id}")
        
        member = db.query(Member).filter(Member.user_id == current_user.id).first()
        if not member:
            print(f"No member profile found for user {current_user.id}")
            return []
        
        print(f"Member found: ID {member.id}")
        
        subs = db.query(Subscription).filter(
            Subscription.member_id == member.id
        ).order_by(Subscription.end_date.desc()).all()
        
        print(f"Found {len(subs)} subscriptions for member {member.id}")
        
        if not subs:
            return []
        
        result = []
        for sub in subs:
            try:
                plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
                
                if not plan:
                    print(f"Plan not found for subscription {sub.id}")
                    continue
                
                result.append(SubscriptionOut(
                    id=sub.id,
                    member_id=sub.member_id,
                    plan_id=sub.plan_id,
                    start_date=sub.start_date,
                    end_date=sub.end_date,
                    status=sub.status,
                    created_at=sub.created_at,
                    plan=_plan_out(plan),
                    member=_member_out(member) if member else None
                ))
            except Exception as e:
                print(f"Error processing subscription {sub.id}: {e}")
                continue
        
        print(f"Returning {len(result)} subscriptions")
        return result
        
    except Exception as e:
        print(f"Error in my_subscriptions: {e}")
        return []


@router.get("/active", response_model=SubscriptionOut)
def get_active_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get current active subscription"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    sub = db.query(Subscription).filter(
        Subscription.member_id == member.id,
        Subscription.status == "active"
    ).order_by(Subscription.end_date.desc()).first()
    
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    
    return SubscriptionOut(
        id=sub.id,
        member_id=sub.member_id,
        plan_id=sub.plan_id,
        start_date=sub.start_date,
        end_date=sub.end_date,
        status=sub.status,
        created_at=sub.created_at,
        plan=_plan_out(plan),
        member=_member_out(member) if member else None
    )


# ============================================================
# PLANS ENDPOINTS
# ============================================================

@router.get("/plans", response_model=List[PlanOut])
def get_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available subscription plans for the current user's gym"""
    plans = db.query(Plan).filter(
        Plan.is_active == True,
        Plan.gym_id == current_user.gym_id
    ).order_by(Plan.price).all()
    
    return [PlanOut(
        id=plan.id,
        name=plan.name,
        price=plan.price,
        duration_days=plan.duration_days,
        description=plan.description,
        created_at=plan.created_at
    ) for plan in plans]


@router.get("/plans/{plan_id}", response_model=PlanOut)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific plan by ID (must belong to current user's gym)"""
    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.is_active == True,
        Plan.gym_id == current_user.gym_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return PlanOut(
        id=plan.id,
        name=plan.name,
        price=plan.price,
        duration_days=plan.duration_days,
        description=plan.description,
        created_at=plan.created_at
    )


@router.post("/plans", response_model=PlanOut)
def create_plan(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Create a new subscription plan for the admin's gym"""
    plan = Plan(
        gym_id=admin.gym_id,
        name=data.get("name"),
        price=data.get("price"),
        duration_days=data.get("duration_days"),
        description=data.get("description"),
        is_active=data.get("is_active", True)
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return PlanOut(
        id=plan.id,
        name=plan.name,
        price=plan.price,
        duration_days=plan.duration_days,
        description=plan.description,
        created_at=plan.created_at
    )


@router.put("/plans/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Update a subscription plan (must belong to admin's gym)"""
    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.gym_id == admin.gym_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if "name" in data:
        plan.name = data["name"]
    if "price" in data:
        plan.price = data["price"]
    if "duration_days" in data:
        plan.duration_days = data["duration_days"]
    if "description" in data:
        plan.description = data["description"]
    if "is_active" in data:
        plan.is_active = data["is_active"]
    
    db.commit()
    db.refresh(plan)
    
    return PlanOut(
        id=plan.id,
        name=plan.name,
        price=plan.price,
        duration_days=plan.duration_days,
        description=plan.description,
        created_at=plan.created_at
    )


@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Soft delete a plan (set inactive) - must belong to admin's gym"""
    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.gym_id == admin.gym_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan.is_active = False
    db.commit()
    
    return {"message": "Plan deactivated"}


@router.get("/my/current")
def get_current_subscription_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get simplified current subscription info"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"has_subscription": False}
    
    sub = db.query(Subscription).filter(
        Subscription.member_id == member.id,
        Subscription.status == "active"
    ).order_by(Subscription.end_date.desc()).first()
    
    if not sub:
        return {"has_subscription": False}
    
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    days_left = (sub.end_date - date.today()).days
    
    return {
        "has_subscription": True,
        "plan_name": plan.name if plan else "Unknown",
        "plan_price": plan.price if plan else 0,
        "start_date": sub.start_date.isoformat(),
        "end_date": sub.end_date.isoformat(),
        "days_left": max(0, days_left),
        "status": sub.status,
        "is_active": days_left > 0
    }