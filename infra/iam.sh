#!/bin/bash
# IAM roles setup for HealthHalo
set -e

PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="healthhalo-sa@$PROJECT_ID.iam.gserviceaccount.com"

echo "Creating Service Account..."
gcloud iam service-accounts create healthhalo-sa \
    --description="Service account for HealthHalo Cloud Run" \
    --display-name="HealthHalo SA"

echo "Granting roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/aiplatform.user" # For Vertex AI / Gemini

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" # For accessing Gemini API Key

echo "IAM setup complete."
