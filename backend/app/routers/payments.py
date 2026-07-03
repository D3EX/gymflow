# backend/app/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, datetime
from ..database import get_db
from ..models.models import Payment, Member, User, Notification
from ..schemas.schemas import PaymentCreate, PaymentUpdate, PaymentOut
from ..utils.auth import require_admin, get_current_user
from .notifications import notify_admins_payment_issue

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# ============================================================
# ADMIN ENDPOINTS (literal paths first)
# ============================================================

@router.get("/", response_model=List[PaymentOut])
def get_payments(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get all payments"""
    query = db.query(Payment)
    if status:
        query = query.filter(Payment.status == status)
    return query.order_by(Payment.created_at.desc()).all()


@router.get("/monthly-revenue")
def monthly_revenue(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get monthly revenue"""
    year = year or datetime.now().year
    results = (
        db.query(
            extract("month", Payment.payment_date).label("month"),
            func.sum(Payment.amount).label("total"),
        )
        .filter(Payment.status == "paid")
        .filter(extract("year", Payment.payment_date) == year)
        .group_by("month")
        .order_by("month")
        .all()
    )
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [{"month": months[int(r.month)-1], "revenue": float(r.total or 0)} for r in results]


@router.get("/stats")
def get_payment_stats(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get payment statistics"""
    total_paid = db.query(func.sum(Payment.amount)).filter(Payment.status == "paid").scalar() or 0
    total_pending = db.query(func.sum(Payment.amount)).filter(Payment.status == "pending").scalar() or 0
    total_overdue = db.query(func.sum(Payment.amount)).filter(Payment.status == "overdue").scalar() or 0

    return {
        "total_paid": float(total_paid),
        "total_pending": float(total_pending),
        "total_overdue": float(total_overdue),
        "total_revenue": float(total_paid + total_pending + total_overdue)
    }


# ============================================================
# MEMBER ENDPOINTS
# ============================================================

@router.get("/my", response_model=List[PaymentOut])
def my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get current user's payment history
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return []

    payments = db.query(Payment).filter(
        Payment.member_id == member.id
    ).order_by(Payment.created_at.desc()).all()

    return payments


@router.get("/my/stats")
def my_payment_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get payment statistics
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {
            "total_paid": 0,
            "total_pending": 0,
            "total_overdue": 0,
            "payment_count": 0
        }

    payments = db.query(Payment).filter(Payment.member_id == member.id).all()

    return {
        "total_paid": float(sum(p.amount for p in payments if p.status == "paid")),
        "total_pending": float(sum(p.amount for p in payments if p.status == "pending")),
        "total_overdue": float(sum(p.amount for p in payments if p.status == "overdue")),
        "payment_count": len(payments)
    }


@router.get("/my/status")
def my_payment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Check overdue status
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"has_overdue": False, "overdue_count": 0}

    overdue_count = db.query(Payment).filter(
        Payment.member_id == member.id,
        Payment.status == "overdue"
    ).count()

    return {
        "has_overdue": overdue_count > 0,
        "overdue_count": overdue_count
    }


# ============================================================
# CREATE PAYMENT - WITH NOTIFICATION
# ============================================================

@router.post("/", response_model=PaymentOut)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Create a new payment"""
    member = db.query(Member).filter(Member.id == data.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    payment = Payment(**data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # CREATE NOTIFICATION FOR PAYMENT
    notification = Notification(
        member_id=member.id,
        title="Payment Recorded",
        message=f"Your payment of {payment.amount:,.0f} DZD has been recorded. Status: {payment.status}",
        type="info"
    )
    db.add(notification)
    db.commit()
    
    print(f"Notification created for payment: {payment.id}")
    
    # Alert admins if this payment was created already in a problem state
    if payment.status in ("overdue", "failed"):
        notify_admins_payment_issue(db, member_name=member.user.name, amount=payment.amount, status=payment.status)
    
    return payment


# ============================================================
# UPDATE PAYMENT STATUS - WITH NOTIFICATION
# ============================================================

@router.put("/{payment_id}", response_model=PaymentOut)
def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Update a payment"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    old_status = payment.status
    
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(payment, field, val)
    
    db.commit()
    db.refresh(payment)
    
    # CREATE NOTIFICATION FOR STATUS CHANGE
    if old_status != payment.status:
        member = db.query(Member).filter(Member.id == payment.member_id).first()
        if member:
            status_messages = {
                "paid": "Your payment has been confirmed and processed. Thank you!",
                "pending": "Your payment is being reviewed. We will notify you when it is confirmed.",
                "overdue": "Your payment is overdue. Please contact support to resolve this."
            }
            
            notif_type = "success" if payment.status == "paid" else "warning" if payment.status == "overdue" else "info"
            
            notification = Notification(
                member_id=member.id,
                title=f"Payment {payment.status.title()}",
                message=status_messages.get(payment.status, f"Your payment status is now: {payment.status}"),
                type=notif_type
            )
            db.add(notification)
            db.commit()
            print(f"Status change notification created for payment: {payment.id}")
            
            # Alert admins about payment problems (failed or newly overdue)
            if payment.status in ("overdue", "failed"):
                notify_admins_payment_issue(db, member_name=member.user.name, amount=payment.amount, status=payment.status)
    
    return payment


@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Delete a payment"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted"}


# ============================================================
# CONFIRM PAYMENT - WITH NOTIFICATION
# ============================================================

@router.post("/{payment_id}/confirm")
def confirm_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Confirm a payment (mark as paid)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment.status = "paid"
    db.commit()
    
    # CREATE NOTIFICATION FOR CONFIRMATION
    member = db.query(Member).filter(Member.id == payment.member_id).first()
    if member:
        notification = Notification(
            member_id=member.id,
            title="Payment Confirmed",
            message=f"Your payment of {payment.amount:,.0f} DZD has been confirmed. Thank you for your payment!",
            type="success"
        )
        db.add(notification)
        db.commit()
        print(f"Confirmation notification created for payment: {payment.id}")
    
    return {"message": "Payment confirmed", "payment_id": payment.id}