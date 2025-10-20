# Blueprint Standard Adherence Thermometers

A collection of web-based tools for visualizing Google Sheets data, including a thermometer-style progress dashboard and standard data viewers. Includes both a standalone web application and an Atlassian Forge app for Jira integration.

## Features

### Thermometer Dashboard (`webapp/index-thermometer.html`)
- **Horizontal Thermometer Visualizations**: Display percentage-based progress bars with colored segments
- **Standards Adherence Tracking**: Perfect for tracking compliance categories (Standard, Semi-Standard, Bespoke, Non-Standard, TBD, N/A)
- **Interactive Features**:
  - Hover tooltips showing exact counts and percentages
  - Clickable team names linking to Confluence pages
  - Search/filter by team name
  - Sort by Standard percentage or alphabetically
- **Google OAuth Integration**: Secure authentication to access private sheets
- **Multi-sheet Support**: Each sheet tab becomes its own thermometer visualization
- **Color-coded Segments**: Customizable colors per category with automatic text contrast

### Standard Data Viewers
- **API Key Version** (`webapp/index.html`): Simple Google Sheets viewer using API keys
- **OAuth Version** (`webapp/index-oauth.html`): Secure OAuth-based Google Sheets viewer
- **Features**:
  - Multi-tab navigation between sheets
  - Tabular data display
  - Real-time refresh
  - Local storage for credentials

### Jira Dashboard Gadget (Forge App)
- **Jira Integration**: Add Google Sheets data directly to Jira dashboards
- **Interactive Visualizations**: Create bar charts, line charts, and pie charts
- **Tab Navigation**: Switch between different sheets
- **Forge Platform**: Built on Atlassian's Forge platform for secure Jira Cloud integration

## Quick Start

### Using the Thermometer Dashboard (Recommended)

1. **Open** `webapp/index-thermometer.html` in a web browser
2. **Click** "Sign in with Google" and authorize access
3. **Data loads automatically** from the configured spreadsheet
4. **Hover** over segments to see detailed tooltips
5. **Search** or sort teams as needed

The thermometer dashboard is pre-configured to work with a specific Google Sheets format. No additional setup required!

### Using the Standard Data Viewers

#### API Key Method (`webapp/index.html`)
1. Get a Google API Key with Sheets API enabled
2. Make your sheet public ("Anyone with the link can view")
3. Open `webapp/index.html` in a browser
4. Enter your Spreadsheet ID and API Key
5. Click "Load Data"

#### OAuth Method (`webapp/index-oauth.html`)
1. Open `webapp/index-oauth.html` in a browser
2. Click "Sign in with Google"
3. Enter your Spreadsheet ID
4. Click "Load Data"

## Setup Instructions

### For Thermometer Dashboard

The thermometer dashboard expects Google Sheets with the following column structure:
- **Lozenge Text**: Category name (e.g., "Standard", "Semi-Standard", "Bespoke", "Non-Standard", "TBD", "N/A")
- **Lozenge Color**: Hex color code or color name
- **Count**: Number of items in that category
- **Page ID** (optional): Confluence page ID for creating clickable links

Each sheet tab in your workbook will become a separate thermometer visualization.

### For Jira Forge App (Optional)

If you want to deploy the Jira dashboard gadget:

#### Prerequisites
1. **Atlassian Forge CLI** (version 12.7.0 or higher)
2. **Node.js** (v14 or higher)
3. **Jira Cloud instance** with admin access
4. **Google Cloud Platform account** for API access

#### Installation Steps

1. **Install dependencies**:
   ```bash
   npm install
   npm run install-frontend
   ```

2. **Build the frontend**:
   ```bash
   npm run build
   ```

3. **Register the app** (first time only):
   ```bash
   forge register
   ```

4. **Deploy the app**:
   ```bash
   forge deploy
   forge install
   ```

