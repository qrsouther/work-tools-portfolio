# Blueprint Standard Adherence Master Tracker

Automatically scans Confluence Blueprint pages for status lozenges (status badges), counts them by label and color, and writes the results to individual Google Sheet tabs for tracking and dashboard integration.

## 📚 Quick Navigation

- 📄 **[SUMMARY.md](./SUMMARY.md)** - One-page quick reference
- 📊 **[STATUS.md](./STATUS.md)** - Detailed deployment status and monitoring
- 🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Visual architecture and data flow diagrams
- 🚀 **[QUICKSTART-GCF.md](./QUICKSTART-GCF.md)** - Fast cloud deployment guide
- 📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive cloud setup guide
- 📑 **[DOCS-INDEX.md](./DOCS-INDEX.md)** - Complete documentation index

## ⚡ Current Status

**✅ DEPLOYED AND RUNNING AUTOMATICALLY**

This application is currently deployed to Google Cloud Functions and runs automatically:
- **Schedule:** Every day at 9:00 AM Eastern Time
- **Platform:** Google Cloud Functions (Gen 2)
- **Region:** us-central1
- **Runtime:** Node.js 20
- **Cost:** $0/month (within free tier)

## 🎯 What It Does

1. **Searches Confluence** for all pages with "Blueprint" in the title within the `cs` space
2. **Filters intelligently:**
   - ✅ Includes: Team Blueprint pages (e.g., "Blueprint: Utah Jazz")
   - ❌ Excludes: Pages with "Generic", "Template", "Templates", or "Client Summaries" in title
3. **Counts lozenges** that appear within header elements (h2, h3, h4, etc.) only
4. **Normalizes labels** for consistency:
   - Title Case for most labels: "Standard", "Semi-Standard", "Non-Standard"
   - UPPERCASE for exceptions: "TBD", "N/A"
5. **Creates individual sheet tabs** for each team in Google Sheets
6. **Updates automatically** every morning

Currently processing **~70 Blueprint pages** with **~4,900 lozenges** total.

## 📊 Features

- **Dynamic page discovery** - Automatically finds all Blueprint pages (no hardcoded list)
- **Smart filtering** - Excludes templates, generic pages, and meta pages
- **Header-only counting** - Only counts lozenges in headers where they should be
- **Case normalization** - Handles inconsistent capitalization while preserving data quality indicators
- **Individual sheet tabs** - Each team gets its own tab named after the team
- **Rate limiting** - Respects Google Sheets API quotas (1.5s delay between writes)
- **OAuth 2.0 authentication** - No service account needed
- **Cloud-native** - Runs serverless with automatic scaling
- **Zero maintenance** - Fully automated daily runs

## 🔍 What's Included vs Excluded

### ✅ Included Pages
All Confluence pages in the `cs` space with "Blueprint" in the title, EXCEPT:

### ❌ Excluded Pages
Pages containing any of these terms in their title:
- `Generic` (e.g., "Blueprint: [Generic NBA team]")
- `Template` or `Templates` (e.g., "Blueprint Templates")
- `Client Summaries` (e.g., "US Client Summaries + Blueprints")
- `What are Blueprint MultiExcerpts`
- `Best Practice Templates`

### 📍 Lozenge Counting Rules
- ✅ **Counted:** Lozenges that are child elements of headers (h1, h2, h3, h4, h5, h6)
- ❌ **Not Counted:** Lozenges in body text, tables, or other non-header locations

This ensures we're only tracking the status indicators that are properly placed in section headers.

