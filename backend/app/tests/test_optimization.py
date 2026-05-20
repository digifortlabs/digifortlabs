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
    
    # Delete original unencrypted files to simulate post-compression worker state
    storage = StorageService()
    job_dir = storage.get_job_dir(job_id)
    original_path = Path(job_dir) / filename
    optimized_path = Path(job_dir) / opt_filename
    if original_path.exists():
        original_path.unlink()
    if optimized_path.exists():
        optimized_path.unlink()
        
    # Write a mock encrypted file using the actual encryption helper
    from app.services.encryption import encrypt_data
    enc_content = encrypt_data(b"%PDF-1.4 optimized and encrypted file")
    enc_path = Path(job_dir) / f"optimized_{filename}.enc"
    enc_path.write_bytes(enc_content)
        
    # Test downloading original filename (which gets routed to the decrypted in-memory stream)
    response = client.get(f"/optimization/download/{job_id}/{filename}")
    assert response.status_code == 200
    assert response.content == b"%PDF-1.4 optimized and encrypted file"

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

def test_cleanup_temp_jobs_unencrypted_sweep(tmp_path):
    # Mock base temp dir path for CleanupService
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()
    
    active_job = temp_dir / "active-job"
    active_job.mkdir()
    
    # Create an old PDF file (2 hours old)
    old_pdf = active_job / "old_report.pdf"
    old_pdf.write_bytes(b"old unencrypted content")
    
    # Create a new PDF file (10 minutes old)
    new_pdf = active_job / "new_report.pdf"
    new_pdf.write_bytes(b"new unencrypted content")
    
    # Create an old ENC file (2 hours old)
    old_enc = active_job / "old_report.pdf.enc"
    old_enc.write_bytes(b"old encrypted content")
    
    import time
    now = time.time()
    past_time = now - (2 * 3600) # 2 hours ago
    recent_time = now - (10 * 60) # 10 minutes ago
    
    # Set modification times
    os.utime(old_pdf, (past_time, past_time))
    os.utime(new_pdf, (recent_time, recent_time))
    os.utime(old_enc, (past_time, past_time))
    
    # Set directory modification time to recent so the directory itself is not deleted
    os.utime(active_job, (recent_time, recent_time))
    
    removed = CleanupService.cleanup_temp_jobs(max_age_hours=24, temp_dir_path=str(temp_dir))
    
    # Verify that the directory itself was NOT removed (since it's recent)
    assert removed == 0
    assert active_job.exists()
    
    # Verify that old_pdf was proactively scrubbed, but new_pdf and old_enc remain
    assert not old_pdf.exists()
    assert new_pdf.exists()
    assert old_enc.exists()

