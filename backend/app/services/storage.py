import os
import shutil
from pathlib import Path

class StorageService:
    def __init__(self, base_temp_dir: str = "backend/data/temp"):
        self.base_temp_dir = Path(base_temp_dir)
        self._ensure_base_dir()

    def _ensure_base_dir(self):
        """Ensure the base temporary directory exists."""
        if not self.base_temp_dir.exists():
            self.base_temp_dir.mkdir(parents=True, exist_ok=True)

    def get_job_dir(self, job_id: str) -> str:
        """
        Creates and returns a unique directory for a job.
        """
        job_dir = self.base_temp_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        return str(job_dir)

    def cleanup_job_dir(self, job_id: str):
        """
        Removes a job's temporary directory.
        """
        job_dir = self.base_temp_dir / job_id
        if job_dir.exists() and job_dir.is_dir():
            shutil.rmtree(job_dir)
            return True
        return False

    def list_expired_jobs(self, max_age_hours: int = 24):
        """
        Future implementation: List job directories older than max_age_hours.
        """
        pass
