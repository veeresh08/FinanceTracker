# 🐳 Docker Deployment Guide - WealthFlow

Complete guide to containerize and deploy your app to **Google Cloud Run**

---

## 📋 **Prerequisites**

1. **Docker Desktop** installed
2. **Google Cloud CLI** (gcloud)
3. **Google Cloud Project** created

---

## 🚀 **QUICK START (3 Steps)**

### **Step 1: Build Docker Image**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

# Build the Docker image
docker build -t wealthflow:latest .
```

### **Step 2: Test Locally**

```bash
# Run the container
docker run -p 3001:3001 wealthflow:latest

# Or use docker-compose
docker-compose up
```

**Open:** http://localhost:3001

### **Step 3: Deploy to Google Cloud Run**

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud run deploy wealthflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001
```

**Done!** Your app will be live at: `https://wealthflow-xxxxx.run.app` 🎉

---

## 📦 **Dockerfile Explanation**

Your `Dockerfile` uses **multi-stage build** for optimization:

```
Stage 1: Build React Frontend
  ↓
Stage 2: Compile TypeScript Backend
  ↓
Stage 3: Create Production Image
  ├── Copy built frontend
  ├── Copy compiled backend
  ├── Install production dependencies only
  └── Final size: ~150MB (optimized!)
```

**Benefits:**
- ✅ Single image contains everything
- ✅ Small size (multi-stage build)
- ✅ Production-ready
- ✅ Secure (non-root user)
- ✅ Health checks included

---

## 🔧 **Before Building: Update server.ts**

Add this to serve frontend in production:

```typescript
// At the top of server/server.ts
import path from 'path';

// After all API routes, add:
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  const frontendPath = path.join(__dirname, '../client/dist');
  app.use(express.static(frontendPath));

  // Handle React routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}
```

---

## 🏗️ **Build Commands**

### **Build Image**
```bash
docker build -t wealthflow:latest .
```

### **Build with Tag**
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/wealthflow:v1.0 .
```

### **Build for Multiple Platforms**
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t wealthflow:latest .
```

---

## 🧪 **Test Docker Image Locally**

### **Run Container**
```bash
docker run -d \
  --name wealthflow \
  -p 3001:3001 \
  -v wealthflow-data:/app/data \
  wealthflow:latest
```

### **Check Logs**
```bash
docker logs -f wealthflow
```

### **Stop Container**
```bash
docker stop wealthflow
docker rm wealthflow
```

### **Using Docker Compose**
```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ☁️ **GOOGLE CLOUD RUN DEPLOYMENT**

### **Step 1: Install Google Cloud CLI**

**Mac:**
```bash
brew install google-cloud-sdk
```

**Windows:**
Download from: https://cloud.google.com/sdk/docs/install

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
```

### **Step 2: Initialize Google Cloud**

```bash
# Login to Google Cloud
gcloud auth login

# Create new project (or use existing)
gcloud projects create wealthflow-app --name="WealthFlow"

# Set project
gcloud config set project wealthflow-app

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### **Step 3: Deploy to Cloud Run**

#### **Option A: Deploy from Source (Easiest)**

```bash
cd "/Users/jarapla.veereshnaik/Documents/veeresh project learning/loan-tracker"

gcloud run deploy wealthflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300
```

#### **Option B: Deploy from Container Registry**

```bash
# Build and tag for Google Container Registry
docker build -t gcr.io/wealthflow-app/wealthflow:v1 .

# Push to Google Container Registry
docker push gcr.io/wealthflow-app/wealthflow:v1

# Deploy to Cloud Run
gcloud run deploy wealthflow \
  --image gcr.io/wealthflow-app/wealthflow:v1 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001
