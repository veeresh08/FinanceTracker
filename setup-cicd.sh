#!/bin/bash

# ============================================
# Complete CI/CD Setup for neutobotix
# ============================================

set -e

echo "🚀 Setting up CI/CD for WealthFlow on neutobotix..."
echo ""

# Configuration
PROJECT_ID="neutobotix"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Set project
echo -e "${YELLOW}🔧 Setting project to neutobotix...${NC}"
gcloud config set project $PROJECT_ID

echo -e "${GREEN}✅ Project set!${NC}"
echo ""

# Enable APIs
echo -e "${YELLOW}📦 Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

echo -e "${GREEN}✅ APIs enabled!${NC}"
echo ""

# Get project number
echo -e "${YELLOW}🔐 Configuring permissions...${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "Cloud Build Service Account: $CLOUD_BUILD_SA"
echo ""

# Grant permissions (with --condition=None to avoid policy conflict)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin" \
  --condition=None \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/storage.admin" \
  --condition=None \
  --quiet

echo -e "${GREEN}✅ Permissions granted!${NC}"
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ CI/CD Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 What's configured:"
echo "  ✅ Project: $PROJECT_ID"
echo "  ✅ APIs enabled"
echo "  ✅ Permissions granted"
echo ""
echo "🎯 Next steps:"
echo "  1. Connect GitHub repository to Cloud Build"
echo "     👉 https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
echo ""
echo "  2. Create Build Trigger:"
echo "     - Name: deploy-wealthflow-on-push"
echo "     - Event: Push to branch"
echo "     - Branch: ^main$"
echo "     - Config: /cloudbuild.yaml"
echo ""
echo "  3. Test by pushing to GitHub:"
echo "     git push origin main"
echo ""
echo -e "${GREEN}🎉 You're ready for automatic deployments!${NC}"

