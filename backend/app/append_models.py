with open(r'd:\Website\DIGIFORTLABS\backend\app\models.py', 'a') as f:
    f.write('''

class NursingHandoverLog(Base):
    __tablename__ = "nursing_handovers"
    
    handover_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.bed_id"), nullable=True)
    nurse_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    shift_date = Column(DateTime, nullable=False, default=func.now())
    shift_type = Column(String, nullable=False) # Morning, Evening, Night
    
    handover_notes = Column(Text, nullable=True)
    critical_alerts = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DietOrder(Base):
    __tablename__ = "diet_orders"
    
    order_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.bed_id"), nullable=True)
    doctor_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    diet_type = Column(String, nullable=False) # Diabetic, Liquid, Normal, etc.
    instructions = Column(Text, nullable=True)
    status = Column(String, default="ORDERED") # ORDERED, PREPARING, DELIVERED
    
    ordered_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime, nullable=True)
''')
