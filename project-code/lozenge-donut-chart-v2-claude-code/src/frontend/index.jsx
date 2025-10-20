import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text, DonutChart } from '@forge/react';
import { invoke } from '@forge/bridge';

// Helper function to convert text to Title Case
const toTitleCase = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    invoke('getLozengeData')
      .then(response => {
        console.log('Received data:', response);
        if (response.error) {
          setError(response.error);
        } else {
          setData(response);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error invoking resolver:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Text>Loading lozenge data...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (!data || !data.lozenges) {
    return <Text>No data received</Text>;
  }

  const lozenges = data.lozenges;
  const totalCount = data.totalCount || 0;

  if (totalCount === 0) {
    return <Text>No labeled solutions found in this Blueprint.</Text>;
  }

  // Transform data into format expected by DonutChart
  // DonutChart expects array of arrays: [colorKey, label, value]

  // Define desired color assignment order
  // First item in array gets first color (Orange=0), second gets second color (Blue=1), etc.
  // We want: Standard=Green (2), Semi-Standard=Orange (0), Bespoke/Non-Standard=Blue (1)
  const colorPriorityOrder = ['semi-standard', 'bespoke', 'standard', 'non-standard'];

  const chartData = Object.entries(lozenges)
    .map(([label, count]) => {
      // Remove color from label (e.g., "Done (Green)" -> "Done")
      const labelWithoutColor = label.replace(/\s*\([^)]*\)\s*$/, '').trim();

      // Convert label to Title Case
      const titleCaseLabel = toTitleCase(labelWithoutColor);

      // Assign color index based on priority order
      const labelKey = labelWithoutColor.toLowerCase();
      const colorIndex = colorPriorityOrder.indexOf(labelKey);
      // If not in our list, assign a high number so it gets default colors
      const colorKey = colorIndex !== -1 ? colorIndex : 999;

      return [colorKey, titleCaseLabel, count];
    })
    .sort((a, b) => {
      // Sort by color index to ensure proper color assignment
      return a[0] - b[0];
    });

  return (
    <DonutChart
      data={chartData}
      colorAccessor={0}
      labelAccessor={1}
      valueAccessor={2}
      title="How compliant is this Blueprint with SeatGeek's standards?"
      subtitle={`There are ${totalCount} chapters in this Blueprint.`}
      showMarkLabels={true}
      height={400}
    />
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
