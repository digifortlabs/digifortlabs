# Database Schema Report

## Table: `hospitals`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| hospital_id | Integer | - | PK, INDEX | Primary Key |
| group_id | Integer | - | INDEX | Optional |
| legal_name | String | - | - | Required |
| hospital_slug | String | - | UNIQUE, INDEX | Optional |
| email | String | - | UNIQUE, INDEX | Required |
| hashed_password | String | - | - | Optional |
| subscription_tier | String | - | - | Optional |
| pricing_tier | String | - | - | Optional |
| organization_type | String | - | - | Optional |
| specialty | String | - | - | Optional |
| mrd_service_type | String | - | - | Optional |
| terminology | JSON | - | - | Optional |
| enabled_modules | JSON | - | - | Optional |
| ai_settings | JSON | - | - | Optional |
| id_generation_settings | JSON | - | - | Optional |
| is_active | Boolean | - | - | Optional |
| is_deleted | Boolean | - | - | Optional |
| trial_ends_at | DateTime | - | - | Optional |
| is_onboarded | Boolean | - | - | Optional |
| director_name | String | - | - | Optional |
| registration_number | String | - | - | Optional |
| established_year | Integer | - | - | Optional |
| address | String | - | - | Optional |
| address_line2 | String | - | - | Optional |
| city | String | - | - | Optional |
| state | String | - | - | Optional |
| pincode | String | - | - | Optional |
| country | String | - | - | Optional |
| phone | String | - | - | Optional |
| alternate_phone | String | - | - | Optional |
| secondary_email | String | - | - | Optional |
| landline | String | - | - | Optional |
| google_maps_url | Text | - | - | Optional |
| price_per_file | Float | - | - | Optional |
| included_pages | Integer | - | - | Optional |
| price_per_extra_page | Float | - | - | Optional |
| custom_pricing | JSON | - | - | Optional |
| pricing_effective_date | DateTime | - | - | Optional |
| pricing_notes | Text | - | - | Optional |
| expected_monthly_volume | Integer | - | - | Optional |
| expected_users | Integer | - | - | Optional |
| storage_requirements | String | - | - | Optional |
| special_requirements | Text | - | - | Optional |
| accept_marketing | Boolean | - | - | Optional |
| max_users | Integer | - | - | Optional |
| per_user_price | Float | - | - | Optional |
| extra_user_price | Float | - | - | Optional |
| registration_fee | Float | - | - | Optional |
| is_reg_fee_paid | Boolean | - | - | Optional |
| gst_number | String | - | - | Optional |
| patient_registration_fee | Float | - | - | Optional |
| nursing_base_charge | Float | - | - | Optional |
| ot_base_charge | Float | - | - | Optional |
| certifications | JSON | - | - | Optional |
| important_documents | JSON | - | - | Optional |
| bank_name | String | - | - | Optional |
| bank_account_no | String | - | - | Optional |
| bank_ifsc | String | - | - | Optional |
| pan_number | String | - | - | Optional |
| pending_updates | Text | - | - | Optional |
| billing_logo_path | String | - | - | Optional |
| billing_header | Text | - | - | Optional |
| billing_footer | Text | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `users`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| user_id | Integer | - | PK, INDEX | Primary Key |
| email | String | - | UNIQUE, INDEX | Required |
| full_name | String | - | - | Required |
| phone | String | - | - | Optional |
| role | String | - | - | Optional |
| hashed_password | String | - | - | Required |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| is_active | Boolean | - | - | Optional |
| is_deleted | Boolean | - | - | Optional |
| is_verified | Boolean | - | - | Optional |
| mfa_enabled | Boolean | - | - | Optional |
| locked_until | DateTime | - | - | Optional |
| failed_login_attempts | Integer | - | - | Optional |
| current_session_id | String | - | - | Optional |
| last_active_at | DateTime | - | - | Optional |
| last_login_at | DateTime | - | - | Optional |
| subdomain | String | - | UNIQUE, INDEX | Optional |
| previous_login_at | DateTime | - | - | Optional |
| force_password_change | Boolean | - | - | Optional |
| known_devices | Text | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `patient_doctor_assignments`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| assignment_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| doctor_profile_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| assigned_at | DateTime | - | - | Optional |

