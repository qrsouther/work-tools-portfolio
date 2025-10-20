import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import Form, { Field, FormFooter, ErrorMessage } from '@atlaskit/form';
import SectionMessage from '@atlaskit/section-message';

const ConfigForm = ({ onSave, onCancel }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [initialConfig, setInitialConfig] = useState({});

  useEffect(() => {
    // Load existing configuration
    invoke('getConfig').then((response) => {
      if (response.success && response.config) {
        setInitialConfig(response.config);
      }
    });
  }, []);

  const handleSubmit = async (data) => {
    setSaving(true);
    setError(null);

    try {
      const response = await invoke('saveConfig', {
        spreadsheetId: data.spreadsheetId,
        apiKey: data.apiKey,
      });

      if (response.success) {
        onSave();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="config-form">
      <h2>Configure Google Sheets Dashboard</h2>

      <SectionMessage appearance="information">
        <p>
          <strong>Setup Instructions:</strong>
        </p>
        <ol>
          <li>
            Get your Google Spreadsheet ID from the URL:
            <br />
            <code>
              https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
            </code>
          </li>
          <li>
            Create a Google API Key:
            <ul>
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the Google Sheets API</li>
              <li>Create credentials (API Key)</li>
              <li>Restrict the key to Google Sheets API for security</li>
            </ul>
          </li>
          <li>Make sure your Google Sheet is set to "Anyone with the link can view"</li>
        </ol>
      </SectionMessage>

      <Form onSubmit={handleSubmit}>
        {({ formProps }) => (
          <form {...formProps}>
            <Field
              name="spreadsheetId"
              label="Google Spreadsheet ID"
              isRequired
              defaultValue={initialConfig.spreadsheetId || ''}
            >
              {({ fieldProps }) => (
                <>
                  <TextField {...fieldProps} placeholder="Enter spreadsheet ID" />
                </>
              )}
            </Field>

            <Field
              name="apiKey"
              label="Google API Key"
              isRequired
              defaultValue={initialConfig.apiKey || ''}
            >
              {({ fieldProps }) => (
                <>
                  <TextField
                    {...fieldProps}
                    type="password"
                    placeholder="Enter API key"
                  />
                </>
              )}
            </Field>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <FormFooter>
              <Button appearance="subtle" onClick={onCancel} isDisabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                appearance="primary"
                isLoading={saving}
              >
                Save Configuration
              </Button>
            </FormFooter>
          </form>
        )}
      </Form>
    </div>
  );
};

export default ConfigForm;
