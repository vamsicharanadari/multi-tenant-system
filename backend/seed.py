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
        res = await session.execute(select(SuperAdmin).where(SuperAdmin.email == "admin@tms.com"))
        existing_admin = res.scalar_one_or_none()
        
        if not existing_admin:
            admin = SuperAdmin(
                email="admin@tms.com",
                password_hash=hash_password("admin")
            )
            
            f1 = PlanFeature(plan_tier="pro", feature_key="advanced_analytics", is_enabled=True)
            f2 = PlanFeature(plan_tier="basic", feature_key="advanced_analytics", is_enabled=False)
            
            session.add_all([admin, f1, f2])
            await session.commit()
            print("Successfully seeded Super Admin admin@tms.com into control_plane DB!")
        else:
            existing_admin.password_hash = hash_password("admin")
            await session.commit()
            print("Updated Super Admin admin@tms.com password!")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_data())
