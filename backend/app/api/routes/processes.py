"""Process monitoring routes."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.models.schemas import ProcessInfo
from app.services.process_service import process_service

router = APIRouter()


@router.get("/processes", response_model=List[ProcessInfo])
async def get_all_processes():
    """Get all running processes."""
    processes = await process_service.get_all_processes()
    return processes


@router.get("/processes/{pid}", response_model=ProcessInfo)
async def get_process(pid: int):
    """Get information about a specific process."""
    process = await process_service.get_process_by_pid(pid)
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    return process


@router.get("/processes/search/{query}", response_model=List[ProcessInfo])
async def search_processes(query: str):
    """Search for processes by name or command."""
    processes = await process_service.search_processes(query)
    return processes


@router.get("/processes/stats")
async def get_process_stats():
    """Get process statistics."""
    stats = await process_service.get_process_stats()
    return stats


@router.get("/processes/top/cpu", response_model=List[ProcessInfo])
async def get_top_cpu_processes(limit: int = Query(default=10, le=50)):
    """Get top CPU consuming processes."""
    all_processes = await process_service.get_all_processes()
    top_processes = sorted(all_processes, key=lambda p: p.cpu_percent, reverse=True)[:limit]
    return top_processes


@router.get("/processes/top/memory", response_model=List[ProcessInfo])
async def get_top_memory_processes(limit: int = Query(default=10, le=50)):
    """Get top memory consuming processes."""
    all_processes = await process_service.get_all_processes()
    top_processes = sorted(all_processes, key=lambda p: p.memory_percent, reverse=True)[:limit]
    return top_processes


@router.get("/processes/by-user/{username}", response_model=List[ProcessInfo])
async def get_processes_by_user(username: str):
    """Get processes owned by a specific user."""
    all_processes = await process_service.get_all_processes()
    user_processes = [p for p in all_processes if p.user == username]
    return user_processes


@router.get("/processes/by-status/{status}", response_model=List[ProcessInfo])
async def get_processes_by_status(status: str):
    """Get processes with a specific status."""
    all_processes = await process_service.get_all_processes()
    status_processes = [p for p in all_processes if p.status.lower() == status.lower()]
    return status_processes