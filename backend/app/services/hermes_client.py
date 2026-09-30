"""Hermes client service for Gateway communication."""

import httpx
from app.config import settings
from app.models.schemas import GatewayStatus, ModelInfo
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class HermesClient:
    """Client for communicating with Hermes Gateway and 9router."""
    
    def __init__(self):
        self.gateway_url = settings.hermes_gateway_url
        self.ninerouter_url = settings.ninerouter_url
        self.timeout = httpx.Timeout(10.0)
    
    async def get_gateway_status(self) -> Optional[GatewayStatus]:
        """Get status from Hermes Gateway."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.gateway_url}/api/status")
                
                if response.status_code == 200:
                    data = response.json()
                    return GatewayStatus(
                        status=data.get("status", "unknown"),
                        uptime=data.get("uptime", "0s"),
                        version=data.get("version"),
                        agents_connected=data.get("agents_connected", 0),
                        last_heartbeat=datetime.now()
                    )
                else:
                    logger.warning(f"Gateway status request failed: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error getting gateway status: {e}")
            return None
    
    async def get_available_models(self) -> List[ModelInfo]:
        """Get available models from 9router."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.ninerouter_url}/v1/models")
                
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    
                    for model_data in data.get("data", []):
                        models.append(ModelInfo(
                            id=model_data.get("id", ""),
                            name=model_data.get("id", ""),
                            provider=model_data.get("owned_by", "unknown"),
                            max_tokens=model_data.get("max_tokens", 0),
                            available=True,
                            pricing=model_data.get("pricing")
                        ))
                    
                    return models
                else:
                    logger.warning(f"Models request failed: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return []
    
    async def ping_gateway(self) -> bool:
        """Ping the gateway to check if it's responsive."""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                response = await client.get(f"{self.gateway_url}/api/health")
                return response.status_code == 200
        except Exception:
            return False
    
    async def ping_ninerouter(self) -> bool:
        """Ping 9router to check if it's responsive."""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                response = await client.get(f"{self.ninerouter_url}/v1/models")
                return response.status_code == 200
        except Exception:
            return False


# Global client instance
hermes_client = HermesClient()