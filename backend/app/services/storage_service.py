from datetime import datetime

from sqlalchemy.orm import Session

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
