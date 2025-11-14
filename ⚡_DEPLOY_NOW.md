# ⚡ DEPLOY TO NEUTOBOTIX - QUICK START

## 🎯 **PROJECT: neutobotix**

Everything is configured! Just follow these 5 steps:

---

## 🚀 **STEP-BY-STEP DEPLOYMENT**

### **STEP 1: Run Setup (2 minutes)** ⚙️

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# One command to set everything up
./setup-cicd.sh
```

**This enables APIs and grants permissions** ✅

---

### **STEP 2: First Deployment (5 minutes)** 🚀

```bash
# Deploy to Cloud Run
./deploy.sh
```

**Wait for it to finish...**

**You'll get:** `https://wealthflow-xxxxx-uc.a.run.app`

**Your app is LIVE!** 🎉 Test it!

---

### **STEP 3: Connect GitHub (2 minutes)** 🔗

1. **Open:** https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

2. **Click:** `CONNECT REPOSITORY` button

3. **Select:** `GitHub (Cloud Build GitHub App)`

4. **Authorize:** Click through GitHub authorization

5. **Select:** `veeresh08/FinanceTracker` repository

6. **Connect:** Check box and click `CONNECT`

7. **Done:** Click `DONE`

---

### **STEP 4: Create Trigger (2 minutes)** 🎯

On the same page:

1. **Click:** `CREATE TRIGGER` button

2. **Fill in:**
   - **Name:** `auto-deploy-wealthflow`
   - **Event:** `Push to a branch`
   - **Repository:** `veeresh08/FinanceTracker`
   - **Branch:** `^main$`
   - **Configuration:** `Cloud Build configuration file`
   - **Location:** `/cloudbuild.yaml`

3. **Click:** `CREATE`

**Trigger created!** ✅

---

### **STEP 5: Test CI/CD (3 minutes)** 🧪

```bash
# Make a small change
echo "\n## 🚀 Deployed on neutobotix" >> README.md

# Push
git add .
git commit -m "🧪 Test auto-deployment"
git push origin main
```

**Watch build:** https://console.cloud.google.com/cloud-build/builds?project=neutobotix

**You'll see:**
- ⏱️ Build triggered automatically
- 🔨 Building... (3-5 minutes)
- ✅ Build succeeded
- 🚀 Deployed to Cloud Run
- 🎉 App updated!

**CI/CD WORKS!** 🎊

---

## 🎯 **THAT'S IT!**

From now on, every time you push to GitHub:

```bash
git push origin main
```

**= Automatic deployment in 4-5 minutes!** ⚡

---

## 📊 **VERIFY EVERYTHING**

### **Check Cloud Run Service:**
```bash
gcloud run services list --project neutobotix
```
**Should show:** `wealthflow` ✅

### **Get Your URL:**
```bash
gcloud run services describe wealthflow \
  --region us-central1 \
  --project neutobotix \
  --format 'value(status.url)'
```

### **Test Your App:**
```bash
# Get URL
URL=$(gcloud run services describe wealthflow --region us-central1 --project neutobotix --format 'value(status.url)')

# Test
curl "$URL/api/auth/status"

# Open
open "$URL"
```

---

## 🔄 **YOUR NEW WORKFLOW**

### **Old Way (Manual):**
```bash
1. Code changes
2. Build frontend
3. Build backend
4. Upload to server
5. Restart server
6. Test production
⏱️ Time: 20-30 minutes
```

### **New Way (Automatic):**
```bash
1. Code changes
2. git push origin main
3. ☕ Wait 4 minutes
✅ Done!
⏱️ Time: 4-5 minutes (automatic!)
```

**80% time saved!** 🚀

---

## 📱 **IMPORTANT LINKS**

### **Your Project:**
- **Console:** https://console.cloud.google.com/?project=neutobotix
- **Cloud Run:** https://console.cloud.google.com/run?project=neutobotix
- **Cloud Build:** https://console.cloud.google.com/cloud-build/builds?project=neutobotix
- **Triggers:** https://console.cloud.google.com/cloud-build/triggers?project=neutobotix

