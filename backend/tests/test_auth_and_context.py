import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.core.security import create_access_token, decode_access_token
from app.main import app

pytestmark = pytest.mark.asyncio

def test_create_and_decode_jwt():
    payload_data = {
        "sub": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "tenant_id": "tnt_110ec48a-a070-4ac8-a146-17b20a9ae369",
        "role": "Admin",
        "is_super_admin": False,
        "impersonated_by": None
    }
    token = create_access_token(payload_data)
    decoded = decode_access_token(token)
    
    assert decoded["sub"] == payload_data["sub"]
    assert decoded["tenant_id"] == payload_data["tenant_id"]
    assert decoded["role"] == payload_data["role"]
    assert decoded["is_super_admin"] == payload_data["is_super_admin"]
    assert decoded["impersonated_by"] == payload_data["impersonated_by"]

async def test_tenant_routing_middleware():
    token = create_access_token({
        "sub": "usr_test_user",
        "tenant_id": "tnt_test_tenant",
        "role": "Admin",
        "is_super_admin": False
    })
    
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/tenant/me", headers=headers)
        
    assert response.status_code == 200
    data = response.json()
    assert data["tenant_id"] == "tnt_test_tenant"
    assert data["user_id"] == "usr_test_user"
