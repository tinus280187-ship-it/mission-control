"""Configuration settings for Mission Control."""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings."""
    
    # API settings
    title: str = "Mission Control API"
    version: str = "1.0.0"
    description: str = "Mission Control Dashboard API"
    
    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Hermes Gateway
    hermes_gateway_url: str = "http://localhost:4860"
    
    # 9router
    ninerouter_url: str = "http://localhost:20128"
    
    # Data paths
    kanban_main_db: str = "/opt/data/kanban.db"
    kanban_boards_path: str = "/opt/data/kanban/boards"
    obsidian_vault_path: str = "/opt/data/home/Documents/Obsidian Vault"
    literature_corpus_path: str = "/opt/data/home/Documents/Disertasi/literature_corpus.json"
    
    # WebSocket settings
    ws_heartbeat_interval: int = 30
    
    class Config:
        env_file = ".env"


settings = Settings()