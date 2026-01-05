# AWS Fresh Start - Demo Hosting Guide

Follow these steps to set up your Digifort Labs demo on AWS for **Free**.

## Phase 1: Database (AWS RDS)
1. Log in to [AWS Console](https://console.aws.amazon.com/).
2. Search for **RDS** and click **Create database**.
3. Choose **Standard create** and **PostgreSQL**.
4. **Templates**: Select **Free Tier** (Crucial for $0 cost).
5. **Settings**:
   - DB instance identifier: `digifort-demo-db`
   - Master username: `postgres`
   - Master password: (Choose one and save it!)
6. **Connectivity**:
   - Public access: **Yes** (For demo purposes so we can init the tables).
   - VPC security group: Create new (Name: `allow-digifort-db-access`).
7. Click **Create database**.

---

## Phase 2: Backend (AWS App Runner)
1. Search for **App Runner** in the AWS Console.
2. Click **Create service**.
3. **Source**:
   - Repository type: **Source code repository** (Connect your GitHub).
   - Branch: `main` (or your preferred branch).
4. **Deployment settings**: Automatic (Every push will update the demo).
5. **Configuration**:
   - Runtime: `Python 3`
   - Build command: `pip install -r backend/requirements.txt`
   - Start command: `cd backend && bash start_prod.sh`
   - Port: `8000`
6. **Environment Variables**:
   - `DATABASE_URL`: `postgresql://postgres:PASSWORD@ENDPOINT:5432/postgres`
   - `ENVIRONMENT`: `production`
   - `DB_WAIT_ENABLED`: `false`

---

## Phase 3: Frontend (AWS Amplify)
1. Search for **AWS Amplify** in the AWS Console.
2. Click **New app** > **Host web app**.
3. Choose **GitHub** and authorize.
4. Select your `frontend` folder (or the whole repo if it's a monorepo).
5. **Build settings**: Amplify usually auto-detects Next.js.
6. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: (The URL provided by App Runner in Phase 2).
7. Click **Save and Deploy**.

---

## Phase 4: Final Link
Once both are live:
1. Copy the **App Runner URL** and put it in Amplify's `NEXT_PUBLIC_API_URL`.
2. Redeploy the Frontend.
3. Your demo is live! 🚀

> [!TIP]
> **Domain Linking**: We will link `digifortlabs.com` only after you verify the demo works.
