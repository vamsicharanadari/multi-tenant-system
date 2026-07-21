from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import decode_access_token
from app.core.tenancy import tenant_engine_manager
from app.core.config import settings

class TenantRoutingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization")
        request.state.tenant_id = None
        request.state.user = None
        request.state.db = None
        request.state.tenant_plan = "basic"

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = decode_access_token(token)
                request.state.user = payload
                tenant_id = payload.get("tenant_id")
                request.state.tenant_id = tenant_id

                if tenant_id:
                    # Connection URI generation / lookup
                    # In production: fetch from Control DB or Redis cache.
                    # Here we default to tenant db or in-memory dynamic URL
                    if "postgresql" in settings.CONTROL_DB_URL:
                        base_uri = settings.CONTROL_DB_URL.rsplit('/', 1)[0]
                        # sanitize tenant_id for db name
                        clean_id = str(tenant_id).replace('-', '_')
                        conn_uri = f"{base_uri}/tenant_{clean_id}"
                    else:
                        conn_uri = f"sqlite+aiosqlite:///:memory:"

                    session_factory = tenant_engine_manager.get_session_factory(tenant_id, conn_uri)
                    async with session_factory() as session:
                        request.state.db = session
                        response = await call_next(request)
                        return response
            except Exception as e:
                # Invalid token or error resolving tenant
                pass

        response = await call_next(request)
        return response
