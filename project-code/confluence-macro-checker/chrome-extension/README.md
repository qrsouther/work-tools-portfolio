# Confluence Macro Error Checker - Chrome Extension

A Chrome extension that automatically scans Confluence Blueprint pages for macro rendering errors using your active browser session.

## Features

- ✅ Automatically finds all Blueprint pages in the CS space
- ✅ Uses your active Confluence session (no authentication issues!)
- ✅ Waits 30 seconds per page for macros to render
- ✅ **Strictly filters for MultiExcerpt Include macro errors only**
- ✅ Runs completely in the background - no need to keep popup open
- ✅ Auto-downloads results as JSON when complete
- ✅ Browser notification when scan finishes
- ✅ Progress viewable in extension service worker console
- ✅ No Python, Selenium, or ChromeDriver required!

## Installation

1. **Download the extension**
   - The extension files are in this `chrome-extension` directory

2. **Open Chrome Extensions page**
   - Go to `chrome://extensions/` in your browser
   - Or click the three dots menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension should now appear in your extensions list

5. **Pin the extension** (optional but recommended)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Confluence Macro Error Checker"
   - Click the pin icon to keep it visible

## Usage

1. **Log into Confluence**
   - Navigate to your Confluence instance (e.g., `https://seatgeek.atlassian.net/wiki`)
   - Make sure you're logged in

2. **Start the scan**
   - Click the extension icon in your toolbar
   - Click "Start Scanning Blueprint Pages"
   - **You can now close the popup!** The scan runs in the background

3. **What happens during the scan**
   - Finds all pages with "Blueprint" in the title in CS space
   - Opens each page in a background tab (you'll see tabs briefly appear)
   - Waits 30 seconds for macros to render
   - Checks for MultiExcerpt Include macro errors
   - Closes the tab and moves to the next page
   - **Expected time: ~45-50 minutes for 90 pages**

4. **Monitor progress (optional)**
   - Go to `chrome://extensions/`
   - Find "Confluence Macro Error Checker"
   - Click "service worker" to see console logs
   - Watch real-time progress: "Checking page 15 of 90..."

5. **Get results**
   - When complete, a browser notification will appear
   - A JSON file will automatically download to your Downloads folder
   - Filename format: `confluence_multiexcerpt_errors_2025-01-17T14-30-00.json`
   - File includes summary and details of all pages with errors

## How It Works

The extension consists of three main components:

1. **Background Service Worker** (`background.js`)
   - Fetches the list of Blueprint pages from Confluence REST API
   - Orchestrates the scanning process
   - Opens pages in background tabs

2. **Content Script** (`content.js`)
   - Runs on each Confluence page
   - Waits 30 seconds for macros to render
   - Detects macro errors using multiple methods:
     - CSS selectors for error classes
     - Text pattern matching
     - Macro-specific error attributes

3. **Popup UI** (`popup.html` + `popup.js`)
   - Displays scan progress
   - Shows results in real-time
   - Provides export functionality

## Advantages Over Python/Selenium Approach

- ✅ **No authentication issues** - Uses your actual logged-in session
- ✅ **Faster** - No WebDriver initialization overhead
- ✅ **More reliable** - Accesses the real rendered DOM
- ✅ **No dependencies** - Just install and use
- ✅ **Better UX** - Real-time progress in your browser
- ✅ **No screen sleep issues** - Runs in active browser context

## Troubleshooting

### Extension doesn't start
- Make sure you're on a Confluence page when you click "Start"
- Check that you're logged into Confluence
- Refresh the Confluence page and try again

### No pages found
- Verify that pages with "Blueprint" in the title exist
- Check browser console for API errors (`F12` → Console tab)
- Make sure you have permission to access the Confluence API

### Errors not detected
- The extension waits 30 seconds per page - some slow macros may need longer
- Some error formats might not be detected - check the page manually
- Open the extension's console to see debugging info

### View extension console
1. Go to `chrome://extensions/`
2. Find "Confluence Macro Error Checker"
3. Click "service worker" or "Inspect views"
4. Check the Console tab for errors

## Customization

### Change wait time
Edit `content.js` line 7 to adjust the wait time (currently 30000ms = 30 seconds):
```javascript
setTimeout(() => {
  const errors = detectMacroErrors();
  // ...
}, 30000); // Change this number
```

### Add custom error patterns
Edit `content.js` and add patterns to the `errorKeywords` array (line 27):
```javascript
const errorKeywords = [
  'lookup error',
  'your custom error text',
  // ... add more
];
```

### Change search keyword
Edit `background.js` line 55 to search for different page titles:
```javascript
const url = `${confluenceUrl}/wiki/rest/api/content/search?cql=title~"YourKeyword"+AND+type=page&...`;
```

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # UI interface
├── popup.js              # UI logic
├── background.js         # Background worker (API calls, orchestration)
├── content.js            # Error detection logic
├── icon16.png            # Extension icon (16x16)
├── icon48.png            # Extension icon (48x48)
├── icon128.png           # Extension icon (128x128)
└── README.md             # This file
```

## Known Limitations

- Opens pages in background tabs (may be visible briefly)
- Requires Chrome/Chromium browser
- Must be on a Confluence page to start
- 30-second wait per page (total time = 30s × number of pages)
- Export only supports JSON format (not Google Sheets)

## Future Enhancements

- [ ] Configurable wait time in UI
- [ ] Pause/resume functionality
- [ ] Filter results by error type
- [ ] Direct Google Sheets export
- [ ] Custom search queries
- [ ] Save scan history
- [ ] Keyboard shortcuts

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Look at the browser console for errors
3. Verify you're using the latest version of Chrome
4. Make sure you have permission to access Confluence

## License

Internal tool - not for distribution
