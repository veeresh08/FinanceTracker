# ☁️ DEPLOY TO NEUTOBOTIX - Your GCP Project

## 🎯 **YOUR PROJECT: neutobotix**

Complete step-by-step guide to deploy WealthFlow with CI/CD

---

## 🚀 **QUICK START (5 Steps)**

### **STEP 1: Run Setup Script**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Run CI/CD setup
./setup-cicd.sh
```

**This will:**
- ✅ Set project to `neutobotix`
- ✅ Enable all required APIs
- ✅ Grant Cloud Build permissions
- ✅ Configure everything automatically

**Takes ~2 minutes** ⏱️

---

### **STEP 2: Deploy First Time**

```bash
# Deploy to Cloud Run
./deploy.sh
```

**Or manually:**
```bash
gcloud run deploy wealthflow \
  --source . \
  --region us-central1 \
  --project neutobotix \
  --allow-unauthenticated \
  --port 3001
```

**Wait 4-5 minutes for first build...** ⏱️

**You'll get:** `https://wealthflow-xxxxx-uc.a.run.app`

**Your app is LIVE!** 🎉

---

### **STEP 3: Connect GitHub to Cloud Build**

#### **Open Cloud Build Console:**

https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

#### **Connect Repository:**

1. Click **"CONNECT REPOSITORY"** button
2. Select **"GitHub (Cloud Build GitHub App)"**
3. Click **"CONTINUE"**
4. **Authenticate with GitHub:**
   - Click "Authorize Google Cloud Build"
   - Login if needed
   - Click "Authorize"
5. **Select Repository:**
   - Find: `veeresh08/FinanceTracker`
   - Click the checkbox
   - Click "Connect"
6. Check **"I understand..."** box
7. Click **"CONNECT"**
8. Click **"DONE"**

**GitHub connected!** ✅

---

### **STEP 4: Create Build Trigger**

On the same page (Cloud Build Triggers):

1. Click **"CREATE TRIGGER"** button

2. **Fill in the form:**

   **Name:** `auto-deploy-wealthflow`

   **Description:** `Auto-deploy WealthFlow on push to main`

   **Region:** `global`

   **Event:** Select `Push to a branch`

   **Source:**
   - **Repository (Gen 2):** Select `veeresh08/FinanceTracker`
   - **Branch:** Type `^main$`
   - Include: Leave empty (deploy on any change)
   - Ignored file filter: Leave empty

   **Configuration:**
   - **Type:** `Cloud Build configuration file (yaml or json)`
   - **Location:** `/cloudbuild.yaml`

   **Service account:** Default (Cloud Build Service Account)

3. Click **"CREATE"**

**Trigger created!** 🎉

---

### **STEP 5: Test CI/CD**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Make a small change
echo "\n## 🚀 Auto-deployed from GitHub!" >> README.md

# Push to GitHub
git add .
git commit -m "🧪 Test automatic deployment"
git push origin main
```

**Go to:** https://console.cloud.google.com/cloud-build/builds?project=neutobotix

**Watch the magic happen:**
- ✅ Build triggers automatically
- ⏱️ Build in progress (3-5 minutes)
- ✅ Build succeeds
- ✅ App deploys to Cloud Run
- 🌐 App is live and updated!

**CI/CD IS WORKING!** 🎊

---

## 📋 **COMPLETE COMMAND LIST**

### **One-Time Setup:**

```bash
# 1. Set project
gcloud config set project neutobotix

# 2. Run setup script
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"
./setup-cicd.sh

# 3. First deployment
./deploy.sh

# 4. Connect GitHub (in browser)
open "https://console.cloud.google.com/cloud-build/triggers?project=neutobotix"
# Follow Step 3 above

# 5. Create trigger (in browser)
# Follow Step 4 above

