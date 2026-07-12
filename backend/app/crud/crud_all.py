from typing import Dict, Any
from .base import CRUDBase
from .. import models

class CRUDHospital(CRUDBase[models.Hospital, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPatientLedgerTransaction(CRUDBase[models.PatientLedgerTransaction, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDUser(CRUDBase[models.User, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPatientDoctorAssignment(CRUDBase[models.PatientDoctorAssignment, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPatient(CRUDBase[models.Patient, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPDFFile(CRUDBase[models.PDFFile, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAIExtraction(CRUDBase[models.AIExtraction, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAuditLog(CRUDBase[models.AuditLog, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDSystemSetting(CRUDBase[models.SystemSetting, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDWarehouse(CRUDBase[models.Warehouse, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPhysicalRack(CRUDBase[models.PhysicalRack, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPhysicalBox(CRUDBase[models.PhysicalBox, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPhysicalMovementLog(CRUDBase[models.PhysicalMovementLog, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDFileRequest(CRUDBase[models.FileRequest, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDQAEntry(CRUDBase[models.QAEntry, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDInvoice(CRUDBase[models.Invoice, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDInvoiceItem(CRUDBase[models.InvoiceItem, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAvailableInvoiceNumber(CRUDBase[models.AvailableInvoiceNumber, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPatientInvoice(CRUDBase[models.PatientInvoice, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPatientInvoiceItem(CRUDBase[models.PatientInvoiceItem, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDBandwidthUsage(CRUDBase[models.BandwidthUsage, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPasswordResetOTP(CRUDBase[models.PasswordResetOTP, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDQAIssue(CRUDBase[models.QAIssue, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDInventoryItem(CRUDBase[models.InventoryItem, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDInventoryLog(CRUDBase[models.InventoryLog, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDICD11Code(CRUDBase[models.ICD11Code, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPatientDiagnosis(CRUDBase[models.PatientDiagnosis, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDICD11ProcedureCode(CRUDBase[models.ICD11ProcedureCode, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPatientProcedure(CRUDBase[models.PatientProcedure, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDentalPatient(CRUDBase[models.DentalPatient, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDepartment(CRUDBase[models.Department, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDoctorProfile(CRUDBase[models.DoctorProfile, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDIPDDoctorVisit(CRUDBase[models.IPDDoctorVisit, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDoctorSchedule(CRUDBase[models.DoctorSchedule, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAppointment(CRUDBase[models.Appointment, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPharmacyDispense(CRUDBase[models.PharmacyDispense, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPharmacyDirectSale(CRUDBase[models.PharmacyDirectSale, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPharmacySupplier(CRUDBase[models.PharmacySupplier, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDMedicineBatch(CRUDBase[models.MedicineBatch, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPurchaseInvoice(CRUDBase[models.PurchaseInvoice, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPurchaseItem(CRUDBase[models.PurchaseItem, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDLabTestCatalog(CRUDBase[models.LabTestCatalog, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDLabOrder(CRUDBase[models.LabOrder, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDLabResult(CRUDBase[models.LabResult, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDTreatmentPlan(CRUDBase[models.TreatmentPlan, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDTreatmentPhase(CRUDBase[models.TreatmentPhase, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDentalTreatment(CRUDBase[models.DentalTreatment, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDental3DScan(CRUDBase[models.Dental3DScan, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDLoginOTP(CRUDBase[models.LoginOTP, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPeriodontalExam(CRUDBase[models.PeriodontalExam, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPeriodontalMeasurement(CRUDBase[models.PeriodontalMeasurement, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDInsuranceProvider(CRUDBase[models.InsuranceProvider, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDInsuranceClaim(CRUDBase[models.InsuranceClaim, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDentalLab(CRUDBase[models.DentalLab, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDentalLabOrder(CRUDBase[models.DentalLabOrder, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDOrthoRecord(CRUDBase[models.OrthoRecord, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDCommunicationLog(CRUDBase[models.CommunicationLog, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDentalInventoryItem(CRUDBase[models.DentalInventoryItem, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDentalInventoryTransaction(CRUDBase[models.DentalInventoryTransaction, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDENTPatient(CRUDBase[models.ENTPatient, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAudiometryTest(CRUDBase[models.AudiometryTest, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDENTExamination(CRUDBase[models.ENTExamination, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDENTSurgery(CRUDBase[models.ENTSurgery, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDOPDPatient(CRUDBase[models.OPDPatient, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDOPDVisit(CRUDBase[models.OPDVisit, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDEmergencyVisit(CRUDBase[models.EmergencyVisit, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDPrescription(CRUDBase[models.Prescription, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDWard(CRUDBase[models.Ward, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDBed(CRUDBase[models.Bed, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDIPDAdmission(CRUDBase[models.IPDAdmission, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDOperationTheater(CRUDBase[models.OperationTheater, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDSurgery(CRUDBase[models.Surgery, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDMedicalEquipment(CRUDBase[models.MedicalEquipment, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDRFIDCard(CRUDBase[models.RFIDCard, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDSystemErrorLog(CRUDBase[models.SystemErrorLog, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDUserTrustedDevice(CRUDBase[models.UserTrustedDevice, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAccountingConfig(CRUDBase[models.AccountingConfig, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAccountingVendor(CRUDBase[models.AccountingVendor, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAccountingExpense(CRUDBase[models.AccountingExpense, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDAccountingTransaction(CRUDBase[models.AccountingTransaction, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDWhatsAppMessageQueue(CRUDBase[models.WhatsAppMessageQueue, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDNursingVitalsLog(CRUDBase[models.NursingVitalsLog, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDMediclaimClaim(CRUDBase[models.MediclaimClaim, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDMaternityPatient(CRUDBase[models.MaternityPatient, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDANCVisit(CRUDBase[models.ANCVisit, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDeliveryRecord(CRUDBase[models.DeliveryRecord, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDNewbornRecord(CRUDBase[models.NewbornRecord, Dict[str, Any], Dict[str, Any]]):
    pass

hospital = CRUDHospital(models.Hospital)
patient_ledger_transaction = CRUDPatientLedgerTransaction(models.PatientLedgerTransaction)
user = CRUDUser(models.User)
patient_doctor_assignment = CRUDPatientDoctorAssignment(models.PatientDoctorAssignment)
patient = CRUDPatient(models.Patient)
p_d_f_file = CRUDPDFFile(models.PDFFile)
a_i_extraction = CRUDAIExtraction(models.AIExtraction)
audit_log = CRUDAuditLog(models.AuditLog)
system_setting = CRUDSystemSetting(models.SystemSetting)
warehouse = CRUDWarehouse(models.Warehouse)
physical_rack = CRUDPhysicalRack(models.PhysicalRack)
physical_box = CRUDPhysicalBox(models.PhysicalBox)
physical_movement_log = CRUDPhysicalMovementLog(models.PhysicalMovementLog)
file_request = CRUDFileRequest(models.FileRequest)
q_a_entry = CRUDQAEntry(models.QAEntry)
invoice = CRUDInvoice(models.Invoice)
invoice_item = CRUDInvoiceItem(models.InvoiceItem)
available_invoice_number = CRUDAvailableInvoiceNumber(models.AvailableInvoiceNumber)
patient_invoice = CRUDPatientInvoice(models.PatientInvoice)
patient_invoice_item = CRUDPatientInvoiceItem(models.PatientInvoiceItem)
bandwidth_usage = CRUDBandwidthUsage(models.BandwidthUsage)
password_reset_o_t_p = CRUDPasswordResetOTP(models.PasswordResetOTP)
q_a_issue = CRUDQAIssue(models.QAIssue)
inventory_item = CRUDInventoryItem(models.InventoryItem)
inventory_log = CRUDInventoryLog(models.InventoryLog)
i_c_d11_code = CRUDICD11Code(models.ICD11Code)
patient_diagnosis = CRUDPatientDiagnosis(models.PatientDiagnosis)
i_c_d11_procedure_code = CRUDICD11ProcedureCode(models.ICD11ProcedureCode)
patient_procedure = CRUDPatientProcedure(models.PatientProcedure)
dental_patient = CRUDDentalPatient(models.DentalPatient)
department = CRUDDepartment(models.Department)
doctor_profile = CRUDDoctorProfile(models.DoctorProfile)
i_p_d_doctor_visit = CRUDIPDDoctorVisit(models.IPDDoctorVisit)
doctor_schedule = CRUDDoctorSchedule(models.DoctorSchedule)
appointment = CRUDAppointment(models.Appointment)
pharmacy_dispense = CRUDPharmacyDispense(models.PharmacyDispense)
pharmacy_direct_sale = CRUDPharmacyDirectSale(models.PharmacyDirectSale)
pharmacy_supplier = CRUDPharmacySupplier(models.PharmacySupplier)
medicine_batch = CRUDMedicineBatch(models.MedicineBatch)
purchase_invoice = CRUDPurchaseInvoice(models.PurchaseInvoice)
purchase_item = CRUDPurchaseItem(models.PurchaseItem)
lab_test_catalog = CRUDLabTestCatalog(models.LabTestCatalog)
lab_order = CRUDLabOrder(models.LabOrder)
lab_result = CRUDLabResult(models.LabResult)
treatment_plan = CRUDTreatmentPlan(models.TreatmentPlan)
treatment_phase = CRUDTreatmentPhase(models.TreatmentPhase)
dental_treatment = CRUDDentalTreatment(models.DentalTreatment)
dental3_d_scan = CRUDDental3DScan(models.Dental3DScan)
login_o_t_p = CRUDLoginOTP(models.LoginOTP)
periodontal_exam = CRUDPeriodontalExam(models.PeriodontalExam)
periodontal_measurement = CRUDPeriodontalMeasurement(models.PeriodontalMeasurement)
insurance_provider = CRUDInsuranceProvider(models.InsuranceProvider)
insurance_claim = CRUDInsuranceClaim(models.InsuranceClaim)
dental_lab = CRUDDentalLab(models.DentalLab)
dental_lab_order = CRUDDentalLabOrder(models.DentalLabOrder)
ortho_record = CRUDOrthoRecord(models.OrthoRecord)
communication_log = CRUDCommunicationLog(models.CommunicationLog)
dental_inventory_item = CRUDDentalInventoryItem(models.DentalInventoryItem)
dental_inventory_transaction = CRUDDentalInventoryTransaction(models.DentalInventoryTransaction)
e_n_t_patient = CRUDENTPatient(models.ENTPatient)
audiometry_test = CRUDAudiometryTest(models.AudiometryTest)
e_n_t_examination = CRUDENTExamination(models.ENTExamination)
e_n_t_surgery = CRUDENTSurgery(models.ENTSurgery)
o_p_d_patient = CRUDOPDPatient(models.OPDPatient)
o_p_d_visit = CRUDOPDVisit(models.OPDVisit)
emergency_visit = CRUDEmergencyVisit(models.EmergencyVisit)
prescription = CRUDPrescription(models.Prescription)
ward = CRUDWard(models.Ward)
bed = CRUDBed(models.Bed)
i_p_d_admission = CRUDIPDAdmission(models.IPDAdmission)
operation_theater = CRUDOperationTheater(models.OperationTheater)
surgery = CRUDSurgery(models.Surgery)
medical_equipment = CRUDMedicalEquipment(models.MedicalEquipment)
r_f_i_d_card = CRUDRFIDCard(models.RFIDCard)
system_error_log = CRUDSystemErrorLog(models.SystemErrorLog)
user_trusted_device = CRUDUserTrustedDevice(models.UserTrustedDevice)
accounting_config = CRUDAccountingConfig(models.AccountingConfig)
accounting_vendor = CRUDAccountingVendor(models.AccountingVendor)
accounting_expense = CRUDAccountingExpense(models.AccountingExpense)
accounting_transaction = CRUDAccountingTransaction(models.AccountingTransaction)
whats_app_message_queue = CRUDWhatsAppMessageQueue(models.WhatsAppMessageQueue)
nursing_vitals_log = CRUDNursingVitalsLog(models.NursingVitalsLog)
mediclaim_claim = CRUDMediclaimClaim(models.MediclaimClaim)
maternity_patient = CRUDMaternityPatient(models.MaternityPatient)
a_n_c_visit = CRUDANCVisit(models.ANCVisit)
delivery_record = CRUDDeliveryRecord(models.DeliveryRecord)
newborn_record = CRUDNewbornRecord(models.NewbornRecord)
