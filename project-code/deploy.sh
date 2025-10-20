#!/bin/bash

# Blueprint Tracker - Google Cloud Functions Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Blueprint Tracker - Cloud Functions Deployment"
echo "=================================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if .env.yaml exists
if [ ! -f ".env.yaml" ]; then
    echo "❌ Error: .env.yaml not found"
    echo "Please create .env.yaml with your environment variables"
    echo "See DEPLOYMENT.md for details"
    exit 1
fi

# Check if OAuth token exists
if [ ! -f ".google-token.json" ]; then
    echo "❌ Error: .google-token.json not found"
    echo "Please run: npm run auth"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCP project set"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project: $PROJECT_ID"
echo "📍 Region: us-central1"
echo ""

# Build the application
echo "🔨 Building TypeScript..."
npm run build

# Upload OAuth token to Secret Manager (if not already exists)
echo ""
echo "🔐 Checking Secret Manager for OAuth token..."
if gcloud secrets describe google-oauth-token &>/dev/null; then
    echo "✓ Secret 'google-oauth-token' already exists"
    read -p "Update it with current .google-token.json? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud secrets versions add google-oauth-token --data-file=.google-token.json
        echo "✓ Updated OAuth token"
    fi
else
    echo "Creating new secret..."
    gcloud secrets create google-oauth-token \
      --data-file=.google-token.json \
      --replication-policy="automatic"
    echo "✓ Created OAuth token secret"
fi

# Deploy Cloud Function
echo ""
echo "🚀 Deploying Cloud Function..."
echo "This may take 2-3 minutes..."
echo ""

gcloud functions deploy blueprint-tracker \
  --gen2 \
  --runtime=nodejs18 \
  --region=us-central1 \
  --source=. \
  --entry-point=runBlueprintTracker \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file=.env.yaml \
  --set-secrets="GOOGLE_OAUTH_TOKEN=google-oauth-token:latest" \
  --timeout=540s \
  --memory=512MB

# Get the function URL
echo ""
echo "📊 Getting function URL..."
FUNCTION_URL=$(gcloud functions describe blueprint-tracker --gen2 --region=us-central1 --format="value(serviceConfig.uri)")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Function URL: $FUNCTION_URL"
echo ""
echo "Test it with:"
echo "  curl -X POST $FUNCTION_URL"
echo ""
echo "Set up scheduling:"
echo "  gcloud scheduler jobs create http blueprint-tracker-daily \\"
echo "    --location=us-central1 \\"
echo "    --schedule=\"0 9 * * *\" \\"
echo "    --uri=\"$FUNCTION_URL\" \\"
echo "    --http-method=POST \\"
echo "    --description=\"Runs Blueprint tracker daily at 9 AM UTC\""
echo ""
echo "📖 See DEPLOYMENT.md for more details"
