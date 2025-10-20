# Changelog

All notable changes to the Blueprint Standard Adherence Master Tracker project.

## [1.0.0] - 2025-10-17 - Production Release

### 🎉 Initial Production Deployment

**Deployment Date:** October 17, 2025
**Status:** Active and Running
**Environment:** Google Cloud Functions (Production)

### ✨ Features Implemented

#### Core Functionality
- **Dynamic Page Discovery:** Automatically finds all Blueprint pages using CQL search
  - Search query: `space = "cs" AND title ~ "Blueprint"`
  - No hardcoded page IDs required
  - Automatically discovers new pages

- **Smart Page Filtering:** Excludes non-team pages
  - Filters out "Generic" template pages
  - Filters out "Template" and "Templates" pages
  - Filters out "Client Summaries" pages
  - Filters out meta pages like "What are Blueprint MultiExcerpts"

- **Header-Only Lozenge Counting:** Accurate status tracking
  - Only counts lozenges within header elements (h1-h6)
  - Ignores lozenges in body text, tables, or other locations
  - Ensures tracking of properly placed status indicators

- **Text Normalization:** Consistent label formatting
  - Title Case for most labels: "Standard", "Semi-Standard", "Non-Standard"
  - UPPERCASE for exceptions: "TBD", "N/A"
  - Preserves variations to identify data quality issues
  - Handles hyphenated words correctly

- **Individual Sheet Tabs:** One tab per team
  - Automatically creates tabs named after teams
  - Extracts team names from page titles (removes "Blueprint: " prefix)
  - Sanitizes names for Google Sheets compatibility
  - Updates existing tabs or creates new ones as needed

- **Rate Limiting:** Respects API quotas
  - 1.5 second delays between Google Sheets writes
  - Prevents hitting 60 writes per minute limit
  - ~40 writes per minute average (well under limit)

- **Parallel Processing:** Fast Confluence fetching
  - Fetches all pages in parallel using Promise.all
  - Reduces total fetch time significantly
  - Handles 70+ pages in ~16 seconds

#### Cloud Deployment
- **Google Cloud Functions (Gen 2):** Serverless execution
  - Node.js 20 runtime
  - 512 MB memory allocation
  - 540 second (9 minute) timeout
  - us-central1 region
  - Fully within free tier

- **Cloud Scheduler:** Automated daily runs
  - Schedule: Every day at 9:00 AM Eastern Time
  - Cron expression: `0 9 * * *`
  - Time zone: America/New_York
  - Status: Enabled and active

- **Secret Manager:** Secure credential storage
  - OAuth token stored securely
  - Service account access control
  - Environment variables encrypted at rest

- **OAuth 2.0 Authentication:** Google Sheets access
  - Desktop app OAuth flow
  - Token refresh capability
  - Supports both local file and environment variable

### 🏗️ Architecture

#### Source Code Components
- `src/index.ts` - Main orchestrator
- `src/confluence.ts` - Confluence API client with CQL search
- `src/lozengeParser.ts` - Lozenge extraction, normalization, counting
- `src/googleSheets.ts` - Google Sheets client with tab management
- `src/authenticate.ts` - OAuth setup script for local development
- `gcf-index.js` - Cloud Function entry point

#### Configuration
- `config.json` - Search parameters (spaceKey, titleSearch)
- `.env` / `.env.yaml` - Environment variables (local/cloud)
- `.google-token.json` - OAuth token (local only)
- `package.json` - Dependencies and build scripts
- `tsconfig.json` - TypeScript compilation settings

#### Deployment Scripts
- `deploy.sh` - Automated deployment script
- `.gcloudignore` - Files excluded from cloud deployment

### 📚 Documentation

#### Core Documentation
- **README.md** - Complete project documentation (15 min read)
- **SUMMARY.md** - One-page quick reference (2 min read)
- **STATUS.md** - Detailed deployment status and monitoring (10 min read)
- **ARCHITECTURE.md** - Visual diagrams and system architecture (10 min read)

