"""Dashboard service for aggregating system information."""

import psutil
from typing import Dict, Any
from datetime import datetime, timedelta
from app.models.schemas import SystemMetrics, DashboardOverview
from app.services.hermes_client import hermes_client
from app.services.kanban_service import kanban_service
from app.services.cron_service import cron_service
from app.services.process_service import process_service
from app.services.memory_service import memory_service
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for providing dashboard overview data."""
    
    def __init__(self):
        pass
    
    async def get_system_metrics(self) -> SystemMetrics:
        """Get current system metrics."""
        try:
            # CPU usage
            cpu_usage = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage = disk.percent
            
            # Network I/O
            network = psutil.net_io_counters()
            network_io = {
                "bytes_sent": float(network.bytes_sent),
                "bytes_recv": float(network.bytes_recv),
                "packets_sent": float(network.packets_sent),
                "packets_recv": float(network.packets_recv)
            }
            
            # System uptime
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = datetime.now() - boot_time
            uptime_str = str(uptime).split('.')[0]  # Remove microseconds
            
            return SystemMetrics(
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                disk_usage=disk_usage,
                network_io=network_io,
                uptime=uptime_str
            )
        
        except Exception as e:
            logger.error(f"Error getting system metrics: {e}")
            return SystemMetrics(
                cpu_usage=0.0,
                memory_usage=0.0,
                disk_usage=0.0,
                network_io={"bytes_sent": 0.0, "bytes_recv": 0.0, "packets_sent": 0.0, "packets_recv": 0.0},
                uptime="Unknown"
            )
    
    async def get_dashboard_overview(self) -> DashboardOverview:
        """Get complete dashboard overview."""
        try:
            # Get system metrics
            system_metrics = await self.get_system_metrics()
            
            # Get gateway status
            gateway_status = await hermes_client.get_gateway_status()
            if not gateway_status:
                # Create a default status if gateway is not available
                from app.models.schemas import GatewayStatus
                gateway_status = GatewayStatus(
                    status="offline",
                    uptime="0s",
                    agents_connected=0,
                    last_heartbeat=datetime.now()
                )
            
            # Get counts from other services
            processes = await process_service.get_all_processes()
            active_processes = len([p for p in processes if p.status in ['running', 'sleeping']])
            
            kanban_stats = await kanban_service.get_board_stats()
            kanban_boards = kanban_stats.get('total_boards', 0)
            
            cron_stats = await cron_service.get_cron_stats()
            cron_jobs = cron_stats.get('total_jobs', 0)
            
            memory_stats = await memory_service.get_memory_stats()
            memory_files = memory_stats.get('obsidian_vault', {}).get('total_files', 0)
            
            return DashboardOverview(
                system_metrics=system_metrics,
                gateway_status=gateway_status,
                active_processes=active_processes,
                kanban_boards=kanban_boards,
                cron_jobs=cron_jobs,
                memory_files=memory_files
            )
        
        except Exception as e:
            logger.error(f"Error getting dashboard overview: {e}")
            # Return a minimal dashboard with error indicators
            from app.models.schemas import GatewayStatus
            return DashboardOverview(
                system_metrics=SystemMetrics(
                    cpu_usage=0.0,
                    memory_usage=0.0,
                    disk_usage=0.0,
                    network_io={"bytes_sent": 0.0, "bytes_recv": 0.0, "packets_sent": 0.0, "packets_recv": 0.0},
                    uptime="Unknown"
                ),
                gateway_status=GatewayStatus(
                    status="error",
                    uptime="0s",
                    agents_connected=0,
                    last_heartbeat=datetime.now()
                ),
                active_processes=0,
                kanban_boards=0,
                cron_jobs=0,
                memory_files=0
            )
    
    async def get_health_check(self) -> Dict[str, Any]:
        """Get health status of all services."""
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy",
            "services": {}
        }
        
        # Check Hermes Gateway
        try:
            gateway_ping = await hermes_client.ping_gateway()
            health_status["services"]["hermes_gateway"] = {
                "status": "healthy" if gateway_ping else "unhealthy",
                "responsive": gateway_ping
            }
        except Exception as e:
            health_status["services"]["hermes_gateway"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Check 9router
        try:
            ninerouter_ping = await hermes_client.ping_ninerouter()
            health_status["services"]["ninerouter"] = {
                "status": "healthy" if ninerouter_ping else "unhealthy",
                "responsive": ninerouter_ping
            }
        except Exception as e:
            health_status["services"]["ninerouter"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Check file system access
        try:
            memory_stats = await memory_service.get_memory_stats()
            health_status["services"]["file_system"] = {
                "status": "healthy",
                "obsidian_accessible": memory_stats.get('obsidian_vault', {}).get('total_files', 0) >= 0,
                "literature_accessible": memory_stats.get('literature_corpus', {}).get('total_entries', 0) >= 0
            }
        except Exception as e:
            health_status["services"]["file_system"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Check process monitoring
        try:
            processes = await process_service.get_all_processes()
            health_status["services"]["process_monitoring"] = {
                "status": "healthy",
                "processes_accessible": len(processes) > 0
            }
        except Exception as e:
            health_status["services"]["process_monitoring"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Check Kanban databases
        try:
            kanban_stats = await kanban_service.get_board_stats()
            health_status["services"]["kanban"] = {
                "status": "healthy",
                "boards_accessible": True
            }
        except Exception as e:
            health_status["services"]["kanban"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Check cron service
        try:
            cron_stats = await cron_service.get_cron_stats()
            health_status["services"]["cron"] = {
                "status": "healthy",
                "hermes_accessible": True
            }
        except Exception as e:
            health_status["services"]["cron"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Determine overall status
        service_statuses = [service["status"] for service in health_status["services"].values()]
        if "error" in service_statuses:
            health_status["overall_status"] = "degraded"
        elif "unhealthy" in service_statuses:
            health_status["overall_status"] = "unhealthy"
        
        return health_status


# Global service instance
dashboard_service = DashboardService()