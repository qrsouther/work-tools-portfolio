import { storage, fetch } from '@forge/api';

export const handler = async (req) => {
  try {
    // Get stored configuration
    const config = await storage.get('sheetConfig');

    if (!config || !config.spreadsheetId || !config.apiKey) {
      return {
        success: false,
        error: 'Missing spreadsheet configuration. Please run: forge storage set sheetConfig \'{"spreadsheetId":"YOUR_ID","apiKey":"YOUR_KEY"}\'',
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
        const range = `${sheetName}!A1:Z100`; // Limit to 100 rows for performance

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
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};
