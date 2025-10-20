# Blueprint Tracker - Architecture Overview

Visual guide to how the Blueprint Standard Adherence Master Tracker works.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRIGGER & SCHEDULE                         │
│                                                                 │
│  Cloud Scheduler Job: blueprint-tracker-daily                  │
│  • Cron: 0 9 * * * (9 AM Eastern)                             │
│  • Location: us-central1                                       │
│  • Status: ENABLED                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD FUNCTION (Gen 2)                       │
│                                                                 │
│  Name: blueprint-tracker                                       │
│  Runtime: Node.js 20                                           │
│  Memory: 512 MB                                                │
│  Timeout: 540s (9 min)                                         │
│  Region: us-central1                                           │
│                                                                 │
│  Entry Point: gcf-index.js → runBlueprintTracker()            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  EXECUTION FLOW                                         │  │
│  │                                                         │  │
│  │  1. Load Environment Variables                         │  │
│  │     ├─ Confluence credentials (.env.yaml)             │  │
│  │     └─ OAuth token (Secret Manager)                   │  │
│  │                                                         │  │
│  │  2. Initialize Clients                                 │  │
│  │     ├─ ConfluenceClient (REST API + CQL)             │  │
│  │     ├─ GoogleSheetsClient (OAuth 2.0)                │  │
│  │     └─ LozengeParser                                  │  │
│  │                                                         │  │
│  │  3. Search Confluence                                  │  │
│  │     └─ CQL: space = "cs" AND title ~ "Blueprint"     │  │
│  │                                                         │  │
│  │  4. Fetch & Filter Pages                              │  │
│  │     ├─ Fetch all found pages (parallel)              │  │
│  │     └─ Exclude: Generic, Templates, Client Summaries │  │
│  │                                                         │  │
│  │  5. Parse Lozenges                                     │  │
│  │     ├─ Extract from headers only (h1-h6)             │  │
│  │     ├─ Normalize text (Title Case / UPPERCASE)       │  │
│  │     └─ Group and count by text + color               │  │
│  │                                                         │  │
│  │  6. Update Google Sheet                                │  │
│  │     ├─ Delete excluded tabs                           │  │
│  │     ├─ Create/update team tabs                        │  │
│  │     └─ Write data (with rate limiting)               │  │
│  │                                                         │  │
│  │  7. Return Success Response                            │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────┬───────────────────────┘
                    │                     │
                    │                     │
        ┌───────────▼──────────┐  ┌──────▼─────────────┐
        │   CONFLUENCE API     │  │  GOOGLE SHEETS API │
        │                      │  │                    │
        │  • Search (CQL)      │  │  • Get sheets      │
        │  • Fetch pages       │  │  • Create tabs     │
        │  • Get content       │  │  • Delete tabs     │
        │                      │  │  • Write data      │
        │  Base URL:           │  │                    │
        │  seatgeek.atlassian  │  │  Sheet ID:         │
        │      .net            │  │  10D0tNsNAC4...    │
        └──────────────────────┘  └────────────────────┘
```

## 📊 Data Flow

```
┌───────────────┐
│  Confluence   │
│   cs Space    │
└───────┬───────┘
        │
        │ Search: "Blueprint"
        ▼
┌─────────────────────────┐
│  85 Pages Found         │
│  (includes Generic/     │
│   Templates)            │
└───────┬─────────────────┘
        │
        │ Filter out excluded
        ▼
┌─────────────────────────┐
│  70 Pages Kept          │
│  (team Blueprints)      │
└───────┬─────────────────┘
        │
        │ Parse each page
        ▼
┌─────────────────────────┐
│  Extract Lozenges       │
│  from Headers Only      │
│                         │
│  <h2>                   │
│    Section Title        │
│    <status>Standard     │
│  </h2>         ✓ COUNT  │
│                         │
│  <p>                    │
│    Body text            │
│    <status>Standard     │
│  </p>          ✗ SKIP   │
└───────┬─────────────────┘
        │
        │ Normalize text
        ▼