## Table: `patients`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| record_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| patient_u_id | String | - | INDEX | Optional |
| uhid | String | - | INDEX | Required |
| ipd_number | String | - | INDEX | Optional |
| full_name | String | - | - | Required |
| gender | String | - | - | Optional |
| age | String | - | - | Optional |
| phone | String | - | - | Optional |
| admission_date | DateTime | - | - | Optional |
| discharge_date | DateTime | - | - | Optional |
| total_bill_amount | Float | - | - | Optional |
| diagnosis | Text | - | - | Optional |
| specialty | String | - | - | Optional |
| is_deleted | Boolean | - | - | Optional |
| deleted_at | DateTime | - | - | Optional |
| physical_box_id | Integer | - | FK (physical_boxes.box_id) | Foreign Key |
| patient_category | String | - | - | Optional |
| address | String | - | - | Optional |
| contact_number | String | - | - | Optional |
| email_id | String | - | - | Optional |
| aadhaar_number | String | - | - | Optional |
| abha_id | String | - | - | Optional |
| ayushman_id | String | - | - | Optional |
| maa_card | String | - | - | Optional |
| dob | DateTime | - | - | Optional |
| blood_group | String | - | - | Optional |
| doctor_name | String | - | - | Optional |
| weight | String | - | - | Optional |
| operative_notes | Text | - | - | Optional |
| mediclaim | String | - | - | Optional |
| medical_summary | Text | - | - | Optional |
| remarks | Text | - | - | Optional |
| opd_number | String | - | - | Optional |
| chief_complaint | Text | - | - | Optional |
| allergies | Text | - | - | Optional |
| medications | Text | - | - | Optional |
| prescriptions | JSON | - | - | Optional |
| specialty_data | JSON | - | - | Optional |
| mother_record_id | Integer | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `pdf_files`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| file_id | Integer | - | PK, INDEX | Primary Key |
| record_id | Integer | - | FK (patients.record_id) | Foreign Key |
| filename | String | - | - | Required |
| file_path | String | - | - | Required |
| file_size | Integer | - | - | Optional |
| page_count | Integer | - | - | Optional |
| upload_status | String | - | - | Optional |
| processing_stage | String | - | - | Optional |
| processing_progress | Integer | - | - | Optional |
| encryption_key | String | - | - | Optional |
| s3_key | String | - | - | Optional |
| storage_path | String | - | - | Optional |
| ocr_text | Text | - | - | Optional |
| is_searchable | Boolean | - | - | Optional |
| is_paid | Boolean | - | - | Optional |
| upload_date | DateTime | - | - | Optional |
| confirmed_at | DateTime | - | - | Optional |
| box_id | Integer | - | FK (physical_boxes.box_id) | Foreign Key |
| price_per_file | Float | - | - | Optional |
| included_pages | Integer | - | - | Optional |
| price_per_extra_page | Float | - | - | Optional |
| file_size_mb | Float | - | - | Optional |
| payment_date | DateTime | - | - | Optional |
| tags | String | - | - | Optional |
| download_request_count | Integer | - | - | Optional |

## Table: `ai_extractions`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| extraction_id | Integer | - | PK, INDEX | Primary Key |
| file_id | Integer | - | FK (pdf_files.file_id) | Foreign Key |
| raw_json | Text | - | - | Optional |
| extracted_text | Text | - | - | Optional |
| confidence_score | Float | - | - | Optional |
| visit_type | String | - | - | Optional |
| doctor_name | String | - | - | Optional |
| summary | Text | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `audit_logs`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| log_id | Integer | - | PK, INDEX | Primary Key |
| user_id | Integer | - | FK (users.user_id), INDEX | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id), INDEX | Foreign Key |
| action | String | - | - | Required |
| module | String | - | - | Optional |
| target_id | String | - | - | Optional |
| details | Text | - | - | Optional |
| ip_address | String | - | - | Optional |
| timestamp | DateTime | - | INDEX | Optional |

## Table: `system_settings`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK | Primary Key |
| key | String | - | UNIQUE, INDEX | Optional |
| value | String | - | - | Optional |
| description | String | - | - | Optional |

## Table: `warehouses`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| warehouse_id | Integer | - | PK, INDEX | Primary Key |
| name | String | - | UNIQUE | Required |
| location | String | - | - | Optional |
| is_active | Boolean | - | - | Optional |

