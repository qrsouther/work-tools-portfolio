# Blueprint Standard Adherence Thermometers - Standalone Web App

A self-contained HTML/JavaScript application that displays Google Sheets data in thermometer visualizations and dashboards. Perfect for embedding in Jira as an iframe gadget.

## Features

- 📊 Displays all sheets/tabs from your Google Sheets workbook
- 🔄 Tab navigation between different sheets
- 📱 Responsive table design with hover effects
- 💾 Remembers your configuration (localStorage)
- 🔒 Secure - all data stays in your browser
- ⚡ Fast and lightweight - single HTML file

## Setup Instructions

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
   - **IMPORTANT**: Click "Restrict Key" and limit it to "Google Sheets API"

### 2. Google Sheets Setup

1. Open your Google Sheets workbook
2. Set sharing to "Anyone with the link can view"
3. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

### 3. Host the Web App

You have several hosting options:

#### Option A: GitHub Pages (Free & Easy)

1. Create a new GitHub repository
2. Upload `index.html` to the repository
3. Go to Settings > Pages
4. Select main branch as source
5. Your URL will be: `https://yourusername.github.io/repo-name/index.html`

#### Option B: Netlify Drop (Free & Instant)

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag and drop the `index.html` file
3. Get instant URL like: `https://random-name.netlify.app`

#### Option C: Internal Web Server

1. Host `index.html` on your company's internal web server
2. Access via: `https://your-server.com/blueprint-thermometers/index.html`

#### Option D: Local File (Development Only)

1. Open `index.html` directly in your browser
2. Note: CORS restrictions may apply

### 4. Add to Jira Dashboard

#### Method 1: External Gadget (Recommended)

1. Go to your Jira dashboard
2. Click "Add gadget"
3. Search for "**External Gadget**" or "**iFrame**"
4. Add the gadget
5. Configure it:
   - **Title**: Blueprint Standard Adherence Thermometers
   - **Gadget URL**: Your hosted URL (e.g., `https://yourusername.github.io/repo-name/index.html`)
   - **Height**: 600px (or adjust as needed)
6. Save the gadget

#### Method 2: Custom HTML Gadget (If Available)

Some Jira instances have custom HTML gadgets:

1. Add "Custom HTML" or "HTML" gadget
2. Paste this code:
```html
<iframe src="YOUR_HOSTED_URL" width="100%" height="600" frameborder="0"></iframe>
```

### 5. Configure the Dashboard

1. When the gadget loads, you'll see setup instructions
2. Enter your:
   - **Spreadsheet ID** (from step 2)
   - **API Key** (from step 1)
3. Click "Load Data"
4. Your sheets will appear in tabs with data tables
5. Configuration is saved automatically for next time

## Usage

- **Tabs**: Click tabs to switch between different sheets
- **Refresh**: Click "Refresh" button to reload data
- **Automatic Save**: Configuration is saved in browser localStorage
- **Data Display**: Shows first 50 rows of each sheet for performance

## Security Notes

- ✅ All API calls are made client-side (browser to Google directly)
- ✅ No data passes through any intermediate server
- ✅ API keys are stored only in browser localStorage
- ⚠️ **Important**: Restrict your Google API key to Sheets API only
- ⚠️ Only use with sheets that are okay to be publicly viewable

## Customization

You can customize the appearance by editing the `<style>` section in `index.html`:

- **Colors**: Change `#0052CC` (primary blue) to your brand color
- **Fonts**: Modify `font-family` values
- **Row Limit**: Change `slice(1, 51)` to show more/fewer rows
- **Table Styling**: Adjust padding, borders, hover effects

## Troubleshooting

### "Failed to fetch spreadsheet"
- Verify your Spreadsheet ID is correct
- Check that the sheet is set to "Anyone with the link can view"
- Ensure your API key is valid and has Sheets API enabled

### "API key not valid"
- Make sure you copied the entire API key
- Check that the API key isn't restricted to wrong domains
- Verify Google Sheets API is enabled in your project

### Blank/Empty Tables
- Check that your sheets have data
- Verify the first row contains headers
- Try clicking "Refresh" to reload

### CORS Errors
- Make sure you're accessing via HTTP/HTTPS, not `file://`
- Host the file on a proper web server

## Advanced: URL Parameters

You can pre-configure the dashboard via URL parameters:

```
https://your-url.com/index.html?spreadsheetId=ABC123&apiKey=xyz
```

This is useful for creating multiple dashboard instances for different sheets.

## Support

For issues or questions:
- Check the browser console for errors (F12)
- Verify Google Sheets API quotas haven't been exceeded
- Test the spreadsheet URL manually in browser

## License

MIT License - Free to use and modify
