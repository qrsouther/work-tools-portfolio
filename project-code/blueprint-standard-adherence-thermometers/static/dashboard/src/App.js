import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Spinner from '@atlaskit/spinner';
import Button from '@atlaskit/button';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import SectionMessage from '@atlaskit/section-message';
import DynamicTable from '@atlaskit/dynamic-table';
import ConfigForm from './ConfigForm';
import DataVisualizations from './DataVisualizations';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

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

  const handleConfigSaved = () => {
    setShowConfig(false);
    fetchData();
  };

  if (showConfig) {
    return (
      <div className="app-container">
        <ConfigForm onSave={handleConfigSaved} onCancel={() => setShowConfig(false)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-container loading">
        <Spinner size="large" />
        <p>Loading Google Sheets data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <SectionMessage appearance="error" title="Error loading data">
          <p>{error}</p>
          <Button appearance="primary" onClick={() => setShowConfig(true)}>
            Configure
          </Button>
          <Button appearance="subtle" onClick={fetchData}>
            Retry
          </Button>
        </SectionMessage>
      </div>
    );
  }

  if (!data || !data.sheets || data.sheets.length === 0) {
    return (
      <div className="app-container">
        <SectionMessage appearance="warning" title="No data found">
          <p>No sheets found in the spreadsheet.</p>
          <Button appearance="primary" onClick={() => setShowConfig(true)}>
            Configure
          </Button>
        </SectionMessage>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <h2>{data.spreadsheetTitle}</h2>
        <div className="header-actions">
          <Button appearance="subtle" onClick={fetchData}>
            Refresh
          </Button>
          <Button appearance="subtle" onClick={() => setShowConfig(true)}>
            Configure
          </Button>
        </div>
      </div>

      <Tabs
        onChange={(index) => setSelectedTab(index)}
        selected={selectedTab}
        id="sheet-tabs"
      >
        <TabList>
          {data.sheets.map((sheet, index) => (
            <Tab key={index}>{sheet.sheetName} ({sheet.rowCount} rows)</Tab>
          ))}
        </TabList>

        {data.sheets.map((sheet, index) => (
          <TabPanel key={index}>
            <div className="sheet-content">
              <h3>{sheet.sheetName}</h3>

              {/* Data Visualizations */}
              <DataVisualizations data={sheet.data} />

              {/* Raw Data Table */}
              <div className="data-table">
                <h4>Raw Data</h4>
                {sheet.data.length > 0 ? (
                  <SheetTable data={sheet.data} />
                ) : (
                  <p>No data available in this sheet.</p>
                )}
              </div>
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

// Component to display sheet data in a table
const SheetTable = ({ data }) => {
  if (!data || data.length === 0) return null;

  const headers = data[0].map((header, index) => ({
    key: `col-${index}`,
    content: header,
    isSortable: true,
  }));

  const rows = data.slice(1).map((row, rowIndex) => ({
    key: `row-${rowIndex}`,
    cells: row.map((cell, cellIndex) => ({
      key: `cell-${rowIndex}-${cellIndex}`,
      content: cell || '',
    })),
  }));

  return (
    <DynamicTable
      head={{ cells: headers }}
      rows={rows}
      rowsPerPage={10}
      defaultPage={1}
      isFixedSize
      defaultSortKey="col-0"
      defaultSortOrder="ASC"
    />
  );
};

export default App;
