import ForgeReconciler, { Text, Strong, Em, Button, Fragment, useState, useEffect } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({ spreadsheetId: '', apiKey: '' });
  const [showConfig, setShowConfig] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke('fetchSheetData');

      if (response.success) {
        setData(response);
        setShowConfig(false);
      } else {
        setError(response.error);
        if (response.error.includes('Missing spreadsheet configuration')) {
          setShowConfig(true);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async () => {
    const response = await invoke('saveConfig', config);
    if (response.success) {
      fetchData();
    } else {
      setError(response.error);
    }
  };

  if (showConfig) {
    return (
      <div style={{ padding: '20px' }}>
        <Text><Strong>Configure Google Sheets Dashboard</Strong></Text>
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <Text><Strong>Spreadsheet ID:</Strong></Text>
            <input
              type="text"
              value={config.spreadsheetId}
              onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
              placeholder="Enter spreadsheet ID"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <Text><Strong>API Key:</Strong></Text>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Enter API key"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <button onClick={handleSaveConfig} style={{ padding: '10px 20px', marginRight: '10px' }}>
            Save Configuration
          </button>
          <button onClick={() => setShowConfig(false)} style={{ padding: '10px 20px' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text>Loading Google Sheets data...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Text><Strong>Error:</Strong> {error}</Text>
        <div style={{ marginTop: '15px' }}>
          <button onClick={() => setShowConfig(true)} style={{ padding: '10px 20px', marginRight: '10px' }}>
            Configure
          </button>
          <button onClick={fetchData} style={{ padding: '10px 20px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.sheets || data.sheets.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <Text>No sheets found in the spreadsheet.</Text>
        <button onClick={() => setShowConfig(true)} style={{ padding: '10px 20px', marginTop: '15px' }}>
          Configure
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Text><Strong>{data.spreadsheetTitle}</Strong></Text>
        <div>
          <button onClick={fetchData} style={{ padding: '8px 15px', marginRight: '10px' }}>
            Refresh
          </button>
          <button onClick={() => setShowConfig(true)} style={{ padding: '8px 15px' }}>
            Configure
          </button>
        </div>
      </div>

      {data.sheets.map((sheet, index) => (
        <div key={index} style={{ marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
          <Text><Strong>{sheet.sheetName}</Strong> ({sheet.rowCount} rows)</Text>

          {sheet.data.length > 0 && (
            <div style={{ marginTop: '15px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {sheet.data[0].map((header, idx) => (
                      <th key={idx} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.data.slice(1, 11).map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.data.length > 11 && (
                <Text><Em>Showing first 10 rows of {sheet.data.length - 1} total rows</Em></Text>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

ForgeReconciler.render(<App />);
