from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from ..models import Hospital, Patient, PhysicalBox, PhysicalRack


class StorageService:
    @staticmethod
    def get_next_box_label(db: Session, hospital_id: int):
        """
        Generates label: CITY/YEAR/MONTH/SEQ (e.g., VVT/2026/01/0001)
        """
        hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
        city_code = (hospital.city[:2].upper() if hospital.city else "XX").ljust(2, 'X')
        
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        
        prefix = f"{city_code}/{year}/{month}/"
        pattern = f"{prefix}%"
        
        # Find max sequence
        boxes = db.query(PhysicalBox).filter(
            PhysicalBox.hospital_id == hospital_id,
            PhysicalBox.label.like(pattern)
        ).all()
        
        max_seq = 0
        for b in boxes:
            try:
                parts = b.label.split('/')
                seq = int(parts[-1])
                if seq > max_seq: max_seq = seq
            except: pass
            
        next_seq = str(max_seq + 1).zfill(4)
        return f"{prefix}{next_seq}"

    @staticmethod
    def find_open_rack_slot(db: Session, hospital_id: int):
        """
        Finds the first available slot (Row, Col) in any Rack with available space.
        Returns: (rack_id, row, col, location_code) or None
        """
        racks = db.query(PhysicalRack).filter(PhysicalRack.hospital_id == hospital_id).all()
        
        for rack in racks:
            # Check capacity in memory for simplicity (optimize with SQL for scale)
            # Find used slots
            used_slots = db.query(PhysicalBox.rack_row, PhysicalBox.rack_column).filter(
                PhysicalBox.rack_id == rack.rack_id
            ).all()
            used_set = set(used_slots) # {(1,1), (1,2)...}
            
            # Iterate Grid
            rows = rack.total_rows or 5
            cols = rack.total_columns or 10
            
            for r in range(1, rows + 1):
                for c in range(1, cols + 1):
                    if (r, c) not in used_set:
                        # Found empty slot!
                        # Location Code: Rack-Row-Col (e.g. R01-01-02)
                        # Padding Row/Col to 2 digits
                        loc_code = f"{rack.label}-{str(r).zfill(2)}-{str(c).zfill(2)}"
                        return rack.rack_id, r, c, loc_code
                        
        return None

    @staticmethod
    def auto_assign_patient(db: Session, patient: Patient):
        """
        Main logic:
        1. Find Box with space (Status='In Storage', Count < Capacity)
        2. If none, Create New Box (Find Rack Slot -> Create)
        3. Assign Patient -> Box
        """
        if patient.physical_box_id:
            return # Already assigned
            
        # 1. Try to find an existing box with space
        # We need to count patients per box. 
        # Ideally, we should denormalize 'current_count' on Box, but for now we query.
        
        # Get all boxes "In Storage"
        boxes = db.query(PhysicalBox).filter(
            PhysicalBox.hospital_id == patient.hospital_id,
            PhysicalBox.status == 'In Storage'
        ).all()
        
        selected_box = None
        
        for box in boxes:
            count = db.query(Patient).filter(Patient.physical_box_id == box.box_id).count()
            capacity = box.capacity if box.capacity else 50
            if count < capacity:
                selected_box = box
                break
                
        # 2. If no box found, Create New
        if not selected_box:
            # A. Find Rack Slot
            slot = StorageService.find_open_rack_slot(db, patient.hospital_id)
            if not slot:
                print("No API Racks Available! Creating fallback unassigned box.")
                # Fallback: create box without rack (or fail? User wants automation)
                # We'll create a box with no rack for now so process continues
                rack_id, r, c, loc_code = None, None, None, "UNASSIGNED"
            else:
                rack_id, r, c, loc_code = slot
                
            # B. Generate Label
            label = StorageService.get_next_box_label(db, patient.hospital_id)
            
            # C. Create Box
            new_box = PhysicalBox(
                hospital_id=patient.hospital_id,
                label=label,
                rack_id=rack_id,
                rack_row=r,
                rack_column=c,
                location_code=loc_code,
                status='In Storage',
                capacity=50 # Default
            )
            db.add(new_box)
            db.commit()
            db.refresh(new_box)
            selected_box = new_box
            
        # 3. Assign
        patient.physical_box_id = selected_box.box_id
        db.commit()
        print(f"✅ Auto-Assigned Patient {patient.full_name} to Box {selected_box.label}")
        return selected_box
    @staticmethod
    def migrate_to_s3(db: Session, file_id: int):
        """
        Migrates a local draft to S3 hierarchy.
        """
        from ..models import PDFFile
        from ..services.s3_handler import S3Manager
        import os, uuid, io
        import re

        f = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
        if not f or "drafts/" not in (f.s3_key or ""):
            return False, "Not a draft or file not found"

        s3_manager = S3Manager()
        if s3_manager.mode != "s3":
            return False, "S3 not configured"

        # 1. Fetch encrypted bytes from local
        encrypted_bytes = s3_manager.get_file_bytes(f.s3_key)
        if not encrypted_bytes:
            return False, "Local file not found"

        # 2. Generate Archival Key
        patient = f.patient
        date_source = patient.discharge_date or patient.created_at or datetime.now()
        year_str = date_source.strftime("%Y")
        month_str = date_source.strftime("%m")
        
        def sanitize(n): return re.sub(r'[^\w\s-]', '_', n).replace(' ', '_')
        hospital_name = sanitize(patient.hospital.legal_name or f"Hospital_{patient.hospital_id}")
        mrd_number = sanitize(patient.patient_u_id)
        
        unique_id = f.s3_key.split('_')[-1] if '_' in f.s3_key else uuid.uuid4().hex[:8]
        ext = os.path.splitext(f.s3_key)[1] # includes .enc
        
        new_s3_key = f"{hospital_name}/{year_str}/{month_str}/{mrd_number}_{unique_id}"
        if not new_s3_key.endswith(".enc"): new_s3_key += ext
        
        # 3. Upload to S3
        success, location = s3_manager.upload_file(io.BytesIO(encrypted_bytes), new_s3_key)
        
        if success:
            # 4. Success: Update DB and Cleanup source
            old_key = f.s3_key
            f.s3_key = new_s3_key
            f.storage_path = location
            f.upload_status = 'confirmed'
            
            # Delete old draft from storage (respects current mode S3/Local)
            s3_manager.delete_file(old_key)
            db.commit()
            return True, "Migrated successfully"
            
        return False, "Upload failed"

    @staticmethod
    def migrate_s3_draft_to_final(db: Session, file_id: int):
        """
        Migrates a file from S3 draft/ or draft_backup/ to final storage hierarchy.
        """
        from ..models import PDFFile
        from ..services.s3_handler import S3Manager
        import os, uuid, re

        f = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
        if not f:
            return False, "File not found"
        
        s3_key = f.s3_key or ""
        if "draft/" not in s3_key and "draft_backup/" not in s3_key:
            return False, "Not a draft file"

        s3_manager = S3Manager()
        if s3_manager.mode != "s3":
            return False, "S3 not configured"

        # 1. Generate final storage key
        patient = f.patient
        date_source = patient.discharge_date or patient.created_at or datetime.now()
        year_str = date_source.strftime("%Y")
        month_str = date_source.strftime("%m")
        
        def sanitize(n): return re.sub(r'[^\w\s-]', '_', n).replace(' ', '_')
        hospital_name = sanitize(patient.hospital.legal_name or f"Hospital_{patient.hospital_id}")
        mrd_number = sanitize(patient.patient_u_id)
        
        # Extract unique ID from current key or generate new
        unique_id = s3_key.split('_')[-1].split('.')[0] if '_' in s3_key else uuid.uuid4().hex[:8]
        ext = os.path.splitext(s3_key)[1]  # includes .enc
        
        new_s3_key = f"{hospital_name}/{year_str}/{month_str}/{mrd_number}_{unique_id}"
        if not new_s3_key.endswith(".enc"): 
            new_s3_key += ext

        # 2. Move file in S3 (copy + delete)
        # 2. Move file in S3 (copy + delete)
        try:
            # Copy to new location
            s3_manager.s3_client.copy_object(
                Bucket=s3_manager.bucket_name,
                CopySource={'Bucket': s3_manager.bucket_name, 'Key': s3_key},
                Key=new_s3_key
            )
            
            # Verify Copy Success before Deleting separate source
            # (Head Object will raise exception if not found)
            s3_manager.get_object_info(new_s3_key) 
            
            # 3. Update database FIRST
            f.s3_key = new_s3_key
            f.storage_path = f"s3://{s3_manager.bucket_name}/{new_s3_key}"
            f.upload_status = 'confirmed'
            db.commit()
            
            # 4. Delete old draft ONLY after DB commit success
            try:
                s3_manager.delete_file(s3_key)
            except Exception as e:
                print(f"⚠️ Warning: Failed to cleanup draft {s3_key} after migration: {e}")
            
            return True, "Migrated from draft to final storage"
            
        except Exception as e:
            # If DB commit failed, we still have the draft.
            # If Copy failed, we still have the draft.
            print(f"❌ Migration Error: {e}")
            return False, f"S3 migration failed: {str(e)}"

    @staticmethod
    def process_auto_confirmations(db: Session):
        """
        Finds drafts older than 24 hours and migrates them to S3.
        """
        from datetime import timedelta
        from ..models import PDFFile
        
        limit = datetime.now() - timedelta(hours=24)
        
        # Find pending drafts older than 24h
        drafts = db.query(PDFFile).options(joinedload(PDFFile.patient)).filter(
            PDFFile.upload_status == 'draft',
            PDFFile.upload_date <= limit
        ).all()
        
        results = {"total": len(drafts), "success": 0, "failed": 0}
        for d in drafts:
            # Determine migration strategy
            s3_key = d.s3_key or ""
            success = False
            msg = ""
            
            if "draft/" in s3_key or "drafts/" in s3_key:
                # S3 Optimization: Use Copy
                success, msg = StorageService.migrate_s3_draft_to_final(db, d.file_id)
            else:
                # Local/Legacy: Use Upload
                success, msg = StorageService.migrate_to_s3(db, d.file_id)
                
            if success:
                results["success"] += 1
                try:
                    from ..audit import log_audit
                    # Log as System (None User) or determine owner
                    log_audit(db, None, "FILE_AUTO_CONFIRMED", f"Auto-confirmed draft: {d.filename}", hospital_id=d.patient.hospital_id)
                    db.commit()
                except: pass
            else:
                # Only mark confirmed if it was a migration error but file exists?
                # Actually, if migration fails, we should probably NOT confirm it blindly unless it returns a specific "safe" error.
                # For now, we maintain the previous logic of fallback confirming to prevent infinite loops, 
                # BUT we mark it as 'error_confirmed' or similar? 
                # The previous code marked it as 'confirmed'. Let's stick to that but log robustly.
                print(f"⚠️ Auto-confirm migration failed for file {d.file_id}: {msg}")
                d.upload_status = 'confirmed' 
                d.processing_stage = 'completed_with_error'
                db.commit()
                results["failed"] += 1
                
        return results