# 6. Test
echo "\n## Test" >> README.md
git add . && git commit -m "Test" && git push
```

---

## 🔗 **YOUR GCP LINKS**

### **Cloud Run Dashboard:**
https://console.cloud.google.com/run?project=neutobotix

**See:**
- Your `wealthflow` service
- Request metrics
- Logs
- Revisions

### **Cloud Build:**
https://console.cloud.google.com/cloud-build/builds?project=neutobotix

**See:**
- Build history
- Real-time build logs
- Build duration
- Success/failure rates

### **Cloud Build Triggers:**
https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

**See:**
- Your triggers
- Trigger history
- Enable/disable triggers

### **Container Registry:**
https://console.cloud.google.com/gcr/images/neutobotix

**See:**
- Docker images
- Image tags
- Image sizes

---

## 🎯 **VERIFY SETUP**

### **Check Project:**
```bash
gcloud config get-value project
```
**Expected:** `neutobotix` ✅

### **Check APIs:**
```bash
gcloud services list --enabled --project neutobotix | grep -E "(run|build)"
```
**Expected:** 
- run.googleapis.com ✅
- cloudbuild.googleapis.com ✅

### **Check Cloud Run Service:**
```bash
gcloud run services list --project neutobotix --region us-central1
```
**Expected:** `wealthflow` service listed ✅

### **Check Permissions:**
```bash
PROJECT_NUMBER=$(gcloud projects describe neutobotix --format="value(projectNumber)")
gcloud projects get-iam-policy neutobotix \
  --flatten="bindings[].members" \
  --filter="bindings.members:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
```
**Expected:** 
- roles/run.admin ✅
- roles/iam.serviceAccountUser ✅
- roles/storage.admin ✅

---

## 🔄 **HOW CI/CD WORKS**

```
┌──────────────────────────────────────────────────┐
│ 1. YOU: Edit code locally                       │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 2. YOU: git push origin main                    │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 3. GITHUB: Webhook notifies Cloud Build         │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 4. CLOUD BUILD: (Automatic)                     │
│    - Clones your repository                      │
│    - Builds Docker image                         │
│    - Runs tests (if configured)                  │
│    - Pushes to Container Registry                │
│    - Time: ~3 minutes                            │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 5. CLOUD RUN: (Automatic)                       │
│    - Pulls new Docker image                      │
│    - Starts new container instances              │
│    - Routes traffic to new version               │
│    - Stops old instances                         │
│    - Time: ~1 minute                             │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 6. RESULT: Your app is updated! 🎉              │
│    URL: https://wealthflow-xxxxx.run.app         │
│    No downtime, automatic rollback on failure    │
└──────────────────────────────────────────────────┘
```

**Total time:** 4-5 minutes from push to live! ⚡

---

## 💡 **WHAT EACH FILE DOES**

### **Dockerfile**
- Multi-stage build configuration
- Builds frontend → Compiles backend → Creates production image
- Optimized size (~150MB)

### **cloudbuild.yaml**
- Tells Cloud Build how to build your app
- Steps: Build → Push → Deploy
- Runs automatically on git push

### **docker-compose.yml**
- For local Docker testing
- Not used in Cloud Run

### **deploy.sh**
- Manual deployment script
- Useful for quick manual deploys
- Uses project: neutobotix

### **setup-cicd.sh**
- One-time CI/CD setup
- Enables APIs
- Grants permissions

---

## 📊 **MONITORING DEPLOYMENTS**

### **Real-time Build Logs:**

**In Terminal:**
```bash
# List recent builds
gcloud builds list --project neutobotix --limit 5

# Stream latest build
gcloud builds log --stream $(gcloud builds list --project neutobotix --limit 1 --format="value(id)")
```

**In Browser:**
https://console.cloud.google.com/cloud-build/builds?project=neutobotix

### **Application Logs:**

```bash
# Real-time app logs
gcloud run services logs tail wealthflow \
  --region us-central1 \
  --project neutobotix
```

**In Browser:**
https://console.cloud.google.com/run/detail/us-central1/wealthflow/logs?project=neutobotix

---

## 🎨 **BUILD CUSTOMIZATION**

Edit `cloudbuild.yaml` to customize build:

```yaml
# Add build steps
steps:
  # Step 1: Run tests (optional)
  - name: 'node:18'
    entrypoint: npm
    args: ['test']
  
  # Step 2: Build image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/wealthflow:$COMMIT_SHA', '.']
  
  # Step 3: Push image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/wealthflow:$COMMIT_SHA']
  
  # Step 4: Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'wealthflow'
      - '--image'
      - 'gcr.io/$PROJECT_ID/wealthflow:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--project'
      - 'neutobotix'
