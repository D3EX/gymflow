# backend/app/routers/messages.py

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List
import os, uuid, shutil

from ..database import get_db
from ..models.models import Message, User, Member, CoachClient
from ..schemas.schemas import MessageSend, MessageEdit, MessageOut, ConversationOut
from ..routers.auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Messages"])


# ─── Helpers ──────────────────────────────────────────────────

def _initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper()


def _require_coach_client_link(
    coach_user_id: int,
    member_id: int,
    db: Session,
    current_user_gym_id: int
) -> None:
    """Raise 403 if no active CoachClient assignment exists and both are in same gym."""
    # Verify coach belongs to the same gym as the current user
    coach = db.query(User).filter(User.id == coach_user_id, User.gym_id == current_user_gym_id).first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Coach not found in your gym.",
        )
    
    # Verify member belongs to the same gym
    member = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == member_id, User.gym_id == current_user_gym_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member not found in your gym.",
        )
    
    # Verify coach-client assignment exists
    link = db.query(CoachClient).filter(
        CoachClient.coach_id == coach_user_id,
        CoachClient.client_id == member_id,
        CoachClient.is_active == True,
        CoachClient.status == "approved",
    ).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active coach-client assignment found.",
        )


def _enrich(msg: Message, db: Session) -> MessageOut:
    sender: User = db.query(User).filter(User.id == msg.sender_id).first()
    return MessageOut(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        coach_user_id=msg.coach_user_id,
        member_id=msg.member_id,
        content=msg.content,
        is_read=msg.is_read,
        is_deleted=msg.is_deleted,
        edited_at=msg.edited_at,
        attachment_url=msg.attachment_url,
        created_at=msg.created_at,
        sender_name=sender.name if sender else None,
        sender_role=sender.role if sender else None,
    )


ONLINE_THRESHOLD = timedelta(minutes=5)
UPLOAD_DIR = "uploads/messages"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".pdf", ".doc", ".docx"}
MAX_FILE_MB = 20


def _is_online(user: User) -> bool:
    """True if the user pinged in the last 5 minutes."""
    if not user or not user.last_seen_at:
        return False
    return datetime.utcnow() - user.last_seen_at < ONLINE_THRESHOLD


# ─── PRESENCE ─────────────────────────────────────────────────

@router.post("/ping", status_code=204)
def presence_ping(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Heartbeat — updates last_seen_at so peers can show online status."""
    current_user.last_seen_at = datetime.utcnow()
    db.commit()


# ─── COACH ENDPOINTS ──────────────────────────────────────────

@router.get("/coach/conversations", response_model=List[ConversationOut])
def coach_get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return one summary row per client the coach has exchanged messages with.
    Ordered by latest message desc.
    """
    if current_user.role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Coaches only.")

    # Find all clients assigned to this coach (active, approved),
    # and ensure they belong to the same gym
    links = (
        db.query(CoachClient)
        .join(User, CoachClient.coach_id == User.id)
        .filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        )
        .all()
    )
    member_ids = [link.client_id for link in links]

    conversations: List[ConversationOut] = []
    for mid in member_ids:
        member: Member = db.query(Member).filter(Member.id == mid).first()
        if not member or not member.user:
            continue

        last_msg = (
            db.query(Message)
            .filter(
                Message.coach_user_id == current_user.id,
                Message.member_id == mid,
            )
            .order_by(Message.created_at.desc())
            .first()
        )

        unread = (
            db.query(func.count(Message.id))
            .filter(
                Message.coach_user_id == current_user.id,
                Message.member_id == mid,
                Message.receiver_id == current_user.id,
                Message.is_read == False,
            )
            .scalar()
        )

        conversations.append(
            ConversationOut(
                member_id=mid,
                member_name=member.user.name,
                member_initials=_initials(member.user.name),
                coach_user_id=current_user.id,
                last_message=last_msg.content if last_msg else None,
                last_time=last_msg.created_at if last_msg else None,
                unread_count=unread or 0,
                is_online=_is_online(member.user),
            )
        )

    # Sort by latest message (clients with no messages yet go last)
    conversations.sort(key=lambda c: c.last_time or datetime.min, reverse=True)
    return conversations


