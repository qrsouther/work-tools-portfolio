import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Select from '@atlaskit/select';

const COLORS = ['#0052CC', '#00875A', '#FF5630', '#FFC400', '#6554C0', '#00B8D9'];

const DataVisualizations = ({ data }) => {
  const [chartType, setChartType] = useState({ value: 'bar', label: 'Bar Chart' });
  const [xAxisColumn, setXAxisColumn] = useState(null);
  const [yAxisColumn, setYAxisColumn] = useState(null);

  if (!data || data.length < 2) {
    return (
      <div className="visualizations">
        <p>Not enough data to create visualizations. Need at least header row and one data row.</p>
      </div>
    );
  }

  const headers = data[0];
  const rows = data.slice(1);

  // Create options for column selection
  const columnOptions = headers.map((header, index) => ({
    value: index,
    label: header || `Column ${index + 1}`,
  }));

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
  ];

  // Prepare chart data
  const prepareChartData = () => {
    if (xAxisColumn === null || yAxisColumn === null) {
      return [];
    }

    return rows.map((row) => {
      const xValue = row[xAxisColumn.value] || '';
      const yValue = parseFloat(row[yAxisColumn.value]) || 0;

      return {
        name: xValue,
        value: yValue,
      };
    }).filter(item => item.name !== '');
  };

  const chartData = prepareChartData();

  const renderChart = () => {
    if (!xAxisColumn || !yAxisColumn || chartData.length === 0) {
      return <p>Please select X and Y axis columns to display chart.</p>;
    }

    switch (chartType.value) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={COLORS[0]} name={yAxisColumn.label} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                name={yAxisColumn.label}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="visualizations">
      <h4>Data Visualization</h4>

      <div className="chart-controls">
        <div className="control-group">
          <label>Chart Type:</label>
          <Select
            options={chartTypeOptions}
            value={chartType}
            onChange={(option) => setChartType(option)}
            placeholder="Select chart type"
          />
        </div>

        <div className="control-group">
          <label>X-Axis (Labels):</label>
          <Select
            options={columnOptions}
            value={xAxisColumn}
            onChange={(option) => setXAxisColumn(option)}
            placeholder="Select column for X-axis"
          />
        </div>

        <div className="control-group">
          <label>Y-Axis (Values):</label>
          <Select
            options={columnOptions}
            value={yAxisColumn}
            onChange={(option) => setYAxisColumn(option)}
            placeholder="Select column for Y-axis"
          />
        </div>
      </div>

      <div className="chart-container">
        {renderChart()}
      </div>

      {chartData.length > 0 && (
        <div className="chart-stats">
          <p>
            <strong>Data Points:</strong> {chartData.length} |
            <strong> Total:</strong> {chartData.reduce((sum, item) => sum + item.value, 0).toFixed(2)} |
            <strong> Average:</strong> {(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataVisualizations;
