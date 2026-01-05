# Implementation Plan - Update Hospital Registration Form

## Objective
Update the hospital registration (onboarding) form in the Super Admin dashboard to include all necessary information fields and fix the UI/JSX structure.

## Proposed Changes

### Frontend Improvements
- Update `newHospital` state in `super-admin/page.tsx` with missing fields (`director_name`, `registration_number`, `phone`, `state`).
- Redesign the Onboard Modal to group fields logically (Basic, Legal, Location, Account).
- Update `handleOnboard` to send all fields to the backend.
- Fix broken JSX tags and structure in the Super Admin page.

## Detailed Tasks

### 1. State & Logic Updates
- [ ] Update `newHospital` state definition.
- [ ] Update `handleOnboard` to include new fields in API call.
- [ ] Update state reset in `handleOnboard` and `handleNewHospitalSubmit`.

### 2. UI Updates (Registration Form)
- [ ] Add "Director Name" field.
- [ ] Add "Registration Number" field.
- [ ] Add "Phone Number" field.
- [ ] Add "State" field.
- [ ] Restore/Fix "Subscription Tier" selection.
- [ ] Group fields into sections for better UX.

### 3. Code Quality / Bug Fix
- [ ] Resolve JSX syntax errors (extra/missing braces/tags).

## Verification Plan
- [ ] Manually test onboarding a new hospital.
- [ ] Verify all fields are captured and sent to the API.
- [ ] Check for any remaining lint errors.
