# Google Cloud Functions Deployment Guide

This guide walks you through deploying the Blueprint Standard Adherence Master Tracker to Google Cloud Functions with automated scheduling.

## ✅ Current Deployment Status

**The application is already deployed and running:**
- **Project ID:** blueprint-tracker-475402
- **Function Name:** blueprint-tracker
- **Region:** us-central1
- **Runtime:** Node.js 20
- **Schedule:** Daily at 9:00 AM Eastern Time
- **Status:** Active and running
- **URL:** https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker

This guide is for reference and future updates.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Google Cloud Project** created (currently using: `blueprint-tracker-475402`)
4. **Google Sheets OAuth Token** already generated (`.google-token.json`)

## Setup Steps

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# Visit: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project (replace YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Prepare Environment Variables

Create a `.env.yaml` file in the project root with your secrets:

```yaml
CONFLUENCE_BASE_URL: "https://your-domain.atlassian.net"
CONFLUENCE_EMAIL: "your-email@example.com"
CONFLUENCE_API_TOKEN: "your-confluence-token"
GOOGLE_CLIENT_ID: "your-google-client-id"
GOOGLE_CLIENT_SECRET: "your-google-client-secret"
GOOGLE_REDIRECT_URI: "http://localhost:3000"
GOOGLE_SHEET_ID: "your-sheet-id"
```

**⚠️ IMPORTANT:** Add `.env.yaml` to your `.gitignore` to keep secrets safe!

### 3. Upload OAuth Token to Google Secret Manager

The OAuth token needs to be accessible by the Cloud Function:

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secret from your local token file
gcloud secrets create google-oauth-token \
  --data-file=.google-token.json \
  --replication-policy="automatic"

# Verify it was created
gcloud secrets versions access latest --secret="google-oauth-token"
```

### 4. Build the Application Locally

```bash
# Build TypeScript to JavaScript
npm run build

# Verify dist/ directory was created and contains compiled JS files
ls dist/
```

### 5. Deploy the Cloud Function

**Option A: Deploy with env-vars-file (Simpler)**

```bash
gcloud functions deploy blueprint-tracker \
  --gen2 \
  --runtime=nodejs18 \
  --region=us-central1 \
  --source=. \
  --entry-point=runBlueprintTracker \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file=.env.yaml \
  --timeout=540s \
  --memory=512MB
```

**Option B: Deploy with individual env vars (More secure)**

```bash
gcloud functions deploy blueprint-tracker \
  --gen2 \
  --runtime=nodejs18 \
  --region=us-central1 \
  --source=. \
  --entry-point=runBlueprintTracker \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars CONFLUENCE_BASE_URL="https://your-domain.atlassian.net",CONFLUENCE_EMAIL="your-email@example.com",CONFLUENCE_API_TOKEN="your-token",GOOGLE_CLIENT_ID="your-id",GOOGLE_CLIENT_SECRET="your-secret",GOOGLE_REDIRECT_URI="http://localhost:3000",GOOGLE_SHEET_ID="your-sheet-id" \
  --timeout=540s \
  --memory=512MB
```

**Important flags explained:**
- `--gen2`: Use second-generation Cloud Functions
- `--timeout=540s`: Allow up to 9 minutes (processing 70 pages takes ~2-3 minutes)
- `--memory=512MB`: Adequate memory for the application
- `--allow-unauthenticated`: Allows Cloud Scheduler to trigger it (you can add authentication later)

### 6. Test the Cloud Function Manually

After deployment, you'll get a trigger URL. Test it:

```bash
# Get the function URL
gcloud functions describe blueprint-tracker --gen2 --region=us-central1 --format="value(serviceConfig.uri)"

# Test it manually (replace URL)
curl -X POST https://REGION-PROJECT_ID.cloudfunctions.net/blueprint-tracker
```

### 7. Set Up Automated Scheduling with Cloud Scheduler

Create a scheduled job to run the tracker automatically:

```bash
# Create a Cloud Scheduler job (runs every day at 9 AM UTC)
gcloud scheduler jobs create http blueprint-tracker-daily \
  --location=us-central1 \
  --schedule="0 9 * * *" \
  --uri="https://REGION-PROJECT_ID.cloudfunctions.net/blueprint-tracker" \
  --http-method=POST \
  --description="Runs Blueprint tracker daily at 9 AM UTC"

# Verify the job was created
gcloud scheduler jobs list --location=us-central1

# Test the scheduled job manually
gcloud scheduler jobs run blueprint-tracker-daily --location=us-central1
```

**Schedule format examples (cron syntax):**
- `"0 9 * * *"` - Every day at 9 AM UTC
- `"0 9 * * 1"` - Every Monday at 9 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 9 * * 1,3,5"` - Monday, Wednesday, Friday at 9 AM UTC

### 8. Monitor Your Function

View logs in real-time:

```bash
# Stream logs
gcloud functions logs read blueprint-tracker --gen2 --region=us-central1 --limit=50

# Or view in Cloud Console
# https://console.cloud.google.com/functions/list
```

## OAuth Token Management

The Cloud Function needs to read the OAuth token. Update the GoogleSheetsClient to read from Secret Manager in production:

### Option 1: Mount token as file (Recommended)

Modify `src/googleSheets.ts` to check for token in environment:

```typescript
private loadSavedToken(): void {
  // In Cloud Functions, check for token in environment variable
  if (process.env.GOOGLE_OAUTH_TOKEN) {
    const token = JSON.parse(process.env.GOOGLE_OAUTH_TOKEN);
    this.oauth2Client.setCredentials(token);
  } else if (fs.existsSync(this.tokenPath)) {
    // Local development - read from file
    const token = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
    this.oauth2Client.setCredentials(token);
  }
}
```

Then add to deployment:

```bash
# Read token from Secret Manager and set as env var
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
```

## Updating the Function

When you make changes:

```bash
# 1. Rebuild TypeScript
npm run build

# 2. Redeploy (uses same command as initial deploy)
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
```

## Cost Estimates

**Cloud Functions (Gen 2):**
- 2M invocations/month free
- After: ~$0.40 per 1M invocations
- Running daily = 30 invocations/month = **FREE**

**Cloud Scheduler:**
- First 3 jobs per month free
- 1 job running daily = **FREE**

**Estimated cost: $0/month** (within free tier)

## Troubleshooting

### Function times out
- Increase timeout: `--timeout=540s` (max 9 minutes)
- Check logs for bottlenecks

### OAuth token expired
- Regenerate token locally: `npm run auth`
- Update secret: `gcloud secrets versions add google-oauth-token --data-file=.google-token.json`

### Permission errors
- Ensure Secret Manager API is enabled
- Grant Cloud Function service account access to secrets

### Memory errors
- Increase memory: `--memory=1024MB` or `--memory=2048MB`

## Security Best Practices

1. **Use Secret Manager** for all sensitive data (done above)
2. **Add authentication** to Cloud Function:
   ```bash
   # Remove --allow-unauthenticated
   # Add service account to Cloud Scheduler
   ```
3. **Restrict API access** with VPC if needed
4. **Monitor logs** for suspicious activity
5. **Set up alerts** for function failures

## Additional Resources

- [Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