5. **Add to Jira Dashboard**:
   - Go to your Jira instance
   - Navigate to any dashboard
   - Click "Add gadget"
   - Search for "Google Sheets Dashboard"
   - Configure with your Spreadsheet ID and API Key

### Google Cloud Setup (For API Key Method)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Sheets API**
3. Create credentials:
   - **For API Key method**: Create an API Key and restrict it to Sheets API
   - **For OAuth method**: Create OAuth 2.0 Client ID for web application
4. For OAuth, configure authorized JavaScript origins and redirect URIs

### Google Sheets Setup (For API Key Method Only)

1. Open your Google Sheets workbook
2. Click "Share" and set to "Anyone with the link can view"
3. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

## Usage

### Thermometer Dashboard

- **View Progress**: Each team/sheet displays as a horizontal thermometer bar with colored segments
- **Hover for Details**: Mouse over any segment to see exact counts and percentages
- **Click Team Names**: If Page IDs are configured, team names link to Confluence pages
- **Search**: Use the search box to filter teams by name
- **Sort**: Choose between sorting by Standard percentage (high to low) or alphabetically
- **Refresh**: Click "Refresh" to fetch the latest data from Google Sheets

### Standard Data Viewers

- **Tabs**: Each sheet from your workbook appears as a separate tab
- **Tables**: View raw data in formatted tables (first 50 rows displayed)
- **Refresh**: Click "Refresh" to fetch the latest data
- **Navigation**: Click tabs to switch between different sheets

### Jira Gadget (if deployed)

- **Visualizations**: Use dropdowns to select chart type and data columns
- **Chart Types**: Bar, Line, or Pie charts
- **Raw Data**: View complete data in table format
- **Configure**: Change connected spreadsheet or API key

## Project Structure

```
blueprint-standard-adherence-thermometers/
├── webapp/                      # Standalone web applications
│   ├── index-thermometer.html   # Thermometer dashboard (main feature)
│   ├── index.html               # API key-based viewer
│   └── index-oauth.html         # OAuth-based viewer
├── manifest.yml                 # Forge app configuration
├── src/                         # Forge app backend
│   ├── index.js                 # Backend resolver (API handlers)
│   └── config.js                # Configuration handler
├── static/
│   ├── dashboard/               # Frontend React app for Forge
│   └── iframe-app/              # Forge iframe resources
├── icon.png                     # App icon
└── package.json                 # Dependencies
```

## Development

### Working with Webapp Files

The webapp files are standalone HTML files that can be:
- **Opened directly** in a browser for local testing
- **Deployed** to any static hosting service (GitHub Pages, Netlify, etc.)
- **Customized** by editing the HTML/CSS/JavaScript directly

### Working with Forge App

```bash
# Watch for changes and auto-deploy
forge tunnel

# View logs
forge logs

# Deploy changes
forge deploy
```

### Making Changes

#### Webapp Changes
1. Edit the HTML file directly
2. Refresh your browser to see changes
3. No build step required

#### Forge App Changes
1. Edit the code in `src/` or `static/dashboard/`
2. Rebuild frontend if needed: `npm run build`
3. Deploy changes: `forge deploy`

## Customization Ideas

### Thermometer Dashboard Customization

#### Change Color Scheme
Edit the colors in the `colors` object assignment in `webapp/index-thermometer.html` (around line 688-698):
```javascript
if (text === 'TBD') {
    colors[text] = '#808080';  // Change this color
} else if (text === 'N/A') {
    colors[text] = '#C0C0C0';  // Change this color
}
```

#### Modify Categories
Update the `segmentOrder` array (line 736) to change the order or add new categories:
```javascript
const segmentOrder = ['Standard', 'Semi-Standard', 'Bespoke', 'Non-Standard', 'TBD', 'N/A'];
```

