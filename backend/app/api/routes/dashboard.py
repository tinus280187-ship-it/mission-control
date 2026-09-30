"""Dashboard overview routes."""

from fastapi import APIRouter
from app.models.schemas import SystemMetrics, DashboardOverview
from app.services.dashboard_service import dashboard_service

router = APIRouter()


@router.get("/dashboard/overview", response_model=DashboardOverview)
async def get_dashboard_overview():
    """Get complete dashboard overview."""
    overview = await dashboard_service.get_dashboard_overview()
    return overview


@router.get("/dashboard/metrics", response_model=SystemMetrics)
async def get_system_metrics():
    """Get current system metrics."""
    metrics = await dashboard_service.get_system_metrics()
    return metrics


@router.get("/dashboard/status")
async def get_dashboard_status():
    """Get dashboard status summary."""
    overview = await dashboard_service.get_dashboard_overview()
    
    return {
        "system_health": {
            "cpu_usage": overview.system_metrics.cpu_usage,
            "memory_usage": overview.system_metrics.memory_usage,
            "disk_usage": overview.system_metrics.disk_usage
        },
        "services": {
            "gateway_status": overview.gateway_status.status,
            "gateway_agents": overview.gateway_status.agents_connected,
            "active_processes": overview.active_processes,
        },
        "data": {
            "kanban_boards": overview.kanban_boards,
            "cron_jobs": overview.cron_jobs,
            "memory_files": overview.memory_files
        }
    }