┌─────────────────────────┐
│  Normalize Labels       │
│                         │
│  "standard" → Standard  │
│  "STANDARD" → Standard  │
│  "tbd"      → TBD       │
│  "n/a"      → N/A       │
└───────┬─────────────────┘
        │
        │ Group & count
        ▼
┌─────────────────────────┐
│  4,900 Lozenges         │
│  Grouped by:            │
│  • Page                 │
│  • Text                 │
│  • Color                │
└───────┬─────────────────┘
        │
        │ Write to sheets
        ▼
┌─────────────────────────┐
│  Google Sheet           │
│  70 Tabs Created        │
│                         │
│  Utah Jazz              │
│  Arizona Cardinals      │
│  Tennessee Titans       │
│  ...                    │
└─────────────────────────┘
```

## 🔄 Execution Timeline

```
09:00:00 AM ET  Cloud Scheduler triggers function
09:00:01        Function cold start (if needed)
09:00:02        Load environment variables
09:00:03        Load OAuth token from Secret Manager
09:00:04        Initialize Confluence client
09:00:05        Initialize Google Sheets client

09:00:06        Search Confluence (CQL query)
09:00:08        └─ Found 85 pages

09:00:09        Fetch all 85 pages (parallel)
09:00:25        └─ Retrieved 85 pages (16 seconds)

09:00:26        Filter pages
09:00:27        └─ 70 pages kept, 15 excluded

09:00:28        Parse lozenges from all pages
09:00:35        └─ Found 4,900 lozenges (7 seconds)

09:00:36        Delete Generic/Template sheet tabs
09:00:42        └─ Deleted 6 tabs (6 seconds)

09:00:43        Write to Google Sheets
09:00:44        [1/70] Utah Jazz
09:00:46        [2/70] Arizona Cardinals (1.5s delay)
09:00:48        [3/70] Tennessee Titans (1.5s delay)
...             ...
09:02:30        [70/70] Last team (1.5s × 70 = 105s)

09:02:31        Return success response
09:02:32        Function execution complete

Total Time: ~2 minutes 32 seconds
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SECRETS & CREDENTIALS                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Environment Variables (Encrypted at Rest)            │
│     ├─ CONFLUENCE_BASE_URL                              │
│     ├─ CONFLUENCE_EMAIL                                 │
│     ├─ CONFLUENCE_API_TOKEN                             │
│     ├─ GOOGLE_CLIENT_ID                                 │
│     ├─ GOOGLE_CLIENT_SECRET                             │
│     ├─ GOOGLE_REDIRECT_URI                              │
│     └─ GOOGLE_SHEET_ID                                  │
│                                                          │
│  2. Secret Manager                                       │
│     └─ google-oauth-token (latest)                      │
│        └─ Access granted to service account             │
│                                                          │
│  3. Service Account                                      │
│     └─ 701841318363-compute@developer.gserviceaccount.com│
│        └─ Role: secretmanager.secretAccessor            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Confluence Authentication:                              │
│  Cloud Function → Basic Auth (email:token)               │
│                → Confluence REST API                     │
│                                                          │
│  Google Sheets Authentication:                           │
│  Cloud Function → Load token from Secret Manager        │
│                → OAuth 2.0 client with token             │
│                → Google Sheets API                       │
│                                                          │
│  Function Trigger:                                       │
│  Cloud Scheduler → HTTP POST (unauthenticated)          │
│                  → Cloud Function                        │
└─────────────────────────────────────────────────────────┘
```

## 📦 Component Breakdown

### Source Code Components

```
src/
├── index.ts (Main Orchestrator)
│   ├─ loadConfiguration()     # Loads config.json + .env
│   ├─ main()                  # Main execution flow
│   └─ Exports: { main }       # For Cloud Functions
│
├── confluence.ts (Confluence Client)
│   ├─ searchPagesByTitle()    # CQL search with pagination
│   ├─ getPageContent()        # Fetch single page
│   └─ getMultiplePages()      # Parallel fetch with Promise.all
│
├── lozengeParser.ts (Parser & Normalizer)
│   ├─ parseLozenges()         # Extract from headers only
│   ├─ normalizeText()         # Title Case + exceptions
│   ├─ countLozenges()         # Group and count
│   └─ analyzePage()           # Complete analysis
│
├── googleSheets.ts (Google Sheets Client)
│   ├─ loadSavedToken()        # From file or env var
│   ├─ getExistingSheets()     # List all tabs
│   ├─ createSheet()           # Create new tab
│   ├─ deleteSheet()           # Delete tab by ID
│   ├─ deleteExcludedSheets()  # Clean up Generic/Templates
│   ├─ clearSheet()            # Clear tab content
│   └─ writeResults()          # Write with rate limiting
│
└── authenticate.ts (OAuth Setup)
    ├─ getAuthUrl()            # Generate OAuth URL
    ├─ getTokenFromCode()      # Exchange code for token
    └─ saveToken()             # Save to .google-token.json
