from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import uuid
import logging
from app.api.dependencies import require_super_admin
from app.models.control import Tenant
from app.models.tenant import Base as TenantBase, User
from app.core.security import hash_password
from app.core.tenancy import tenant_engine_manager
from app.core.config import settings

logger = logging.getLogger("provisioning")

router = APIRouter(prefix="/api/v1/super-admin/tenants", tags=["Provisioning"])

class TenantCreateSchema(BaseModel):
    name: str
    subdomain: str
    plan_tier: str = "basic"
    admin_email: str
    admin_password: str

@router.post("", status_code=status.HTTP_201_CREATED)
async def provision_tenant(
    data: TenantCreateSchema,
    request: Request,
    claims: dict = Depends(require_super_admin)
):
    try:
        tenant_id = str(uuid.uuid4())
        clean_id = tenant_id.replace("-", "_")
        db_name = f"tenant_{clean_id}"

        if "postgresql" in settings.CONTROL_DB_URL:
            # Connect to postgres server (control_plane DB) to create physical new database
            admin_uri = settings.CONTROL_DB_URL
            admin_engine = create_async_engine(admin_uri, isolation_level="AUTOCOMMIT")
            async with admin_engine.connect() as conn:
                await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
            await admin_engine.dispose()

            base_uri = settings.CONTROL_DB_URL.rsplit('/', 1)[0]
            db_uri = f"{base_uri}/{db_name}"
        else:
            db_uri = "sqlite+aiosqlite:///:memory:"

        # Initialize tenant DB schema and seed Tenant Admin
        engine = create_async_engine(db_uri, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(TenantBase.metadata.create_all)
        
        tenant_engine_manager.register_engine(tenant_id, engine)
        session_factory = tenant_engine_manager.get_session_factory(tenant_id, db_uri)
        async with session_factory() as session:
            admin_user = User(
                email=data.admin_email,
                password_hash=hash_password(data.admin_password),
                full_name=f"{data.name} Admin",
                role="Admin"
            )
            session.add(admin_user)
            await session.commit()

        # Record in Control DB if session exists
        session_factory_ctrl = getattr(request.app.state, "control_db_session_factory", None)
        if session_factory_ctrl:
            async with session_factory_ctrl() as ctrl_session:
                t = Tenant(
                    id=uuid.UUID(tenant_id),
                    name=data.name,
                    subdomain=data.subdomain,
                    db_connection_uri=db_uri,
                    plan_tier=data.plan_tier
                )
                ctrl_session.add(t)
                await ctrl_session.commit()

        return {
            "tenant_id": tenant_id,
            "name": data.name,
            "subdomain": data.subdomain,
            "plan_tier": data.plan_tier,
            "db_connection_uri": db_uri,
            "message": "Tenant provisioned successfully"
        }
    except Exception as e:
        logger.exception("Error provisioning tenant")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Provisioning failed: {str(e)}"
        )
