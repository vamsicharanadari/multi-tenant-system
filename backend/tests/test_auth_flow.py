import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.control import Base as ControlBase, SuperAdmin
from app.models.tenant import Base as TenantBase, User
from app.core.security import hash_password
from app.core.tenancy import tenant_engine_manager
from app.main import app

pytestmark = pytest.mark.asyncio

@pytest.fixture(autouse=True)
async def setup_dbs():
    ctrl_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with ctrl_engine.begin() as conn:
        await conn.run_sync(ControlBase.metadata.create_all)
    
    ctrl_factory = async_sessionmaker(bind=ctrl_engine, class_=AsyncSession, expire_on_commit=False)
    async with ctrl_factory() as s:
        sa = SuperAdmin(email="super@admin.com", password_hash=hash_password("supersecret"))
        s.add(sa)
        await s.commit()
    
    app.state.control_db_session_factory = ctrl_factory

    # Tenant DB
    t_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with t_engine.begin() as conn:
        await conn.run_sync(TenantBase.metadata.create_all)
    
    tenant_engine_manager.register_engine("tenant_x", t_engine)
    t_factory = tenant_engine_manager.get_session_factory("tenant_x", "")
    async with t_factory() as s:
        u = User(email="member@tenantx.com", password_hash=hash_password("pass123"), full_name="Member X", role="Member")
        s.add(u)
        await s.commit()

async def test_super_admin_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/login", json={"email": "super@admin.com", "password": "supersecret"})
        assert res.status_code == 200
        data = res.json()
        assert data["is_super_admin"] is True
        assert "access_token" in data
