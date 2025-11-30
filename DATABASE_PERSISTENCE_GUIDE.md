# 🪣 Database Persistence Setup for Cloud Run

## Problem
SQLite database gets deleted when Cloud Run container restarts, causing data loss.

## Solution
Use **Google Cloud Storage (GCS)** to persist the database!

---

## 📋 How It Works

```
┌─────────────────┐
│  Container      │
│  Starts         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Download DB    │
│  from GCS       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  App Runs       │
│  (use SQLite)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Periodic       │
│  Backup to GCS  │
│  (every 10 min) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Container      │
│  Stops          │
│  (save to GCS)  │
└─────────────────┘
```

---

## 🔧 Setup Steps

### Step 1: Create GCS Bucket

```bash
# Create bucket for database backups
gsutil mb -p horizontal-data-435605-b9 -c STANDARD -l us-central1 gs://wealthflow-db-backup/

# Make it private (secure)
gsutil iam ch allUsers:legacyObjectReader gs://wealthflow-db-backup/
```

**Or via Console:**
1. Go to: https://console.cloud.google.com/storage/browser
2. Click "Create Bucket"
3. Name: `wealthflow-db-backup`
4. Location: `us-central1`
5. Storage class: `Standard`
6. Click "Create"

### Step 2: Give Cloud Run Permission to Access GCS

```bash
# Get the service account used by Cloud Run
SERVICE_ACCOUNT="325113757905-compute@developer.gserviceaccount.com"

# Give it permission to read/write from the bucket
gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:objectAdmin gs://wealthflow-db-backup/
```

### Step 3: Install GCS Package

Already added to package.json:
```json
"@google-cloud/storage": "^7.7.0"
```

### Step 4: Code Changes (Already Implemented)

In `server/server.ts`:
- Downloads database from GCS on startup
- Uploads database to GCS every 10 minutes
- Backs up on graceful shutdown (SIGTERM/SIGINT)
- Triggers backup after important operations (user creation, etc.)

---

## 🚀 Deploy

Once you push to GitHub:
1. Cloud Build runs
2. Builds Docker image with GCS support
3. Deploys to Cloud Run
4. Container starts and downloads database from GCS
5. Data persists across restarts!

---

## ✅ Verification

After deployment, check if it works:

```bash
# View logs
gcloud run services logs read wealthflow --region=us-central1 --limit=50

# Look for these messages:
# "📥 Downloading database from GCS..."
# "✅ Database downloaded from GCS"
# "✅ Database backed up to GCS"
```

---

## 💡 How It Helps

**Before (Without GCS):**
- Add loans → Container restarts → Data lost ❌

**After (With GCS):**
- Add loans → Backed up to GCS → Container restarts → Data restored ✅

---

## 🔒 Security

- Bucket is private (only your service account can access)
- Database encrypted at rest in GCS
- Automatic versioning in GCS (can restore old versions)

---

## 📊 Monitoring

```bash
# Check bucket contents
gsutil ls gs://wealthflow-db-backup/

# View database file info
gsutil ls -L gs://wealthflow-db-backup/database/loan-tracker.db

# Download database locally (for debugging)
gsutil cp gs://wealthflow-db-backup/database/loan-tracker.db ./loan-tracker-backup.db
```

---

## 🎉 Benefits

✅ **No Cloud SQL needed** - Keep using SQLite  
✅ **Simple** - Minimal code changes  
✅ **Cost-effective** - GCS storage is cheap  
✅ **Reliable** - Automatic backups  
✅ **Fast** - Local SQLite performance  
✅ **Portable** - Easy to download/backup  

---

## 🔧 Alternative: Cloud Storage FUSE (Advanced)

If you want real-time sync, you could use Cloud Storage FUSE, but it's more complex. The backup/restore approach is simpler and more reliable for SQLite.

---

**Your database will now persist in Cloud Run!** 🎊

