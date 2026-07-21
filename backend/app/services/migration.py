from sqlalchemy.ext.asyncio import create_async_engine
from app.models.tenant import Base as TenantBase
from app.models.control import Tenant
from sqlalchemy import select

async def migrate_tenant_db(connection_uri: str):
    """Programmatically run tenant DDL migrations on a specific tenant DB."""
    engine = create_async_engine(connection_uri, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(TenantBase.metadata.create_all)
    await engine.dispose()

async def run_all_tenant_migrations(control_db_session):
    """Iterate through active tenants in Control DB and run migrations."""
    result = await control_db_session.execute(select(Tenant).where(Tenant.is_active == True))
    tenants = result.scalars().all()
    for tenant in tenants:
        await migrate_tenant_db(tenant.db_connection_uri)
    return len(tenants)
