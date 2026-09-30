"""Health check routes."""

from fastapi import APIRouter
from app.services.dashboard_service import dashboard_service

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return await dashboard_service.get_health_check()


@router.get("/ping")
async def ping():
    """Simple ping endpoint."""
    return {"status": "ok", "message": "Mission Control API is running"}