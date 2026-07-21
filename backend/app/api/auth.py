from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy import select
from app.core.security import verify_password, create_access_token
from app.models.control import SuperAdmin
from app.models.tenant import User

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

class LoginSchema(BaseModel):
    email: str
    password: str
    tenant_subdomain: str = None

@router.post("/login")
async def login(data: LoginSchema, request: Request):
    # Super Admin login ONLY allowed on main control plane (when no tenant_id resolved on domain)
    if not request.state.tenant_id:
        control_factory = getattr(request.app.state, "control_db_session_factory", None)
        if control_factory:
            async with control_factory() as session:
                res = await session.execute(select(SuperAdmin).where(SuperAdmin.email == data.email))
                super_admin = res.scalar_one_or_none()
                if super_admin and verify_password(data.password, super_admin.password_hash):
                    token = create_access_token({
                        "sub": str(super_admin.id),
                        "email": super_admin.email,
                        "tenant_id": None,
                        "role": "SuperAdmin",
                        "is_super_admin": True
                    })
                    return {"access_token": token, "token_type": "bearer", "is_super_admin": True}

    # Tenant user login (when tenant_id resolved on domain or header)
    if request.state.db and request.state.tenant_id:
        res = await request.state.db.execute(select(User).where(User.email == data.email))
        user = res.scalar_one_or_none()
        if user and verify_password(data.password, user.password_hash):
            token = create_access_token({
                "sub": str(user.id),
                "email": user.email,
                "tenant_id": request.state.tenant_id,
                "role": user.role,
                "is_super_admin": False
            })
            return {"access_token": token, "token_type": "bearer", "is_super_admin": False}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password"
    )
