# backend/app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from ..database import get_db
from ..models.models import User, Member
from ..schemas.schemas import Token, LoginRequest, UserCreate, UserOut
from ..utils.auth import verify_password, hash_password, create_access_token, get_current_user, get_password_hash
from .notifications import notify_admins_new_signup

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Pydantic models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = os.getenv("GMAIL_USER", "")
SMTP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using SMTP"""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("Email credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_USERNAME
        msg['To'] = to_email
        
        part = MIMEText(html_content, 'html')
        msg.attach(part)
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False


# ============================================================
# AUTH ENDPOINTS
# ============================================================

@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    token = create_access_token({"sub": str(user.id), "role": user.role})
    
    # Look up member status (only relevant for clients) so the frontend
    # can gate pending accounts right after login without an extra request.
    member_status = None
    if user.role == "client":
        member = db.query(Member).filter(Member.user_id == user.id).first()
        member_status = member.status if member else None
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user.role, 
        "name": user.name, 
        "user_id": user.id,
        "status": member_status
    }


# backend/app/routers/auth.py

@router.post("/register", response_model=UserOut)
def register(data: UserCreate, db: Session = Depends(get_db)):
    print(f"\n{'='*60}")
    print(f"📝 REGISTER: {data.name} ({data.email})")
    print(f"{'='*60}")
    
    # Check if email exists
    if db.query(User).filter(User.email == data.email).first():
        print(f"❌ Email already registered: {data.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        name=data.name, 
        email=data.email, 
        password=hash_password(data.password), 
        role=data.role.value if hasattr(data.role, 'value') else data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"✅ User created: ID={user.id}, Role={user.role}")
    
    # Create member profile for clients
    if user.role == "client":
        print(f"👤 Creating member profile...")
        member = Member(user_id=user.id, status="pending")
        db.add(member)
        db.commit()
        print(f"✅ Member created: ID={member.id}, Status={member.status}")
        
        # 🔔 Send admin notification
        print(f"🔔 Sending admin notification...")
        try:
            from .notifications import notify_admins_new_signup
            result = notify_admins_new_signup(
                db, 
                member_name=user.name, 
                pending_approval=True
            )
            print(f"✅ Notification sent! {len(result)} notifications created")
        except Exception as e:
            print(f"❌ Notification error: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"ℹ️ User is not a client (role={user.role})")
    
    print(f"{'='*60}\n")
    return user


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ============================================================
# ✅ CHANGE PASSWORD - FIXED (PUT method + Pydantic model)
# ============================================================

@router.put("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    Expects: {"current_password": "old", "new_password": "new"}
    """
    print(f"🔐 Change password request for: {current_user.email}")
    
    # Verify current password
    if not verify_password(request.current_password, current_user.password):
        print(f"❌ Current password incorrect for {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password length
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # Hash and save new password
    current_user.password = get_password_hash(request.new_password)
    db.commit()
    
    print(f"✅ Password changed successfully for {current_user.email}")
    return {"message": "Password changed successfully"}


# ============================================================
# Forgot Password Endpoints
# ============================================================

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """Request password reset link"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        return {"message": "If your email is registered, you will receive a reset link"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expires = expires_at
    db.commit()
    
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; }}
        .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .logo {{ color: #fb7121; font-size: 24px; font-weight: bold; }}
        .button {{ 
          display: inline-block; 
          background: #fb7121; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 20px 0;
          font-weight: 600;
        }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">GYM<span style="color: #fb7121;">FLOW</span></div>
        </div>
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested to reset your password for your GymFlow account.</p>
        <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
        <div style="text-align: center;">
          <a href="{reset_link}" class="button">Reset Password</a>
        </div>
        <p>Or copy this link: <br/> <small style="color: #666; word-break: break-all;">{reset_link}</small></p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
          <p>GymFlow - Complete Gym Management System</p>
          <p>© {datetime.utcnow().year} GymFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """
    
    background_tasks.add_task(send_email, request.email, "Reset Your GymFlow Password", html_content)
    
    return {"message": "If your email is registered, you will receive a reset link"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token"""
    user = db.query(User).filter(
        User.reset_token == request.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    user.password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}