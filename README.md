# Work Tools Portfolio

A GitHub Pages site showcasing custom-built tools, Chrome extensions, and automation workflows for Confluence, Jira, and workflow automation at SeatGeek.

## Live Site

Visit the portfolio at: `https://qrsouther.github.io/work-tools-portfolio/`

## Projects Featured

### 1. Blueprint Standard Adherence Master Tracker
Fully automated cloud-based application deployed to Google Cloud Functions. Scans ~70 Confluence Blueprint pages for status lozenges (~4,900 total), counts them by label and color, and exports results to individual Google Sheets tabs. Runs daily at 9 AM ET with zero maintenance required.

- **Type:** Cloud Function, Automation (Production)
- **Tech:** Node.js, TypeScript, Google Cloud Functions, Confluence API, Google Sheets API, OAuth 2.0
- **Status:** ✅ Deployed and Running
- **Updated:** October 20, 2025

### 2. Blueprint Standard Adherence Thermometers
Atlassian Forge app that displays thermometer visualizations for tracking blueprint standard adherence on Jira dashboards. Pulls data from Google Sheets and displays custom data visualizations with real-time compliance metrics.

- **Type:** Forge App, Jira Dashboard Gadget
- **Tech:** Atlassian Forge, React 19.2, Google Sheets API, Custom Visualizations
- **Status:** Built - Ready for deployment
- **Updated:** October 17, 2025

### 3. Blueprint Standards Chart (Custom UI React)
Atlassian Forge confluence macro application with custom UI configuration. Features dual Vite-based static builds (hello-world macro and custom config UI). Demonstrates custom Confluence macro with configuration capabilities.

- **Type:** Forge App, Confluence Macro
- **Tech:** Atlassian Forge, React, Vite, Custom UI
- **Status:** Built - Production-ready
- **Updated:** October 16, 2025

### 4. Confluence JSON Editor
Chrome extension for editing Confluence page content via REST API. Uses manifest v3 with service worker background. Provides side panel UI for JSON content editing directly against Confluence pages.

- **Type:** Chrome Extension
- **Tech:** Chrome Manifest v3, Service Worker, Confluence REST API
- **Status:** Built - Ready for use
- **Updated:** October 14, 2025

### 5. Confluence Macro Error Checker
Comprehensive macro error detection system with dual implementations:
- **Python CLI Tool**: Searches Confluence pages by keyword, detects macro rendering errors, exports results to Google Sheets
- **Chrome Extension**: Scans Blueprint pages in background tabs (~45-50 min runtime) using active Confluence session, with strict error filtering and automatic JSON export

- **Type:** Dual Tools (CLI + Chrome Extension)
- **Tech:** Python, Chrome Extension, Google Sheets API, Confluence API
- **Status:** Actively Developed (Chrome extension recently updated Oct 17)
- **Updated:** October 17, 2025

### 6. Lozenge Donut Chart v2 (Claude Code)
Atlassian Forge UI Kit component for creating donut chart visualizations with lozenge status indicators. Part of the Claude Code project series with detailed development guidelines.

- **Type:** Forge App, Visualization Component
- **Tech:** Atlassian Forge UI Kit, React 18.2, @forge/api, @forge/bridge
- **Status:** Built - Ready for deployment
- **Updated:** October 16, 2025

## Local Development

### Prerequisites
- Web browser
- Local web server (optional, for testing)

### Running Locally

You can simply open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## Deployment to GitHub Pages

### Step 1: Create Repository

```bash
cd work-tools-portfolio
git init
git add .
git commit -m "Initial commit: Work tools portfolio site"
```

### Step 2: Create GitHub Repository

1. Go to GitHub and create a new repository named `work-tools-portfolio`
2. Don't initialize with README (we already have one)
3. Copy the repository URL

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/qrsouther/work-tools-portfolio.git
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings"
3. Scroll to "Pages" section
4. Under "Source", select "main" branch and "/ (root)" folder
5. Click "Save"
6. Your site will be published at `https://qrsouther.github.io/work-tools-portfolio/`

## Customization

### Updating Project Information

Edit the project cards in `index.html` to update descriptions, links, or add new projects.

### Styling Changes

Modify `styles.css` to customize colors, fonts, and layout. The CSS uses CSS custom properties (variables) for easy theming:

```css
:root {
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    /* ... other variables */
}
```

### Adding New Projects

1. Create a new HTML file in the `projects/` directory
2. Use existing project pages as templates
3. Add a new project card in `index.html`
4. Update the project links

## Structure

```
work-tools-portfolio/
├── index.html                      # Main landing page
├── styles.css                      # Global styles
├── build-portfolio.js              # Automated build system
├── build-docs.html                 # Build documentation
├── package.json                    # Build dependencies
├── README.md                       # This file
├── projects/                       # Individual project pages
│   ├── blueprint-standard-adherence-master-tracker.html
│   ├── blueprint-standard-adherence-thermometers.html
│   ├── blueprint-standards-chart-custom-ui-react.html
│   ├── confluence-json-editor.html
│   ├── confluence-macro-checker.html
│   └── lozenge-donut-chart-v2-claude-code.html
├── project-code/                   # Full source code for all projects
│   ├── blueprint-standard-adherence-master-tracker/
│   ├── blueprint-standard-adherence-thermometers/
│   ├── blueprint-standards-chart-custom-ui-react/
│   ├── confluence-json-editor/
│   ├── confluence-macro-checker/
│   └── lozenge-donut-chart-v2-claude-code/
└── .gitignore
```

## Technologies Used

### Frontend
- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript (no frameworks needed for static site)

### Hosting
- GitHub Pages

### Projects Featured Use
- Node.js / TypeScript
- Python
- React
- Atlassian Forge
- Google Cloud Platform
- Confluence & Jira APIs

## License

This portfolio site is open source. Individual projects may have their own licenses.

## Contact

For questions about any of these projects, please open an issue in the respective project repository.

---

Built with Claude Code
