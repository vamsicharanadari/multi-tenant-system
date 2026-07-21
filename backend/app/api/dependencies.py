from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import AsyncGenerator
from app.models.control import PlanFeature

async def get_tenant_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    db: AsyncSession = request.state.db
    if not db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tenant context not found or invalid credentials"
        )
    yield db

def get_current_user_claims(request: Request) -> dict:
    if not request.state.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return request.state.user

def require_super_admin(claims: dict = Depends(get_current_user_claims)) -> dict:
    if not claims.get("is_super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin privileges required"
        )
    return claims

def require_feature(feature_key: str):
    async def dependency(request: Request):
        user = request.state.user
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        
        plan_tier = user.get("plan_tier", request.state.tenant_plan or "basic")
        
        # Check plan features from control_db session if available, or fallback in-memory mapping
        session_factory = getattr(request.app.state, "control_db_session_factory", None)
        if session_factory:
            async with session_factory() as session:
                res = await session.execute(
                    select(PlanFeature).where(
                        PlanFeature.plan_tier == plan_tier,
                        PlanFeature.feature_key == feature_key
                    )
                )
                feature = res.scalar_one_or_none()
                if feature and not feature.is_enabled:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Feature '{feature_key}' not included in plan '{plan_tier}'."
                    )
                elif not feature and plan_tier == "basic":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Feature '{feature_key}' not included in plan '{plan_tier}'."
                    )
        else:
            if plan_tier == "basic" and feature_key == "advanced_analytics":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Feature '{feature_key}' not included in plan."
                )

    return dependency
