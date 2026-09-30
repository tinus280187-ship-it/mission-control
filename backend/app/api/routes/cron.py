"""Cron job routes."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.schemas import CronJob
from app.services.cron_service import cron_service

router = APIRouter()


@router.get("/cron/jobs", response_model=List[CronJob])
async def get_cron_jobs():
    """Get all cron jobs."""
    jobs = await cron_service.get_cron_jobs()
    return jobs


@router.get("/cron/jobs/{job_id}", response_model=CronJob)
async def get_cron_job(job_id: str):
    """Get a specific cron job."""
    job = await cron_service.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Cron job not found")
    return job


@router.get("/cron/stats")
async def get_cron_stats():
    """Get cron job statistics."""
    stats = await cron_service.get_cron_stats()
    return stats


@router.get("/cron/jobs/enabled", response_model=List[CronJob])
async def get_enabled_jobs():
    """Get only enabled cron jobs."""
    all_jobs = await cron_service.get_cron_jobs()
    enabled_jobs = [job for job in all_jobs if job.enabled]
    return enabled_jobs


@router.get("/cron/jobs/disabled", response_model=List[CronJob])
async def get_disabled_jobs():
    """Get only disabled cron jobs."""
    all_jobs = await cron_service.get_cron_jobs()
    disabled_jobs = [job for job in all_jobs if not job.enabled]
    return disabled_jobs