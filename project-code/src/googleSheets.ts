import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PageLozengeResult } from './lozengeParser';
import * as fs from 'fs';
import * as path from 'path';

export interface GoogleSheetsConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  spreadsheetId: string;
}

/**
 * Google Sheets API Client with OAuth 2.0 Authentication
 * Handles authentication and writing lozenge data to sheets with dynamic tab creation
 */
export class GoogleSheetsClient {
  private sheets;
  private spreadsheetId: string;
  private oauth2Client: OAuth2Client;
  private tokenPath: string;

  constructor(config: GoogleSheetsConfig) {
    this.tokenPath = path.join(__dirname, '../.google-token.json');

    // Create OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    // Load saved token if it exists
    this.loadSavedToken();

    this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
    this.spreadsheetId = config.spreadsheetId;
  }

  /**
   * Loads previously saved OAuth token
   * Supports both local file (development) and environment variable (Cloud Functions)
   */
  private loadSavedToken(): void {
    // In Cloud Functions, check for token in environment variable first
    if (process.env.GOOGLE_OAUTH_TOKEN) {
      try {
        const token = JSON.parse(process.env.GOOGLE_OAUTH_TOKEN);
        this.oauth2Client.setCredentials(token);
        console.log('✓ Loaded OAuth token from environment variable');
        return;
      } catch (error) {
        console.warn('⚠️  Failed to parse GOOGLE_OAUTH_TOKEN from environment');
      }
    }

    // Local development - read from file
    if (fs.existsSync(this.tokenPath)) {
      const token = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
      this.oauth2Client.setCredentials(token);
      console.log('✓ Loaded OAuth token from file');
    }
  }

  /**
   * Saves OAuth token for future use
   */
  saveToken(token: any): void {
    fs.writeFileSync(this.tokenPath, JSON.stringify(token, null, 2));
    this.oauth2Client.setCredentials(token);
  }

  /**
   * Generates the authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }

  /**
   * Exchanges authorization code for tokens
   */
  async getTokenFromCode(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Checks if we have valid credentials
   */
  isAuthenticated(): boolean {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials && credentials.access_token);
  }

  /**
   * Extracts team name from page title
   * Example: "Blueprint: Utah Jazz" -> "Utah Jazz"
   */
  private extractTeamName(pageTitle: string): string {
    // Remove "Blueprint: " prefix if it exists
    const cleaned = pageTitle.replace(/^Blueprint:\s*/i, '').trim();

    // Sanitize for sheet name (Google Sheets has restrictions)
    // Remove invalid characters: : / \ ? * [ ]
    return cleaned.replace(/[:/\\?*\[\]]/g, '').substring(0, 100); // Max 100 chars
  }

