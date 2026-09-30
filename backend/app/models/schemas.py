"""Pydantic schemas for Mission Control API."""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


# Health schemas
class HealthStatus(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, bool]


# Gateway schemas
class GatewayStatus(BaseModel):
    status: str
    uptime: str
    version: Optional[str] = None
    agents_connected: int
    last_heartbeat: datetime


# Kanban schemas
class KanbanCard(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    column_id: str
    position: int
    created_at: datetime
    updated_at: datetime
    tags: List[str] = []
    assignee: Optional[str] = None


class KanbanColumn(BaseModel):
    id: str
    title: str
    position: int
    cards: List[KanbanCard] = []


class KanbanBoard(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    columns: List[KanbanColumn] = []
    created_at: datetime
    updated_at: datetime


# Cron schemas
class CronJob(BaseModel):
    id: str
    schedule: str
    command: str
    description: Optional[str] = None
    enabled: bool
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    status: str


# Process schemas
class ProcessInfo(BaseModel):
    pid: int
    name: str
    command: str
    cpu_percent: float
    memory_percent: float
    status: str
    start_time: datetime
    user: str


# Memory schemas
class MemoryFile(BaseModel):
    path: str
    name: str
    size: int
    modified: datetime
    type: str
    content_preview: Optional[str] = None


class MemoryFolder(BaseModel):
    path: str
    name: str
    files: List[MemoryFile] = []
    folders: List['MemoryFolder'] = []
    total_files: int
    total_size: int


class LiteratureEntry(BaseModel):
    id: str
    title: str
    authors: List[str]
    year: int
    abstract: Optional[str] = None
    keywords: List[str] = []
    url: Optional[str] = None


# Dashboard schemas
class SystemMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: Dict[str, float]
    uptime: str


class DashboardOverview(BaseModel):
    system_metrics: SystemMetrics
    gateway_status: GatewayStatus
    active_processes: int
    kanban_boards: int
    cron_jobs: int
    memory_files: int


# 9router schemas
class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    max_tokens: int
    available: bool
    pricing: Optional[Dict[str, float]] = None


# WebSocket schemas
class WSMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime


# Update forward references
MemoryFolder.model_rebuild()