#### Setup Guides
- **QUICKSTART-GCF.md** - Fast cloud deployment guide
- **DEPLOYMENT.md** - Comprehensive cloud setup guide
- **DOCS-INDEX.md** - Complete documentation index

#### Templates
- `.env.example` - Environment variables template
- `.env.yaml.example` - Cloud Functions environment template
- `config.example.json` - Configuration template

### 📊 Performance Metrics

**Current Statistics:**
- **Pages processed:** ~70 Blueprint pages
- **Pages excluded:** ~15 (Generic, Templates, Client Summaries)
- **Total lozenges:** ~4,900
- **Execution time:** ~2-3 minutes
- **API calls per run:** ~150 (85 Confluence + 70 Google Sheets)
- **Cost:** $0/month (within free tier)

**Resource Usage:**
- CPU: ~0.33 vCPU average
- Memory: ~200 MB average, ~300 MB peak
- Network: ~7 MB per run (5 MB in, 2 MB out)

### 🔐 Security

- OAuth tokens stored in Google Secret Manager
- Environment variables encrypted at rest
- API credentials never in source code
- `.env`, `.google-token.json`, and `config.json` excluded from git
- Service account with minimal required permissions (Secret Manager accessor)
- HTTPS-only communication
- No hardcoded credentials

### 🧪 Testing & Validation

**Testing Performed:**
- ✅ Local execution with sample pages
- ✅ Full run with all 70 pages
- ✅ Cloud Function deployment and execution
- ✅ Cloud Scheduler trigger
- ✅ Manual HTTP trigger
- ✅ OAuth token refresh from Secret Manager
- ✅ Rate limiting effectiveness
- ✅ Page filtering logic
- ✅ Text normalization rules
- ✅ Google Sheet tab creation/update

**Validation Results:**
- All 70 team pages processed successfully
- 15 excluded pages correctly filtered
- Individual sheet tabs created for each team
- Lozenge counts accurate
- Text normalization working as expected
- Rate limiting preventing quota issues
- Execution time within acceptable range (~2-3 minutes)

### 🐛 Known Issues

**Intentionally Preserved:**
- Label variations like "Semi Standard" (no hyphen) or "Na" (typo)
- These help identify data quality issues in source Confluence pages

**Limitations:**
- OAuth token needs manual refresh every ~6 months (acceptable)
- Cold start adds ~10 seconds to first run after idle (negligible)
- Processing time increases with more pages (linear scaling)

### 🔄 Deployment Details

**Google Cloud Project:**
- Project ID: blueprint-tracker-475402
- Project Number: 701841318363
- Region: us-central1

**Cloud Function:**
- Name: blueprint-tracker
- URL: https://us-central1-blueprint-tracker-475402.cloudfunctions.net/blueprint-tracker
- Status: Active

**Cloud Scheduler:**
- Job Name: blueprint-tracker-daily
- Location: us-central1
- Status: Enabled

**Secret Manager:**
- Secret Name: google-oauth-token
- Version: latest
- Access: 701841318363-compute@developer.gserviceaccount.com

### 📦 Dependencies

**Production:**
- axios: ^1.6.0 - HTTP client for Confluence API
- dotenv: ^16.3.1 - Environment variable loader
- googleapis: ^128.0.0 - Google Sheets API client

**Development:**
- @types/node: ^20.10.0 - TypeScript types for Node.js
- ts-node: ^10.9.2 - TypeScript execution for development
- typescript: ^5.3.3 - TypeScript compiler

### 🎯 Future Considerations

**Potential Enhancements (Not Planned):**
- Email notifications after each run
- Slack integration for updates
- Historical data tracking
- Data validation alerts
- Performance dashboard
- Multi-region deployment
- Custom reporting (PDF/HTML)

These are documented but not scheduled for implementation.

---

## Version History

### [1.0.0] - 2025-10-17
- Initial production release
- Fully automated and deployed to Google Cloud

---

**Maintained By:** Quinn Souther
**Project Start:** October 2025
**First Deploy:** October 17, 2025
**Current Version:** 1.0.0
**Status:** Production - Active
