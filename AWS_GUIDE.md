# AWS Fresh Start - Demo Hosting Guide

**Follow these steps to finish setting up your Demo!**

## Phase 1: Database (RDS) ✅
**Status**: `Available`
**Endpoint**: `digifort-demo-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com`

---

## Phase 2: Backend (AWS App Runner)
**Action Required: Copy & Paste these values!**

1.  Go to [App Runner Console](https://ap-south-1.console.aws.amazon.com/apprunner/home?region=ap-south-1#/create).
2.  **Source**:
    *   **Repository Information**: Select **Generic App Runner GitHub connection** (or create new).
    *   **Repository URL**: `https://github.com/digifortlabs/digifortlabs.git`
    *   **Branch**: `master`
    *   **Directory**: `/`
3.  **Configure Build**:
    *   **Runtime**: `Python 3`
    *   **Build command**: `pip install -r backend/requirements.txt`
    *   **Start command**: `cd backend && bash start_prod.sh`
    *   **Port**: `8000`
4.  **Service settings**:
    *   **Service Name**: `digifort-backend`
    *   **Environment variables** (Click **Add environment variable**):
        *   `DATABASE_URL` = `postgresql://postgres:Digifort$2026!Strong@digifort-demo-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com:5432/postgres`
        *   `ENVIRONMENT` = `production`
        *   `DB_WAIT_ENABLED` = `false`
5.  **Click Create & Deploy**.

---

## Phase 3: Frontend (AWS Amplify)
**Setting this up AFTER Backend is ready.**

1.  Search for **AWS Amplify** in the AWS Console.
2.  Click **New app** > **Host web app** > **GitHub**.
3.  Select `digifortlabs/digifortlabs` repo and `master` branch.
4.  **Monorepo settings**:
    *   Check "The root of my app is inside a monorepo".
    *   Type: `frontend`
5.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL` = *(We will paste the App Runner URL here once Phase 2 finishes)*.
6.  Click **Save and Deploy**.

---

## Final Step
When the Backend is deployed, it will give you a default domain like `https://xyz.awsapprunner.com`.
We will copy that domain into Phase 3 to link them together!
