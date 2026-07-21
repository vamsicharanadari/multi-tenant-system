import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.tenant import Base as TenantBase, User
from app.core.security import create_access_token
from app.core.tenancy import tenant_engine_manager
from app.main import app

pytestmark = pytest.mark.asyncio

@pytest.fixture(autouse=True)
async def setup_invitation_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(TenantBase.metadata.create_all)
    
    tenant_engine_manager.register_engine("tenant_inv_test", engine)

async def test_admin_can_create_invitation():
    admin_token = create_access_token({
        "sub": "admin_user_1",
        "tenant_id": "tenant_inv_test",
        "role": "Admin",
        "is_super_admin": False
    })
    headers = {"Authorization": f"Bearer {admin_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/invitations",
            json={"email": "newuser@tenant.com", "role": "Member"},
            headers=headers
        )
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == "newuser@tenant.com"
        assert data["role"] == "Member"
        assert "token" in data

        # Accept invitation
        accept_res = await ac.post(
            "/api/v1/invitations/accept",
            json={
                "token": data["token"],
                "full_name": "New User",
                "password": "newpassword123"
            },
            headers=headers
        )
        assert accept_res.status_code == 200

async def test_non_admin_cannot_create_invitation():
    member_token = create_access_token({
        "sub": "member_user_1",
        "tenant_id": "tenant_inv_test",
        "role": "Member",
        "is_super_admin": False
    })
    headers = {"Authorization": f"Bearer {member_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/invitations",
            json={"email": "hacker@tenant.com", "role": "Admin"},
            headers=headers
        )
        assert res.status_code == 403
