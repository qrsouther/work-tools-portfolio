// Grayscale color palette
const COLOR_MAP = {
  'Grey': '#333333',
  'Red': '#666666',
  'Yellow': '#999999',
  'Green': '#BBBBBB',
  'Blue': '#DDDDDD'
};

function createDonutChart(data, totalCount) {
  const svg = document.getElementById('donut-chart');
  const width = 200;
  const height = 200;
  const radius = 80;
  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius = 50;

  // Clear existing content
  svg.innerHTML = '';

  if (totalCount === 0) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', centerX);
    text.setAttribute('y', centerY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#6B778C');
    text.setAttribute('font-size', '14');
    text.textContent = 'No lozenges found';
    svg.appendChild(text);
    return;
  }

  // Sort by count descending
  const sortedData = Object.entries(data)
    .map(([label, count]) => {
      const color = label.match(/\((.*?)\)/)?.[1] || 'Grey';
      return { label, count, color: COLOR_MAP[color] || COLOR_MAP['Grey'] };
    })
    .sort((a, b) => b.count - a.count);

  // Calculate angles
  let currentAngle = -Math.PI / 2; // Start at top

  sortedData.forEach(item => {
    const percentage = item.count / totalCount;
    const angle = percentage * 2 * Math.PI;

    // Create path for donut segment
    const startX = centerX + radius * Math.cos(currentAngle);
    const startY = centerY + radius * Math.sin(currentAngle);

    const endAngle = currentAngle + angle;
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const innerStartX = centerX + innerRadius * Math.cos(currentAngle);
    const innerStartY = centerY + innerRadius * Math.sin(currentAngle);
    const innerEndX = centerX + innerRadius * Math.cos(endAngle);
    const innerEndY = centerY + innerRadius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L ${innerEndX} ${innerEndY}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
      'Z'
    ].join(' ');

    path.setAttribute('d', pathData);
    path.setAttribute('fill', item.color);
    path.setAttribute('stroke', 'white');
    path.setAttribute('stroke-width', '2');

    svg.appendChild(path);

    currentAngle = endAngle;
  });

  // Add center circle text with total
  const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerText.setAttribute('x', centerX);
  centerText.setAttribute('y', centerY);
  centerText.setAttribute('text-anchor', 'middle');
  centerText.setAttribute('dominant-baseline', 'middle');
  centerText.setAttribute('fill', '#172B4D');
  centerText.setAttribute('font-size', '24');
  centerText.setAttribute('font-weight', '600');
  centerText.textContent = totalCount;
  svg.appendChild(centerText);

  const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerLabel.setAttribute('x', centerX);
  centerLabel.setAttribute('y', centerY + 20);
  centerLabel.setAttribute('text-anchor', 'middle');
  centerLabel.setAttribute('fill', '#6B778C');
  centerLabel.setAttribute('font-size', '12');
  centerLabel.textContent = 'Total';
  svg.appendChild(centerLabel);
}

function createLegend(data, totalCount) {
  const legend = document.getElementById('legend');
  legend.innerHTML = '';

  if (totalCount === 0) {
    legend.innerHTML = '<div style="color: #6B778C;">No lozenges found on this page.</div>';
    return;
  }

  const sortedData = Object.entries(data)
    .map(([label, count]) => {
      const percentage = ((count / totalCount) * 100).toFixed(1);
      const color = label.match(/\((.*?)\)/)?.[1] || 'Grey';
      return { label, count, percentage, color: COLOR_MAP[color] || COLOR_MAP['Grey'] };
    })
    .sort((a, b) => b.count - a.count);

  sortedData.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'legend-item';

    const colorBox = document.createElement('div');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = item.color;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'legend-label';
    labelSpan.textContent = item.label;

    const countSpan = document.createElement('span');
    countSpan.className = 'legend-count';
    countSpan.textContent = item.count;

    const percentSpan = document.createElement('span');
    percentSpan.className = 'legend-percent';
    percentSpan.textContent = `(${item.percentage}%)`;

    itemDiv.appendChild(colorBox);
    itemDiv.appendChild(labelSpan);
    itemDiv.appendChild(countSpan);
    itemDiv.appendChild(percentSpan);

    legend.appendChild(itemDiv);
  });
}

// Main execution
function initializeMacro() {
  // This is a placeholder - not actually used since we switched to custom-chart.html
  console.log('Static index.js loaded but not used');
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMacro);
} else {
  initializeMacro();
}
