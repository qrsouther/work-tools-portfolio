# Chrome Extension Improvements

## Changes Made

### 1. **Strict Error Filtering** (content.js)
- **Before**: Captured all errors on the page, including unrelated browser errors, network issues, and general page errors
- **After**: Only captures MultiExcerpt Include macro errors with strict keyword matching:
  - "page lookup error"
  - "macro lookup error"
  - "multiexcerpt" + "not found"
- **Result**: Eliminates false positives

### 2. **Background Operation** (background.js)
- **Before**: Required keeping the popup open to monitor progress
- **After**: Runs completely in background - you can close the popup immediately after starting
- **Benefit**: No need to babysit the extension for 45+ minutes

### 3. **Automatic Results Export** (background.js)
- **Before**: Manual export via button click
- **After**: Automatically downloads JSON file when scan completes
- **Filename**: `confluence_multiexcerpt_errors_2025-01-17T14-30-00.json`
- **Location**: Your browser's Downloads folder

### 4. **Browser Notifications** (manifest.json + background.js)
- **New**: Desktop notification when scan completes
- Shows summary: "Scanned 90 pages. Found 12 errors on 5 pages."
- Also notifies on errors

### 5. **Enhanced JSON Export Format** (background.js)
```json
{
  "scan_date": "2025-01-17T14:30:00.000Z",
  "summary": {
    "total_pages_scanned": 90,
    "pages_with_errors": 5,
    "total_errors_found": 12
  },
  "pages_with_errors": [
    {
      "page_title": "Blueprint: Baltimore Ravens",
      "page_url": "https://...",
      "space": "CS",
      "error_count": 3,
      "errors": [...]
    }
  ]
}
```

### 6. **Better Progress Monitoring** (background.js)
- Console logs show real-time progress:
  ```
  ============================================================
  Starting scan of 90 Blueprint pages
  Estimated time: 53 minutes
  ============================================================

  [1/90] Checking: Blueprint: LPGA
    ✓ No errors
  [2/90] Checking: Blueprint: Baltimore Ravens
    ⚠️  Found 3 error(s)
  ...
  ```
- View by clicking "service worker" in chrome://extensions

### 7. **Fixed Pagination** (background.js)
- **Before**: Would fetch hundreds/thousands of duplicate pages
- **After**: Properly tracks page IDs to avoid duplicates and stops when no new pages found
- **Result**: Correctly fetches ~80-90 Blueprint pages from CS space

## How to Use

1. **Install/Reload Extension**
   - Go to `chrome://extensions/`
   - Click reload button on "Confluence Macro Error Checker"

2. **Start Scan**
   - Be logged into Confluence
   - Click extension icon
   - Click "Start Scanning Blueprint Pages"
   - **Close the popup** - it will run in background

3. **Monitor (Optional)**
   - Go to `chrome://extensions/`
   - Click "service worker" under the extension
   - Watch console for real-time progress

4. **Get Results**
   - Wait ~45-50 minutes for 90 pages
   - Browser notification will pop up when done
   - JSON file auto-downloads to Downloads folder

## JSON File Example

The downloaded file will contain only pages with MultiExcerpt Include errors, with full details:

```json
{
  "scan_date": "2025-01-17T19:30:45.123Z",
  "summary": {
    "total_pages_scanned": 87,
    "pages_with_errors": 3,
    "total_errors_found": 5
  },
  "pages_with_errors": [
    {
      "page_title": "Blueprint: Baltimore Ravens",
      "page_url": "https://seatgeek.atlassian.net/wiki/spaces/CS/pages/12345/Blueprint+Baltimore+Ravens",
      "space": "CS",
      "error_count": 2,
      "errors": [
        {
          "type": "MultiExcerpt Lookup Error",
          "message": "Page lookup error - the page 'Stadium Info' was not found in space 'CS'"
        },
        {
          "type": "MultiExcerpt Include Error",
          "message": "Macro lookup error: MultiExcerpt include could not find the excerpt 'team-details'"
        }
      ]
    }
  ]
}
```

## Troubleshooting

**Extension not finding pages?**
- Make sure you're logged into Confluence
- Check that you're on a Confluence page when you start the scan
- Verify pages exist in CS space with "Blueprint" in title

**Scan seems stuck?**
- Go to chrome://extensions/ → click "service worker"
- Check console for progress logs
- Each page takes ~30-35 seconds

**No notification appeared?**
- Check your browser's notification settings
- Check Downloads folder for the JSON file anyway
- Check service worker console for "Scan complete" message

**Want to stop early?**
- Click extension icon
- Click "Stop Scan" button
- Results so far will still be exported
