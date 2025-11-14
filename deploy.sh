#!/bin/bash

# ============================================
# WealthFlow - Google Cloud Run Deployment
# ============================================

set -e  # Exit on error

echo "🚀 Starting WealthFlow deployment to Google Cloud Run..."
echo ""

# Configuration
PROJECT_ID="neutobotix"  # Your Google Cloud Project ID
SERVICE_NAME="wealthflow"
REGION="us-central1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo ""

# Set project
echo -e "${YELLOW}🔧 Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
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
  --timeout 300 \
  --concurrency 80 \
  --execution-environment gen2 \
  --cpu-throttling \
  --no-cpu-boost

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Your app is live at:${NC}"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
echo ""
echo -e "${GREEN}🎉 Success! Your app is now running on Google Cloud Run!${NC}"

