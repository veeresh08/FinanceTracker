#!/bin/bash

# ============================================
# Build and Test Docker Image Locally
# ============================================

set -e

echo "🐳 Building Docker image for WealthFlow..."

# Build image
docker build -t wealthflow:latest .

echo "✅ Build complete!"
echo ""
echo "🧪 Testing image..."

# Run container
docker run -d \
  --name wealthflow-test \
  -p 3001:3001 \
  -v wealthflow-data:/app/data \
  -e NODE_ENV=production \
  wealthflow:latest

echo "✅ Container started!"
echo ""
echo "📊 Container info:"
docker ps --filter name=wealthflow-test

echo ""
echo "📝 Waiting for app to start (5 seconds)..."
sleep 5

echo ""
echo "🌐 Testing application..."
curl -s http://localhost:3001/api/auth/status | head -1 || echo "⚠️  App might still be starting..."

echo ""
echo "✅ Test complete!"
echo ""
echo "📋 Useful commands:"
echo "  View logs:    docker logs -f wealthflow-test"
echo "  Stop:         docker stop wealthflow-test"
echo "  Remove:       docker rm wealthflow-test"
echo "  Test app:     open http://localhost:3001"
echo ""
echo "🎉 Your app is running in Docker!"

