"""Cron service for managing scheduled tasks."""

import subprocess
import re
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.models.schemas import CronJob
import logging

logger = logging.getLogger(__name__)


class CronService:
    """Service for managing cron jobs through Hermes."""
    
    def __init__(self):
        self.hermes_command = "hermes"
    
    async def get_cron_jobs(self) -> List[CronJob]:
        """Get all cron jobs from Hermes."""
        try:
            # Execute hermes cron list command
            result = subprocess.run(
                [self.hermes_command, "cron", "list"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return self._parse_cron_output(result.stdout)
            else:
                logger.error(f"Hermes cron command failed: {result.stderr}")
                return []
        
        except subprocess.TimeoutExpired:
            logger.error("Hermes cron command timed out")
            return []
        except FileNotFoundError:
            logger.error("Hermes command not found")
            return []
        except Exception as e:
            logger.error(f"Error getting cron jobs: {e}")
            return []
    
    def _parse_cron_output(self, output: str) -> List[CronJob]:
        """Parse the output of 'hermes cron list' command."""
        jobs = []
        
        try:
            lines = output.strip().split('\n')
            
            for i, line in enumerate(lines):
                line = line.strip()
                if not line or line.startswith('#') or line.startswith('ID'):
                    continue
                
                # Try to parse the line format
                # Expected format: ID | Schedule | Command | Status | Last Run | Next Run
                parts = [part.strip() for part in line.split('|')]
                
                if len(parts) >= 3:
                    job_id = parts[0]
                    schedule = parts[1]
                    command = parts[2]
                    status = parts[3] if len(parts) > 3 else "unknown"
                    last_run_str = parts[4] if len(parts) > 4 else None
                    next_run_str = parts[5] if len(parts) > 5 else None
                    
                    # Parse timestamps
                    last_run = None
                    next_run = None
                    
                    try:
                        if last_run_str and last_run_str != "-" and last_run_str != "Never":
                            last_run = datetime.fromisoformat(last_run_str.replace("Z", "+00:00"))
                    except:
                        pass
                    
                    try:
                        if next_run_str and next_run_str != "-":
                            next_run = datetime.fromisoformat(next_run_str.replace("Z", "+00:00"))
                    except:
                        pass
                    
                    job = CronJob(
                        id=job_id,
                        schedule=schedule,
                        command=command,
                        enabled=status.lower() in ["enabled", "active", "running"],
                        last_run=last_run,
                        next_run=next_run,
                        status=status
                    )
                    jobs.append(job)
        
        except Exception as e:
            logger.error(f"Error parsing cron output: {e}")
            logger.debug(f"Raw output: {output}")
        
        return jobs
    
    async def get_job_by_id(self, job_id: str) -> Optional[CronJob]:
        """Get a specific cron job by ID."""
        jobs = await self.get_cron_jobs()
        for job in jobs:
            if job.id == job_id:
                return job
        return None
    
    async def get_cron_stats(self) -> Dict[str, Any]:
        """Get statistics about cron jobs."""
        jobs = await self.get_cron_jobs()
        
        total_jobs = len(jobs)
        enabled_jobs = sum(1 for job in jobs if job.enabled)
        disabled_jobs = total_jobs - enabled_jobs
        
        # Count jobs by status
        status_counts = {}
        for job in jobs:
            status = job.status.lower()
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Find next upcoming job
        next_job = None
        earliest_next_run = None
        
        for job in jobs:
            if job.next_run and job.enabled:
                if earliest_next_run is None or job.next_run < earliest_next_run:
                    earliest_next_run = job.next_run
                    next_job = job
        
        return {
            "total_jobs": total_jobs,
            "enabled_jobs": enabled_jobs,
            "disabled_jobs": disabled_jobs,
            "status_counts": status_counts,
            "next_job": {
                "id": next_job.id,
                "command": next_job.command,
                "next_run": next_job.next_run.isoformat() if next_job.next_run else None
            } if next_job else None
        }


# Global service instance
cron_service = CronService()