## 🚀 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Cloud Scheduler (Daily at 9 AM ET)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP POST trigger
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Google Cloud Function (blueprint-tracker)                  │
│  ├─ Searches Confluence for Blueprint pages                 │
│  ├─ Filters out excluded pages                              │
│  ├─ Parses lozenges from headers only                       │
│  ├─ Normalizes label text (Title Case / UPPERCASE)          │
│  ├─ Deletes excluded sheet tabs                             │
│  └─ Writes to individual Google Sheet tabs                  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│  Confluence   │         │ Google Sheet │
│  REST API     │         │  (70 tabs)   │
└───────────────┘         └──────────────┘
```

### Execution Flow

1. **Cloud Scheduler** triggers the function via HTTP POST
2. **Cloud Function** starts:
   - Loads environment variables and OAuth token from Secret Manager
   - Connects to Confluence REST API
   - Searches for all pages: `space = "cs" AND title ~ "Blueprint"`
3. **Page Filtering**:
   - Fetches all found pages
   - Filters out excluded terms (Generic, Template, etc.)
4. **Lozenge Parsing**:
   - Extracts only lozenges within header elements
   - Normalizes text to Title Case (with TBD/N/A exceptions)
   - Groups and counts by text + color
5. **Google Sheets Update**:
   - Deletes any excluded sheet tabs
   - Creates/updates individual tabs for each team
   - Writes lozenge counts with timestamp
6. **Returns** success response

**Typical execution time:** ~2-3 minutes for 70 pages

## 📁 Output Format

Each team gets its own sheet tab (e.g., "Utah Jazz", "Arizona Cardinals"):

| Page ID    | Page Title                | Lozenge Text  | Lozenge Color | Count | Last Updated             |
|------------|---------------------------|---------------|---------------|-------|--------------------------|
| 4187848753 | Blueprint: Utah Jazz      | Standard      | green         | 57    | 2025-10-17T09:00:00.000Z |
| 4187848753 | Blueprint: Utah Jazz      | Bespoke       | purple        | 6     | 2025-10-17T09:00:00.000Z |
| 4187848753 | Blueprint: Utah Jazz      | Semi-Standard | yellow        | 6     | 2025-10-17T09:00:00.000Z |
| 4187848753 | Blueprint: Utah Jazz      | N/A           | default       | 2     | 2025-10-17T09:00:00.000Z |

**Note:** Label variations like "Semi Standard" (no hyphen) or "Na" (typo) are preserved intentionally to help identify data quality issues in the source Confluence pages.

## 🛠️ Local Development

### Prerequisites

- Node.js 18 or higher
- A Confluence Cloud account with API access
- A Google Cloud account
- Google Sheets API enabled
- OAuth 2.0 credentials (Desktop app type)

### Setup Instructions

#### 1. Install Dependencies

```bash
cd blueprint-standard-adherence-master-tracker
npm install
```

#### 2. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Confluence Configuration
CONFLUENCE_BASE_URL=https://yourcompany.atlassian.net
CONFLUENCE_EMAIL=your.email@company.com
CONFLUENCE_API_TOKEN=your_confluence_api_token

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost

# Google Sheets Configuration
GOOGLE_SHEET_ID=your_google_sheet_id
```

#### 3. Configure Search Parameters

Edit `config.json`:

```json
{
  "spaceKey": "cs",
  "titleSearch": "Blueprint"
}
```

This tells the app to search for pages with "Blueprint" in the title within the "cs" space.

#### 4. Authenticate with Google

```bash
npm run auth
```

Follow the prompts to authorize the app. This creates `.google-token.json` which is reused automatically.

#### 5. Build and Run

```bash
# Build TypeScript
npm run build

# Run the tracker
npm start
```

### Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the tracker (requires build first)
- `npm run dev` - Run with ts-node (for development)
- `npm run auth` - Run OAuth authentication flow

## ☁️ Cloud Deployment

The application is deployed to Google Cloud Functions. See detailed guides:

- **Quick Start:** [QUICKSTART-GCF.md](./QUICKSTART-GCF.md) (~10 minutes)
- **Full Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md) (comprehensive)

### Deployment Summary

**Current Deployment:**
- **Project ID:** blueprint-tracker-475402
- **Function Name:** blueprint-tracker
- **Region:** us-central1
- **Schedule:** Daily at 9:00 AM ET (`0 9 * * *`)
- **URL:** https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker

**To redeploy after changes:**

```bash
# 1. Update code locally
# 2. Build
npm run build

# 3. Deploy
./deploy.sh
```

### Monitoring

**View logs:**
```bash
gcloud functions logs read blueprint-tracker --gen2 --region=us-central1 --limit=50
```

**Cloud Console:**
https://console.cloud.google.com/functions/details/us-central1/blueprint-tracker?project=blueprint-tracker-475402

**Scheduler Jobs:**
```bash
gcloud scheduler jobs list --location=us-central1
```

**Test manually:**
```bash
# Trigger the function
curl -X POST https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker

# Or trigger the scheduled job
gcloud scheduler jobs run blueprint-tracker-daily --location=us-central1
```

## 📝 Configuration Reference

### config.json

```json
{
  "spaceKey": "cs",           // Confluence space key to search
  "titleSearch": "Blueprint"  // Search term for page titles
}
```

**Optional:** You can add `testPageIds` array for testing specific pages:

```json
{
  "spaceKey": "cs",
  "titleSearch": "Blueprint",
  "testPageIds": ["4187848753", "4403593346"]  // Only process these pages
}
```

### Exclusion Terms

To modify which pages are excluded, edit:
- **src/index.ts** - Lines 64-71 (page filtering)
- **src/googleSheets.ts** - Lines 168-175 (sheet tab deletion)

Current exclusion terms:
```typescript
const exclusionTerms = [
  'Generic',
  'Template',
  'Templates',
  'Client Summaries',
  'What are Blueprint MultiExcerpts',
  'Best Practice Templates'
];
```