  /**
   * Gets all existing sheet names in the spreadsheet
   */
  private async getExistingSheets(): Promise<Map<string, number>> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId
    });

    const sheetMap = new Map<string, number>();
    if (response.data.sheets) {
      for (const sheet of response.data.sheets) {
        if (sheet.properties?.title && sheet.properties?.sheetId !== undefined && sheet.properties?.sheetId !== null) {
          sheetMap.set(sheet.properties.title, sheet.properties.sheetId);
        }
      }
    }
    return sheetMap;
  }

  /**
   * Creates a new sheet tab
   */
  private async createSheet(sheetName: string): Promise<void> {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }]
      }
    });
    console.log(`  ✓ Created new sheet tab: "${sheetName}"`);
  }

  /**
   * Deletes a sheet tab by sheet ID
   */
  private async deleteSheet(sheetId: number, sheetName: string): Promise<void> {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          deleteSheet: {
            sheetId: sheetId
          }
        }]
      }
    });
    console.log(`  ✓ Deleted sheet tab: "${sheetName}"`);
  }

  /**
   * Deletes all sheet tabs that should be excluded (templates, meta pages, generic)
   */
  async deleteExcludedSheets(): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please run: npm run auth');
      }

      console.log('\n🗑️  Cleaning up excluded sheet tabs...');

      const existingSheets = await this.getExistingSheets();
      const excludedSheets: Array<{name: string, id: number}> = [];

      // Terms to match for exclusion
      const exclusionTerms = [
        'Generic',
        'Template',
        'Templates',
        'Client Summaries',
        'What are Blueprint MultiExcerpts',
        'Best Practice Templates'
      ];

      // Find all sheets that match exclusion criteria
      for (const [sheetName, sheetId] of existingSheets.entries()) {
        if (exclusionTerms.some(term => sheetName.includes(term))) {
          excludedSheets.push({name: sheetName, id: sheetId});
        }
      }

      if (excludedSheets.length === 0) {
        console.log('  ✓ No excluded sheets found to delete');
        return;
      }

      console.log(`  Found ${excludedSheets.length} excluded sheet(s) to delete`);

      // Delete each excluded sheet with rate limiting
      for (let i = 0; i < excludedSheets.length; i++) {
        const sheet = excludedSheets[i];
        await this.deleteSheet(sheet.id, sheet.name);

        // Add delay to avoid rate limits
        if (i < excludedSheets.length - 1) {
          await this.sleep(1000);
        }
      }

      console.log(`\n✓ Deleted ${excludedSheets.length} excluded sheet(s)`);
    } catch (error) {
      throw new Error(`Failed to delete excluded sheets: ${error}`);
    }
  }

  /**
   * Reads the Page ID from column A of a specific sheet
   * @param sheetName - The name of the sheet tab to read from
   * @returns The Page ID found in the sheet, or null if not found
   */
  private async getPageIdFromSheet(sheetName: string): Promise<string | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `'${sheetName}'!A2:A2` // Row 2, column A (first data row after header)
      });

      if (response.data.values && response.data.values.length > 0 && response.data.values[0].length > 0) {
        return response.data.values[0][0];
      }
      return null;
    } catch (error) {
      console.warn(`  ⚠️  Could not read Page ID from sheet "${sheetName}"`);
      return null;
    }
  }

  /**
   * Deletes sheet tabs for pages that are no longer in the current result set
   * (e.g., archived pages that were previously tracked)
   * Uses Page ID from column A to identify which sheets correspond to archived pages
   * @param currentResults - The current set of pages that should have sheets
   */
  async deleteArchivedPageSheets(currentResults: PageLozengeResult[]): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please run: npm run auth');
      }

      console.log('\n🗑️  Checking for archived page sheet tabs...');

      // Get all existing sheets
      const existingSheets = await this.getExistingSheets();

      // Create set of valid page IDs from current results
      const validPageIds = new Set<string>();
      for (const result of currentResults) {
        validPageIds.add(result.pageId);
      }

      // Check each sheet and determine if it should be deleted
      const sheetsToDelete: Array<{name: string, id: number, pageId: string | null}> = [];

      for (const [sheetName, sheetId] of existingSheets.entries()) {
        // Read the Page ID from column A of this sheet
        const pageId = await this.getPageIdFromSheet(sheetName);

        if (pageId && !validPageIds.has(pageId)) {
          // This sheet's Page ID is not in the current valid set - it's archived
          sheetsToDelete.push({name: sheetName, id: sheetId, pageId: pageId});
        }

        // Add delay to avoid rate limits when reading sheets
        await this.sleep(200);
      }

      if (sheetsToDelete.length === 0) {
        console.log('  ✓ No archived page sheets found to delete');
        return;
      }

      console.log(`  Found ${sheetsToDelete.length} archived page sheet(s) to delete:`);
      sheetsToDelete.forEach(sheet => {
        console.log(`    - "${sheet.name}" (Page ID: ${sheet.pageId})`);
      });

      // Delete each archived page sheet with rate limiting
      for (let i = 0; i < sheetsToDelete.length; i++) {
        const sheet = sheetsToDelete[i];
        await this.deleteSheet(sheet.id, sheet.name);

        // Add delay to avoid rate limits
        if (i < sheetsToDelete.length - 1) {
          await this.sleep(1000);
        }
      }

      console.log(`✓ Deleted ${sheetsToDelete.length} archived page sheet(s)`);
    } catch (error) {
      throw new Error(`Failed to delete archived page sheets: ${error}`);
    }
  }

  /**
   * Clears a specific sheet's content
   */
  private async clearSheet(sheetName: string): Promise<void> {
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: `'${sheetName}'!A:Z`
    });
  }

  /**
   * Formats the lozenge results for a single page into rows
   */
  private formatPageDataForSheets(page: PageLozengeResult): any[][] {
    // Create header row
    const rows: any[][] = [
      ['Page ID', 'Page Title', 'Lozenge Text', 'Lozenge Color', 'Count', 'Last Updated']
    ];

    if (page.lozenges.length === 0) {
      // If no lozenges found, add a row indicating this
      rows.push([
        page.pageId,
        page.pageTitle,
        'No lozenges found',
        '',
        0,
        new Date().toISOString()
      ]);
    } else {
      // Add a row for each lozenge type
      for (const lozenge of page.lozenges) {
        rows.push([
          page.pageId,
          page.pageTitle,
          lozenge.text,
          lozenge.color,
          lozenge.count,
          new Date().toISOString()
        ]);
      }
    }

    return rows;
  }

  /**
   * Utility function to sleep/delay execution
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sorts all sheet tabs alphabetically
   */
  async sortSheetsAlphabetically(): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please run: npm run auth');
      }

      console.log('\n🔤 Sorting sheet tabs alphabetically...');

      // Get all existing sheets with their IDs and positions
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      if (!response.data.sheets || response.data.sheets.length === 0) {
        console.log('  ✓ No sheets to sort');
        return;
      }

      // Create array of sheets with their names and IDs
      const sheetList = response.data.sheets
        .filter(sheet => sheet.properties?.title && sheet.properties?.sheetId !== undefined)
        .map(sheet => ({
          title: sheet.properties!.title!,
          sheetId: sheet.properties!.sheetId!
        }));

      // Sort alphabetically by title
      sheetList.sort((a, b) => a.title.localeCompare(b.title));

      // Build batch update request to reorder sheets
      const requests = sheetList.map((sheet, index) => ({
        updateSheetProperties: {
          properties: {
            sheetId: sheet.sheetId,
            index: index
          },
          fields: 'index'
        }
      }));

      // Execute the batch update
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: requests
        }
      });

      console.log(`✓ Sorted ${sheetList.length} sheet tab(s) alphabetically`);
    } catch (error) {
      throw new Error(`Failed to sort sheets: ${error}`);
    }
  }

  /**
   * Writes results to individual sheet tabs based on page titles
   * Each page gets its own tab named after the team
   * Includes rate limiting to avoid Google Sheets API quotas (60 writes per minute)
   */
  async writeResults(results: PageLozengeResult[]): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please run: npm run auth');
      }

      console.log('\n📊 Writing results to Google Sheets...');
      console.log(`⏱️  Rate limiting enabled: ~1.5 second delay between writes to avoid quota limits\n`);

      // Get existing sheets
      const existingSheets = await this.getExistingSheets();

      // Process each page with rate limiting
      for (let i = 0; i < results.length; i++) {
        const page = results[i];
        const sheetName = this.extractTeamName(page.pageTitle);
        console.log(`\n  [${i + 1}/${results.length}] Processing: ${page.pageTitle}`);
        console.log(`  → Sheet tab: "${sheetName}"`);

        // Create sheet if it doesn't exist
        if (!existingSheets.has(sheetName)) {
          await this.createSheet(sheetName);
          existingSheets.set(sheetName, 0); // Add to our tracking
          await this.sleep(1000); // Wait 1 second after creating sheet
        } else {
          console.log(`  ✓ Sheet tab already exists: "${sheetName}"`);
        }

        // Clear and write data
        await this.clearSheet(sheetName);
        await this.sleep(500); // Wait 0.5 seconds after clear

        const rows = this.formatPageDataForSheets(page);

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `'${sheetName}'!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: rows
          }
        });

        console.log(`  ✓ Wrote ${page.lozenges.length} lozenge types to "${sheetName}"`);

        // Add delay between pages to stay under rate limit (60 per minute = 1 per second)
        // We use 1.5 seconds to be safe
        if (i < results.length - 1) {
          await this.sleep(1500);
        }
      }

      console.log(`\n✓ Successfully wrote ${results.length} page(s) to Google Sheets`);
    } catch (error) {
      throw new Error(`Failed to write to Google Sheets: ${error}`);
    }
  }

  /**
   * Alternative: Append results instead of replacing
   * Useful if you want to keep historical data
   */
  async appendResults(results: PageLozengeResult[]): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please run: npm run auth');
      }

      console.log('\n📊 Appending results to Google Sheets...');

      // Get existing sheets
      const existingSheets = await this.getExistingSheets();

      // Process each page
      for (const page of results) {
        const sheetName = this.extractTeamName(page.pageTitle);

        // Create sheet if it doesn't exist
        if (!existingSheets.has(sheetName)) {
          await this.createSheet(sheetName);
          existingSheets.set(sheetName, 0);

          // For new sheets, write header first
          const headerRow = [['Page ID', 'Page Title', 'Lozenge Text', 'Lozenge Color', 'Count', 'Last Updated']];
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `'${sheetName}'!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: headerRow
            }
          });
        }

        // Append data (skip header)
        const rows = this.formatPageDataForSheets(page);
        const dataRows = rows.slice(1);

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `'${sheetName}'!A:F`,
          valueInputOption: 'RAW',
          requestBody: {
            values: dataRows
          }
        });

        console.log(`  ✓ Appended ${page.lozenges.length} lozenge types to "${sheetName}"`);
      }

      console.log(`\n✓ Successfully appended ${results.length} page(s) to Google Sheets`);
    } catch (error) {
      throw new Error(`Failed to append to Google Sheets: ${error}`);
    }
  }
}
