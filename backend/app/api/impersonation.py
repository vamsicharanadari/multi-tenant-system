from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
import logging
from app.api.dependencies import require_super_admin
from app.core.security import create_access_token
from app.core.config import settings

logger = logging.getLogger("audit")

router = APIRouter(prefix="/api/v1/super-admin/impersonate", tags=["Impersonation"])

class ImpersonationSchema(BaseModel):
    target_tenant_id: str
    target_user_id: str
    plan_tier: Optional[str] = "pro"

@router.post("")
async def impersonate_user(
    data: ImpersonationSchema,
    claims: dict = Depends(require_super_admin)
):
    super_admin_id = claims.get("sub")
    
    # Audit log
    logger.info(f"AUDIT: SuperAdmin {super_admin_id} impersonating User {data.target_user_id} in Tenant {data.target_tenant_id}")
    
    token = create_access_token(
        {
            "sub": data.target_user_id,
            "tenant_id": data.target_tenant_id,
            "plan_tier": data.plan_tier,
            "role": "Admin",
            "is_super_admin": False,
            "impersonated_by": super_admin_id
        },
        expires_delta=timedelta(minutes=settings.IMPERSONATION_EXPIRE_MINUTES)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.IMPERSONATION_EXPIRE_MINUTES * 60,
        "impersonated_by": super_admin_id,
        "target_tenant_id": data.target_tenant_id
    }
