from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from datetime import timedelta
import logging
import uuid
from app.api.dependencies import require_super_admin
from app.core.security import create_access_token
from app.core.config import settings
from app.models.tenant import User
from app.core.tenancy import tenant_engine_manager

logger = logging.getLogger("audit")

router = APIRouter(prefix="/api/v1/super-admin/impersonate", tags=["Impersonation"])

class ImpersonationSchema(BaseModel):
    target_tenant_id: str
    target_user_id: str

@router.post("")
async def impersonate_user(
    data: ImpersonationSchema,
    claims: dict = Depends(require_super_admin)
):
    super_admin_id = claims.get("sub")
    tenant_id = data.target_tenant_id
    user_id = data.target_user_id

    # Resolve target tenant DB connection
    if "postgresql" in settings.CONTROL_DB_URL:
        base_uri = settings.CONTROL_DB_URL.rsplit('/', 1)[0]
        clean_id = str(tenant_id).replace('-', '_')
        conn_uri = f"{base_uri}/tenant_{clean_id}"
    else:
        conn_uri = "sqlite+aiosqlite:///:memory:"

    session_factory = tenant_engine_manager.get_session_factory(tenant_id, conn_uri)
    
    target_role = "Member"
    target_email = ""

    try:
        async with session_factory() as session:
            try:
                u_uuid = uuid.UUID(user_id)
                res = await session.execute(select(User).where(User.id == u_uuid))
            except ValueError:
                res = await session.execute(select(User).where(User.email == user_id))

            user_obj = res.scalar_one_or_none()
            if user_obj:
                target_role = user_obj.role
                target_email = user_obj.email
    except Exception as e:
        logger.warning(f"Could not query target user role: {e}")

    # Audit log
    logger.info(f"AUDIT: SuperAdmin {super_admin_id} impersonating User {user_id} ({target_email}) [Role: {target_role}] in Tenant {tenant_id}")
    
    token = create_access_token(
        {
            "sub": user_id,
            "email": target_email or user_id,
            "tenant_id": tenant_id,
            "role": target_role,
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
        "target_tenant_id": tenant_id,
        "target_email": target_email,
        "target_role": target_role
    }