@router.get("/coach/unread-count")
def coach_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Total unread messages across all clients for the coach sidebar badge."""
    if current_user.role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Coaches only.")

    count = (
        db.query(func.count(Message.id))
        .filter(
            Message.coach_user_id == current_user.id,
            Message.receiver_id == current_user.id,
            Message.is_read == False,
        )
        .scalar()
    )
    return {"unread": count or 0}


@router.get("/coach/conversation/{member_id}", response_model=List[MessageOut])
def coach_get_conversation(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all messages between this coach and the given member."""
    if current_user.role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Coaches only.")

    _require_coach_client_link(current_user.id, member_id, db, current_user.gym_id)

    messages = (
        db.query(Message)
        .filter(
            Message.coach_user_id == current_user.id,
            Message.member_id == member_id,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Mark incoming messages as read
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()

    return [_enrich(m, db) for m in messages]


@router.post("/coach/send/{member_id}", response_model=MessageOut, status_code=201)
def coach_send_message(
    member_id: int,
    body: MessageSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Coach sends a message to a client."""
    if current_user.role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Coaches only.")

    _require_coach_client_link(current_user.id, member_id, db, current_user.gym_id)

    member: Member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    msg = Message(
        sender_id=current_user.id,
        receiver_id=member.user_id,
        coach_user_id=current_user.id,
        member_id=member_id,
        content=body.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _enrich(msg, db)


@router.patch("/coach/conversation/{member_id}/read", status_code=204)
def coach_mark_read(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all messages from this member to the coach as read."""
    if current_user.role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Coaches only.")

    _require_coach_client_link(current_user.id, member_id, db, current_user.gym_id)

    db.query(Message).filter(
        Message.coach_user_id == current_user.id,
        Message.member_id == member_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()


# ─── MEMBER ENDPOINTS ─────────────────────────────────────────

def _get_member_and_coach(
    current_user: User,
    db: Session,
):
    """
    Resolve the Member record and their assigned coach's User record.
    Raises 404 if the member profile or coach assignment is missing.
    Ensures both are in the same gym.
    """
    member: Member = (
        db.query(Member).filter(Member.user_id == current_user.id).first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found.")

    link: CoachClient = (
        db.query(CoachClient)
        .join(User, CoachClient.coach_id == User.id)
        .filter(
            CoachClient.client_id == member.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        )
        .first()
    )
    if not link:
        raise HTTPException(
            status_code=404,
            detail="No assigned coach found. Contact the gym admin.",
        )

    coach: User = db.query(User).filter(User.id == link.coach_id, User.gym_id == current_user.gym_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach account not found.")

    return member, coach


@router.get("/member/conversation", response_model=List[MessageOut])
def member_get_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the full conversation between the member and their assigned coach."""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Members only.")

    member, coach = _get_member_and_coach(current_user, db)

    messages = (
        db.query(Message)
        .filter(
            Message.coach_user_id == coach.id,
            Message.member_id == member.id,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Mark incoming messages as read
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()

    return [_enrich(m, db) for m in messages]


@router.post("/member/send", response_model=MessageOut, status_code=201)
def member_send_message(
    body: MessageSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member sends a message to their assigned coach."""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Members only.")

    member, coach = _get_member_and_coach(current_user, db)

    msg = Message(
        sender_id=current_user.id,
        receiver_id=coach.id,
        coach_user_id=coach.id,
        member_id=member.id,
        content=body.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _enrich(msg, db)


@router.patch("/member/conversation/read", status_code=204)
def member_mark_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all unread messages from the coach as read."""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Members only.")

    member, coach = _get_member_and_coach(current_user, db)

    db.query(Message).filter(
        Message.coach_user_id == coach.id,
        Message.member_id == member.id,
        Message.receiver_id == current_user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()


@router.get("/member/coach-info")
def member_get_coach_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the assigned coach's basic info for the floating chat header.
    Used by the frontend widget to display coach name, specialty, etc.
    """
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Members only.")

    member, coach = _get_member_and_coach(current_user, db)

    staff = coach.staff_profile
    return {
        "coach_user_id": coach.id,
        "name": coach.name,
        "initials": _initials(coach.name),
        "specialty": staff.specialty if staff else None,
        "is_online": _is_online(coach),
    }


@router.get("/member/unread-count")
def member_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quick unread badge count for the floating FAB button."""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Members only.")

    member: Member = (
        db.query(Member).filter(Member.user_id == current_user.id).first()
    )
    if not member:
        return {"unread": 0}

    count = (
        db.query(func.count(Message.id))
        .filter(
            Message.member_id == member.id,
            Message.receiver_id == current_user.id,
            Message.is_read == False,
        )
        .scalar()
    )
    return {"unread": count or 0}


# ─── ATTACHMENTS ──────────────────────────────────────────────

def _save_upload(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"File type '{ext}' not allowed.")
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)
    with open(dest, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    size_mb = os.path.getsize(dest) / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        os.remove(dest)
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_FILE_MB} MB).")
    return f"/uploads/messages/{filename}"


@router.post("/coach/send/{member_id}/upload", response_model=MessageOut, status_code=201)
def coach_upload_attachment(
    member_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Coach sends a file attachment to a client."""
    if current_user.role not in ("coach", "admin"):
        raise HTTPException(status_code=403, detail="Coaches only.")
    _require_coach_client_link(current_user.id, member_id, db, current_user.gym_id)
    member: Member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    url = _save_upload(file)
    msg = Message(
        sender_id=current_user.id,
        receiver_id=member.user_id,
        coach_user_id=current_user.id,
        member_id=member_id,
        content="",
        attachment_url=url,
    )
    db.add(msg); db.commit(); db.refresh(msg)
    return _enrich(msg, db)


@router.post("/member/upload", response_model=MessageOut, status_code=201)
def member_upload_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member sends a file attachment to their coach."""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Members only.")
    member, coach = _get_member_and_coach(current_user, db)
    url = _save_upload(file)
    msg = Message(
        sender_id=current_user.id,
        receiver_id=coach.id,
        coach_user_id=coach.id,
        member_id=member.id,
        content="",
        attachment_url=url,
    )
    db.add(msg); db.commit(); db.refresh(msg)
    return _enrich(msg, db)


# ─── EDIT / DELETE ────────────────────────────────────────────

def _get_own_message(message_id: int, current_user: User, db: Session) -> Message:
    """Fetch a message and verify the caller is the sender."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own messages.")
    if msg.is_deleted:
        raise HTTPException(status_code=410, detail="Message already deleted.")
    return msg


@router.patch("/messages/{message_id}", response_model=MessageOut)
def edit_message(
    message_id: int,
    body: MessageEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit the content of your own message."""
    msg = _get_own_message(message_id, current_user, db)
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message content cannot be empty.")
    msg.content = content
    msg.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return _enrich(msg, db)


@router.delete("/messages/{message_id}", status_code=204)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete your own message."""
    msg = _get_own_message(message_id, current_user, db)
    msg.is_deleted = True
    msg.content = ""
    db.commit()