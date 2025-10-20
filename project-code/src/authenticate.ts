import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { GoogleSheetsClient } from './googleSheets';

// Load environment variables
dotenv.config();

/**
 * OAuth Authentication Setup Script
 * Run this once to authenticate with Google and save your token
 */
async function authenticate() {
  console.log('🔐 Google Sheets OAuth Authentication Setup\n');

  // Validate required environment variables
  const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'GOOGLE_SHEET_ID'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\nPlease add these to your .env file.');
    console.error('See README.md for setup instructions.\n');
    process.exit(1);
  }

  // Create Google Sheets client
  const client = new GoogleSheetsClient({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    spreadsheetId: process.env.GOOGLE_SHEET_ID!
  });

  // Check if already authenticated
  if (client.isAuthenticated()) {
    console.log('✓ Already authenticated!');
    console.log('Token file exists at: .google-token.json\n');
    console.log('You can now run: npm start\n');
    return;
  }

  // Generate authorization URL
  const authUrl = client.getAuthUrl();

  console.log('📋 Follow these steps:\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Sign in with your Google account');
  console.log('3. Grant access to Google Sheets');
  console.log('4. Copy the authorization code from the URL\n');

  // Prompt for authorization code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Paste the authorization code here: ', async (code) => {
    try {
      console.log('\n🔄 Exchanging code for access token...');
      const token = await client.getTokenFromCode(code.trim());
      client.saveToken(token);

      console.log('✅ Authentication successful!\n');
      console.log('Token saved to: .google-token.json');
      console.log('\nYou can now run: npm start\n');
    } catch (error) {
      console.error('\n❌ Authentication failed:', error instanceof Error ? error.message : error);
      console.error('\nPlease try again and make sure you copied the full authorization code.\n');
      process.exit(1);
    }

    rl.close();
  });
}

// Run authentication
authenticate().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
