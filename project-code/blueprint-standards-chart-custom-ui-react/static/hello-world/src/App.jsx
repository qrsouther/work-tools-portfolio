import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

// Custom color mapping - YOU CAN EDIT THESE!
const LABEL_COLOR_MAP = {
  'standard': '#36B37E',        // Green
  'semi-standard': '#FFAB00',   // Yellow/Orange
  'non-standard': '#FF5630',    // Red
  'bespoke': '#6554C0',         // Purple
  'n/a': '#808080',             // Gray
  'tbd': '#808080'              // Gray
};

const toTitleCase = (str) => {
  // Handle special cases first
  const upper = str.toUpperCase();
  if (upper === 'N/A' || upper === 'TBD' || upper === 'NA') {
    return upper;
  }

  // Standard title case for other strings
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const PieChart = ({ data, totalCount }) => {
  const svgRef = React.useRef(null);

  useEffect(() => {
    if (!svgRef.current || totalCount === 0) return;

    const svg = svgRef.current;
    const width = 200;
    const height = 200;
    const radius = 90;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear existing content
    svg.innerHTML = '';

    // Process and sort data
    const chartData = Object.entries(data).map(([label, count]) => {
      const cleanLabel = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const labelKey = cleanLabel.toLowerCase();
      const color = LABEL_COLOR_MAP[labelKey] || '#8993A4';

      return {
        label: toTitleCase(cleanLabel),
        count,
        color,
        percentage: count / totalCount
      };
    }).sort((a, b) => b.count - a.count);

    // Draw pie slices
    let currentAngle = -Math.PI / 2;

    chartData.forEach(item => {
      const angle = item.percentage * 2 * Math.PI;
      const endAngle = currentAngle + angle;

      const startX = centerX + radius * Math.cos(currentAngle);
      const startY = centerY + radius * Math.sin(currentAngle);
      const endX = centerX + radius * Math.cos(endAngle);
      const endY = centerY + radius * Math.sin(endAngle);

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z'
      ].join(' ');

      path.setAttribute('d', pathData);
      path.setAttribute('fill', item.color);
      path.setAttribute('stroke', 'white');
      path.setAttribute('stroke-width', '2');

      svg.appendChild(path);

      currentAngle = endAngle;
    });
  }, [data, totalCount]);

  if (totalCount === 0) {
    return (
      <svg ref={svgRef} width="200" height="200">
        <text x="100" y="100" textAnchor="middle" fill="#6B778C" fontSize="14">
          No lozenges found
        </text>
      </svg>
    );
  }

  return <svg ref={svgRef} width="200" height="200" />;
};

const Legend = ({ data, totalCount }) => {
  if (totalCount === 0) {
    return <div style={{ color: '#6B778C' }}>No lozenges found on this page.</div>;
  }

  const chartData = Object.entries(data).map(([label, count]) => {
    const cleanLabel = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const labelKey = cleanLabel.toLowerCase();
    const color = LABEL_COLOR_MAP[labelKey] || '#8993A4';

    return {
      label: toTitleCase(cleanLabel),
      count,
      color,
      percentage: (count / totalCount * 100).toFixed(1)
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <div style={{ flex: 1 }}>
      {chartData.map((item, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '14px',
          color: '#172B4D'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            backgroundColor: item.color,
            marginRight: '8px',
            flexShrink: 0
          }} />
          <span style={{ flex: 1 }}>{item.label}</span>
          <span style={{ fontWeight: 600, marginLeft: '8px' }}>{item.count}</span>
          <span style={{ color: '#6B778C', marginLeft: '4px' }}>({item.percentage}%)</span>
        </div>
      ))}
    </div>
  );
};

function App() {
  const [lozengeData, setLozengeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    invoke('getLozengeData')
      .then(response => {
        console.log('Received data:', response);
        if (response.error) {
          setError(response.error);
        } else {
          setLozengeData(response);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error invoking resolver:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        padding: '20px',
        color: '#6B778C',
        fontSize: '14px'
      }}>
        Loading data on this client's Blueprint chapters...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        padding: '20px',
        color: '#FF5630',
        backgroundColor: '#FFEBE6',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        Error: {error}
      </div>
    );
  }

  const lozenges = lozengeData?.lozenges || {};
  const totalCount = lozengeData?.totalCount || 0;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{
          margin: 0,
          color: '#172B4D',
          fontSize: '18px',
          fontWeight: 600
        }}>
        </h2>
        <button
          onClick={fetchData}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#0052CC',
            backgroundColor: 'transparent',
            border: '1px solid #DFE1E6',
            borderRadius: '3px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#F4F5F7';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          Refresh
        </button>
      </div>

      There are {totalCount} chapters in this Blueprint, whose solutions break down accordingly:

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        marginTop: '20px'
      }}>
        <PieChart data={lozenges} totalCount={totalCount} />
        <Legend data={lozenges} totalCount={totalCount} />
      </div>

      {totalCount > 0 && (
        <div style={{
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '1px solid #DFE1E6',
          fontSize: '14px',
          color: '#6B778C'
        }}>
        </div>
      )}
    </div>
  );
}

export default App;
