import React from 'react';
import Plot from 'react-plotly.js';

const RiskBreakdown = ({ components }) => {
  if (!components) {
    components = {
      price: 18,
      bidPattern: 16,
      boq: 12,
      contractor: 12,
      document: 10
    };
  }

  let formatted = [];
  if (Array.isArray(components)) {
    formatted = components.map(c => ({ name: c.name || c.label, score: parseFloat(c.score || c.value || 0) }));
  } else {
    formatted = [
      { name: 'Price Anomalies', score: parseFloat(components.price || 0) },
      { name: 'Bid Pattern Nexus', score: parseFloat(components.bidPattern || components.bid_pattern || 0) },
      { name: 'BOQ Line Variances', score: parseFloat(components.boq || 0) },
      { name: 'Contractor Risk', score: parseFloat(components.contractor || 0) },
      { name: 'Document Checklist', score: parseFloat(components.document || 0) },
    ];
  }

  const chartData = [{
    type: 'bar',
    x: formatted.map(c => c.score),
    y: formatted.map(c => c.name),
    orientation: 'h',
    marker: {
      color: formatted.map(c => {
        if (c.score >= 15) return '#ef4444'; // red
        if (c.score >= 10) return '#f97316'; // orange
        if (c.score >= 5) return '#f59e0b';  // amber
        return '#10b981';                    // emerald
      }),
      line: { color: '#ffffff', width: 1.5 }
    },
    text: formatted.map(c => `${c.score} pts`),
    textposition: 'auto',
    hoverinfo: 'y+x',
  }];

  const layout = {
    autosize: true,
    height: 220,
    margin: { t: 10, b: 30, l: 140, r: 25 },
    xaxis: { 
      range: [0, 25], 
      automargin: true,
      gridcolor: '#f1f5f9',
      tickfont: { size: 10, color: '#64748b' }
    },
    yaxis: { 
      automargin: true,
      tickfont: { size: 11, family: 'ui-sans-serif, system-ui', color: '#1e293b' }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'ui-sans-serif, system-ui' }
  };

  return (
    <div className="w-full h-[220px] max-w-full overflow-hidden">
      <Plot
        data={chartData}
        layout={layout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  );
};

export default RiskBreakdown;