```

---

## 🔔 **NOTIFICATIONS**

Get notified when builds succeed/fail:

### **Email Notifications:**

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=neutobotix
2. Click your trigger
3. Click "EDIT"
4. Scroll to "Notifications"
5. Click "Enable notifications"
6. Select "Email"
7. Add your email: `jveereshnaik@gmail.com`
8. Save

### **Slack Notifications:**

```bash
# Install Cloud Build Slack app
# https://console.cloud.google.com/marketplace/product/google/cloud-build
```

---

## 💰 **COST ESTIMATE**

### **Cloud Build:**
- **First 120 build-minutes/day:** FREE ✅
- **After:** $0.003 per build-minute
- **Your app build:** ~4 minutes = $0.012 per build

### **Cloud Run:**
- **First 2M requests/month:** FREE ✅
- **180,000 vCPU-seconds/month:** FREE ✅
- **360,000 GiB-seconds/month:** FREE ✅

### **Total Monthly Cost (Estimate):**
- **0-10 deploys:** $0 (within free tier)
- **Light traffic:** $0-1/month
- **Medium traffic:** $2-5/month
- **Heavy traffic:** $10-20/month

**Very affordable!** 💰

---

## 🎯 **DEPLOYMENT WORKFLOW**

### **Daily Development:**

```bash
# 1. Make changes
# (edit your code...)

# 2. Test locally
npm run server
cd client && npm run dev

# 3. Commit
git add .
git commit -m "✨ Add new feature"

# 4. Push to GitHub
git push origin main

# 5. AUTOMATIC DEPLOYMENT! 🚀
# - Cloud Build builds your app
# - Cloud Run deploys it
# - App is live in 4-5 minutes
# - You get notified (if configured)
```

**No manual deployment commands needed!** 🎉

---

## 📱 **YOUR DEPLOYED APP**

After deployment, your app will be at:

```
https://wealthflow-[unique-id]-uc.a.run.app
```

**Features:**
- ✅ **HTTPS** - Automatic SSL
- ✅ **Global CDN** - Fast worldwide
- ✅ **Auto-scaling** - 0 to 10 instances
- ✅ **Zero downtime** - Gradual traffic shift
- ✅ **Automatic rollback** - If deployment fails
- ✅ **Health monitoring** - Auto-restart on failure

---

## 🔧 **ADVANCED: Environment Variables**

Set production environment variables:

### **Create Secrets:**

```bash
# Google Client ID
echo "YOUR_GOOGLE_CLIENT_ID" | gcloud secrets create google-client-id \
  --data-file=- \
  --replication-policy="automatic" \
  --project neutobotix

# Google Client Secret
echo "YOUR_GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret \
  --data-file=- \
  --replication-policy="automatic" \
  --project neutobotix

# JWT Secret
echo "YOUR_JWT_SECRET_HERE" | gcloud secrets create jwt-secret \
  --data-file=- \
  --replication-policy="automatic" \
  --project neutobotix
```

### **Update Cloud Run to Use Secrets:**

```bash
gcloud run services update wealthflow \
  --region us-central1 \
  --project neutobotix \
  --update-secrets=GOOGLE_CLIENT_ID=google-client-id:latest \
  --update-secrets=GOOGLE_CLIENT_SECRET=google-client-secret:latest \
  --update-secrets=JWT_SECRET=jwt-secret:latest
```

### **Update cloudbuild.yaml:**

Add to deploy step:

```yaml
- '--update-secrets'
- 'GOOGLE_CLIENT_ID=google-client-id:latest'
- '--update-secrets'
- 'GOOGLE_CLIENT_SECRET=google-client-secret:latest'
- '--update-secrets'
- 'JWT_SECRET=jwt-secret:latest'
```

---

## 🐛 **TROUBLESHOOTING**

### **Build Fails:**

**Check logs:**
```bash
gcloud builds list --project neutobotix --limit 5
gcloud builds log LATEST_BUILD_ID --project neutobotix
```

**Common issues:**
- ❌ Dockerfile error → Check syntax
- ❌ Missing dependencies → Check package.json
- ❌ Permissions → Run `./setup-cicd.sh` again

---

### **Deploy Fails:**

**Check service:**
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

### **Trigger Not Working:**

**Verify trigger:**
```bash
gcloud builds triggers list --project neutobotix
```

**Check webhook:**
1. Go to GitHub: https://github.com/veeresh08/FinanceTracker/settings/hooks
2. Should see: `https://cloudbuild.googleapis.com/...`
3. Click it → Recent Deliveries
4. Should show successful pings