## Table: `physical_racks`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| rack_id | Integer | - | PK, INDEX | Primary Key |
| warehouse_id | Integer | - | FK (warehouses.warehouse_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| label | String | - | - | Required |
| aisle | Integer | - | - | Optional |
| capacity | Integer | - | - | Optional |
| total_rows | Integer | - | - | Optional |
| total_columns | Integer | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `physical_boxes`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| box_id | Integer | - | PK, INDEX | Primary Key |
| rack_id | Integer | - | FK (physical_racks.rack_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| label | String | - | UNIQUE | Required |
| location_code | String | - | - | Optional |
| status | String | - | - | Optional |
| is_open | Boolean | - | - | Optional |
| capacity | Integer | - | - | Optional |
| category | String | - | - | Optional |
| rack_row | Integer | - | - | Optional |
| rack_column | Integer | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| sealed_date | DateTime | - | - | Optional |

## Table: `physical_movement_logs`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| log_id | Integer | - | PK, INDEX | Primary Key |
| action_type | String | - | - | Required |
| uhid | String | - | - | Required |
| patient_name | String | - | - | Optional |
| destination | String | - | - | Optional |
| performed_by_user_id | Integer | - | FK (users.user_id) | Foreign Key |
| status | String | - | - | Optional |
| timestamp | DateTime | - | - | Optional |

## Table: `file_requests`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| request_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| box_id | Integer | - | FK (physical_boxes.box_id) | Foreign Key |
| requester_name | String | - | - | Required |
| status | String | - | - | Optional |
| request_date | DateTime | - | - | Optional |
| processed_date | DateTime | - | - | Optional |

## Table: `qa_entries`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| qa_id | Integer | - | PK, INDEX | Primary Key |
| file_id | Integer | - | FK (pdf_files.file_id) | Foreign Key |
| reviewer_id | Integer | - | FK (users.user_id) | Foreign Key |
| status | String | - | - | Optional |
| comments | String | - | - | Optional |
| timestamp | DateTime | - | - | Optional |

## Table: `invoices`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| invoice_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| invoice_number | String | - | UNIQUE, INDEX | Required |
| total_amount | Float | - | - | Required |
| tax_amount | Float | - | - | Optional |
| gst_rate | Float | - | - | Optional |
| status | String | - | - | Optional |
| bill_date | DateTime | - | - | Optional |
| due_date | DateTime | - | - | Optional |
| payment_date | DateTime | - | - | Optional |
| payment_method | String | - | - | Optional |
| transaction_id | String | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `invoice_items`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| item_id | Integer | - | PK, INDEX | Primary Key |
| invoice_id | Integer | - | FK (invoices.invoice_id) | Foreign Key |
| file_id | Integer | - | FK (pdf_files.file_id) | Foreign Key |
| description | String | - | - | Required |
| hsn_code | String | - | - | Optional |
| amount | Float | - | - | Required |
| discount | Float | - | - | Optional |

## Table: `available_invoice_numbers`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK, INDEX | Primary Key |
| number | Integer | - | INDEX | Required |
| invoice_type | String | - | - | Required |
| financial_year | String | - | - | Required |
| created_at | DateTime | - | - | Optional |

## Table: `patient_invoices`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| invoice_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id), INDEX | Foreign Key |
| patient_id | Integer | - | FK (patients.record_id), INDEX | Foreign Key |
| invoice_number | String | - | UNIQUE, INDEX | Required |
| bill_date | DateTime | - | - | Optional |
| due_date | DateTime | - | - | Optional |
| payment_date | DateTime | - | - | Optional |
| subtotal | Float | - | - | Optional |
| discount_amount | Float | - | - | Optional |
| gst_rate | Float | - | - | Optional |
| tax_amount | Float | - | - | Optional |
| total_amount | Float | - | - | Optional |
| status | String | - | - | Optional |
| payment_method | String | - | - | Optional |
| transaction_id | String | - | - | Optional |
| remarks | Text | - | - | Optional |
| pdf_path | String | - | - | Optional |
| created_by | Integer | - | FK (users.user_id) | Foreign Key |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `patient_invoice_items`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| item_id | Integer | - | PK, INDEX | Primary Key |
| invoice_id | Integer | - | FK (patient_invoices.invoice_id) | Foreign Key |
| description | String | - | - | Required |
| qty | Integer | - | - | Optional |
| unit_price | Float | - | - | Optional |
| discount | Float | - | - | Optional |
| amount | Float | - | - | Optional |
| charge_type | String | - | - | Optional |
| reference_id | Integer | - | - | Optional |

## Table: `bandwidth_usage`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| month_year | String | - | INDEX | Optional |
| used_mb | Float | - | - | Optional |
| quota_limit_mb | Float | - | - | Optional |

## Table: `password_reset_otps`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| otp_id | Integer | - | PK, INDEX | Primary Key |
| email | String | - | INDEX | Required |
| otp_code | String | - | - | Required |
| expires_at | DateTime | - | - | Required |
| is_used | Boolean | - | - | Optional |
| attempt_count | Integer | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `qa_issues`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| issue_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| file_id | Integer | - | FK (pdf_files.file_id) | Foreign Key |
| record_id | Integer | - | FK (patients.record_id) | Foreign Key |
| filename | String | - | - | Optional |
| issue_type | String | - | - | Required |
| details | Text | - | - | Optional |
| severity | String | - | - | Optional |
| status | String | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `inventory_items`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| item_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| name | String | - | INDEX | Required |
| category | String | - | - | Optional |
| unit_price | Float | - | - | Optional |
| reorder_point | Integer | - | - | Optional |
| unit | String | - | - | Optional |
| current_stock | Integer | - | - | Optional |
| last_updated | DateTime | - | - | Optional |

## Table: `inventory_logs`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| item_id | Integer | - | FK (inventory_items.item_id) | Foreign Key |
| change_type | String | - | - | Required |
| quantity | Integer | - | - | Required |
| description | String | - | - | Optional |
| performed_by | Integer | - | FK (users.user_id) | Foreign Key |
| timestamp | DateTime | - | - | Optional |

## Table: `icd11_codes`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| code | String | - | PK, INDEX | Primary Key |
| description | String | - | - | Required |
| chapter | String | - | - | Optional |

## Table: `patient_diagnoses`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| diagnosis_id | Integer | - | PK, INDEX | Primary Key |
| record_id | Integer | - | FK (patients.record_id) | Foreign Key |
| code | String | - | FK (icd11_codes.code) | Foreign Key |
| notes | Text | - | - | Optional |
| diagnosed_by | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| diagnosed_at | DateTime | - | - | Optional |

## Table: `icd11_procedure_codes`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| code | String | - | PK, INDEX | Primary Key |
| description | String | - | - | Required |

## Table: `patient_procedures`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| procedure_id | Integer | - | PK, INDEX | Primary Key |
| record_id | Integer | - | FK (patients.record_id) | Foreign Key |
| code | String | - | FK (icd11_procedure_codes.code) | Foreign Key |
| notes | Text | - | - | Optional |
| performed_by | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| performed_at | DateTime | - | - | Optional |

## Table: `dental_patients`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| patient_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| main_patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| uhid | String | - | - | Optional |
| opd_number | String | - | - | Optional |
| registration_date | DateTime | - | - | Optional |
| full_name | String | - | - | Required |
| date_of_birth | DateTime | - | - | Optional |
| gender | String | - | - | Optional |
| phone | String | - | - | Optional |
| email | String | - | - | Optional |
| address | Text | - | - | Optional |
| chief_complaint | Text | - | - | Optional |
| clinical_data | JSON | - | - | Optional |
| habits | JSON | - | - | Optional |
| medical_history | Text | - | - | Optional |
| allergies | Text | - | - | Optional |
| medications | Text | - | - | Optional |
| prescriptions | JSON | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `departments`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| department_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| name | String | - | - | Required |
| description | Text | - | - | Optional |
| is_active | Boolean | - | - | Optional |

## Table: `doctor_profiles`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| profile_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| user_id | Integer | - | FK (users.user_id) | Foreign Key |
| department_id | Integer | - | FK (departments.department_id) | Foreign Key |
| full_name | String | - | - | Required |
| email | String | - | - | Optional |
| phone | String | - | - | Optional |
| specialization | String | - | - | Optional |
| consultation_fee | Float | - | - | Optional |
| ipd_charge | Float | - | - | Optional |
| is_active | Boolean | - | - | Optional |
| is_residential | Boolean | - | - | Optional |

## Table: `doctor_schedules`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| schedule_id | Integer | - | PK, INDEX | Primary Key |
| doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| day_of_week | Integer | - | - | Required |
| start_time | String | - | - | Required |
| end_time | String | - | - | Required |
| session_type | String | - | - | Optional |
| slot_duration_minutes | Integer | - | - | Optional |
| is_active | Boolean | - | - | Optional |

## Table: `appointments`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| appointment_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| department_id | Integer | - | FK (departments.department_id) | Foreign Key |
| appointment_date | DateTime | - | - | Required |
| start_time | DateTime | - | - | Required |
| end_time | DateTime | - | - | Required |
| status | String | - | - | Optional |
| reason_for_visit | String | - | - | Optional |
| notes | Text | - | - | Optional |
| visit_type | String | - | - | Optional |
| is_follow_up | Boolean | - | - | Optional |
| opd_number | String | - | INDEX | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `pharmacy_dispenses`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| dispense_id | Integer | - | PK, INDEX | Primary Key |
| prescription_id | Integer | - | FK (prescriptions.prescription_id) | Foreign Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| pharmacist_id | Integer | - | FK (users.user_id) | Foreign Key |
| quantity_dispensed | Integer | - | - | Required |
| unit_price | Float | - | - | Optional |
| total_price | Float | - | - | Optional |
| is_paid | Boolean | - | - | Optional |
| payment_method | String | - | - | Optional |
| dispensed_at | DateTime | - | - | Optional |

## Table: `pharmacy_direct_sales`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| sale_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| pharmacist_id | Integer | - | FK (users.user_id) | Foreign Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| walkin_name | String | - | - | Optional |
| walkin_phone | String | - | - | Optional |
| items_sold | JSON | - | - | Required |
| subtotal | Float | - | - | Optional |
| tax_amount | Float | - | - | Optional |
| total_amount | Float | - | - | Optional |
| payment_method | String | - | - | Optional |
| sold_at | DateTime | - | - | Optional |

## Table: `pharmacy_suppliers`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| supplier_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| name | String | - | - | Required |
| contact_person | String | - | - | Optional |
| phone | String | - | - | Optional |
| email | String | - | - | Optional |
| gst_number | String | - | - | Optional |
| address | String | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `medicine_batches`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| batch_id | Integer | - | PK, INDEX | Primary Key |
| item_id | Integer | - | FK (inventory_items.item_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| supplier_id | Integer | - | FK (pharmacy_suppliers.supplier_id) | Foreign Key |
| batch_number | String | - | - | Required |
| mfg_date | DateTime | - | - | Optional |
| expiry_date | DateTime | - | - | Optional |
| purchase_price | Float | - | - | Optional |
| mrp | Float | - | - | Optional |
| initial_stock | Integer | - | - | Optional |
| current_stock | Integer | - | - | Optional |
| is_active | Boolean | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `pharmacy_purchase_invoices`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| invoice_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| supplier_id | Integer | - | FK (pharmacy_suppliers.supplier_id) | Foreign Key |
| received_by | Integer | - | FK (users.user_id) | Foreign Key |
| invoice_number | String | - | - | Required |
| invoice_date | DateTime | - | - | Optional |
| subtotal | Float | - | - | Optional |
| tax_amount | Float | - | - | Optional |
| discount | Float | - | - | Optional |
| total_amount | Float | - | - | Optional |
| status | String | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `pharmacy_purchase_items`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| purchase_item_id | Integer | - | PK, INDEX | Primary Key |
| invoice_id | Integer | - | FK (pharmacy_purchase_invoices.invoice_id) | Foreign Key |
| batch_id | Integer | - | FK (medicine_batches.batch_id) | Foreign Key |
| item_id | Integer | - | FK (inventory_items.item_id) | Foreign Key |
| quantity | Integer | - | - | Required |
| free_quantity | Integer | - | - | Optional |
| purchase_price | Float | - | - | Optional |
| tax_percentage | Float | - | - | Optional |
| total_price | Float | - | - | Optional |

## Table: `lab_test_catalog`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| test_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| test_name | String | - | - | Required |
| category | String | - | - | Optional |
| price | Float | - | - | Optional |
| is_active | Boolean | - | - | Optional |

## Table: `lab_orders`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| order_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| visit_type | String | - | - | Optional |
| visit_id | Integer | - | - | Optional |
| status | String | - | - | Optional |
| ordered_at | DateTime | - | - | Optional |

## Table: `lab_results`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| result_id | Integer | - | PK, INDEX | Primary Key |
| order_id | Integer | - | FK (lab_orders.order_id) | Foreign Key |
| test_id | Integer | - | FK (lab_test_catalog.test_id) | Foreign Key |
| technician_id | Integer | - | FK (users.user_id) | Foreign Key |
| result_value | String | - | - | Optional |
| reference_range | String | - | - | Optional |
| remarks | Text | - | - | Optional |
| report_file_url | String | - | - | Optional |
| completed_at | DateTime | - | - | Optional |

## Table: `dental_treatment_plans`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| plan_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| name | String | - | - | Required |
| status | String | - | - | Optional |
| priority | String | - | - | Optional |
| estimated_cost | Float | - | - | Optional |
| notes | Text | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `dental_treatment_phases`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| phase_id | Integer | - | PK, INDEX | Primary Key |
| plan_id | Integer | - | FK (dental_treatment_plans.plan_id) | Foreign Key |
| name | String | - | - | Required |
| phase_order | Integer | - | - | Optional |
| status | String | - | - | Optional |
| estimated_duration_days | Integer | - | - | Optional |

## Table: `dental_treatments`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| treatment_id | Integer | - | PK, INDEX | Primary Key |
| dental_patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| tooth_number | Integer | - | - | Optional |
| treatment_type | String | - | - | Required |
| description | Text | - | - | Optional |
| cost | Float | - | - | Optional |
| status | String | - | - | Optional |
| date_performed | DateTime | - | - | Optional |
| phase_id | Integer | - | FK (dental_treatment_phases.phase_id) | Foreign Key |
| patient_invoice_id | Integer | - | FK (patient_invoices.invoice_id) | Foreign Key |

## Table: `dental_3d_scans`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| scan_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| scan_type | String | - | - | Optional |
| file_path | String | - | - | Required |
| file_name | String | - | - | Required |
| uploaded_at | DateTime | - | - | Optional |
| notes | Text | - | - | Optional |

## Table: `login_otps`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK, INDEX | Primary Key |
| user_id | Integer | - | FK (users.user_id) | Foreign Key |
| device_id | String | - | INDEX | Required |
| otp_code | String | - | - | Required |
| expires_at | DateTime | - | - | Required |
| created_at | DateTime | - | - | Optional |

## Table: `periodontal_exams`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| exam_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| dentist_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| exam_date | DateTime | - | - | Optional |
| notes | Text | - | - | Optional |
| overall_plaque_score | Float | - | - | Optional |
| overall_bleeding_score | Float | - | - | Optional |

## Table: `periodontal_measurements`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| measurement_id | Integer | - | PK, INDEX | Primary Key |
| exam_id | Integer | - | FK (periodontal_exams.exam_id) | Foreign Key |
| tooth_number | Integer | - | - | Required |
| pd_db | Integer | - | - | Optional |
| pd_b | Integer | - | - | Optional |
| pd_mb | Integer | - | - | Optional |
| pd_dl | Integer | - | - | Optional |
| pd_l | Integer | - | - | Optional |
| pd_ml | Integer | - | - | Optional |
| gm_db | Integer | - | - | Optional |
| gm_b | Integer | - | - | Optional |
| gm_mb | Integer | - | - | Optional |
| gm_dl | Integer | - | - | Optional |
| gm_l | Integer | - | - | Optional |
| gm_ml | Integer | - | - | Optional |
| bop_db | Boolean | - | - | Optional |
| bop_b | Boolean | - | - | Optional |
| bop_mb | Boolean | - | - | Optional |
| bop_dl | Boolean | - | - | Optional |
| bop_l | Boolean | - | - | Optional |
| bop_ml | Boolean | - | - | Optional |

## Table: `insurance_providers`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| provider_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| name | String | - | - | Required |
| contact_email | String | - | - | Optional |
| contact_phone | String | - | - | Optional |
| portal_url | String | - | - | Optional |

## Table: `insurance_claims`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| claim_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| provider_id | Integer | - | FK (insurance_providers.provider_id) | Foreign Key |
| policy_number | String | - | - | Required |
| claim_amount | Float | - | - | Required |
| approved_amount | Float | - | - | Optional |
| status | String | - | - | Optional |
| submitted_date | DateTime | - | - | Optional |
| resolved_date | DateTime | - | - | Optional |
| notes | Text | - | - | Optional |

## Table: `dental_labs`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| lab_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| name | String | - | - | Required |
| contact_person | String | - | - | Optional |
| phone | String | - | - | Optional |
| email | String | - | - | Optional |
| address | Text | - | - | Optional |

## Table: `dental_lab_orders`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| order_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| lab_id | Integer | - | FK (dental_labs.lab_id) | Foreign Key |
| dentist_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| appliance_type | String | - | - | Required |
| tooth_number | String | - | - | Optional |
| shade | String | - | - | Optional |
| instructions | Text | - | - | Optional |
| sent_date | DateTime | - | - | Optional |
| due_date | DateTime | - | - | Optional |
| received_date | DateTime | - | - | Optional |
| status | String | - | - | Optional |

## Table: `ortho_records`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| record_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| dentist_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| visit_date | DateTime | - | - | Optional |
| appliance_type | String | - | - | Required |
| upper_wire | String | - | - | Optional |
| lower_wire | String | - | - | Optional |
| elastics | String | - | - | Optional |
| notes | Text | - | - | Optional |
| next_visit_tasks | Text | - | - | Optional |

## Table: `communication_logs`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| log_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (dental_patients.patient_id) | Foreign Key |
| comm_type | String | - | - | Required |
| category | String | - | - | Required |
| message_content | Text | - | - | Required |
| sent_at | DateTime | - | - | Optional |
| status | String | - | - | Optional |

## Table: `dental_inventory_items`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| item_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| name | String | - | INDEX | Required |
| category | String | - | - | Optional |
| sku_code | String | - | - | Optional |
| current_stock | Integer | - | - | Optional |
| reorder_point | Integer | - | - | Optional |
| unit_of_measure | String | - | - | Optional |
| expiry_date | DateTime | - | - | Optional |
| last_restocked | DateTime | - | - | Optional |

## Table: `dental_inventory_transactions`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| txn_id | Integer | - | PK, INDEX | Primary Key |
| item_id | Integer | - | FK (dental_inventory_items.item_id) | Foreign Key |
| user_id | Integer | - | FK (users.user_id) | Foreign Key |
| change_type | String | - | - | Required |
| quantity | Integer | - | - | Required |
| notes | Text | - | - | Optional |
| timestamp | DateTime | - | - | Optional |

## Table: `ent_patients`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| ent_patient_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| chief_complaint | Text | - | - | Optional |
| ent_history | JSON | - | - | Optional |
| allergies | JSON | - | - | Optional |
| family_ent_history | JSON | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

## Table: `audiometry_tests`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| test_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| audiologist_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| test_type | String | - | - | Required |
| results | JSON | - | - | Optional |
| hearing_loss_degree | String | - | - | Optional |
| recommendations | Text | - | - | Optional |
| test_date | DateTime | - | - | Optional |

## Table: `ent_examinations`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| exam_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| examiner_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| examination_data | JSON | - | - | Optional |
| findings | Text | - | - | Optional |
| exam_date | DateTime | - | - | Optional |

## Table: `ent_surgeries`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| surgery_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| surgeon_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| procedure_code | String | - | - | Optional |
| surgery_type | String | - | - | Required |
| scheduled_date | DateTime | - | - | Optional |
| duration_minutes | Integer | - | - | Optional |
| anesthesia_type | String | - | - | Optional |
| pre_op_notes | Text | - | - | Optional |
| post_op_notes | Text | - | - | Optional |
| status | String | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `opd_patients`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| opd_patient_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| blood_group | String | - | - | Optional |
| allergies | Text | - | - | Optional |
| chronic_conditions | JSON | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `opd_visits`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| visit_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| opd_patient_id | Integer | - | FK (opd_patients.opd_patient_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| visit_date | DateTime | - | - | Optional |
| temperature | Float | - | - | Optional |
| blood_pressure | String | - | - | Optional |
| pulse_rate | Integer | - | - | Optional |
| weight | Float | - | - | Optional |
| chief_complaint | Text | - | - | Optional |
| diagnosis | Text | - | - | Optional |
| treatment | Text | - | - | Optional |
| consultation_fee | Float | - | - | Optional |
| is_paid | Boolean | - | - | Optional |
| patient_invoice_id | Integer | - | FK (patient_invoices.invoice_id) | Foreign Key |
| is_mediclaim | Boolean | - | - | Optional |
| mediclaim_details | String | - | - | Optional |

## Table: `emergency_visits`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| emergency_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| visit_date | DateTime | - | - | Optional |
| triage_level | String | - | - | Optional |
| mode_of_arrival | String | - | - | Optional |
| is_medico_legal | Boolean | - | - | Optional |
| police_station | String | - | - | Optional |
| ambulance_driver | String | - | - | Optional |
| temperature | Float | - | - | Optional |
| blood_pressure | String | - | - | Optional |
| pulse_rate | Integer | - | - | Optional |
| weight | Float | - | - | Optional |
| chief_complaint | Text | - | - | Optional |
| diagnosis | Text | - | - | Optional |
| treatment | Text | - | - | Optional |
| notes | Text | - | - | Optional |
| status | String | - | - | Optional |
| is_mediclaim | Boolean | - | - | Optional |
| mediclaim_details | String | - | - | Optional |

## Table: `prescriptions`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| prescription_id | Integer | - | PK, INDEX | Primary Key |
| visit_id | Integer | - | FK (opd_visits.visit_id) | Foreign Key |
| medicine_name | String | - | - | Required |
| dosage | String | - | - | Required |
| frequency | String | - | - | Required |
| duration | String | - | - | Required |
| instructions | Text | - | - | Optional |

## Table: `wards`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| ward_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| ward_name | String | - | - | Required |
| ward_type | String | - | - | Required |
| floor_number | String | - | - | Optional |
| total_beds | Integer | - | - | Required |
| daily_charge | Float | - | - | Optional |
| occupied_beds | Integer | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `beds`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| bed_id | Integer | - | PK, INDEX | Primary Key |
| ward_id | Integer | - | FK (wards.ward_id) | Foreign Key |
| bed_number | String | - | - | Required |
| is_occupied | Boolean | - | - | Optional |
| status | String | - | - | Optional |

## Table: `ipd_admissions`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| admission_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| admission_date | DateTime | - | - | Required |
| discharge_date | DateTime | - | - | Optional |
| ward_id | Integer | - | FK (wards.ward_id) | Foreign Key |
| bed_id | Integer | - | FK (beds.bed_id) | Foreign Key |
| admitting_doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| diagnosis | Text | - | - | Optional |
| treatment_plan | Text | - | - | Optional |
| status | String | - | - | Optional |
| vitals_log | JSON | - | - | Optional |
| medication_orders | JSON | - | - | Optional |
| medication_log | JSON | - | - | Optional |
| doctor_notes | JSON | - | - | Optional |
| fluid_balance_log | JSON | - | - | Optional |
| pre_op_assessment | JSON | - | - | Optional |
| post_op_assessment | JSON | - | - | Optional |
| ot_required | Boolean | - | - | Optional |
| patient_invoice_id | Integer | - | FK (patient_invoices.invoice_id) | Foreign Key |
| is_mediclaim | Boolean | - | - | Optional |
| mediclaim_details | String | - | - | Optional |

## Table: `operation_theaters`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| ot_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| ot_name | String | - | - | Required |
| ot_type | String | - | - | Optional |
| status | String | - | - | Optional |
| current_patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| current_doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| scheduled_start | DateTime | - | - | Optional |
| scheduled_end | DateTime | - | - | Optional |
| current_surgery_name | String | - | - | Optional |
| current_anesthesia_type | String | - | - | Optional |
| anesthesiologist_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| current_diagnosis | Text | - | - | Optional |
| special_requirements | Text | - | - | Optional |

## Table: `surgeries`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| surgery_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| admission_id | Integer | - | FK (ipd_admissions.admission_id) | Foreign Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| ot_id | Integer | - | FK (operation_theaters.ot_id) | Foreign Key |
| surgery_name | String | - | - | Required |
| status | String | - | - | Optional |
| pre_op_assessment | JSON | - | - | Optional |
| post_op_assessment | JSON | - | - | Optional |
| doctor_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| anesthesiologist_id | Integer | - | FK (doctor_profiles.profile_id) | Foreign Key |
| created_at | DateTime | - | - | Optional |

## Table: `medical_equipments`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| equipment_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| name | String | - | - | Required |
| equipment_type | String | - | - | Required |
| status | String | - | - | Optional |
| current_ward_id | Integer | - | FK (wards.ward_id) | Foreign Key |
| current_bed_id | Integer | - | FK (beds.bed_id) | Foreign Key |
| current_ot_id | Integer | - | FK (operation_theaters.ot_id) | Foreign Key |
| current_patient_id | Integer | - | FK (patients.record_id) | Foreign Key |

## Table: `rfid_cards`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| rfid_id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| card_number | String | - | UNIQUE, INDEX | Required |
| patient_id | Integer | - | FK (patients.record_id), UNIQUE | Foreign Key |
| status | String | - | - | Optional |
| issued_at | DateTime | - | - | Optional |
| last_scanned_at | DateTime | - | - | Optional |

## Table: `system_error_logs`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK, INDEX | Primary Key |
| severity | String | - | - | Optional |
| module | String | - | - | Optional |
| message | Text | - | - | Required |
| traceback | Text | - | - | Optional |
| timestamp | DateTime | - | - | Optional |

## Table: `user_trusted_devices`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK, INDEX | Primary Key |
| user_id | Integer | - | FK (users.user_id), INDEX | Foreign Key |
| device_token_hash | String | - | INDEX | Required |
| device_name | String | - | - | Optional |
| last_used_at | DateTime | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `accounting_config`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| config_id | Integer | - | PK | Primary Key |
| current_fy | String | - | - | Optional |
| company_name | String | - | - | Optional |
| company_phone | String | - | - | Optional |
| company_address | Text | - | - | Optional |
| company_gst | String | - | - | Optional |
| company_pan | String | - | - | Optional |
| company_email | String | - | - | Optional |
| company_website | String | - | - | Optional |
| company_bank_name | String | - | - | Optional |
| company_bank_acc | String | - | - | Optional |
| company_bank_ifsc | String | - | - | Optional |
| company_bank_branch | String | - | - | Optional |
| invoice_prefix | String | - | - | Optional |
| invoice_prefix_nongst | String | - | - | Optional |
| receipt_prefix | String | - | - | Optional |
| expense_prefix | String | - | - | Optional |
| next_invoice_number | Integer | - | - | Optional |
| next_invoice_number_nongst | Integer | - | - | Optional |
| next_receipt_number | Integer | - | - | Optional |
| next_expense_number | Integer | - | - | Optional |
| number_format | String | - | - | Optional |

## Table: `accounting_vendors`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| vendor_id | Integer | - | PK, INDEX | Primary Key |
| name | String | - | - | Required |
| email | String | - | - | Optional |
| phone | String | - | - | Optional |
| address | Text | - | - | Optional |
| gst_number | String | - | - | Optional |
| is_active | Boolean | - | - | Optional |

## Table: `accounting_expenses`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| expense_id | Integer | - | PK, INDEX | Primary Key |
| voucher_number | String | - | UNIQUE, INDEX | Optional |
| category | String | - | - | Required |
| amount | Float | - | - | Required |
| tax_amount | Float | - | - | Optional |
| date | DateTime | - | - | Optional |
| payment_method | String | - | - | Optional |
| vendor_id | Integer | - | FK (accounting_vendors.vendor_id) | Foreign Key |
| description | String | - | - | Optional |

## Table: `accounting_transactions`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| transaction_id | Integer | - | PK, INDEX | Primary Key |
| date | DateTime | - | - | Optional |
| party_type | String | - | - | Required |
| party_id | Integer | - | - | Optional |
| voucher_type | String | - | - | Required |
| voucher_id | Integer | - | - | Optional |
| voucher_number | String | - | - | Optional |
| debit | Float | - | - | Optional |
| credit | Float | - | - | Optional |
| description | Text | - | - | Optional |
| created_at | DateTime | - | - | Optional |

## Table: `whatsapp_message_queue`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| id | Integer | - | PK, INDEX | Primary Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| phone_number | String | - | - | Required |
| message_text | Text | - | - | Required |
| status | String | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| sent_at | DateTime | - | - | Optional |
| error_message | Text | - | - | Optional |

## Table: `nursing_vitals_logs`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| log_id | Integer | - | PK, INDEX | Primary Key |
| admission_id | Integer | - | FK (ipd_admissions.admission_id) | Foreign Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| nurse_id | Integer | - | FK (users.user_id) | Foreign Key |
| blood_pressure | String | - | - | Optional |
| temperature | String | - | - | Optional |
| heart_rate | String | - | - | Optional |
| respiratory_rate | String | - | - | Optional |
| spO2 | String | - | - | Optional |
| notes | Text | - | - | Optional |
| logged_at | DateTime | - | - | Optional |

## Table: `mediclaim_claims`

| Field Name | Data Type | Size | Key | Description |
| :--- | :--- | :--- | :--- | :--- |
| claim_id | Integer | - | PK, INDEX | Primary Key |
| patient_id | Integer | - | FK (patients.record_id) | Foreign Key |
| hospital_id | Integer | - | FK (hospitals.hospital_id) | Foreign Key |
| visit_type | String | - | - | Required |
| visit_id | Integer | - | - | Required |
| policy_details | String | - | - | Optional |
| status | String | - | - | Optional |
| claimed_amount | Float | - | - | Optional |
| approved_amount | Float | - | - | Optional |
| created_at | DateTime | - | - | Optional |
| updated_at | DateTime | - | - | Optional |

