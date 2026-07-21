from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select
from app.models.control import Tenant

router = APIRouter(prefix="/api/v1/tenant/config", tags=["Branding"])

@router.get("")
async def get_tenant_branding_config(request: Request):
    if hasattr(request.state, "branding_config") and request.state.branding_config:
        return request.state.branding_config

    tenant_id = getattr(request.state, "tenant_id", None)
    control_factory = getattr(request.app.state, "control_db_session_factory", None)
    if tenant_id and control_factory:
        async with control_factory() as session:
            import uuid
            res = await session.execute(select(Tenant).where(Tenant.id == uuid.UUID(tenant_id)))
            tenant = res.scalar_one_or_none()
            if tenant:
                return tenant.branding_config

    return {
        "primary_color": "#3B82F6",
        "secondary_color": "#1E293B",
        "logo_url": "https://assets.app.com/default-logo.png",
        "app_title": "Enterprise Multi-Tenant App"
    }
