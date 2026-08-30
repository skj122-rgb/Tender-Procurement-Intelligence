import React from 'react';
import Plot from 'react-plotly.js';

const DepartmentChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs">No department data</div>;
  }

  const chartData = [{
    x: data.map(d => d.department),
    y: data.map(d => d.count),
    type: 'bar',
    marker: {
      color: '#3b82f6', // blue-500
      line: { color: '#1d4ed8', width: 1.5 }
    },
    hoverinfo: 'x+y',
  }];

  const layout = {
    autosize: true,
    height: 260,
    margin: { t: 15, b: 50, l: 35, r: 15 },
    xaxis: { 
      tickangle: -20, 
      automargin: true,
      tickfont: { size: 10, family: 'ui-sans-serif, system-ui', color: '#475569' }
    },
    yaxis: { 
      automargin: true,
      gridcolor: '#f1f5f9',
      tickfont: { size: 10, family: 'ui-sans-serif, system-ui', color: '#64748b' }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'ui-sans-serif, system-ui' }
  };

  return (
    <div className="w-full h-[260px] max-w-full overflow-hidden">
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

export default DepartmentChart;
