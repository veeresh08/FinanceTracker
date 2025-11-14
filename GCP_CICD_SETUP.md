# ☁️ GOOGLE CLOUD CI/CD SETUP - Complete Guide

## Project: **neutobotix**
## Service: **wealthflow**
## Region: **us-central1**

---

## 🎯 **WHAT WE'RE BUILDING:**

```
GitHub Push → Cloud Build → Cloud Run → Live App!
    ↓            ↓             ↓           ↓
  main       Build Docker   Deploy      Auto-update
  branch     Container      Service     Your app
```

**Every git push automatically deploys your app!** 🚀

---

## 📋 **COMPLETE STEP-BY-STEP GUIDE**

### **STEP 1: Install Google Cloud CLI**

**Mac:**
```bash
brew install google-cloud-sdk
```

**Verify installation:**
```bash
gcloud --version
```

---

### **STEP 2: Login & Set Project**

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project neutobotix

# Verify
gcloud config get-value project
```

**Expected output:** `neutobotix` ✅

---

### **STEP 3: Enable Required APIs**

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# Enable Secret Manager API (for environment variables)
gcloud services enable secretmanager.googleapis.com
```

**This takes 1-2 minutes.** ⏱️

---

### **STEP 4: Create Cloud Run Service (First Time)**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Deploy for the first time
gcloud run deploy wealthflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --project neutobotix \
  --allow-unauthenticated \
  --port 3001 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300
