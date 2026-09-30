"""Gateway and Hermes routes."""

from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import GatewayStatus, ModelInfo
from app.services.hermes_client import hermes_client

router = APIRouter()


@router.get("/gateway/status", response_model=GatewayStatus)
async def get_gateway_status():
    """Get Hermes Gateway status."""
    status = await hermes_client.get_gateway_status()
    if not status:
        raise HTTPException(status_code=503, detail="Gateway not available")
    return status


@router.get("/gateway/ping")
async def ping_gateway():
    """Ping the Hermes Gateway."""
    is_responsive = await hermes_client.ping_gateway()
    return {
        "responsive": is_responsive,
        "status": "online" if is_responsive else "offline"
    }


@router.get("/models", response_model=List[ModelInfo])
async def get_available_models():
    """Get available AI models from 9router."""
    models = await hermes_client.get_available_models()
    return models


@router.get("/ninerouter/ping")
async def ping_ninerouter():
    """Ping the 9router service."""
    is_responsive = await hermes_client.ping_ninerouter()
    return {
        "responsive": is_responsive,
        "status": "online" if is_responsive else "offline"
    }