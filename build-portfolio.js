#!/usr/bin/env node

/**
 * Portfolio Build Script
 *
 * Automatically scans project directories and rebuilds the portfolio site
 * with updated project information from README files.
 *
 * Usage: node build-portfolio.js
 * Or: npm run build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  projectsDir: path.join(__dirname, '..'),
  outputDir: __dirname,
  excludeDirs: [
    'work-tools-portfolio',
    'Obsolete',
    'node_modules',
    '.git',
    '.DS_Store',
    '.claude',
    'smart-excerpt-option1',
    'smart-excerpt-option4'
  ],
  githubUsername: 'qrsouther'
};

// ANSI color codes for pretty console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, colors.green);
}

function logInfo(message) {
  log(`  → ${message}`, colors.cyan);
}

/**
 * Scan directories for projects with README files
 */
function scanProjects() {
  logStep('SCAN', 'Scanning for projects...');

  const projects = [];
  const items = fs.readdirSync(CONFIG.projectsDir, { withFileTypes: true });

  for (const item of items) {
    if (!item.isDirectory()) continue;
    if (CONFIG.excludeDirs.includes(item.name)) continue;

    const projectPath = path.join(CONFIG.projectsDir, item.name);
    const readmePath = path.join(projectPath, 'README.md');
    const altReadmePath = path.join(projectPath, 'CONFLUENCE_MACRO_CHECKER_README.md');

    let finalReadmePath = null;

    if (fs.existsSync(readmePath)) {
      finalReadmePath = readmePath;
    } else if (fs.existsSync(altReadmePath)) {
      finalReadmePath = altReadmePath;
    }

    if (finalReadmePath) {
      const readme = fs.readFileSync(finalReadmePath, 'utf-8');
      const projectInfo = parseReadme(readme, item.name);

      if (projectInfo) {
        projects.push(projectInfo);
        logSuccess(`Found: ${item.name}`);
      }
    }
  }

  logInfo(`Total projects found: ${projects.length}`);
  return projects;
}

/**
 * Parse README file and extract project information
 */
function parseReadme(readme, dirName) {
  const lines = readme.split('\n');

  // Extract title (first h1)
  const titleMatch = readme.match(/^#\s+(.+?)$/m);
  const title = titleMatch ? titleMatch[1] : formatTitle(dirName);

  // Extract description (first paragraph after title)
  let description = '';
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.trim() && !line.startsWith('#') && !line.startsWith('[')) {
      description = line.trim();
      break;
    }
  }

  // Detect project type and execution badges
  const content = readme.toLowerCase();
  const executionTypes = [];
  const isDependent = content.includes('uses master tracker') || content.includes('data dependency');

  // Detect execution type
  if (content.includes('cloud function') || content.includes('google cloud')) {
    executionTypes.push({ type: 'deployed', icon: '☁️', text: 'Google Cloud Function (Automated)' });
  }
  if (content.includes('forge app') || (content.includes('forge') && content.includes('jira'))) {
    executionTypes.push({ type: 'forge', icon: '🔧', text: 'Forge App (Install to Jira)' });
  }
  if (content.includes('forge app') || (content.includes('forge') && content.includes('confluence'))) {
    executionTypes.push({ type: 'forge', icon: '🔧', text: 'Forge App (Install to Confluence)' });
  }
  if (content.includes('chrome extension')) {
    executionTypes.push({ type: 'extension', icon: '🧩', text: 'Chrome Extension (Manual Install)' });
  }
  if (content.includes('python') && (content.includes('cli') || content.includes('script'))) {
    executionTypes.push({ type: 'script', icon: '🐍', text: 'Python Script (Manual Run)' });
  }

  // Add dependency badge if applicable
  if (isDependent) {
    executionTypes.push({ type: 'dependency', icon: '⬆️', text: 'Uses Master Tracker Data' });
  }

  return {
    title,
    description: description || 'No description available',
    dirName,
    executionTypes: executionTypes.length > 0 ? executionTypes : [{ type: 'script', icon: '🔨', text: 'Tool' }],
    isDependent,
    readme
  };
}

/**
 * Format directory name to readable title
 */
