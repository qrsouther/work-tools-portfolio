# Confluence Macro Error Checker

This script crawls your company's Confluence instance to find pages with a specific keyword in their title, checks for macro rendering errors, and exports the results to Google Sheets.

## Features

- Searches Confluence pages by title keyword
- Detects macro rendering errors including:
  - Error placeholder elements
  - Macro error messages
  - Unknown or failed macros
- Exports results to Google Sheets with:
  - Page title
  - Page URL (clickable)
  - Error type
  - Exact error message
- Optional JSON export for backup/processing

## Prerequisites

1. **Python 3.7+**
2. **Confluence API Access**
   - Confluence instance URL
   - Username/email
   - API token

3. **Google Cloud Service Account**
   - Service account credentials JSON file
   - Google Sheets API enabled
   - Google Drive API enabled

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Confluence API Token

1. Log in to your Confluence instance
2. Go to Account Settings → Security → API Token
3. Click "Create API token"
4. Give it a name (e.g., "Macro Checker")
5. Copy the token (you won't be able to see it again)

### 3. Set Up Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
4. Create a service account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "confluence-macro-checker")
   - Grant it the "Editor" role
   - Click "Done"
5. Create a key:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Download the file (save it securely)

## Usage

### Basic Usage

```bash
python confluence_macro_checker.py \
  --confluence-url "https://yourcompany.atlassian.net" \
  --username "your.email@company.com" \
  --api-token "your-confluence-api-token" \
  --keyword "YourKeyword" \
  --google-credentials "path/to/service-account-credentials.json"
```

### With Custom Sheet Name

```bash
python confluence_macro_checker.py \
  --confluence-url "https://yourcompany.atlassian.net" \
  --username "your.email@company.com" \
  --api-token "your-confluence-api-token" \
  --keyword "YourKeyword" \
  --google-credentials "path/to/service-account-credentials.json" \
  --sheet-name "Q4 2024 Macro Errors"
```

### With JSON Backup

```bash
python confluence_macro_checker.py \
  --confluence-url "https://yourcompany.atlassian.net" \
  --username "your.email@company.com" \
  --api-token "your-confluence-api-token" \
  --keyword "YourKeyword" \
  --google-credentials "path/to/service-account-credentials.json" \
  --save-json "errors_backup.json"
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--confluence-url` | Yes | Base URL of your Confluence instance |
| `--username` | Yes | Your Confluence username/email |
| `--api-token` | Yes | Your Confluence API token |
| `--keyword` | Yes | Keyword to search for in page titles |
| `--google-credentials` | Yes | Path to Google service account JSON file |
| `--sheet-name` | No | Name for the Google Sheet (default: "Confluence Macro Errors") |
| `--save-json` | No | Optional path to save results as JSON |

## How It Works

1. **Search**: Uses Confluence REST API with CQL to find all pages containing the keyword in their title
2. **Scan**: For each page:
   - Fetches rendered HTML and storage format
   - Parses HTML for error indicators:
     - Error CSS classes (confluence-macro-error, macro-error, etc.)
     - Error text patterns (Unknown macro, Failed to render, etc.)
   - Extracts error context and messages
3. **Export**: Creates a Google Sheet with:
   - Formatted headers
   - All error details
   - Clickable URLs
   - Auto-resized columns
   - Public view-only sharing link

## Output

The script will:
- Print progress as it searches and scans pages
- Display a summary of errors found
- Create a Google Sheet and print the URL
- Optionally save to JSON if specified

### Google Sheet Format

| Page Title | Page URL | Error Type | Error Message |
|------------|----------|------------|---------------|
| Example Page | https://... | Macro Rendering Error | Unknown macro: customMacro |

## Error Types Detected

- **Macro Rendering Error**: Detected via error HTML elements
- **Macro Error Text**: Detected via error keywords in page text
- **API Error**: Issues fetching page content

## Common Error Messages

- "Unknown macro: [macro-name]"
- "Macro not found"
- "Unable to render [macro-name]"
- "Cannot display macro"
- "Failed to render macro"
- "Invalid macro parameters"

## Troubleshooting

### Authentication Issues

- **Confluence**: Verify your API token is valid and hasn't expired
- **Google**: Ensure your service account credentials file is valid

### No Pages Found

- Check that the keyword matches your page titles (search is case-insensitive)
- Verify you have access to the pages in Confluence

### Permission Errors (Google Sheets)

- Ensure Google Sheets API is enabled in your project
- Verify service account has necessary permissions

### Rate Limiting

If you have many pages, Confluence might rate limit requests. The script handles this automatically, but if you encounter issues:
- Add delays between requests
- Process pages in smaller batches

## Security Notes

- **Never commit** your API tokens or credentials files to version control
- Store credentials securely (use environment variables or secret managers in production)
- The created Google Sheets are shared with "anyone with the link" (view-only)
- Consider restricting sheet access after creation if needed

## Example Output

```
Searching for pages with 'ProjectX' in title...
  Found: ProjectX - Overview
  Found: ProjectX - Architecture
  Found: ProjectX - Deployment Guide

Total pages found: 3

Scanning 3 pages for macro errors...

Checking: ProjectX - Overview
  ✓ No errors found
Checking: ProjectX - Architecture
  ⚠️  Found 2 error(s)
Checking: ProjectX - Deployment Guide
  ⚠️  Found 1 error(s)

============================================================
SUMMARY: Found 3 macro error(s)
============================================================

✓ Exported 3 error(s) to Google Sheets
  Spreadsheet URL: https://docs.google.com/spreadsheets/d/...
```

## License

This script is provided as-is for internal company use.