```

**Wait 3-5 minutes for first deployment...** ⏱️

**You'll get a URL like:**
```
https://wealthflow-xxxxx-uc.a.run.app
```

**Save this URL!** 🔖

---

### **STEP 5: Connect GitHub to Cloud Build**

#### **5.1: Go to Cloud Build Console**

Open: https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

#### **5.2: Connect GitHub Repository**

1. Click **"CONNECT REPOSITORY"** button
2. Select **"GitHub (Cloud Build GitHub App)"**
3. Click **"Continue"**
4. Click **"Authorize Google Cloud Build"** (authorize with GitHub)
5. Select your repository: **`veeresh08/FinanceTracker`**
6. Click **"Connect"**
7. Click **"Done"**

**Now Cloud Build can access your GitHub repo!** ✅

---

### **STEP 6: Create Build Trigger**

#### **6.1: Create Trigger**

On the Cloud Build Triggers page:

1. Click **"CREATE TRIGGER"** button
2. Fill in details:

**Name:** `deploy-on-push`

**Description:** `Auto-deploy WealthFlow on push to main`

**Event:** Select `Push to a branch`

**Source:**
- **Repository:** `veeresh08/FinanceTracker`
- **Branch:** `^main$` (regex pattern for main branch)

**Configuration:**
- **Type:** Select `Cloud Build configuration file (yaml or json)`
- **Location:** `/cloudbuild.yaml`

**Advanced (Optional):**
- Substitution variables:
  - `_REGION` = `us-central1`
  - `_SERVICE_NAME` = `wealthflow`

3. Click **"CREATE"** button

**Trigger created!** 🎉

---

### **STEP 7: Grant Cloud Build Permissions**

Cloud Build needs permission to deploy to Cloud Run:

```bash
# Get Cloud Build service account
PROJECT_NUMBER=$(gcloud projects describe neutobotix --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

# Grant Artifact Registry Writer role
gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer"
```

**Permissions granted!** 🔐

---

### **STEP 8: Test CI/CD Pipeline**

#### **8.1: Make a Small Change**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Make a small change (example: update README)
echo "\n## 🚀 Deployed on Google Cloud Run!" >> README.md

# Commit and push
git add .
git commit -m "🚀 Test CI/CD deployment"
git push origin main
```

#### **8.2: Watch the Build**

Go to: https://console.cloud.google.com/cloud-build/builds?project=neutobotix

**You'll see:**
- ✅ Build triggered automatically
- ⏱️ Build in progress (~3-5 minutes)
- ✅ Build successful
- ✅ Deployed to Cloud Run
- 🌐 App updated automatically!

**Your app auto-deployed!** 🎉

---

## 📊 **VERIFY EVERYTHING IS WORKING**

### **Check Cloud Run Service:**

```bash
gcloud run services describe wealthflow \
  --region us-central1 \
  --project neutobotix
```

### **Get Your Live URL:**

```bash
gcloud run services describe wealthflow \
  --region us-central1 \
  --project neutobotix \
  --format 'value(status.url)'
```

### **Test Your Live App:**

```bash
# Get URL
URL=$(gcloud run services describe wealthflow --region us-central1 --project neutobotix --format 'value(status.url)')

# Test health check
curl $URL/api/auth/status

# Open in browser
open $URL
```

---

## 🔄 **CI/CD WORKFLOW (Automatic)**

From now on, whenever you push to GitHub:

```bash
# 1. Make changes to your code
# (edit files...)

# 2. Commit and push
git add .
git commit -m "✨ Add new feature"
git push origin main

# 3. Magic happens automatically! ✨
# - GitHub webhook triggers Cloud Build
# - Cloud Build builds Docker image
# - Cloud Build deploys to Cloud Run
# - Your app updates automatically!
```

**No manual deployment needed!** 🎉

---

## 📁 **Cloud Build Configuration**

Your `cloudbuild.yaml` file controls the deployment:

```yaml
steps:
  1. Build Docker image
  2. Push to Container Registry
  3. Deploy to Cloud Run
```

**Build time:** 3-5 minutes
**Automatic rollback:** If deployment fails
**Zero downtime:** New version gradually replaces old

---

## 🔐 **Environment Variables (Production)**

Set secrets for production:

### **Create Secrets:**

```bash
# Create secret for Google Client ID
echo "YOUR_GOOGLE_CLIENT_ID" | gcloud secrets create google-client-id \
  --data-file=- \
  --replication-policy="automatic" \
  --project neutobotix

# Create secret for Google Client Secret
echo "YOUR_GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret \
  --data-file=- \
  --replication-policy="automatic" \
  --project neutobotix

# Create secret for JWT
echo "YOUR_SUPER_SECRET_JWT_KEY" | gcloud secrets create jwt-secret \
  --data-file=- \
  --replication-policy="automatic" \
  --project neutobotix
```

### **Update cloudbuild.yaml to Use Secrets:**

Add to the deploy step in `cloudbuild.yaml`:

```yaml
- '--set-secrets'
- 'GOOGLE_CLIENT_ID=google-client-id:latest'
- '--set-secrets'
- 'GOOGLE_CLIENT_SECRET=google-client-secret:latest'
- '--set-secrets'
- 'JWT_SECRET=jwt-secret:latest'
```

---

## 📊 **MONITORING & LOGS**

### **View Build Logs:**

**In Browser:**
https://console.cloud.google.com/cloud-build/builds?project=neutobotix

**In Terminal:**
```bash
# List recent builds
gcloud builds list --limit 5 --project neutobotix

# View specific build
gcloud builds log BUILD_ID --project neutobotix
```

### **View Service Logs:**

**In Browser:**
https://console.cloud.google.com/run/detail/us-central1/wealthflow/logs?project=neutobotix

**In Terminal:**
```bash
# Real-time logs
gcloud run services logs tail wealthflow \
  --region us-central1 \
  --project neutobotix

# Recent logs
gcloud run services logs read wealthflow \
  --region us-central1 \
  --project neutobotix \
  --limit 50
```

---

## 🎯 **COMPLETE SETUP CHECKLIST**

### **Initial Setup (ONE TIME):**

- [ ] Install Google Cloud CLI
- [ ] Login: `gcloud auth login`
- [ ] Set project: `gcloud config set project neutobotix`
- [ ] Enable APIs (run the commands in Step 3)
- [ ] Deploy first time: `gcloud run deploy wealthflow --source .`
- [ ] Connect GitHub repository to Cloud Build
- [ ] Create build trigger
- [ ] Grant Cloud Build permissions
- [ ] Test CI/CD with a push

### **Daily Workflow:**

- [ ] Make code changes
- [ ] Test locally
- [ ] Commit: `git commit -m "message"`
- [ ] Push: `git push origin main`
- [ ] **AUTOMATIC**: Cloud Build deploys!
- [ ] Wait 3-5 minutes
- [ ] Check your live URL
- [ ] **App updated!** 🎉

---

## 🚀 **DEPLOYMENT SCRIPT (Updated)**

Your `deploy.sh` is already configured for `neutobotix`:

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"
./deploy.sh
```

**This will:**
1. Set project to `neutobotix`
2. Deploy to Cloud Run
3. Show you the live URL

---

## 📱 **AUTOMATIC DEPLOYMENT FLOW**

```
┌─────────────────────────────────────────────────────────┐
│  YOU: Push to GitHub (main branch)                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  GITHUB: Webhook triggers Cloud Build                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  CLOUD BUILD:                                           │
│  1. Clone your repository                               │
│  2. Build Docker image (multi-stage)                    │
│  3. Push to Container Registry                          │
│  4. Deploy to Cloud Run                                 │
│  ⏱️  Total time: 3-5 minutes                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  CLOUD RUN:                                             │
│  1. Pull new container                                  │
│  2. Start new instances                                 │
│  3. Route traffic gradually                             │
│  4. Stop old instances                                  │
│  ✅ Zero downtime deployment!                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  RESULT: Your app is updated and live! 🎉              │
│  URL: https://wealthflow-xxxxx-uc.a.run.app            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 **CLOUD BUILD TRIGGER SETTINGS**

Here's exactly what to configure:

### **Basic Settings:**
- **Name:** `deploy-wealthflow-on-push`
- **Description:** `Auto-deploy WealthFlow to Cloud Run on push to main`
- **Tags:** `deploy`, `production`, `auto`

### **Event:**
- **Event:** `Push to a branch`

### **Source:**
- **Repository:** `github_veeresh08_FinanceTracker` (will appear after connecting)
- **Branch:** `^main$`

### **Configuration:**
- **Type:** `Cloud Build configuration file (yaml or json)`
- **Location:** `/ cloudbuild.yaml` (in root)

### **Advanced Settings (Optional):**
- **Substitution variables:**
  - `_REGION` = `us-central1`
  - `_SERVICE_NAME` = `wealthflow`
  - `_PROJECT_ID` = `neutobotix`

### **Filters (Optional):**
- **Include files:** (leave empty to build on any change)
- **Ignore files:** `docs/**`, `*.md` (skip docs changes)

---

## 🎬 **VIDEO WALKTHROUGH (Text Steps)**

### **Connect GitHub to Cloud Build:**

1. **Go to:** https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

2. **Click:** "CONNECT REPOSITORY" button (blue button)

3. **Select Source:** Choose "GitHub (Cloud Build GitHub App)"

4. **Authenticate:** 
   - Click "Continue"
   - If asked, click "Authorize Google Cloud Build"
   - Login to GitHub if needed

5. **Select Repository:**
   - You'll see your repositories
   - Find and click: `veeresh08/FinanceTracker`
   - Click "Connect repository"
   - Check the box "I understand..."
   - Click "Connect"

6. **Skip trigger creation** (we'll do it manually)
   - Click "Done"

**Repository connected!** ✅

---

### **Create Build Trigger:**

1. **Click:** "CREATE TRIGGER" button

2. **Fill in:**

   **Name:** `deploy-wealthflow-on-push`

   **Region:** `global` (or `us-central1`)

   **Description:** `Auto-deploy WealthFlow to Cloud Run on push to main branch`

   **Event:** Select `Push to a branch`

   **Source:**
   - Repository: `github_veeresh08_FinanceTracker`
   - Branch: Type `^main$`

   **Configuration:**
   - Type: Select `Cloud Build configuration file`
   - Location: Type `/cloudbuild.yaml`

3. **Click:** "CREATE" button (blue button at bottom)

**Trigger created!** 🎉

---

### **Grant Permissions:**

Run these commands:

```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe neutobotix --format="value(projectNumber)")

# Cloud Build service account
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

# Grant Storage Admin (for Container Registry)
gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/storage.admin"

echo "✅ Permissions granted!"
```

**This allows Cloud Build to deploy to Cloud Run!** 🔐

---

## ✅ **VERIFY CI/CD IS WORKING**

### **Test 1: Make a Small Change**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Add a test line to README
echo "\n## 🚀 Auto-deployed with CI/CD!" >> README.md

# Commit and push
git add .
git commit -m "🧪 Test CI/CD pipeline"
git push origin main
```

### **Test 2: Watch the Build**

**Option A: In Browser**

Go to: https://console.cloud.google.com/cloud-build/builds?project=neutobotix

**You'll see:**
- New build started automatically ✅
- Build progress in real-time
- Logs showing each step
- Final status: SUCCESS ✅

**Option B: In Terminal**

```bash
# Watch builds
gcloud builds list --ongoing --project neutobotix

# Follow a specific build
gcloud builds log --stream BUILD_ID --project neutobotix
```

### **Test 3: Verify Deployment**

```bash
# Get service URL
URL=$(gcloud run services describe wealthflow --region us-central1 --project neutobotix --format 'value(status.url)')

# Test it
curl $URL/api/auth/status

# Open in browser
open $URL
```

**If you see your updated app, CI/CD is working!** 🎉

---

## 🎨 **COMPLETE COMMANDS (Copy & Paste)**

### **Full Setup Script:**

```bash
#!/bin/bash
# Complete CI/CD Setup for neutobotix

echo "🚀 Setting up CI/CD for neutobotix..."

# Set project
gcloud config set project neutobotix

# Enable APIs
echo "📦 Enabling APIs..."
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# Get project number
PROJECT_NUMBER=$(gcloud projects describe neutobotix --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant permissions
echo "🔐 Granting permissions..."
gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/storage.admin"

echo "✅ Setup complete!"
echo "🌐 Now connect GitHub repository manually in Cloud Console"
echo "👉 https://console.cloud.google.com/cloud-build/triggers?project=neutobotix"
```

**Save as `setup-cicd.sh` and run:**
```bash
chmod +x setup-cicd.sh
./setup-cicd.sh
```

---

## 📊 **MONITORING YOUR DEPLOYMENTS**

### **Cloud Build Dashboard:**
https://console.cloud.google.com/cloud-build/dashboard?project=neutobotix

**Shows:**
- Build history
- Success/failure rate
- Build duration
- Trigger activity

### **Cloud Run Dashboard:**
https://console.cloud.google.com/run?project=neutobotix

**Shows:**
- Active services
- Request count
- Latency
- Error rate
- Cost estimate

---

## 🔔 **SET UP NOTIFICATIONS**

Get notified on Slack/Email when deployments succeed/fail:

### **Email Notifications:**

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=neutobotix
2. Click your trigger: `deploy-wealthflow-on-push`
3. Click "EDIT"
4. Scroll to "Notifications"
5. Select notification channel
6. Save

### **Slack Notifications:**

```bash
# Install Slack app from GCP Marketplace
# Then configure webhook in Cloud Build settings
```

---

## 💰 **COST MONITORING**

### **Set Budget Alert:**

```bash
# Create budget
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="WealthFlow Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

**You'll get email alerts at 50%, 90%, and 100% of budget!** 📧

---

## 🐛 **TROUBLESHOOTING**

### **Build Fails:**

**Check logs:**
```bash
gcloud builds list --limit 5 --project neutobotix
gcloud builds log LATEST_BUILD_ID --project neutobotix
```

**Common issues:**
- ❌ Dockerfile syntax error → Check `Dockerfile`
- ❌ Missing dependencies → Check `package.json`
- ❌ Build timeout → Increase timeout in `cloudbuild.yaml`

---

### **Deploy Fails:**

**Check permissions:**
```bash
# List IAM policies
gcloud projects get-iam-policy neutobotix \
  --flatten="bindings[].members" \
  --filter="bindings.members:cloudbuild"
```

**Should show:**
- ✅ `roles/run.admin`
- ✅ `roles/iam.serviceAccountUser`
- ✅ `roles/storage.admin`

---

### **App Not Working:**

**Check service status:**
```bash
gcloud run services describe wealthflow \
  --region us-central1 \
  --project neutobotix
```

**Check logs:**
```bash
gcloud run services logs tail wealthflow \
  --region us-central1 \
  --project neutobotix
```

---

## 📈 **SCALING CONFIGURATION**

Your app auto-scales based on traffic:

**Current Settings:**
- Min instances: 0 (scales to zero = $0 when idle)
- Max instances: 10 (handles up to ~800 concurrent requests)
- Concurrency: 80 (requests per instance)

**Adjust if needed:**

```bash
gcloud run services update wealthflow \
  --region us-central1 \
  --project neutobotix \
  --min-instances 1 \
  --max-instances 20 \
  --concurrency 100
```

---

## 🌐 **CUSTOM DOMAIN (Optional)**

Want `app.yourcompany.com`?

```bash
# Verify domain
gcloud domains verify yourcompany.com --project neutobotix

# Map domain to Cloud Run
gcloud run domain-mappings create \
  --service wealthflow \
  --domain app.yourcompany.com \
  --region us-central1 \
  --project neutobotix

# Update DNS as instructed
# SSL/HTTPS automatic!
```

---

## 🎯 **YOUR DEPLOYMENT URLs**

### **Development:**
```
Frontend: http://localhost:5173
Backend:  http://localhost:3001
```

### **Production (Cloud Run):**
```
Live App: https://wealthflow-xxxxx-uc.a.run.app
API:      https://wealthflow-xxxxx-uc.a.run.app/api/
```

---

## 📊 **BUILD & DEPLOY TIMES**

**First Deployment:**
- Build Docker image: ~4 minutes
- Deploy to Cloud Run: ~1 minute
- **Total: ~5 minutes**

**Subsequent Deployments:**
- Build (cached layers): ~2 minutes
- Deploy: ~1 minute
- **Total: ~3 minutes**

---

## 🎉 **SUCCESS INDICATORS**

After setup, you should see:

✅ **In Cloud Build:**
- Trigger appears in triggers list
- Status: "Enabled"
- Last run: "Success"

✅ **In Cloud Run:**
- Service: `wealthflow`
- Status: "Healthy"
- URL: Active

✅ **In GitHub:**
- Commit shows "✓" (deployment succeeded)
- Actions tab shows build history

---

## 🔄 **ROLLBACK (If Needed)**

If deployment breaks something:

```bash
# List revisions
gcloud run revisions list \
  --service wealthflow \
  --region us-central1 \
  --project neutobotix

# Rollback to previous revision
gcloud run services update-traffic wealthflow \
  --to-revisions PREVIOUS_REVISION=100 \
  --region us-central1 \
  --project neutobotix
```

**App instantly reverted!** ⏮️

---

## 🎊 **FINAL COMMANDS TO RUN**

### **One-Time Setup:**

```bash
# 1. Set project
gcloud config set project neutobotix

# 2. Enable APIs (copy entire block)
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# 3. First deployment
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"
gcloud run deploy wealthflow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001

# 4. Grant permissions (copy entire block)
PROJECT_NUMBER=$(gcloud projects describe neutobotix --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding neutobotix \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/storage.admin"

# 5. Connect GitHub (do this in browser)
# https://console.cloud.google.com/cloud-build/triggers?project=neutobotix
# Click "CONNECT REPOSITORY" and follow steps above
```

### **Test CI/CD:**

```bash
# Make a change
echo "\n## ✅ Deployed on Google Cloud Run" >> README.md

# Push
git add .
git commit -m "🚀 Test CI/CD deployment"
git push origin main

# Watch build
open "https://console.cloud.google.com/cloud-build/builds?project=neutobotix"
```

---

## 🎯 **EXPECTED RESULT**

After completing all steps:

1. **Push to GitHub** → Automatic build starts
2. **Cloud Build** → Builds Docker image
3. **Cloud Run** → Deploys new version
4. **Your app** → Updated automatically!
5. **Total time:** 3-5 minutes

**Every push to `main` branch triggers deployment!** 🚀

---

## 📞 **NEED HELP?**

### **Google Cloud Console:**
- **Cloud Run:** https://console.cloud.google.com/run?project=neutobotix
- **Cloud Build:** https://console.cloud.google.com/cloud-build/builds?project=neutobotix
- **Triggers:** https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

### **Documentation:**
- **Cloud Run:** https://cloud.google.com/run/docs
- **Cloud Build:** https://cloud.google.com/build/docs
- **GitHub Integration:** https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github

---

## 🎉 **YOU'RE ALL SET!**

Your CI/CD pipeline is configured and ready!

**From now on:**
```bash
git push origin main
```

**= Automatic deployment!** 🚀

---

**Made with ❤️ - Your app is now enterprise-grade!** ☁️✨

**Questions? Issues? Just ask!** 💬