---

## 📊 **MONITORING**

### **Cloud Build Dashboard:**
https://console.cloud.google.com/cloud-build/dashboard?project=neutobotix

**Metrics:**
- Build success rate
- Build duration
- Build frequency

### **Cloud Run Metrics:**
https://console.cloud.google.com/run/detail/us-central1/wealthflow/metrics?project=neutobotix

**Metrics:**
- Request count
- Request latency
- Container instances
- CPU & Memory usage
- Error rate

---

## 🎯 **COMPLETE CHECKLIST**

### **Setup (One Time):**

- [ ] Install Google Cloud CLI: `brew install google-cloud-sdk`
- [ ] Login: `gcloud auth login`
- [ ] Set project: `gcloud config set project neutobotix`
- [ ] Run setup: `./setup-cicd.sh`
- [ ] First deploy: `./deploy.sh`
- [ ] Connect GitHub to Cloud Build
- [ ] Create build trigger
- [ ] Test with git push

### **Verify:**

- [ ] Service shows in Cloud Run dashboard
- [ ] Trigger shows in Cloud Build triggers
- [ ] Build succeeds after git push
- [ ] App is accessible at Cloud Run URL
- [ ] Logs are visible
- [ ] Health check passes

---

## 🚀 **YOUR DEPLOYMENT COMMANDS**

### **Manual Deploy:**
```bash
./deploy.sh
```

### **Check Status:**
```bash
gcloud run services describe wealthflow \
  --region us-central1 \
  --project neutobotix
```

### **View Logs:**
```bash
gcloud run services logs tail wealthflow \
  --region us-central1 \
  --project neutobotix
```

### **Get URL:**
```bash
gcloud run services describe wealthflow \
  --region us-central1 \
  --project neutobotix \
  --format 'value(status.url)'
```

---

## 🎊 **AFTER SETUP COMPLETE**

Your workflow becomes:

```bash
# Edit code
# Test locally
git add .
git commit -m "✨ New feature"
git push origin main
# ☕ Coffee break (4-5 minutes)
# ✅ App automatically deployed!
```

**That's it!** 🚀

---

## 📱 **SHARE YOUR LIVE APP**

After deployment:

```bash
# Get your URL
gcloud run services describe wealthflow \
  --region us-central1 \
  --project neutobotix \
  --format 'value(status.url)'
```

**Share it:**
- 💼 Add to resume
- 👔 Add to LinkedIn
- 🐦 Tweet it
- 📧 Show recruiters
- 🌍 Share with friends

---

## 💡 **PRO TIPS**

1. **Preview Deployments** - Create separate service for testing
2. **Custom Domain** - Make it professional
3. **Budget Alerts** - Set $10-20 monthly budget
4. **Monitoring** - Set up error alerts
5. **Backup Strategy** - Use Cloud SQL for production
6. **Branch Deployments** - Deploy dev branch to staging
7. **Rollback** - Keep 5-10 revisions for quick rollback

---

## 🎯 **QUICK REFERENCE**

### **Project Info:**
- **Project ID:** neutobotix
- **Service Name:** wealthflow
- **Region:** us-central1

### **Important URLs:**
- **Console:** https://console.cloud.google.com/?project=neutobotix
- **Cloud Run:** https://console.cloud.google.com/run?project=neutobotix
- **Cloud Build:** https://console.cloud.google.com/cloud-build/builds?project=neutobotix
- **Triggers:** https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

---

## 🎉 **CONGRATULATIONS!**

You now have:
- ✅ **Automated CI/CD pipeline**
- ✅ **Deploy on every git push**
- ✅ **Live app on Google Cloud**
- ✅ **Zero-downtime deployments**
- ✅ **Automatic rollback**
- ✅ **Production monitoring**
- ✅ **Enterprise-grade setup**

**You're running like a tech giant!** 🚀💪

---

**Made with ❤️ - Now push your code and watch it deploy automatically!** ☁️✨

