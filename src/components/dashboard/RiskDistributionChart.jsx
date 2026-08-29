import React from 'react';
import Plot from 'react-plotly.js';

const RiskDistributionChart = ({ data }) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs">No distribution data</div>;
  }

  const items = Array.isArray(data) 
    ? data 
    : Object.entries(data).map(([label, value]) => ({ label, value }));

  const chartData = [{
    values: items.map(d => d.value),
    labels: items.map(d => d.label),
    type: 'pie',
    hole: 0.55,
    marker: {
      colors: items.map(d => {
        switch (d.label.toUpperCase()) {
          case 'LOW': return '#10b981';      // emerald-500
          case 'MEDIUM': return '#f59e0b';   // amber-500
          case 'HIGH': return '#f97316';     // orange-500
          case 'CRITICAL': return '#ef4444'; // red-500
          default: return '#64748b';         // slate-500
        }
      }),
      line: { color: '#ffffff', width: 2 }
    },
    textinfo: 'percent',
    hoverinfo: 'label+value+percent',
    textposition: 'inside',
  }];

  const layout = {
    autosize: true,
    height: 260,
    margin: { t: 10, b: 20, l: 15, r: 15 },
    showlegend: true,
    legend: { 
      orientation: 'h', 
      x: 0.5, 
      y: -0.15, 
      xanchor: 'center',
      font: { size: 11, family: 'ui-sans-serif, system-ui', color: '#475569' }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'ui-sans-serif, system-ui' }
  };

  return (
    <div className="w-full h-[260px] max-w-full overflow-hidden flex items-center justify-center">
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

export default RiskDistributionChart;
