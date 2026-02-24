from fastapi import APIRouter

from app.api.portfolio import router as portfolio_router
from app.api.live import router as live_router

router = APIRouter()
router.include_router(portfolio_router, prefix="/portfolio", tags=["portfolio"])
router.include_router(live_router, prefix="/live", tags=["live"])
