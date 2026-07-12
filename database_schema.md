# Core Database Schema

This document provides a high-level overview of the most critical database tables in the Digifort Labs project.

## Core Multi-Tenant Tables

### Table: `hospitals`
The central tenant model. Each hospital has its own subdomain, pricing, and settings.
* `hospital_id` (Integer, PK): Primary Key
* `legal_name` (String): Required
* `hospital_slug` (String): UNIQUE (used for subdomains)
* `email` (String): UNIQUE
* `subscription_tier` (String), `pricing_tier` (String)
* `is_active` (Boolean), `is_deleted` (Boolean)
* `custom_pricing` (JSON), `enabled_modules` (JSON)
* `id_generation_settings` (JSON), `trial_ends_at` (DateTime)

### Table: `users`
Users belonging to hospitals (doctors, staff, admins).
* `user_id` (Integer, PK)
* `hospital_id` (Integer, FK): The hospital this user belongs to
* `email` (String, UNIQUE), `full_name` (String), `phone` (String)
* `role` (String)
* `hashed_password` (String)
* `subdomain` (String, UNIQUE): Domain associated with the user

## Medical & Patient Tables

### Table: `patients`
Stores all patient demographics and core medical information.
* `record_id` (Integer, PK)
* `hospital_id` (Integer, FK)
* `uhid` (String): Unique Health ID
* `full_name` (String), `gender` (String), `age` (String), `phone` (String)
* `admission_date` (DateTime), `discharge_date` (DateTime)
* `total_bill_amount` (Float), `diagnosis` (Text)

### Table: `doctor_profiles`
Detailed profile for doctors, linked to a user account.
* `profile_id` (Integer, PK)
* `hospital_id` (Integer, FK)
* `user_id` (Integer, FK)
* `department_id` (Integer, FK)
* `full_name` (String), `specialization` (String)
* `consultation_fee` (Float), `ipd_charge` (Float)

### Table: `appointments`
Patient appointments with doctors.
* `appointment_id` (Integer, PK)
* `hospital_id` (Integer, FK)
* `patient_id` (Integer, FK)
* `doctor_id` (Integer, FK)
* `appointment_date` (DateTime)
* `start_time` (DateTime), `end_time` (DateTime)
* `status` (String), `visit_type` (String)

## Billing & Finance

### Table: `patient_invoices`
Invoices generated for patients.
* `invoice_id` (Integer, PK)
* `hospital_id` (Integer, FK)
* `patient_id` (Integer, FK)
* `invoice_number` (String, UNIQUE)
* `total_amount` (Float), `subtotal` (Float), `tax_amount` (Float)
* `status` (String)
* `payment_method` (String)

### Table: `patient_invoice_items`
Line items for each patient invoice.
* `item_id` (Integer, PK)
* `invoice_id` (Integer, FK)
* `description` (String)
* `qty` (Integer), `unit_price` (Float), `amount` (Float)

## Document Management

### Table: `pdf_files`
Uploaded medical records, scanned documents, etc.
* `file_id` (Integer, PK)
* `record_id` (Integer, FK): The patient this file belongs to
* `filename` (String), `file_path` (String)
* `ocr_text` (Text)
* `s3_key` (String)

## Physical Storage Tracking

### Table: `physical_boxes` & `physical_racks`
Tracking physical paper records stored in the warehouse.
* `box_id` (Integer, PK)
* `rack_id` (Integer, FK)
* `hospital_id` (Integer, FK)
* `label` (String), `status` (String)
