import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.security import create_access_token
from app.core.tenancy import tenant_engine_manager
from app.models.tenant import Base as TenantBase, User
from app.main import app

pytestmark = pytest.mark.asyncio

@pytest.fixture(autouse=True)
async def setup_tenant_databases():
    # Create in-memory engines for tenant_a and tenant_b
    engine_a = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    engine_b = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    async with engine_a.begin() as conn:
        await conn.run_sync(TenantBase.metadata.create_all)
    async with engine_b.begin() as conn:
        await conn.run_sync(TenantBase.metadata.create_all)

    # Register in tenant_engine_manager
    tenant_engine_manager.register_engine("tenant_a", engine_a)
    tenant_engine_manager.register_engine("tenant_b", engine_b)

    # Seed User in tenant_a
    session_factory_a = tenant_engine_manager.get_session_factory("tenant_a", "")
    async with session_factory_a() as session:
        user_a = User(email="user_a@tenantA.com", full_name="User A", password_hash="hash_a", role="Admin")
        session.add(user_a)
        await session.commit()

    # Seed User in tenant_b
    session_factory_b = tenant_engine_manager.get_session_factory("tenant_b", "")
    async with session_factory_b() as session:
        user_b = User(email="user_b@tenantB.com", full_name="User B", password_hash="hash_b", role="Admin")
        session.add(user_b)
        await session.commit()

async def test_tenant_a_data_isolated_from_tenant_b():
    token_a = create_access_token({
        "sub": "user_a",
        "tenant_id": "tenant_a",
        "role": "Admin",
        "is_super_admin": False
    })
    headers = {"Authorization": f"Bearer {token_a}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/users", headers=headers)
        assert res.status_code == 200
        users = res.json()
        emails = [u["email"] for u in users]
        assert "user_a@tenantA.com" in emails
        assert "user_b@tenantB.com" not in emails

async def test_cross_tenant_lookup_denied():
    token_a = create_access_token({
        "sub": "user_a",
        "tenant_id": "tenant_a",
        "role": "Admin",
        "is_super_admin": False
    })
    headers = {"Authorization": f"Bearer {token_a}"}

    # Fetch tenant_b user id directly
    session_factory_b = tenant_engine_manager.get_session_factory("tenant_b", "")
    async with session_factory_b() as session:
        res = await session.execute(TenantBase.metadata.tables["users"].select())
        user_b_row = res.first()
        user_b_id = str(user_b_row.id)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/users/{user_b_id}", headers=headers)
        assert res.status_code in (404, 403)
