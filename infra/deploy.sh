#!/bin/bash
# Deploy script for Google Cloud Run
set -e

PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="healthhalo"
REGION="us-central1"

echo "Deploying HealthHalo to Cloud Run..."

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"

echo "Deployment complete."
