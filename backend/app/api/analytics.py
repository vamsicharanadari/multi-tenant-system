from fastapi import APIRouter, Depends
from app.api.dependencies import require_feature

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/dashboard", dependencies=[Depends(require_feature("advanced_analytics"))])
async def get_analytics_dashboard():
    return {
        "metrics": {
            "total_revenue": "$1,250,000",
            "active_users": 1420,
            "conversion_rate": "4.8%"
        },
        "status": "success"
    }
