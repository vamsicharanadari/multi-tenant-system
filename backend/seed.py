import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.models.control import Base as ControlBase, SuperAdmin, PlanFeature
from app.core.security import hash_password

CONTROL_DB_URL = "postgresql+asyncpg://admin:secret@localhost:5432/control_plane"

async def seed_data():
    engine = create_async_engine(CONTROL_DB_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(ControlBase.metadata.create_all)
    
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with session_factory() as session:
        res = await session.execute(select(SuperAdmin).where(SuperAdmin.email == "admin@enterprise.com"))
        existing_admin = res.scalar_one_or_none()
        
        if not existing_admin:
            admin = SuperAdmin(
                email="admin@enterprise.com",
                password_hash=hash_password("supersecretpassword")
            )
            
            f1 = PlanFeature(plan_tier="pro", feature_key="advanced_analytics", is_enabled=True)
            f2 = PlanFeature(plan_tier="basic", feature_key="advanced_analytics", is_enabled=False)
            
            session.add_all([admin, f1, f2])
            await session.commit()
            print("Successfully seeded Super Admin and Plan Features into control_plane DB!")
        else:
            print("Super Admin already exists.")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_data())
