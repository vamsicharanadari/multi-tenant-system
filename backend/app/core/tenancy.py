from typing import Dict
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, AsyncSession, async_sessionmaker

class TenantEngineManager:
    """Manages dynamic connection pools / engines per tenant to prevent per-request connection overhead."""
    def __init__(self):
        self._engines: Dict[str, AsyncEngine] = {}
        self._session_factories: Dict[str, async_sessionmaker[AsyncSession]] = {}

    def get_engine(self, tenant_id: str, connection_uri: str) -> AsyncEngine:
        if tenant_id not in self._engines:
            if "sqlite" in connection_uri or not connection_uri:
                engine = create_async_engine(connection_uri or "sqlite+aiosqlite:///:memory:", pool_pre_ping=True)
            else:
                engine = create_async_engine(
                    connection_uri,
                    pool_pre_ping=True,
                    pool_size=10,
                    max_overflow=20
                )
            self._engines[tenant_id] = engine
            self._session_factories[tenant_id] = async_sessionmaker(
                bind=engine,
                expire_on_commit=False,
                class_=AsyncSession
            )
        return self._engines[tenant_id]

    def register_engine(self, tenant_id: str, engine: AsyncEngine):
        self._engines[tenant_id] = engine
        self._session_factories[tenant_id] = async_sessionmaker(
            bind=engine,
            expire_on_commit=False,
            class_=AsyncSession
        )

    def get_session_factory(self, tenant_id: str, connection_uri: str) -> async_sessionmaker[AsyncSession]:
        if tenant_id not in self._session_factories:
            self.get_engine(tenant_id, connection_uri)
        return self._session_factories[tenant_id]

    async def dispose_all(self):
        for engine in self._engines.values():
            await engine.dispose()
        self._engines.clear()
        self._session_factories.clear()

tenant_engine_manager = TenantEngineManager()
