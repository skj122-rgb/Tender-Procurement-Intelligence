import React from 'react';
import Plot from 'react-plotly.js';

const RiskScoreGauge = ({ score }) => {
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;

  const chartData = [
    {
      type: "indicator",
      mode: "gauge+number",
      value: numericScore,
      number: {
        suffix: " / 100",
        font: { size: 28, color: numericScore > 75 ? '#dc2626' : numericScore > 50 ? '#d97706' : '#16a34a', family: 'ui-sans-serif, system-ui' }
      },
      gauge: {
        axis: { range: [0, 100], tickwidth: 1, tickcolor: "#94a3b8", nticks: 5 },
        bar: { color: "#1e293b", thickness: 0.2 },
        bgcolor: "white",
        borderwidth: 1,
        bordercolor: "#cbd5e1",
        steps: [
          { range: [0, 30], color: "#dcfce7" },   // Emerald 100
          { range: [30, 60], color: "#fef9c3" },  // Yellow 100
          { range: [60, 80], color: "#ffedd5" },  // Orange 100
          { range: [80, 100], color: "#fee2e2" }  // Red 100
        ],
      }
    }
  ];

  const layout = {
    autosize: true,
    margin: { t: 25, b: 15, l: 30, r: 30 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'ui-sans-serif, system-ui' },
    height: 220,
  };

  return (
    <div className="w-full h-[220px] max-w-full overflow-hidden flex items-center justify-center">
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

export default RiskScoreGauge;
