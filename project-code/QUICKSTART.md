# Quick Start Guide

## First Time Setup (20 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Get Confluence API Token
https://id.atlassian.com/manage-profile/security/api-tokens
→ Create token → Copy it

### 3. Setup Google OAuth Credentials

**Enable Google Sheets API:**
- Go to https://console.cloud.google.com/
- Create new project → Enable "Google Sheets API"

**Create OAuth Credentials:**
- Go to "APIs & Services" → "Credentials"
- Create OAuth client ID → Choose "Desktop app"
- Copy the Client ID and Client Secret

### 4. Create Google Sheet
- Create a new Google Sheet
- Copy the spreadsheet ID from the URL

### 5. Configure
```bash
cp .env.example .env
cp config.example.json config.json
```

Edit `.env` with your actual values:
- Add Confluence credentials
- Add Google Client ID and Client Secret
- Add Google Sheet ID

Edit `config.json` with your Confluence page IDs.

### 6. Authenticate with Google
```bash
npm run auth
```

Follow the prompts to authorize the app with your Google account. This only needs to be done once!

### 7. Run
```bash
npm run build
npm start
```

## Regular Usage

After initial setup, just run:
```bash
npm start
```

The OAuth token is saved and will be reused automatically.

## Key Files You'll Edit

- **config.json** - Add/remove Confluence page IDs here
- **.env** - Update if credentials change

## Common Commands

```bash
npm install          # Install dependencies (first time only)
npm run auth         # Authenticate with Google (first time only, or to re-auth)
npm run build        # Compile TypeScript to JavaScript
npm start           # Run the tracker
npm run dev         # Run without building (development mode)
```

## What Gets Updated

Your Google Sheet will be completely refreshed each time with current lozenge counts from all configured pages.

## Re-authenticating

If your token expires or you want to use a different Google account:

```bash
rm .google-token.json
npm run auth
```

## Scheduling Automation

See the "Automating with Scheduling" section in README.md for setting up automatic runs with cron or GitHub Actions.
