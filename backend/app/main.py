from fastapi import FastAPI, Request, HTTPException, status
from app.middleware.tenant import TenantRoutingMiddleware
from app.api.users import router as users_router
from app.api.provisioning import router as provisioning_router
from app.api.impersonation import router as impersonation_router
from app.api.analytics import router as analytics_router
from app.api.branding import router as branding_router
from app.api.auth import router as auth_router

app = FastAPI(title="Multi-Tenant Enterprise API")

app.add_middleware(TenantRoutingMiddleware)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(provisioning_router)
app.include_router(impersonation_router)
app.include_router(analytics_router)
app.include_router(branding_router)

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