#### Customize Links
Change the Confluence URL pattern (line 716):
```javascript
link.href = `https://your-domain.atlassian.net/wiki/spaces/cs/pages/${pageId}`;
```

#### Adjust Thermometer Size
Modify the height in the `.thermometer` CSS class (line 280):
```css
height: 80px;  /* Change this value */
```

### Forge App Customization

#### Add More Chart Types
Edit `static/dashboard/src/DataVisualizations.js` to add more recharts visualizations:
- Area charts
- Scatter plots
- Radar charts
- Composed charts

#### Custom Styling
Modify `static/dashboard/src/App.css` to match your brand colors

#### Data Filtering
Add filtering logic to allow users to filter data before visualization

#### Scheduled Refresh
Use Forge scheduled triggers to automatically refresh data

## Security Notes

### OAuth Authentication (Thermometer Dashboard)
- **Secure**: Uses Google OAuth 2.0 for authentication
- **Tokens**: Access tokens are stored in browser memory only (not persisted)
- **Permissions**: Only requests read-only access to spreadsheets
- **Private Sheets**: Can access private sheets you have permission to view

### API Key Authentication (Standard Viewers)
- **Public Sheets Only**: Requires sheets to be set to "Anyone with the link can view"
- **API Key Security**: Restrict your Google API key to only the Sheets API
- **Local Storage**: API keys are stored in browser localStorage
- **Best Practice**: Use OAuth method for private or sensitive data

### Forge App
- **Secure Storage**: API keys stored in Forge's encrypted storage API
- **Data Privacy**: Only use with data you're comfortable storing in Atlassian's systems
- **Sheet Permissions**: Ensure sheets are set to "view only" to prevent unauthorized edits

## Troubleshooting

### Thermometer Dashboard Issues

**Authentication Failed**
- Clear browser cache and cookies
- Try signing out and signing in again
- Check that Google OAuth library loaded (refresh page)

**Thermometers Not Displaying**
- Verify your sheet has required columns: "Lozenge Text", "Lozenge Color", "Count"
- Check that Count column contains numeric values
- Ensure at least one data row exists below headers

**Wrong Colors Showing**
- Check "Lozenge Color" column has valid color values (hex codes or names)
- TBD and N/A have hardcoded colors (#808080 and #C0C0C0)

### Standard Viewer Issues

**"Failed to fetch spreadsheet" Error**
- Verify Google Sheet is set to "Anyone with the link can view" (for API key method)
- Check that API key is valid and enabled for Sheets API
- Confirm Spreadsheet ID is correct
- For OAuth method, ensure you're signed in

**Data Not Loading**
- Check browser console for error messages
- Verify spreadsheet ID format (no spaces or extra characters)
- Test sheet URL directly in browser to confirm it's accessible

### Forge App Issues

**"Missing spreadsheet configuration" Error**
- Configure gadget with both Spreadsheet ID and API Key

**Build Errors**
- Delete `node_modules` in both root and `static/dashboard` directories
- Run `npm install` and `npm run install-frontend` again
- Ensure Node.js version is v14 or higher

## Use Cases

### Thermometer Dashboard
- **Standards Compliance Tracking**: Visualize how teams adhere to different standards
- **Progress Monitoring**: Track project completion across multiple categories
- **Team Comparison**: Compare performance or compliance across different teams
- **Executive Reporting**: Quick visual overview of organizational metrics

### Standard Data Viewers
- **Quick Data Review**: View Google Sheets data without opening Google Sheets
- **Embedded Dashboards**: Embed sheet data in internal tools or websites
- **Multi-sheet Browsing**: Navigate through multiple sheets in one interface

### Jira Integration
- **Centralized Dashboards**: Bring external data into Jira
- **Sprint Metrics**: Display spreadsheet-based metrics alongside Jira data
- **Team KPIs**: Show team performance data from sheets in Jira dashboards

## License

ISC

## Resources

- **Forge Platform**: [Atlassian Forge Documentation](https://developer.atlassian.com/platform/forge/)
- **Google Sheets API**: [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- **Google OAuth 2.0**: [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
