import Resolver from '@forge/resolver';

const resolver = new Resolver();

// Handler for configuration dialog
resolver.define('getConfigForm', async () => {
  return {
    fields: [
      {
        type: 'text',
        name: 'spreadsheetId',
        label: 'Google Spreadsheet ID',
        description: 'The ID from your Google Sheet URL',
        isRequired: true,
      },
      {
        type: 'text',
        name: 'apiKey',
        label: 'Google API Key',
        description: 'Your Google Sheets API key',
        isRequired: true,
      },
    ],
  };
});

export const handler = resolver.getDefinitions();