```

### **Step 4: Get Your Live URL**

After deployment, you'll get a URL like:
```
https://wealthflow-xxxxx-uc.a.run.app
```

**Your app is now live!** 🎉

---

## 🔐 **Environment Variables for Production**

Create a `.env.production` file:

```bash
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/database.db
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
JWT_SECRET=your_super_secret_key_here
SESSION_SECRET=your_session_secret_here
```

**Deploy with environment variables:**

```bash
gcloud run deploy wealthflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DATABASE_PATH=/app/data/database.db
```

---

## 📊 **Cloud Run Configuration**

### **Recommended Settings:**

```bash
gcloud run deploy wealthflow \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --cpu-throttling \
  --execution-environment gen2
```

**Explanation:**
- `--memory 1Gi` - 1GB RAM (sufficient for your app)
- `--cpu 1` - 1 vCPU
- `--min-instances 0` - Scale to zero when idle (saves money)
- `--max-instances 10` - Max 10 instances under load
- `--timeout 300` - 5 minutes timeout
- `--concurrency 80` - 80 requests per instance
- `--allow-unauthenticated` - Public access

---

## 💾 **Database Persistence**

For production, replace SQLite with **Cloud SQL** (PostgreSQL):

### **Option 1: Cloud SQL (Recommended)**

```bash
# Create Cloud SQL instance
gcloud sql instances create wealthflow-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create wealthflow --instance=wealthflow-db

# Connect Cloud Run to Cloud SQL
gcloud run deploy wealthflow \
  --source . \
  --add-cloudsql-instances=PROJECT_ID:us-central1:wealthflow-db
```

### **Option 2: Use Volume (SQLite)**

Mount a persistent volume in Cloud Run:

```bash
gcloud run deploy wealthflow \
  --source . \
  --execution-environment gen2 \
  --mount type=cloud-storage,bucket=wealthflow-data,mount-path=/app/data
```

---

## 🧪 **Local Testing with Docker**

### **Build and Run**

```bash
# Build
docker build -t wealthflow:test .

# Run with volume for data persistence
docker run -d \
  --name wealthflow-test \
  -p 3001:3001 \
  -v wealthflow-data:/app/data \
  -e NODE_ENV=production \
  wealthflow:test

# Check logs
docker logs -f wealthflow-test

# Test
open http://localhost:3001
```

### **Clean Up**

```bash
docker stop wealthflow-test
docker rm wealthflow-test
docker volume rm wealthflow-data
```

---

## 🔍 **Verify Docker Image**

```bash
# Check image size
docker images wealthflow

# Inspect image
docker inspect wealthflow:latest

# Run shell inside container
docker run -it --rm wealthflow:latest sh

# Check what's inside
ls -la /app
```

---

## 📈 **Monitoring & Logs**

### **View Cloud Run Logs**

```bash
# Real-time logs
gcloud run services logs tail wealthflow --region us-central1

# Recent logs
gcloud run services logs read wealthflow --region us-central1 --limit 50
```

### **View Metrics**

Go to: https://console.cloud.google.com/run/detail/us-central1/wealthflow/metrics

---

## 💰 **Cost Estimation**

**Google Cloud Run Pricing:**

| Resource | Free Tier | After Free |
|----------|-----------|------------|
| Requests | 2M/month | $0.40/M |
| CPU | 180K vCPU-seconds | $0.00002400/vCPU-second |
| Memory | 360K GiB-seconds | $0.00000250/GiB-second |

**Your App (Estimated):**
- **If minimal traffic:** FREE (within free tier)
- **If moderate traffic (10K requests/month):** $1-2/month
- **If high traffic (100K requests/month):** $5-10/month

**Tip:** Use `--min-instances 0` to scale to zero = $0 when idle! 💰

---

## 🚀 **Complete Deployment Script**

Create `deploy.sh`:

```bash
#!/bin/bash

# WealthFlow Deployment Script
# Deploys to Google Cloud Run

set -e

echo "🚀 Deploying WealthFlow to Google Cloud Run..."

# Configuration
PROJECT_ID="wealthflow-app"
SERVICE_NAME="wealthflow"
REGION="us-central1"

# Set project
gcloud config set project $PROJECT_ID

# Deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3001 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300

