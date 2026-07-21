import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.control import Base as ControlBase, SuperAdmin, PlanFeature
from app.core.security import hash_password
from app.main import app

pytestmark = pytest.mark.asyncio

@pytest.fixture(autouse=True)
async def setup_e2e_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(ControlBase.metadata.create_all)
    
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as s:
        sa = SuperAdmin(email="super@corp.com", password_hash=hash_password("adminpass"))
        f1 = PlanFeature(plan_tier="pro", feature_key="advanced_analytics", is_enabled=True)
        f2 = PlanFeature(plan_tier="basic", feature_key="advanced_analytics", is_enabled=False)
        s.add_all([sa, f1, f2])
        await s.commit()

    app.state.control_db_session_factory = session_factory

async def test_full_lifecycle_e2e():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Step 1: Login as Super Admin
        login_res = await ac.post("/api/v1/auth/login", json={"email": "super@corp.com", "password": "adminpass"})
        assert login_res.status_code == 200
        sa_token = login_res.json()["access_token"]

        # Step 2: Provision Tenant
        prov_res = await ac.post(
            "/api/v1/super-admin/tenants",
            json={
                "name": "Stark Industries",
                "subdomain": "stark",
                "plan_tier": "pro",
                "admin_email": "tony@stark.com",
                "admin_password": "jarvispassword"
            },
            headers={"Authorization": f"Bearer {sa_token}"}
        )
        assert prov_res.status_code == 201
        tenant_id = prov_res.json()["tenant_id"]

        # Step 3: Impersonate Tenant Admin
        imp_res = await ac.post(
            "/api/v1/super-admin/impersonate",
            json={"target_tenant_id": tenant_id, "target_user_id": "usr_tony"},
            headers={"Authorization": f"Bearer {sa_token}"}
        )
        assert imp_res.status_code == 200
        imp_token = imp_res.json()["access_token"]

        # Step 4: Impersonated user accesses tenant users & guarded analytics
        headers = {"Authorization": f"Bearer {imp_token}"}
        me_res = await ac.get("/api/v1/tenant/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["tenant_id"] == tenant_id

        analytics_res = await ac.get("/api/v1/analytics/dashboard", headers=headers)
        assert analytics_res.status_code == 200
        assert "metrics" in analytics_res.json()
