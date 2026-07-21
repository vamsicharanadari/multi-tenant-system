from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import uuid
import secrets

from app.api.dependencies import get_tenant_db, get_current_user_claims
from app.models.tenant import UserInvitation, User
from app.core.security import hash_password

router = APIRouter(prefix="/api/v1/invitations", tags=["User Invitations"])

class CreateInvitationSchema(BaseModel):
    email: str
    role: str = "Member"

class AcceptInvitationSchema(BaseModel):
    token: str
    full_name: str
    password: str

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_invitation(
    data: CreateInvitationSchema,
    db: AsyncSession = Depends(get_tenant_db),
    claims: dict = Depends(get_current_user_claims)
):
    if claims.get("role") not in ("Admin", "SuperAdmin") and not claims.get("is_super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Tenant Admins can invite new users."
        )

    if data.role not in ("Admin", "Member", "Viewer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be Admin, Member, or Viewer"
        )

    inv_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation = UserInvitation(
        email=data.email,
        role=data.role,
        token=inv_token,
        expires_at=expires_at
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    return {
        "id": str(invitation.id),
        "email": invitation.email,
        "role": invitation.role,
        "token": invitation.token,
        "expires_at": invitation.expires_at.isoformat(),
        "invite_link": f"/accept-invite?token={invitation.token}"
    }

@router.get("", response_model=list)
async def list_invitations(
    db: AsyncSession = Depends(get_tenant_db),
    claims: dict = Depends(get_current_user_claims)
):
    result = await db.execute(select(UserInvitation))
    invites = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "email": i.email,
            "role": i.role,
            "token": i.token,
            "expires_at": i.expires_at.isoformat()
        }
        for i in invites
    ]

@router.post("/accept")
async def accept_invitation(
    data: AcceptInvitationSchema,
    db: AsyncSession = Depends(get_tenant_db)
):
    res = await db.execute(select(UserInvitation).where(UserInvitation.token == data.token))
    invitation = res.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invitation token")

    if datetime.now(timezone.utc) > invitation.expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation has expired")

    # Create new User in tenant DB
    new_user = User(
        email=invitation.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=invitation.role
    )
    db.add(new_user)
    await db.delete(invitation)
    await db.commit()

    return {"message": "Account created successfully. You can now log in."}
