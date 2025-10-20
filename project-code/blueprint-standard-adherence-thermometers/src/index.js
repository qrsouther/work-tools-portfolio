import Resolver from '@forge/resolver';
import api, { route, fetch, storage } from '@forge/api';

const resolver = new Resolver();

// Fetch data from Google Sheets
resolver.define('fetchSheetData', async (req) => {
  try {
    const { spreadsheetId, apiKey } = req.payload;

    // Get stored configuration
    const storedConfig = await storage.get('sheetConfig');
    const config = req.payload || storedConfig;

    if (!config || !config.spreadsheetId || !config.apiKey) {
      return {
        success: false,
        error: 'Missing spreadsheet configuration. Please configure the gadget.',
      };
    }

    // Fetch spreadsheet metadata to get all sheets
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?key=${config.apiKey}`;
    const metadataResponse = await fetch(metadataUrl);

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      return {
        success: false,
        error: `Failed to fetch spreadsheet: ${errorText}`,
      };
    }

    const metadata = await metadataResponse.json();
    const sheets = metadata.sheets || [];

    // Fetch data from all sheets/tabs
    const allSheetData = await Promise.all(
      sheets.map(async (sheet) => {
        const sheetName = sheet.properties.title;
        const range = `${sheetName}!A1:Z1000`; // Adjust range as needed

        const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}?key=${config.apiKey}`;
        const dataResponse = await fetch(dataUrl);

        if (dataResponse.ok) {
          const data = await dataResponse.json();
          return {
            sheetName,
            data: data.values || [],
            rowCount: (data.values || []).length,
          };
        }

        return {
          sheetName,
          data: [],
          rowCount: 0,
          error: 'Failed to fetch data',
        };
      })
    );

    return {
      success: true,
      spreadsheetTitle: metadata.properties.title,
      sheets: allSheetData,
      totalSheets: sheets.length,
    };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
});

// Save configuration
resolver.define('saveConfig', async (req) => {
  try {
    const { spreadsheetId, apiKey } = req.payload;

    await storage.set('sheetConfig', {
      spreadsheetId,
      apiKey,
    });

    return {
      success: true,
      message: 'Configuration saved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

// Get stored configuration
resolver.define('getConfig', async () => {
  try {
    const config = await storage.get('sheetConfig');
    return {
      success: true,
      config: config || {},
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

export const handler = resolver.getDefinitions();
