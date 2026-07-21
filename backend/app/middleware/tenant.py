from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import select
from app.core.security import decode_access_token
from app.core.tenancy import tenant_engine_manager
from app.core.config import settings
from app.models.control import Tenant

class TenantRoutingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization")
        host_header = request.headers.get("Host", "")
        subdomain_header = request.headers.get("X-Tenant-Subdomain") or request.query_params.get("subdomain")
        
        request.state.tenant_id = None
        request.state.user = None
        request.state.db = None
        request.state.tenant_plan = "basic"
        request.state.branding_config = None

        # Check Subdomain resolution from Host or Header
        resolved_subdomain = subdomain_header
        if not resolved_subdomain and "." in host_header and not host_header.startswith("localhost") and not host_header.startswith("127.0.0.1"):
            resolved_subdomain = host_header.split(".")[0]

        # Fetch Tenant info from Control DB if subdomain resolved
        control_factory = getattr(request.app.state, "control_db_session_factory", None)
        if resolved_subdomain and control_factory:
            async with control_factory() as ctrl_session:
                res = await ctrl_session.execute(select(Tenant).where(Tenant.subdomain == resolved_subdomain))
                tenant_record = res.scalar_one_or_none()
                if tenant_record:
                    request.state.tenant_id = str(tenant_record.id)
                    request.state.tenant_plan = tenant_record.plan_tier
                    request.state.branding_config = tenant_record.branding_config

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = decode_access_token(token)
                request.state.user = payload
                jwt_tenant_id = payload.get("tenant_id")
                if jwt_tenant_id:
                    request.state.tenant_id = jwt_tenant_id
            except Exception:
                pass

        tenant_id = request.state.tenant_id
        if tenant_id:
            if "postgresql" in settings.CONTROL_DB_URL:
                base_uri = settings.CONTROL_DB_URL.rsplit('/', 1)[0]
                clean_id = str(tenant_id).replace('-', '_')
                conn_uri = f"{base_uri}/tenant_{clean_id}"
            else:
                conn_uri = f"sqlite+aiosqlite:///:memory:"

            session_factory = tenant_engine_manager.get_session_factory(tenant_id, conn_uri)
            async with session_factory() as session:
                request.state.db = session
                response = await call_next(request)
                return response

        response = await call_next(request)
        return response
