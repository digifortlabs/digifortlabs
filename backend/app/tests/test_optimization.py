import os
import shutil
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.services.storage import StorageService
from app.services.cleanup_service import CleanupService

client = TestClient(app)

@pytest.fixture
def temp_job_dir():
    # Setup a local storage job dir
    storage = StorageService()
    job_id = "test-job-123"
    job_dir = storage.get_job_dir(job_id)
    
    # Create test files
    input_file = Path(job_dir) / "test.pdf"
    optimized_file = Path(job_dir) / "optimized_test.pdf"
    
    input_file.write_bytes(b"%PDF-1.4 test file")
    optimized_file.write_bytes(b"%PDF-1.4 optimized file")
    
    yield job_id, "test.pdf", "optimized_test.pdf"
    
    # Cleanup
    storage.cleanup_job_dir(job_id)

def test_trigger_optimization():
    with patch("app.routers.optimization.process_pdf_optimization.delay") as mock_delay:
        mock_task = MagicMock()
        mock_task.id = "mock-task-id-abc"
        mock_delay.return_value = mock_task
        
        pdf_content = b"%PDF-1.4 sample content"
        files = {"file": ("sample.pdf", pdf_content, "application/pdf")}
        
        response = client.post("/optimization/trigger", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["job_id"] is not None
        assert data["task_id"] == "mock-task-id-abc"
        assert data["status"] == "queued"
        
        # Clean up created storage job directory
        storage = StorageService()
        storage.cleanup_job_dir(data["job_id"])

def test_get_optimization_status():
    with patch("app.routers.optimization.AsyncResult") as mock_async_result:
        mock_res = MagicMock()
        mock_res.status = "SUCCESS"
        mock_res.ready.return_value = True
        mock_res.successful.return_value = True
        mock_res.result = {"status": "success", "metrics": {"ratio": 0.5}}
        mock_async_result.return_value = mock_res
        
        response = client.get("/optimization/status/mock-task-id-abc")
        
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "mock-task-id-abc"
        assert data["status"] == "SUCCESS"
        assert data["result"]["metrics"]["ratio"] == 0.5

def test_download_optimized_file(temp_job_dir):
    job_id, filename, opt_filename = temp_job_dir
    
    # Delete original file to force fallback to the optimized file
    storage = StorageService()
    job_dir = storage.get_job_dir(job_id)
    original_path = Path(job_dir) / filename
    if original_path.exists():
        original_path.unlink()
        
    # Test downloading original filename (which gets routed to optimized if it exists)
    response = client.get(f"/optimization/download/{job_id}/{filename}")
    assert response.status_code == 200
    assert response.content == b"%PDF-1.4 optimized file"

def test_download_security_path_traversal():
    # Test that path traversal containing ".." fails with 403
    response = client.get("/optimization/download/..job/test.pdf")
    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden"
    
    response = client.get("/optimization/download/job/..test.pdf")
    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden"

def test_cleanup_temp_jobs(tmp_path):
    # Mock base temp dir path for CleanupService
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()
    
    # Create an old job dir and a new job dir
    old_job = temp_dir / "old-job-id"
    old_job.mkdir()
    new_job = temp_dir / "new-job-id"
    new_job.mkdir()
    
    # Set modification time of old job to 48 hours ago
    import time
    past_time = time.time() - (48 * 3600)
    os.utime(old_job, (past_time, past_time))
    
    # Call directly with temp_dir_path
    removed = CleanupService.cleanup_temp_jobs(max_age_hours=24, temp_dir_path=str(temp_dir))
    
    # Verify that old_job is deleted but new_job is not
    assert removed == 1
    assert not old_job.exists()
    assert new_job.exists()
