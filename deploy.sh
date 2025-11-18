#!/bin/bash

# Circle.so + Google Tasks Integration - Deployment Script
# Deploys all Cloud Functions to Google Cloud

set -e  # Exit on error

# Configuration
PROJECT_ID="onboarding-tasks-automation"
REGION="us-central1"
RUNTIME="nodejs20"
ALLOWED_DOMAIN="citylifestyle.com"
CIRCLE_DOMAIN="https://communities.citylifestyle.com"

echo "🚀 Deploying Circle Tasks Integration to Google Cloud..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Allowed Domain: $ALLOWED_DOMAIN"
echo "Circle Domain: $CIRCLE_DOMAIN"
echo ""

# Check if service account key exists
if [ ! -f "service-account-key.json" ]; then
    echo "❌ Error: service-account-key.json not found!"
    echo "Please add your service account key file to the root directory."
    exit 1
fi

# Set the active project
echo "Setting active project..."
gcloud config set project $PROJECT_ID

# Function to deploy a Cloud Function
deploy_function() {
    local FUNCTION_NAME=$1
    local ENTRY_POINT=$2
    local SOURCE_DIR=$3

    echo ""
    echo "📦 Deploying $FUNCTION_NAME..."

    # Copy service account key to function directory
    cp service-account-key.json "$SOURCE_DIR/"

    # Deploy the function
    gcloud functions deploy $FUNCTION_NAME \
        --gen2 \
        --runtime=$RUNTIME \
        --region=$REGION \
        --source=$SOURCE_DIR \
        --entry-point=$ENTRY_POINT \
        --trigger-http \
        --allow-unauthenticated \
        --max-instances=10 \
        --timeout=60s \
        --memory=256MB \
        --set-env-vars="ALLOWED_DOMAIN=$ALLOWED_DOMAIN,CIRCLE_DOMAIN=$CIRCLE_DOMAIN"

    # Remove the copied key for security
    rm "$SOURCE_DIR/service-account-key.json"

    echo "✅ $FUNCTION_NAME deployed successfully!"
}

# Deploy each function
deploy_function "getTasks" "getTasks" "getTasks"
deploy_function "completeTask" "completeTask" "completeTask"
deploy_function "uncompleteTask" "uncompleteTask" "uncompleteTask"

echo ""
echo "✨ All functions deployed successfully!"
echo ""
echo "Your function URLs:"
echo "  getTasks:       https://$REGION-$PROJECT_ID.cloudfunctions.net/getTasks"
echo "  completeTask:   https://$REGION-$PROJECT_ID.cloudfunctions.net/completeTask"
echo "  uncompleteTask: https://$REGION-$PROJECT_ID.cloudfunctions.net/uncompleteTask"
echo ""
echo "Next steps:"
echo "1. Update circle-page/custom-html.html with these URLs"
echo "2. Add the HTML to your Circle.so custom page"
echo "3. Test the integration!"
