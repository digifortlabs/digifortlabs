import enum
from ..database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "superadmin"
    PLATFORM_STAFF = "superadmin_staff"
    WAREHOUSE_MANAGER = "warehouse_manager"
    HOSPITAL_ADMIN = "hospital_admin"
    HOSPITAL_STAFF = "hospital_staff"
    WEBSITE_ADMIN = "website_admin"
    GROUP_ADMIN = "group_admin"

class Permission(str, enum.Enum):
    # Platform
    MANAGE_HOSPITALS = "manage_hospitals"
    MANAGE_PLATFORM_SETTINGS = "manage_platform_settings"
    VIEW_ALL_AUDITS = "view_all_audits"
    
    # Hospital Admin
    MANAGE_HOSPITAL_USERS = "manage_hospital_users"
    MANAGE_HOSPITAL_SETTINGS = "manage_hospital_settings"
    VIEW_HOSPITAL_REPORTS = "view_hospital_reports"
    
    # Hospital Operations
    MANAGE_PATIENTS = "manage_patients"
    UPLOAD_RECORDS = "upload_records"
    VIEW_RECORDS = "view_records"
    DELETE_RECORDS = "delete_records"
    MANAGE_PHYSICAL_STORAGE = "manage_physical_storage"

ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: [p for p in Permission],
    UserRole.PLATFORM_STAFF: [
        Permission.MANAGE_HOSPITALS, Permission.VIEW_ALL_AUDITS,
        Permission.VIEW_RECORDS
    ],
    UserRole.WAREHOUSE_MANAGER: [
        Permission.MANAGE_PHYSICAL_STORAGE, Permission.VIEW_RECORDS
    ],
    UserRole.GROUP_ADMIN: [
        Permission.VIEW_HOSPITAL_REPORTS, Permission.VIEW_RECORDS
    ],
    UserRole.HOSPITAL_ADMIN: [
        Permission.MANAGE_HOSPITAL_USERS, Permission.MANAGE_HOSPITAL_SETTINGS,
        Permission.VIEW_HOSPITAL_REPORTS, Permission.MANAGE_PATIENTS,
        Permission.UPLOAD_RECORDS, Permission.VIEW_RECORDS, Permission.DELETE_RECORDS,
        Permission.MANAGE_PHYSICAL_STORAGE
    ],
    UserRole.HOSPITAL_STAFF: [
        Permission.MANAGE_PATIENTS, Permission.UPLOAD_RECORDS, Permission.VIEW_RECORDS,
        Permission.MANAGE_PHYSICAL_STORAGE
    ],
    UserRole.WEBSITE_ADMIN: []
}
