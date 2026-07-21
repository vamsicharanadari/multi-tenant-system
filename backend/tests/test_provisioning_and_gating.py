import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.security import create_access_token, decode_access_token
from app.core.tenancy import tenant_engine_manager
from app.models.control import Base as ControlBase, Tenant, PlanFeature
from app.main import app

pytestmark = pytest.mark.asyncio

@pytest.fixture(autouse=True)
async def setup_control_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(ControlBase.metadata.create_all)
    
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        # Seed plan features
        f1 = PlanFeature(plan_tier="pro", feature_key="advanced_analytics", is_enabled=True)
        f2 = PlanFeature(plan_tier="basic", feature_key="advanced_analytics", is_enabled=False)
        session.add_all([f1, f2])
        await session.commit()
    
    app.state.control_db_session_factory = session_factory

async def test_super_admin_provision_tenant_creates_database():
    super_admin_token = create_access_token({
        "sub": "admin_123",
        "tenant_id": None,
        "role": "SuperAdmin",
        "is_super_admin": True
    })
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    
    payload = {
        "name": "Acme Corp",
        "subdomain": "acme",
        "plan_tier": "pro",
        "admin_email": "admin@acme.com",
        "admin_password": "securepassword123"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/super-admin/tenants", json=payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert "tenant_id" in data
        assert data["subdomain"] == "acme"

async def test_impersonation_generates_audited_jwt():
    super_admin_token = create_access_token({
        "sub": "admin_123",
        "tenant_id": None,
        "role": "SuperAdmin",
        "is_super_admin": True
    })
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    
    payload = {
        "target_tenant_id": "tnt_acme_123",
        "target_user_id": "usr_acme_user"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/super-admin/impersonate", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        token = data["access_token"]
        claims = decode_access_token(token)
        assert claims["tenant_id"] == "tnt_acme_123"
        assert claims["sub"] == "usr_acme_user"
        assert claims["impersonated_by"] == "admin_123"

async def test_feature_gate_dependency():
    token_pro = create_access_token({
        "sub": "user_pro",
        "tenant_id": "tnt_pro",
        "plan_tier": "pro",
        "role": "Member",
        "is_super_admin": False
    })
    token_basic = create_access_token({
        "sub": "user_basic",
        "tenant_id": "tnt_basic",
        "plan_tier": "basic",
        "role": "Member",
        "is_super_admin": False
    })

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Pro user access
        res_pro = await ac.get("/api/v1/analytics/dashboard", headers={"Authorization": f"Bearer {token_pro}"})
        assert res_pro.status_code == 200

        # Basic user access
        res_basic = await ac.get("/api/v1/analytics/dashboard", headers={"Authorization": f"Bearer {token_basic}"})
        assert res_basic.status_code == 403
