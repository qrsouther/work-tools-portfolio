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
    'node_modules',
    '.git',
    '.DS_Store',
    '.claude'
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

  // Detect project type and technologies
  const content = readme.toLowerCase();
  const badges = [];
  const stats = [];

  // Detect technologies and add badges
  if (content.includes('forge') || content.includes('atlassian')) badges.push({ type: 'forge', text: 'Forge App' });
  if (content.includes('react')) badges.push({ type: 'react', text: 'React' });
  if (content.includes('python')) badges.push({ type: 'python', text: 'Python' });
  if (content.includes('cloud function') || content.includes('google cloud')) badges.push({ type: 'cloud', text: 'Cloud Function' });
  if (content.includes('automation') || content.includes('scheduled')) badges.push({ type: 'automation', text: 'Automation' });
  if (content.includes('chrome extension')) badges.push({ type: 'tool', text: 'Chrome Extension' });
  if (content.includes('cli') || content.includes('command line')) badges.push({ type: 'tool', text: 'CLI Tool' });
  if (content.includes('visualization') || content.includes('chart')) badges.push({ type: 'visualization', text: 'Visualization' });

  // Extract key stats if present
  const statusMatch = readme.match(/Status.*?deployed/i);
  if (statusMatch) stats.push('Deployed & Running');

  const pagesMatch = readme.match(/~?(\d+)\s+pages/i);
  if (pagesMatch) stats.push(`~${pagesMatch[1]} pages processed`);

  return {
    title,
    description: description || 'No description available',
    dirName,
    badges: badges.length > 0 ? badges : [{ type: 'tool', text: 'Tool' }],
    stats: stats.length > 0 ? stats : ['Active'],
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
 * Generate project card HTML for index page
 */
function generateProjectCard(project) {
  const badgesHtml = project.badges
    .map(badge => `<span class="badge badge-${badge.type}">${badge.text}</span>`)
    .join('\n                    ');

  const statsHtml = project.stats
    .map(stat => `<span>${stat}</span>`)
    .join('\n                    ');

  const slug = project.dirName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return `            <!-- ${project.title} -->
            <article class="project-card">
                <div class="project-header">
                    <h2>${project.title}</h2>
                    ${badgesHtml}
                </div>
                <p class="project-description">
                    ${project.description}
                </p>
                <div class="project-stats">
                    ${statsHtml}
                </div>
                <div class="project-links">
                    <a href="projects/${slug}.html" class="btn btn-primary">View Details</a>
                    <a href="https://github.com/${CONFIG.githubUsername}/${project.dirName}" class="btn btn-secondary" target="_blank">View on GitHub</a>
                </div>
            </article>`;
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
 * Generate main index.html page
 */
function generateIndexPage(projects) {
  const projectCardsHtml = projects.map(generateProjectCard).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Tools Portfolio</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>Work Tools & Automation</h1>
            <p class="subtitle">Custom-built solutions for Confluence, Jira, and workflow automation</p>
        </div>
    </header>

    <main class="container">
        <section class="intro">
            <p>This portfolio showcases various tools, Chrome extensions, and automation workflows built to streamline work processes at SeatGeek. Each tool is designed to solve specific challenges with Confluence, Jira, and data tracking.</p>
            <p style="margin-top: 1rem;"><a href="build-docs.html" style="color: #2563eb; font-weight: 600;">📖 View Build Documentation</a> - Learn how to rebuild this portfolio automatically</p>
        </section>

        <section class="projects-grid">
${projectCardsHtml}
        </section>

        <section class="tech-stack">
            <h2>Technologies Used</h2>
            <div class="tech-grid">
                <div class="tech-item">
                    <h3>Backend</h3>
                    <ul>
                        <li>Node.js</li>
                        <li>Python</li>
                        <li>Google Cloud Functions</li>
                    </ul>
                </div>
                <div class="tech-item">
                    <h3>Frontend</h3>
                    <ul>
                        <li>React</li>
                        <li>JavaScript</li>
                        <li>HTML/CSS</li>
                    </ul>
                </div>
                <div class="tech-item">
                    <h3>Platforms</h3>
                    <ul>
                        <li>Atlassian Forge</li>
                        <li>Confluence API</li>
                        <li>Jira API</li>
                    </ul>
                </div>
                <div class="tech-item">
                    <h3>Integrations</h3>
                    <ul>
                        <li>Google Sheets API</li>
                        <li>Google Cloud Platform</li>
                        <li>OAuth 2.0</li>
                    </ul>
                </div>
            </div>
        </section>
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
