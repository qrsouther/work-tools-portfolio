# Quick Start: Google Cloud Functions Deployment

This guide gets you up and running in ~10 minutes.

## ✅ Current Status

**The application is already deployed!**

- **Deployed:** October 17, 2025
- **Schedule:** Daily at 9:00 AM Eastern Time
- **Project:** blueprint-tracker-475402
- **Function:** blueprint-tracker
- **Status:** Active

This guide is for reference if you need to redeploy or make changes.

## Prerequisites

✅ You already have:
- Google Cloud account with billing enabled
- `.google-token.json` (OAuth token) generated locally
- `.env` file with your credentials
- Application working locally
- gcloud CLI installed and configured

## Steps

### 1. Install gcloud CLI

```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Login and Set Project

```bash
# Login
gcloud auth login

# Create or select a project
gcloud projects create blueprint-tracker-2024  # Or use existing
gcloud config set project blueprint-tracker-2024

# Enable billing (required - use Cloud Console)
# https://console.cloud.google.com/billing
```

### 3. Enable Required APIs

```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

This takes ~2 minutes.

### 4. Create .env.yaml

Copy your existing `.env` file's values into Cloud Functions format:

```bash
cp .env.yaml.example .env.yaml
```

Then edit `.env.yaml` with your values:

```yaml
CONFLUENCE_BASE_URL: "https://yourcompany.atlassian.net"
CONFLUENCE_EMAIL: "you@yourcompany.com"
CONFLUENCE_API_TOKEN: "your_token_here"
GOOGLE_CLIENT_ID: "your_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET: "your_client_secret"
GOOGLE_REDIRECT_URI: "http://localhost:3000"
GOOGLE_SHEET_ID: "your_sheet_id_here"
```

### 5. Deploy with One Command

```bash
./deploy.sh
```

That's it! The script will:
- ✅ Build your TypeScript code
- ✅ Upload OAuth token to Secret Manager
- ✅ Deploy the Cloud Function
- ✅ Give you the function URL

### 6. Set Up Daily Schedule

After deployment, run the command shown by the script:

```bash
gcloud scheduler jobs create http blueprint-tracker-daily \
  --location=us-central1 \
  --schedule="0 9 * * *" \
  --uri="YOUR_FUNCTION_URL_HERE" \
  --http-method=POST \
  --description="Runs Blueprint tracker daily at 9 AM UTC"
```

**Schedule options:**
- `"0 9 * * *"` - Every day at 9 AM UTC
- `"0 9 * * 1"` - Every Monday at 9 AM
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * 0"` - Every Sunday at midnight

### 7. Test It

```bash
# Manual test via HTTP
curl -X POST YOUR_FUNCTION_URL

# Or trigger the scheduled job
gcloud scheduler jobs run blueprint-tracker-daily --location=us-central1
```

### 8. Monitor

View logs:

```bash
# Command line
gcloud functions logs read blueprint-tracker --gen2 --region=us-central1 --limit=50

# Or Cloud Console (prettier)
# https://console.cloud.google.com/functions/list
```

## Estimated Time

- ✅ gcloud setup: 3 minutes
- ✅ Enable APIs: 2 minutes
- ✅ Create .env.yaml: 2 minutes
- ✅ Deploy: 2-3 minutes
- ✅ Set up schedule: 1 minute

**Total: ~10 minutes**

## Cost

**FREE** (within free tier):
- Cloud Functions: 2M invocations/month free (you use ~30)
- Cloud Scheduler: First 3 jobs free (you use 1)
- Secret Manager: First 6 operations/month free

## Troubleshooting

### "Project not found"
```bash
gcloud config set project YOUR_PROJECT_ID
```

### "Billing not enabled"
- Go to: https://console.cloud.google.com/billing
- Link a billing account (required for Cloud Functions)

### "Permission denied"
```bash
gcloud auth login
```

### "Function timeout"
The function processes ~70 pages in ~2-3 minutes. If it times out:
- Check logs: `gcloud functions logs read blueprint-tracker --gen2 --region=us-central1`
- Increase timeout in deploy.sh: `--timeout=540s` → `--timeout=900s`

### "OAuth token not found"
Make sure `.google-token.json` exists:
```bash
npm run auth
```

## Next Steps

Once deployed:
1. ✅ Check your Google Sheet - it should update automatically
2. ✅ Set up email alerts for function failures (optional)
3. ✅ Add authentication for better security (see DEPLOYMENT.md)

## Need Help?

See the full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
