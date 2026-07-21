from fastapi import FastAPI, Request, HTTPException, status
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from contextlib import asynccontextmanager

from app.core.config import settings
from app.models.control import Base as ControlBase, SuperAdmin, PlanFeature
from app.core.security import hash_password

from app.middleware.tenant import TenantRoutingMiddleware
from app.api.users import router as users_router
from app.api.provisioning import router as provisioning_router
from app.api.impersonation import router as impersonation_router
from app.api.analytics import router as analytics_router
from app.api.branding import router as branding_router
from app.api.auth import router as auth_router
from app.api.invitations import router as invitations_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Control DB connection pool
    engine = create_async_engine(settings.CONTROL_DB_URL, echo=False, pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.run_sync(ControlBase.metadata.create_all)
    
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    app.state.control_db_session_factory = session_factory

    # Auto-seed Super Admin
    async with session_factory() as session:
        res = await session.execute(select(SuperAdmin).where(SuperAdmin.email == "admin@enterprise.com"))
        existing_admin = res.scalar_one_or_none()
        if not existing_admin:
            admin = SuperAdmin(
                email="admin@enterprise.com",
                password_hash=hash_password("supersecretpassword")
            )
            f1 = PlanFeature(plan_tier="pro", feature_key="advanced_analytics", is_enabled=True)
            f2 = PlanFeature(plan_tier="basic", feature_key="advanced_analytics", is_enabled=False)
            session.add_all([admin, f1, f2])
            await session.commit()

    yield
    await engine.dispose()

app = FastAPI(title="Multi-Tenant Enterprise API", lifespan=lifespan)

app.add_middleware(TenantRoutingMiddleware)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(provisioning_router)
app.include_router(impersonation_router)
app.include_router(analytics_router)
app.include_router(branding_router)
app.include_router(invitations_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/v1/tenant/me")
async def get_current_tenant_user(request: Request):
    if not request.state.user or not request.state.tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return {
        "tenant_id": request.state.tenant_id,
        "user_id": request.state.user.get("sub"),
        "role": request.state.user.get("role"),
        "is_super_admin": request.state.user.get("is_super_admin", False),
        "impersonated_by": request.state.user.get("impersonated_by")
    }
