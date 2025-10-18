# Work Tools Portfolio

A GitHub Pages site showcasing custom-built tools, Chrome extensions, and automation workflows for Confluence, Jira, and workflow automation at SeatGeek.

## Live Site

Visit the portfolio at: `https://qrsouther.github.io/work-tools-portfolio/`

## Projects Featured

### 1. Blueprint Standard Adherence Master Tracker
Automated Google Cloud Function that scans Confluence Blueprint pages for status lozenges and tracks them in Google Sheets. Runs daily at 9 AM ET.

- **Type:** Cloud Function, Automation
- **Tech:** Node.js, TypeScript, Google Cloud Functions, Confluence API, Google Sheets API
- **Status:** ✅ Deployed and running

### 2. Confluence Macro Error Checker
Python CLI tool that crawls Confluence to detect macro rendering errors and exports results to Google Sheets.

- **Type:** CLI Tool, Python Script
- **Tech:** Python, Confluence API, Google Sheets API
- **Status:** Active

### 3. Jira Google Sheets Dashboard
Atlassian Forge app that creates a Jira dashboard gadget displaying data from Google Sheets with interactive visualizations.

- **Type:** Forge App
- **Tech:** Atlassian Forge, React, Google Sheets API, Recharts
- **Status:** Active

### 4. Blueprint Standards Chart
Custom React UI component for Confluence that displays Blueprint standard adherence data with configurable charts.

- **Type:** Forge App, Confluence Macro
- **Tech:** Atlassian Forge, React, Custom UI
- **Status:** Active

### 5. Confluence JSON Editor
Forge app providing a JSON editor interface within Confluence for structured data editing.

- **Type:** Forge App, Confluence Macro
- **Tech:** Atlassian Forge, React, JSON validation
- **Status:** Active

### 6. Lozenge Donut Chart v2
Enhanced Confluence visualization component that creates donut charts from lozenge data.

- **Type:** Forge App, Visualization
- **Tech:** Atlassian Forge, React, Chart.js
- **Status:** Active

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
├── index.html              # Main landing page
├── styles.css              # Global styles
├── README.md               # This file
├── projects/               # Individual project pages
│   ├── blueprint-tracker.html
│   ├── macro-checker.html
│   ├── jira-sheets-dashboard.html
│   ├── blueprint-chart.html
│   ├── json-editor.html
│   └── lozenge-donut-chart.html
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
