"""Process service for monitoring system processes."""

import psutil
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.schemas import ProcessInfo
import logging

logger = logging.getLogger(__name__)


class ProcessService:
    """Service for monitoring system processes."""
    
    def __init__(self):
        pass
    
    async def get_all_processes(self) -> List[ProcessInfo]:
        """Get information about all running processes."""
        processes = []
        
        try:
            for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'status', 'create_time']):
                try:
                    # Get process info
                    pinfo = proc.info
                    
                    # Get command line
                    command = self._get_process_command(pinfo['pid'])
                    
                    # Create ProcessInfo object
                    process_info = ProcessInfo(
                        pid=pinfo['pid'],
                        name=pinfo['name'] or 'Unknown',
                        command=command,
                        cpu_percent=pinfo['cpu_percent'] or 0.0,
                        memory_percent=pinfo['memory_percent'] or 0.0,
                        status=pinfo['status'] or 'unknown',
                        start_time=datetime.fromtimestamp(pinfo['create_time']) if pinfo['create_time'] else datetime.now(),
                        user=pinfo['username'] or 'unknown'
                    )
                    processes.append(process_info)
                
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    # Process disappeared or we don't have access
                    continue
                except Exception as e:
                    logger.debug(f"Error getting process info for PID {pinfo.get('pid', 'unknown')}: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error getting process list: {e}")
        
        return processes
    
    def _get_process_command(self, pid: int) -> str:
        """Get the full command line for a process."""
        try:
            # Try using psutil first
            proc = psutil.Process(pid)
            cmdline = proc.cmdline()
            if cmdline:
                return ' '.join(cmdline)
        except:
            pass
        
        try:
            # Fall back to reading /proc/<pid>/cmdline
            cmdline_path = f"/proc/{pid}/cmdline"
            if os.path.exists(cmdline_path):
                with open(cmdline_path, 'rb') as f:
                    cmdline_bytes = f.read()
                    # Arguments are null-separated in /proc/<pid>/cmdline
                    cmdline = cmdline_bytes.decode('utf-8', errors='ignore').replace('\x00', ' ').strip()
                    return cmdline
        except Exception as e:
            logger.debug(f"Error reading cmdline for PID {pid}: {e}")
        
        return "Unknown"
    
    async def get_process_by_pid(self, pid: int) -> Optional[ProcessInfo]:
        """Get information about a specific process."""
        try:
            proc = psutil.Process(pid)
            
            command = self._get_process_command(pid)
            
            process_info = ProcessInfo(
                pid=pid,
                name=proc.name(),
                command=command,
                cpu_percent=proc.cpu_percent(),
                memory_percent=proc.memory_percent(),
                status=proc.status(),
                start_time=datetime.fromtimestamp(proc.create_time()),
                user=proc.username()
            )
            return process_info
        
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            return None
        except Exception as e:
            logger.error(f"Error getting process info for PID {pid}: {e}")
            return None
    
    async def search_processes(self, query: str) -> List[ProcessInfo]:
        """Search for processes by name or command."""
        all_processes = await self.get_all_processes()
        query_lower = query.lower()
        
        matching_processes = []
        for proc in all_processes:
            if (query_lower in proc.name.lower() or 
                query_lower in proc.command.lower() or 
                query_lower in proc.user.lower()):
                matching_processes.append(proc)
        
        return matching_processes
    
    async def get_process_stats(self) -> Dict[str, Any]:
        """Get statistics about running processes."""
        processes = await self.get_all_processes()
        
        total_processes = len(processes)
        
        # Count by status
        status_counts = {}
        for proc in processes:
            status = proc.status
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Find top CPU and memory consumers
        top_cpu = sorted(processes, key=lambda p: p.cpu_percent, reverse=True)[:5]
        top_memory = sorted(processes, key=lambda p: p.memory_percent, reverse=True)[:5]
        
        # Count by user
        user_counts = {}
        for proc in processes:
            user = proc.user
            user_counts[user] = user_counts.get(user, 0) + 1
        
        return {
            "total_processes": total_processes,
            "status_counts": status_counts,
            "user_counts": user_counts,
            "top_cpu": [{"pid": p.pid, "name": p.name, "cpu_percent": p.cpu_percent} for p in top_cpu],
            "top_memory": [{"pid": p.pid, "name": p.name, "memory_percent": p.memory_percent} for p in top_memory]
        }


# Global service instance
process_service = ProcessService()