### Case Normalization

To modify text normalization rules, edit **src/lozengeParser.ts** - Lines 37-55:

```typescript
private normalizeText(text: string): string {
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  // Special cases: keep as UPPERCASE
  if (upper === 'TBD' || upper === 'N/A') {
    return upper;
  }

  // Everything else: Title Case
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}
```

## 🔒 Security

- ✅ OAuth tokens stored in Google Secret Manager
- ✅ Environment variables encrypted
- ✅ API credentials never in source code
- ✅ `.env` and `.google-token.json` excluded from git
- ✅ Service account with minimal permissions
- ✅ HTTPS-only communication

**Important Files (Never commit these):**
- `.env` - Contains API tokens and credentials
- `.env.yaml` - Cloud Functions environment variables
- `.google-token.json` - OAuth refresh token
- `config.json` - May contain sensitive page IDs

All are listed in `.gitignore`.

## 📊 Current Statistics

As of last update:
- **Pages processed:** ~70 Blueprint pages
- **Pages excluded:** ~15 (Generic, Templates, Client Summaries)
- **Total lozenges:** ~4,900
- **Execution time:** ~2-3 minutes
- **API calls per run:** ~150 (85 Confluence + 70 Google Sheets)
- **Cost:** $0/month (within free tier)

## 🐛 Troubleshooting

### "Not authenticated"
Run `npm run auth` to generate OAuth token.

### "Failed to fetch pages"
- Check Confluence API token is valid
- Verify you have access to the `cs` space
- Confirm network connectivity

### "Permission denied on secret"
Grant Secret Manager access to the service account:
```bash
gcloud secrets add-iam-policy-binding google-oauth-token \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### "Function timeout"
Increase timeout in deployment:
```bash
--timeout=900s  # Max 15 minutes for Gen 2
```

### "Quota exceeded"
The app has built-in rate limiting (1.5s between writes). If you still hit limits:
- Reduce the number of pages
- Increase delays in `src/googleSheets.ts` (line 304)

### "Token expired"
Regenerate locally and update secret:
```bash
npm run auth
gcloud secrets versions add google-oauth-token --data-file=.google-token.json
```

## 📖 Additional Documentation

- [SUMMARY.md](./SUMMARY.md) - One-page quick reference
- [STATUS.md](./STATUS.md) - Detailed deployment status and monitoring
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Visual architecture diagrams and data flow
- [QUICKSTART-GCF.md](./QUICKSTART-GCF.md) - Quick cloud deployment guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment documentation
- [DOCS-INDEX.md](./DOCS-INDEX.md) - Complete documentation index
- [.env.example](./.env.example) - Environment variables template
- [.env.yaml.example](./.env.yaml.example) - Cloud Functions env template
- [config.example.json](./config.example.json) - Configuration template

## 🏗️ Project Structure

```
blueprint-standard-adherence-master-tracker/
├── src/
│   ├── index.ts           # Main orchestrator (search, filter, parse, write)
│   ├── confluence.ts      # Confluence API client with CQL search
│   ├── lozengeParser.ts   # Lozenge extraction, normalization, counting
│   ├── googleSheets.ts    # Google Sheets client with tab management
│   └── authenticate.ts    # OAuth setup script for local dev
├── gcf-index.js          # Cloud Function entry point
├── deploy.sh             # Deployment automation script
├── config.json           # Search configuration (not in git)
├── .env                  # Local environment variables (not in git)
├── .env.yaml             # Cloud env variables (not in git)
├── .google-token.json    # OAuth token (not in git)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .gcloudignore         # Files excluded from cloud deployment
└── README.md             # This file
```

## 🔄 Change Schedule

To change when the tracker runs:

```bash
gcloud scheduler jobs update http blueprint-tracker-daily \
  --location=us-central1 \
  --schedule="0 17 * * *"  # Example: 5 PM instead of 9 AM
```

**Schedule format (cron):**
- `"0 9 * * *"` - Every day at 9 AM
- `"0 9 * * 1"` - Every Monday at 9 AM
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * 0"` - Every Sunday at midnight

**Time zone:**
Currently set to `America/New_York`. Change with `--time-zone` flag.

## 📞 Support

For issues or questions:
1. Check this README and troubleshooting section
2. Review deployment guides ([DEPLOYMENT.md](./DEPLOYMENT.md))
3. Check logs: `gcloud functions logs read blueprint-tracker --gen2 --region=us-central1`
4. Confluence API docs: https://developer.atlassian.com/cloud/confluence/rest/
5. Google Sheets API docs: https://developers.google.com/sheets/api

## 📄 License

MIT