function formatTitle(dirName) {
  return dirName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate tool item HTML for launcher page
 */
function generateToolItem(project) {
  const executionTypesHtml = project.executionTypes
    .map(badge => `<span class="execution-type ${badge.type}">${badge.icon} ${badge.text}</span>`)
    .join('\n                    ');

  // Map project directory names to thumbnail filenames
  const thumbnailMap = {
    'blueprint-standard-adherence-master-tracker': 'master-tracker.png',
    'blueprint-standard-adherence-thermometers': 'thermometers.png',
    'blueprint-standards-chart-custom-ui-react': 'blueprint-chart.png',
    'confluence-json-editor': 'json-editor.png',
    'confluence-macro-checker': 'macro-checker.png',
    'smart-excerpt': 'smart-excerpt.png'
  };

  const thumbnail = thumbnailMap[project.dirName] || 'placeholder.png';
  const dependentClass = project.isDependent ? ' tool-item-dependent' : '';

  return `            <!-- ${project.title} -->
            <div class="tool-item${dependentClass}">
                <img src="thumbnails/${thumbnail}" alt="${project.title}" class="tool-thumbnail">
                <div class="tool-info">
                    <h2>${project.title}</h2>
                    <p class="description">${project.description}</p>
                    ${executionTypesHtml}
                </div>
                <div class="tool-actions">
                    <a href="https://github.com/${CONFIG.githubUsername}/${project.dirName}" class="btn" target="_blank">GitHub</a>
                </div>
            </div>`;
}

/**
 * Generate individual project detail page
 */
function generateProjectPage(project) {
  const slug = project.dirName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Convert markdown README to HTML-friendly format
  const readmeHtml = project.readme
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^(?!<[huplod]|<\/[huplod])(.+)$/gm, '<p>$1</p>')
    .replace(/<\/ul>\n?<ul>/g, '')
    .replace(/<\/ol>\n?<ol>/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title} - Work Tools Portfolio</title>
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>${project.title}</h1>
            <p class="subtitle">${project.description}</p>
        </div>
    </header>

    <main class="container">
        <a href="../index.html" class="back-link">← Back to Portfolio</a>

        <div class="project-detail">
            <div class="launch-buttons">
                <a href="https://github.com/${CONFIG.githubUsername}/${project.dirName}" class="btn btn-primary" target="_blank">View on GitHub</a>
            </div>

            ${readmeHtml}
        </div>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2025 Work Tools Portfolio. Built with Claude Code.</p>
        </div>
    </footer>
</body>
</html>`;
}

/**
 * Generate main index.html page (launcher style)
 */
function generateIndexPage(projects) {
  const toolItemsHtml = projects.map(generateToolItem).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Tools Launcher</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Work Tools</h1>
            <p class="subtitle">Quick access to automation, extensions, and utilities</p>
        </header>

        <main class="tools-list">
${toolItemsHtml}

        </main>

        <footer>
            <p>Built with <a href="https://claude.com/claude-code" target="_blank">Claude Code</a></p>
        </footer>
    </div>
</body>
</html>`;
}

/**
 * Main build function
 */
function buildPortfolio() {
  log('\n' + colors.bright + '='.repeat(60) + colors.reset);
  log(colors.bright + '  Portfolio Build Script' + colors.reset);
  log(colors.bright + '='.repeat(60) + colors.reset);

  // Step 1: Scan projects
  const projects = scanProjects();

  if (projects.length === 0) {
    log('\n⚠️  No projects found!', colors.yellow);
    return;
  }

  // Step 2: Generate index page
  logStep('BUILD', 'Generating index.html...');
  const indexHtml = generateIndexPage(projects);
  fs.writeFileSync(path.join(CONFIG.outputDir, 'index.html'), indexHtml);
  logSuccess('index.html created');

  // Step 3: Generate project pages
  logStep('BUILD', 'Generating project pages...');
  const projectsDir = path.join(CONFIG.outputDir, 'projects');
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir);
  }

  for (const project of projects) {
    const slug = project.dirName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pageHtml = generateProjectPage(project);
    fs.writeFileSync(path.join(projectsDir, `${slug}.html`), pageHtml);
    logSuccess(`${slug}.html created`);
  }

  // Step 4: Summary
  log('\n' + colors.bright + '='.repeat(60) + colors.reset);
  log(colors.green + colors.bright + '  ✓ Build Complete!' + colors.reset);
  log(colors.bright + '='.repeat(60) + colors.reset);
  logInfo(`Generated ${projects.length} project pages`);
  logInfo(`Output directory: ${CONFIG.outputDir}`);

  log('\n' + colors.cyan + 'Next steps:' + colors.reset);
  log('  1. Review the generated files');
  log('  2. Commit changes: ' + colors.yellow + 'git add . && git commit -m "Rebuild portfolio"' + colors.reset);
  log('  3. Push to GitHub: ' + colors.yellow + 'git push' + colors.reset);
  log('');
}

// Run the build
if (require.main === module) {
  try {
    buildPortfolio();
  } catch (error) {
    log('\n❌ Build failed:', colors.bright);
    console.error(error);
    process.exit(1);
  }
}

module.exports = { buildPortfolio };