### **Your Code:**
- **GitHub:** https://github.com/veeresh08/FinanceTracker
- **Live App:** (get URL from Cloud Run)

---

## 💡 **QUICK COMMANDS**

```bash
# Deploy manually
./deploy.sh

# View builds
gcloud builds list --project neutobotix

# View logs
gcloud run services logs tail wealthflow \
  --region us-central1 --project neutobotix

# Get URL
gcloud run services describe wealthflow \
  --region us-central1 --project neutobotix \
  --format 'value(status.url)'

# Update service
gcloud run services update wealthflow \
  --region us-central1 --project neutobotix \
  --memory 2Gi
```

---

## 🎨 **CUSTOMIZE BUILD**

Edit `cloudbuild.yaml` to add steps:

```yaml
steps:
  # Add tests
  - name: 'node:18'
    entrypoint: npm
    args: ['test']

  # Add linting
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'lint']

  # Then build and deploy
  # (existing steps...)
```

---

## 🔔 **GET NOTIFIED**

Set up notifications:

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=neutobotix
2. Click your trigger
3. Edit → Notifications
4. Enable and add email
5. Save

**Get emails on every deployment!** 📧

---

## 🌐 **CUSTOM DOMAIN (Optional)**

Want `app.yourcompany.com`?

```bash
# Map domain
gcloud run domain-mappings create \
  --service wealthflow \
  --domain app.yourcompany.com \
  --region us-central1 \
  --project neutobotix

# Update DNS records as instructed
# SSL automatic!
```

---

## 💰 **COST (Estimate)**

With your traffic:
- **0-10K requests/month:** $0 (FREE!)
- **10-50K requests/month:** $0-2
- **50-100K requests/month:** $2-5

**Very affordable!** 💰

---

## 🎊 **SUCCESS CRITERIA**

You'll know it's working when:

✅ **After `git push`:**
- Build starts automatically in Cloud Build
- You see build logs
- Build completes successfully
- App deploys to Cloud Run
- Service URL works
- Changes are live

✅ **In Cloud Console:**
- Build trigger shows "Enabled"
- Last build shows "Success"
- Service shows "Healthy"
- Requests are being served

✅ **In Terminal:**
```bash
curl YOUR_CLOUD_RUN_URL/api/auth/status
# Returns: {"isAuthenticated": false} ✅
```

---

## 🎯 **IF YOU GET STUCK**

### **Issue: "Permission denied"**
```bash
# Run setup again
./setup-cicd.sh
```

### **Issue: "API not enabled"**
```bash
# Enable manually
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com --project neutobotix
```

### **Issue: "Build fails"**
```bash
# Check logs
gcloud builds list --project neutobotix --limit 1
# Copy BUILD_ID
gcloud builds log BUILD_ID --project neutobotix
```

---

## 📋 **FULL SETUP (All Commands)**

Copy and run:

```bash
# Navigate to project
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# 1. Setup
./setup-cicd.sh

# 2. First deploy
./deploy.sh

# 3. Connect GitHub & Create Trigger (do in browser)
open "https://console.cloud.google.com/cloud-build/triggers?project=neutobotix"

# 4. Test
echo "\n## Test" >> README.md
git add . && git commit -m "Test" && git push

# 5. Watch
open "https://console.cloud.google.com/cloud-build/builds?project=neutobotix"
```

**Done!** 🎉

---

## 🚀 **READY? LET'S GO!**

### **RUN THIS NOW:**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"
./setup-cicd.sh
```

**Then:**
```bash
./deploy.sh
```

**Then open browser and follow Steps 3-4 above!**

---

## 🎊 **YOU'RE ALMOST THERE!**

5 simple steps separate you from automatic deployments:

1. ⏳ Run `./setup-cicd.sh`
2. ⏳ Run `./deploy.sh`
3. ⏳ Connect GitHub (2 clicks)
4. ⏳ Create trigger (fill form)
5. ⏳ Test with `git push`

**Total time: 15 minutes**
**Result: Lifetime of automatic deployments!** 🚀

---

**Made with ❤️ - Let's get your app deployed!** ☁️🔥

**Start NOW with:** `./setup-cicd.sh` 🎯

