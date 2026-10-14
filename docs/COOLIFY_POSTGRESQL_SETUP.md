# Coolify PostgreSQL Setup Runbook (100% Free & Unlimited)

This guide walks you through provisioning a self-hosted PostgreSQL database in your **Coolify** instance for **Savage Gentlemen**.

---

## 1. Why Coolify PostgreSQL?
- **100% Free Forever ($0/month):** Runs inside a Docker container directly on your VPS.
- **Zero Quota Limits:** Unlimited compute hours, unlimited data, unlimited queries (no 100-hour Neon cap).
- **Blazing Fast:** Internal network communication between your app container and database container has zero external internet latency.

---

## 2. Step-by-Step Provisioning (2 Minutes)

### Step 1: Log into Coolify & Add PostgreSQL Resource
1. Open your **Coolify Dashboard**:
   - **URL:** [http://2.29.43.46:8000](http://2.29.43.46:8000/login)
   - **Login Email:** `savgmen@gmail.com`
   - **Password:** Your Coolify master password *(if forgotten, let me know and I can generate a reset token immediately via SSH)*.
2. Open your Project (`SavageGentlemen`) and select your Production environment.
3. Click **+ New Resource** (top right) &rarr; Select **Database** &rarr; Click **PostgreSQL**.
4. Configure database settings:
   - **Name:** `savage-postgres`
   - **Database Name:** `savagegentlemen` (or leave default `postgres`)
   - **User:** `postgres`
   - **Password:** (Leave Coolify's generated secure password or enter your own)
5. Click **Save** and then click **Start / Deploy**.

### Step 2: Grab the Internal Connection String
1. Once PostgreSQL is running (green status), look under **Connection Details**:
2. Find the **Internal Database URL** (for services inside the same Coolify Docker network):
   ```text
   postgresql://postgres:<PASSWORD>@<CONTAINER_NAME_OR_SERVICE>:5432/savagegentlemen
   ```
   *(Coolify also generates a helper variable like `DATABASE_URL`)*.

### Step 3: Link to Your SavageGentlemen Application
1. In Coolify, click on your **SavageGentlemen** web application resource.
2. Go to **Environment Variables**.
3. Update or add `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:<PASSWORD>@<CONTAINER_NAME_OR_SERVICE>:5432/savagegentlemen
   ```
4. Click **Save** and click **Redeploy**.

---

## 3. Database Initialization & Seeding

Once the application redeploys with the Coolify `DATABASE_URL`, initialize the database tables and ticket tiers:

### Option A: From Coolify Application Terminal (Easiest)
In Coolify, go to your **SavageGentlemen** application &rarr; click **Terminal** (or **Execute Command**):
```bash
# 1. Push schema tables
npm run db:push

# 2. Stage MOVE YUH RASS event & ticket tiers
npx tsx scripts/seed-staging-tickets.ts

# 3. Activate the 20 Free Unisex Tickets live!
npx tsx scripts/activate-free-tickets.ts
```

### Option B: From Your Local Machine (Using Coolify Public DB Port)
If you enabled public access on the Coolify PostgreSQL resource:
```bash
# Set temporary DATABASE_URL pointing to Coolify public port
export DATABASE_URL="postgresql://postgres:<PASSWORD>@<YOUR_SERVER_IP>:<COOLIFY_PORT>/savagegentlemen"

# Push schema and activate free tickets
npm run db:push
npx tsx scripts/seed-staging-tickets.ts
npx tsx scripts/activate-free-tickets.ts
```

---

## 4. Automatic Tier Progression in Action

Once activated, your event ticketing behaves dynamically:
1. **Tier 1 (Live Now):** 20 Free Unisex Admission tickets ($0.00).
2. **Auto-Trigger:** When all 20 are claimed, the engine seals the free tier and auto-activates:
   - **Early Bird Female:** $20.00 (30 tickets)
   - **Early Bird Male:** $20.00 (20 tickets)
3. **Subsequent Progression:** Female and male queues advance independently through General Admission ($30), Late Release ($40), and Door ($50).
