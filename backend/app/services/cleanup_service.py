import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from ..models import Hospital, Patient, PDFFile
from .s3_handler import S3Manager
import os

class CleanupService:
    @staticmethod
    def run_retention_policy(db: Session):
        """
        Background task to clean up patient records that have exceeded 
        their hospital's retention policy. MLC cases are EXEMPT.
        """
        print(f"🧹 [Retention Cleanup] Started at {datetime.datetime.now()}")
        hospitals = db.query(Hospital).filter(Hospital.is_active == True).all()
        
        total_files_deleted = 0
        total_patients_deleted = 0
        
        for hospital in hospitals:
            retention_years = getattr(hospital, 'retention_years', 5) # Default to 5 if not set
            cutoff_date = datetime.datetime.now() - datetime.timedelta(days=retention_years * 365)
            
            # Find patients past retention date, excluding MLC, BIRTH, DEATH
            # We use discharge_date as the clock-start for retention
            patients_to_cleanup = db.query(Patient)\
                .options(joinedload(Patient.files))\
                .filter(
                    Patient.hospital_id == hospital.hospital_id,
                    Patient.discharge_date < cutoff_date,
                    Patient.patient_category.notin_(["MLC", "BIRTH", "DEATH"]),
                    Patient.is_deleted == False # Only cleanup non-deleted (or we can cleanup all)
                ).all()
                
            if not patients_to_cleanup:
                continue
                
            print(f"🏥 Hospital {hospital.legal_name}: Found {len(patients_to_cleanup)} patients past retention ({retention_years} yrs)")
            
            s3_manager = S3Manager()
            for patient in patients_to_cleanup:
                # 1. Delete associated files from S3/Local
                for f in patient.files:
                    try:
                        if f.s3_key:
                            s3_manager.delete_file(f.s3_key)
                        if f.storage_path and f.storage_path != f.s3_key and os.path.isabs(f.storage_path):
                            if os.path.exists(f.storage_path): os.remove(f.storage_path)
                        total_files_deleted += 1
                    except Exception as e:
                        print(f"⚠️ Failed to delete file {f.file_id} during cleanup: {e}")
                
                # 2. Delete patient from DB (Cascade handles PDFFile rows)
                # We could also do 'is_deleted = True' but for retention, we usually hard-delete
                db.delete(patient)
                total_patients_deleted += 1
                
        if total_patients_deleted > 0:
            db.commit()
            print(f"✅ Cleanup Complete: Removed {total_patients_deleted} patients and {total_files_deleted} files.")
        else:
            print("✨ Cleanup Finished: Nothing to remove.")
            
        return {
            "patients_deleted": total_patients_deleted,
            "files_deleted": total_files_deleted
        }

    @staticmethod
    def cleanup_temp_jobs(max_age_hours: int = 24, temp_dir_path: str = "backend/data/temp"):
        """
        Removes temporary job directories from storage/jobs that are older than max_age_hours.
        Also scans active directories to delete any unencrypted PDF files older than 1 hour.
        """
        import time
        import shutil
        from pathlib import Path
        
        # Base temp dir from StorageService logic
        temp_dir = Path(temp_dir_path)
        if not temp_dir.exists():
            return 0
            
        print(f"🧹 [Job Cleanup] Scanning {temp_dir} for expired jobs and lingering unencrypted files...")
        now = time.time()
        max_age_sec = max_age_hours * 3600
        unencrypted_age_sec = 1 * 3600 # 1 hour
        
        removed_count = 0
        unencrypted_scrubbed_count = 0
        
        for item in temp_dir.iterdir():
            if item.is_dir():
                # 1. Clean up entire directories past the max age limit
                if (now - item.stat().st_mtime) > max_age_sec:
                    try:
                        shutil.rmtree(item)
                        removed_count += 1
                        continue # Entire directory removed, move to next
                    except Exception as e:
                        print(f"⚠️ Failed to remove expired job dir {item}: {e}")
                
                # 2. Secondary Sweep: Clean up unencrypted PDF files inside active directories if older than 1 hour
                try:
                    for subitem in item.iterdir():
                        if subitem.is_file() and subitem.suffix.lower() == ".pdf":
                            if (now - subitem.stat().st_mtime) > unencrypted_age_sec:
                                try:
                                    subitem.unlink()
                                    unencrypted_scrubbed_count += 1
                                    print(f"🗑️ Proactive Scrub: Lingering unencrypted file {subitem.name} removed.")
                                except Exception as e:
                                    print(f"⚠️ Failed to proactively scrub {subitem}: {e}")
                except Exception as e:
                    print(f"⚠️ Error scanning subdirectory {item} for intermediate PDFs: {e}")
        
        if removed_count > 0:
            print(f"✅ Job Cleanup Complete: Removed {removed_count} expired job directories.")
        if unencrypted_scrubbed_count > 0:
            print(f"🧹 Lingering Unencrypted Scrub Complete: Removed {unencrypted_scrubbed_count} raw/intermediate PDF files.")
            
        return removed_count

