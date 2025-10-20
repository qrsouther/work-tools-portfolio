import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { ConfluenceClient } from './confluence';
import { LozengeParser } from './lozengeParser';
import { GoogleSheetsClient } from './googleSheets';

// Load environment variables from .env file
dotenv.config();

/**
 * Main application orchestrator
 * Coordinates the flow: Confluence → Parse → Google Sheets
 */
async function main() {
  console.log('🚀 Blueprint Standard Adherence Master Tracker\n');

  try {
    // 1. Load configuration
    console.log('📋 Loading configuration...');
    const config = loadConfiguration();

    // 2. Initialize clients
    console.log('🔌 Connecting to Confluence...');
    const confluenceClient = new ConfluenceClient({
      baseUrl: config.confluence.baseUrl,
      email: config.confluence.email,
      apiToken: config.confluence.apiToken
    });

    console.log('🔌 Connecting to Google Sheets...');
    const sheetsClient = new GoogleSheetsClient({
      clientId: config.googleSheets.clientId,
      clientSecret: config.googleSheets.clientSecret,
      redirectUri: config.googleSheets.redirectUri,
      spreadsheetId: config.googleSheets.spreadsheetId
    });

    const parser = new LozengeParser();

    // 3. Search for Blueprint pages and fetch them (or use test page IDs)
    let pageIds: string[];

    if (config.confluence.testPageIds && config.confluence.testPageIds.length > 0) {
      console.log(`\n🧪 Test mode: Using ${config.confluence.testPageIds.length} hardcoded page IDs`);
      pageIds = config.confluence.testPageIds;
    } else {
      pageIds = await confluenceClient.searchPagesByTitle(
        config.confluence.spaceKey,
        config.confluence.titleSearch
      );

      if (pageIds.length === 0) {
        console.log('\n⚠️  No pages found matching search criteria.\n');
        return;
      }
    }

    console.log(`\n📥 Fetching ${pageIds.length} Confluence pages...`);
    const pages = await confluenceClient.getMultiplePages(pageIds);
    console.log(`✓ Retrieved ${pages.length} pages`);

    // Filter out pages that are templates, meta pages, or generic
    const exclusionTerms = [
      'Generic',
      'Template',
      'Templates',
      'Client Summaries',
      'What are Blueprint MultiExcerpts',
      'Best Practice Templates'
    ];

    const filteredPages = pages.filter(page => {
      return !exclusionTerms.some(term => page.title.includes(term));
    });

    const excludedCount = pages.length - filteredPages.length;
    if (excludedCount > 0) {
      console.log(`✓ Excluded ${excludedCount} page(s) (templates, meta pages, generic)`);
    }

    // 4. Parse and analyze lozenges
    console.log('\n🔍 Analyzing lozenges...');
    const results = filteredPages.map(page =>
      parser.analyzePage(page.pageId, page.title, page.content)
    );

    // Print summary
    const totalLozenges = results.reduce((sum, r) => sum + r.totalCount, 0);
    console.log(`✓ Found ${totalLozenges} total lozenges across all pages`);

    // Show breakdown by page
    console.log('\nBreakdown by page:');
    results.forEach(result => {
      console.log(`  • ${result.pageTitle}: ${result.totalCount} lozenges`);
      result.lozenges.forEach(lozenge => {
        console.log(`    - ${lozenge.text} (${lozenge.color}): ${lozenge.count}`);
      });
    });

    // 5. Delete excluded sheet tabs if they exist
    await sheetsClient.deleteExcludedSheets();

    // 6. Delete sheets for archived pages (based on Page ID comparison)
    await sheetsClient.deleteArchivedPageSheets(results);

    // 7. Write to Google Sheets (each page to its own tab)
    await sheetsClient.writeResults(results);

    // 8. Sort sheet tabs alphabetically
    await sheetsClient.sortSheetsAlphabetically();

    console.log('\n✅ Complete! Check your Google Sheet for results.\n');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Loads configuration from environment variables and config file
 */
function loadConfiguration() {
  // Load search configuration from config file
  const configPath = path.join(__dirname, '../config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('config.json not found. Please create it from config.example.json');
  }

  const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Validate required config file fields
  if (!configFile.spaceKey) {
    throw new Error('Missing required field "spaceKey" in config.json');
  }
  if (!configFile.titleSearch) {
    throw new Error('Missing required field "titleSearch" in config.json');
  }

  // Validate required environment variables
  const requiredEnvVars = [
    'CONFLUENCE_BASE_URL',
    'CONFLUENCE_EMAIL',
    'CONFLUENCE_API_TOKEN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'GOOGLE_SHEET_ID'
  ];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  return {
    confluence: {
      baseUrl: process.env.CONFLUENCE_BASE_URL!,
      email: process.env.CONFLUENCE_EMAIL!,
      apiToken: process.env.CONFLUENCE_API_TOKEN!,
      spaceKey: configFile.spaceKey,
      titleSearch: configFile.titleSearch,
      testPageIds: configFile.testPageIds
    },
    googleSheets: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
      spreadsheetId: process.env.GOOGLE_SHEET_ID!
    }
  };
}

// Export main function for Google Cloud Functions
export { main };

// Run the application if this file is executed directly
if (require.main === module) {
  main();
}