echo "✅ Deployment complete!"
echo "🌐 Your app is live at:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
```

**Make it executable and run:**

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔐 **Production Security Checklist**

Before deploying:

- [ ] Update `GOOGLE_CLIENT_ID` for production domain
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Enable CORS for production URL
- [ ] Set up Cloud SQL for database
- [ ] Enable Cloud Logging
- [ ] Set up Cloud Monitoring
- [ ] Configure custom domain
- [ ] Enable HTTPS (automatic with Cloud Run)
- [ ] Set up backup strategy
- [ ] Configure rate limiting

---

## 🌐 **Custom Domain Setup**

### **Step 1: Verify Domain**

```bash
gcloud domains verify YOUR_DOMAIN.com
```

### **Step 2: Map Domain**

```bash
gcloud run domain-mappings create \
  --service wealthflow \
  --domain YOUR_DOMAIN.com \
  --region us-central1
```

### **Step 3: Update DNS**

Add the DNS records shown by the command to your domain registrar.

---

## 🔄 **CI/CD Pipeline (GitHub Actions)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - id: auth
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy wealthflow \
          --source . \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated \
          --port 3001
```

---

## 📊 **Useful Docker Commands**

```bash
# List images
docker images

# List running containers
docker ps

# Remove unused images
docker image prune -a

# Remove all stopped containers
docker container prune

# View container logs
docker logs CONTAINER_ID

# Execute command in container
docker exec -it CONTAINER_ID sh

# Copy file from container
docker cp CONTAINER_ID:/app/data/database.db ./backup.db
```

---

## 🐛 **Troubleshooting**

### **Build Fails**

```bash
# Build with no cache
docker build --no-cache -t wealthflow:latest .

# Build with verbose output
docker build --progress=plain -t wealthflow:latest .
```

### **Container Won't Start**

```bash
# Check logs
docker logs CONTAINER_ID

# Run interactively to debug
docker run -it --rm wealthflow:latest sh
```

### **Cloud Run Deploy Fails**

```bash
# Check service status
gcloud run services describe wealthflow --region us-central1

# View logs
gcloud run services logs tail wealthflow --region us-central1
```

### **Frontend Not Loading**

Make sure you updated `server.ts` to serve static files in production (see instructions above).

---

## 📦 **Alternative: Deploy to Other Platforms**

### **Heroku**

```bash
heroku login
heroku create wealthflow-app
heroku container:push web
heroku container:release web
```

### **Railway**

```bash
railway login
railway init
railway up
```

### **DigitalOcean App Platform**

```bash
doctl apps create --spec .do/app.yaml
```

---

## 🎯 **Production Checklist**

Before going live:

- [ ] Build Docker image successfully
- [ ] Test locally with Docker
- [ ] Set production environment variables
- [ ] Update CORS settings
- [ ] Configure database persistence
- [ ] Set up monitoring
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Test authentication
- [ ] Load test the application
- [ ] Set up backup strategy

---

## 💡 **Best Practices**

1. **Use `.dockerignore`** - Speeds up build
2. **Multi-stage builds** - Reduces image size
3. **Non-root user** - Security best practice
4. **Health checks** - Automatic restart on failure
5. **Environment variables** - Never hardcode secrets
6. **Volume mounts** - Data persistence
7. **Resource limits** - Prevent excessive costs

---

## 📚 **Additional Resources**

- Docker Docs: https://docs.docker.com/
- Cloud Run Docs: https://cloud.google.com/run/docs
- Best Practices: https://cloud.google.com/run/docs/tips
- Pricing: https://cloud.google.com/run/pricing

---

## 🎉 **YOU'RE READY!**

Your application is now:
- ✅ **Containerized** - Single Docker image
- ✅ **Cloud-ready** - Deployable to Cloud Run
- ✅ **Scalable** - Auto-scales with traffic
- ✅ **Secure** - Non-root user, environment variables
- ✅ **Production-ready** - Health checks, logging

**Just run:**

```bash
docker build -t wealthflow:latest .
docker run -p 3001:3001 wealthflow:latest
```

**Then visit:** http://localhost:3001

---

**Made with ❤️ - Your app is now containerized and cloud-ready!** ☁️🚀

