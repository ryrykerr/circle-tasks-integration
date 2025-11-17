# Setup Guide

Complete setup instructions for the Circle.so + Google Tasks Integration.

## Prerequisites

- Google Cloud Project: `onboarding-tasks-automation`
- Service account with domain-wide delegation configured
- Service account key JSON file
- Google Cloud SDK (`gcloud`) installed
- Node.js 20+ installed
- Git installed

## 1. Initial Setup

### Clone the repository

```bash
git clone https://github.com/ryrykerr/circle-tasks-integration.git
cd circle-tasks-integration
```

### Add service account key

1. Download your service account key from Google Cloud Console
2. Rename it to `service-account-key.json`
3. Place it in the root directory of this project
4. **IMPORTANT**: Verify it's in `.gitignore` to prevent accidental commits

```bash
# Verify the key is excluded
git status
# service-account-key.json should NOT appear
```

## 2. Configure Google Cloud

### Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project onboarding-tasks-automation
```

### Enable required APIs

```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable tasks.googleapis.com
```

## 3. Service Account Configuration

Your service account needs:

1. **Domain-wide delegation enabled** in Google Workspace Admin Console
2. **OAuth Scopes**:
   - `https://www.googleapis.com/auth/tasks` (read/write)
   - `https://www.googleapis.com/auth/tasks.readonly` (read-only)

### Verify service account setup

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to: Security → Access and data control → API controls → Domain-wide delegation
3. Find your service account client ID
4. Verify the scopes are authorized

## 4. Deploy Functions

### Make deploy script executable

```bash
chmod +x deploy.sh
```

### Deploy all functions

```bash
./deploy.sh
```

This will deploy:
- `getTasks` - Retrieve tasks
- `completeTask` - Mark task complete
- `uncompleteTask` - Mark task incomplete

### Note your function URLs

After deployment, you'll see URLs like:
```
https://us-central1-onboarding-tasks-automation.cloudfunctions.net/getTasks
https://us-central1-onboarding-tasks-automation.cloudfunctions.net/completeTask
https://us-central1-onboarding-tasks-automation.cloudfunctions.net/uncompleteTask
```

## 5. Configure Circle.so Integration

### Update the HTML file

1. Edit `circle-page/custom-html.html`
2. Update these values:
   - `API_BASE_URL` - Your Cloud Function URL base
   - `USER_EMAIL` - The email of the user whose tasks to display

### Add to Circle.so

1. Log in to your Circle.so community
2. Create a new custom page
3. Paste the contents of `custom-html.html`
4. Save and publish

## 6. Testing

### Test getTasks

```bash
curl -X POST https://us-central1-onboarding-tasks-automation.cloudfunctions.net/getTasks \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"user@citylifestyle.com"}'
```

### Test completeTask

```bash
curl -X POST https://us-central1-onboarding-tasks-automation.cloudfunctions.net/completeTask \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail":"user@citylifestyle.com",
    "taskListId":"YOUR_TASK_LIST_ID",
    "taskId":"YOUR_TASK_ID"
  }'
```

## 7. Security Checklist

- [ ] Service account key is NOT in git repository
- [ ] `.gitignore` includes `service-account-key.json`
- [ ] Domain-wide delegation is properly configured
- [ ] Service account has minimum required scopes
- [ ] Cloud Functions are deployed with proper IAM permissions

## Troubleshooting

### "Service account key not found"

Make sure `service-account-key.json` is in each function directory during deployment. The deploy script copies it automatically.

### "Insufficient permissions"

Verify domain-wide delegation is configured correctly in Google Workspace Admin Console.

### "Function not found"

Ensure you're using the correct Google Cloud project and region.

## Support

For issues, contact the project maintainer or open an issue on GitHub.
