from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from app.api.dependencies import get_tenant_db
from app.models.tenant import User

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

@router.get("", response_model=List[dict])
async def list_users(db: AsyncSession = Depends(get_tenant_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [{"id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role} for u in users]

@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: str, db: AsyncSession = Depends(get_tenant_db)):
    try:
        u_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    result = await db.execute(select(User).where(User.id == u_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role}
