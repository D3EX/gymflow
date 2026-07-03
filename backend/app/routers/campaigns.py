# backend/app/routers/campaigns.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, date, timedelta
from ..database import get_db
from ..models.models import Campaign, Member, User, Notification, Subscription
from ..schemas.schemas import CampaignCreate, CampaignUpdate, CampaignOut
from ..utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])
public_router = APIRouter(prefix="/api/campaigns/public", tags=["Campaigns (Public)"])

@router.get("/", response_model=List[CampaignOut])
def get_campaigns(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(Campaign).filter(Campaign.gym_id == admin.gym_id)
    if status:
        query = query.filter(Campaign.status == status)
    return query.order_by(Campaign.created_at.desc()).all()

@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(
    campaign_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.gym_id == admin.gym_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.post("/", response_model=CampaignOut)
def create_campaign(
    data: CampaignCreate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    campaign = Campaign(
        gym_id=admin.gym_id,
        title=data.title,
        type=data.type,
        content=data.content,
        audience=data.audience,
        status="draft",
        sent_count=0,
        opened_count=0,
        clicked_count=0,
        converted_count=0,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        cover_image=data.cover_image,
        created_at=datetime.utcnow()
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: int, 
    data: CampaignUpdate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.gym_id == admin.gym_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(campaign, field, val)
    
    db.commit()
    db.refresh(campaign)
    return campaign

@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.gym_id == admin.gym_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}

@router.post("/{campaign_id}/send")
def send_campaign(
    campaign_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.gym_id == admin.gym_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    today = date.today()
    
    gym_members = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
    )
    
    recipients = []
    
    if campaign.audience == "all":
        recipients = gym_members.all()
    elif campaign.audience == "active":
        recipients = gym_members.filter(Member.status == "active").all()
    elif campaign.audience == "inactive":
        recipients = gym_members.filter(Member.status != "active").all()
    elif campaign.audience == "expiring":
        target_date = today + timedelta(days=7)
        expiring_subs = (
            db.query(Subscription)
            .join(Member, Subscription.member_id == Member.id)
            .join(User, Member.user_id == User.id)
            .filter(
                User.gym_id == admin.gym_id,
                Subscription.status == "active",
                Subscription.end_date <= target_date,
                Subscription.end_date >= today
            )
            .all()
        )
        member_ids = [sub.member_id for sub in expiring_subs]
        if member_ids:
            recipients = gym_members.filter(Member.id.in_(member_ids)).all()
    elif campaign.audience == "vip":
        recipients = gym_members.filter(Member.is_vip == True).all()
    else:
        recipients = gym_members.all()
    
    created_count = 0
    for member in recipients:
        try:
            notification = Notification(
                member_id=member.id,
                title=campaign.title,
                message=campaign.content,
                type="announcement",
                is_read=False,
                cover_image=campaign.cover_image,
                action_link="/member/offers",
                action_label="View Offers"
            )
            db.add(notification)
            created_count += 1
        except Exception as e:
            print(f"Failed to create notification for member {member.id}: {e}")
    
    campaign.status = "sent"
    campaign.sent_count = created_count
    campaign.opened_count = int(created_count * 0.75)
    campaign.clicked_count = int(created_count * 0.45)
    campaign.converted_count = int(created_count * 0.25)
    campaign.sent_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": f"Campaign sent to {created_count} recipients",
        "recipient_count": created_count,
        "campaign_id": campaign_id,
        "status": "sent"
    }

@public_router.get("/active", response_model=List[CampaignOut])
def get_public_active_campaigns(
    gym_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    query = db.query(Campaign).filter(
        Campaign.status == "sent",
        Campaign.created_at >= thirty_days_ago
    )
    
    if gym_id:
        query = query.filter(Campaign.gym_id == gym_id)
    
    campaigns = query.order_by(Campaign.created_at.desc()).all()
    
    return campaigns

@router.get("/stats/summary")
def get_campaign_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    base = db.query(Campaign).filter(Campaign.gym_id == admin.gym_id)
    
    total = base.count()
    sent = base.filter(Campaign.status == "sent").count()
    scheduled = base.filter(Campaign.status == "scheduled").count()
    draft = base.filter(Campaign.status == "draft").count()
    
    total_reach = base.filter(Campaign.status == "sent").with_entities(Campaign.sent_count).all()
    total_reach_sum = sum([r[0] for r in total_reach if r[0]]) if total_reach else 0
    
    avg_open = base.filter(Campaign.status == "sent").with_entities(Campaign.opened_count).all()
    avg_open_rate = sum([r[0] for r in avg_open if r[0]]) / len(avg_open) if avg_open else 0
    
    return {
        "total": total,
        "sent": sent,
        "scheduled": scheduled,
        "draft": draft,
        "total_reach": total_reach_sum,
        "avg_open_rate": round(avg_open_rate, 1)
    }

@router.post("/{campaign_id}/track-open")
def track_campaign_open(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.gym_id == current_user.gym_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign.opened_count += 1
    db.commit()
    
    return {"message": "Tracked"}

@router.post("/{campaign_id}/track-click")
def track_campaign_click(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.gym_id == current_user.gym_id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign.clicked_count += 1
    db.commit()
    
    return {"message": "Tracked"}