```

### Configuration Files

```
config.json
├─ spaceKey: "cs"              # Confluence space
└─ titleSearch: "Blueprint"    # Search term

.env (local) / .env.yaml (cloud)
├─ CONFLUENCE_BASE_URL         # https://seatgeek.atlassian.net
├─ CONFLUENCE_EMAIL            # qsouther@seatgeek.com
├─ CONFLUENCE_API_TOKEN        # API token
├─ GOOGLE_CLIENT_ID            # OAuth client ID
├─ GOOGLE_CLIENT_SECRET        # OAuth client secret
├─ GOOGLE_REDIRECT_URI         # http://localhost
└─ GOOGLE_SHEET_ID             # 10D0tNsNAC4cwSvFrd9...

.google-token.json
├─ access_token                # Short-lived access token
├─ refresh_token               # Long-lived refresh token
├─ scope                       # sheets API scope
├─ token_type                  # Bearer
└─ expiry_date                 # Token expiration
```

## 🌐 Network Flow

```
┌──────────────────┐
│ Cloud Scheduler  │
└────────┬─────────┘
         │ HTTPS POST
         │ (Cloud internal network)
         ▼
┌──────────────────────────┐
│ Cloud Function           │
│ (us-central1)            │
└─┬──────────────────────┬─┘
  │                      │
  │ HTTPS                │ HTTPS
  │ (Internet)           │ (Internet)
  ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│ Confluence API   │   │ Google Sheets    │
│ seatgeek.        │   │ API              │
│ atlassian.net    │   │ googleapis.com   │
└──────────────────┘   └──────────────────┘
```

## 📊 Performance Characteristics

### Resource Usage Per Run

| Resource | Usage | Notes |
|----------|-------|-------|
| CPU | ~0.33 vCPU | Average during execution |
| Memory | ~200 MB | Peak ~300 MB |
| Network Out | ~5 MB | Confluence responses |
| Network In | ~2 MB | Google Sheets writes |
| Execution Time | ~2-3 min | 70 pages with rate limiting |

### API Call Distribution

```
Confluence API:
├─ 1 × Search query (CQL)
└─ 85 × Page fetch (parallel)

Google Sheets API:
├─ 1 × Get existing sheets
├─ 6 × Delete excluded tabs
├─ 70 × Clear tab
└─ 70 × Write data

Total: ~232 API calls per run
```

### Rate Limiting Strategy

```
Confluence API:
└─ No rate limiting needed (parallel fetches)

Google Sheets API:
├─ 60 writes per minute limit
└─ 1.5 second delays between writes
    ├─ 70 writes × 1.5s = 105 seconds
    └─ Effective rate: ~40 writes/minute ✓
```

## 🔄 Update & Deployment Flow

```
Local Development:
1. Edit source code
2. npm run build
3. npm start (test locally)

Deploy to Cloud:
1. npm run build
2. ./deploy.sh
   ├─ Uploads OAuth token to Secret Manager
   ├─ Uploads source code to Cloud Storage
   ├─ Triggers Cloud Build
   └─ Deploys new Cloud Function revision

Cloud Build Process:
1. Install dependencies (npm install)
2. Run gcp-build script
3. Compile TypeScript (tsc)
4. Package function
5. Deploy to Cloud Run (Gen 2 backend)
6. Update Cloud Function endpoint
```

---

**Architecture Version:** 1.0
**Last Updated:** October 17, 2025
