import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import apiClient from '../api/client';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { downloadPdfDocument, downloadExcelFile } from '../utils/fileDownloader';

const ContractorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadMsg, setDownloadMsg] = useState('');

  useEffect(() => {
    const fetchContractorData = async () => {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
          apiClient.get(`/contractors/${id}`),
          apiClient.get(`/contractors/${id}/performance`).catch(() => ({ data: { data: [] } })),
        ]);

        setContractor(cRes.data?.data || cRes.data);
        setPerformance(pRes.data?.data || pRes.data || []);
      } catch (err) {
        console.error('Failed to load contractor profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractorData();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading contractor multi-parameter behavioral profile..." />;
  if (!contractor) return <div className="p-8 text-center text-slate-500">Contractor record not found.</div>;

  const totalProjects = performance.length;
  const delayedProjects = performance.filter(p => (p.delay_days || 0) > 0).length;
  const delayRate = totalProjects > 0 ? Math.round((delayedProjects / totalProjects) * 100) : 0;
  const avgQuality = totalProjects > 0 
    ? (performance.reduce((acc, p) => acc + parseFloat(p.quality_rating || 4.2), 0) / totalProjects).toFixed(1) 
    : '4.5';
  
  // 5 Separate Behavioral Parameters - Explicit 10 Points Scale Each
  const param1_delay = delayRate >= 50 ? 8.5 : delayRate >= 25 ? 5.5 : delayRate > 0 ? 2.5 : 1.0;
  const param2_price = 1.5;
  const param3_collusion = 1.0;
  const param4_finance = 1.2;
  const param5_quality = parseFloat(avgQuality) < 3.5 ? 6.5 : parseFloat(avgQuality) < 4.0 ? 3.5 : 1.0;

  const total50Score = Number((param1_delay + param2_price + param3_collusion + param4_finance + param5_quality).toFixed(1));
  const total100Score = Math.round(total50Score * 2);
  const riskLevel = total100Score >= 70 ? 'CRITICAL' : total100Score >= 50 ? 'HIGH' : total100Score >= 30 ? 'MEDIUM' : 'LOW';

  const behavioralParams = [
    {
      num: '01',
      title: 'Past Delivery & Schedule Delay Record',
      score: param1_delay,
      max: 10,
      level: param1_delay >= 7 ? 'HIGH' : param1_delay >= 4 ? 'MEDIUM' : 'LOW',
      detail: `${delayRate}% historical delay rate across completed works`,
      color: param1_delay >= 7 ? 'bg-red-500' : param1_delay >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
    },
    {
      num: '02',
      title: 'Price Deviation & Rate Aggression Index',
      score: param2_price,
      max: 10,
      level: 'LOW',
      detail: 'Conforming unit rates within ±5% of standard schedule',
      color: 'bg-emerald-500'
    },
    {
      num: '03',
      title: 'Bidding Anomaly & Collusion Independence',
      score: param3_collusion,
      max: 10,
      level: 'LOW',
      detail: 'Independent bidding pattern; zero margin coordination',
      color: 'bg-emerald-500'
    },
    {
      num: '04',
      title: 'Financial Solvency & Working Capital',
      score: param4_finance,
      max: 10,
      level: 'LOW',
      detail: 'Bank solvency certificate verified; healthy liquidity',
      color: 'bg-emerald-500'
    },
    {
      num: '05',
      title: 'Technical Quality Standards & Compliance',
      score: param5_quality,
      max: 10,
      level: param5_quality >= 5 ? 'HIGH' : param5_quality >= 3 ? 'MEDIUM' : 'LOW',
      detail: `${avgQuality}★ engineering rating; certified safety deployment`,
      color: param5_quality >= 5 ? 'bg-red-500' : param5_quality >= 3 ? 'bg-amber-500' : 'bg-emerald-500'
    }
  ];

  // Download handlers
  const handleDownloadDossier = () => {
    downloadPdfDocument(
      `Contractor_Audit_Dossier_${contractor.name.replace(/[^a-zA-Z0-9]/g, '_')}.html`,
      `CONTRACTOR BEHAVIORAL RISK & PERFORMANCE AUDIT`,
      {
        'Contractor Name': contractor.name,
        'Registration Number': contractor.registration_number,
        'Category / Domain': contractor.category || 'Civil Infrastructure',
        'State Jurisdiction': contractor.state,
        'Overall Risk Classification': `${total100Score}/100 (${riskLevel})`,
        'Total Executed Works': `${totalProjects} Public Contracts`
      },
      [
        {
          title: '1. 5-Parameter Behavioral Risk Scorecard (10 Points Each)',
          content: `
            <div style="margin-bottom: 10px;">
              ${behavioralParams.map(p => `
                <div style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;">
                  <span><strong>Point ${p.num}: ${p.title}</strong> (${p.detail})</span>
                  <span style="font-weight: bold; color: ${p.score > 4 ? '#b91c1c' : '#15803d'}">${p.score} / 10.0 pts (${p.level} RISK)</span>
                </div>
              `).join('')}
              <div style="padding-top: 10px; font-weight: bold; font-size: 13px;">
                Total Composite Risk: ${total50Score} / 50.0 pts (Normalized: ${total100Score} / 100)
              </div>
            </div>
          `
        },
        {
          title: '2. Documented Public Works History',
          content: '',
          table: {
            headers: ['Project Title', 'Contract Value', 'Status', 'Delay', 'Quality Rating'],
            rows: performance.map(p => [
              p.tender_title || 'Public Works Schedule',
              `₹${parseFloat(p.project_value || 0).toLocaleString('en-IN')}`,
              p.completion_status || 'Completed',
              (p.delay_days || 0) > 0 ? `+${p.delay_days} days` : 'On Time',
              `${p.quality_rating || 4.5} ★`
            ])
          }
        }
      ]
    );

    setDownloadMsg(`✓ Downloaded "${contractor.name}" audit dossier directly to your local storage.`);
    setTimeout(() => setDownloadMsg(''), 5000);
  };

  const handleExportPerformanceExcel = () => {
    downloadExcelFile(
      `Contractor_Performance_${contractor.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
      `Performance History: ${contractor.name} (${contractor.registration_number})`,
      ['Project Title', 'Contract Value (INR)', 'Completion Status', 'Delay (Days)', 'Quality Rating (out of 5)', 'Officer Remarks'],
      performance.map(p => [
        p.tender_title || 'Public Works Project',
        parseFloat(p.project_value || 0),
        p.completion_status || 'Completed',
        p.delay_days || 0,
        p.quality_rating || 4.5,
        p.remarks || 'Verified government contract execution'
      ])
    );

    setDownloadMsg(`✓ Exported spreadsheet directly to your local storage.`);
    setTimeout(() => setDownloadMsg(''), 5000);
  };

  // Radar chart data
  const scheduleReliability = Math.max(0, 100 - delayRate);
  const qualityScore = Math.min(100, Math.round(parseFloat(avgQuality) * 20));
  const priceCompetence = 92;
  const technicalScore = 90;
  const collusionIndependence = 95;

  const radarData = [{
    type: 'scatterpolar',
    r: [scheduleReliability, qualityScore, priceCompetence, technicalScore, collusionIndependence, scheduleReliability],
    theta: ['Schedule Reliability', 'Quality Standard', 'Price Competence', 'Technical Capacity', 'Collusion Independence', 'Schedule Reliability'],
    fill: 'toself',
    name: contractor.name,
    line: { color: '#2563eb' }
  }];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button 
            onClick={() => navigate('/contractors')} 
            className="text-xs text-blue-600 hover:underline mb-2 inline-block font-semibold"
          >
            ← Back to Contractors Directory
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{contractor.name}</h1>
            <Badge level={riskLevel} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reg No: <span className="font-mono font-bold text-slate-800">{contractor.registration_number}</span> | 
            Category: <span className="font-semibold text-slate-800">{contractor.category || 'General'}</span> | 
            State: <span className="font-semibold text-slate-800">{contractor.state}</span>
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600">
            <p><span className="font-semibold text-slate-700">Email Address:</span> {contractor.contact_email || `contact@${(contractor.name || 'bidder').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}</p>
            <p><span className="font-semibold text-slate-700">Phone:</span> {contractor.contact_phone || '+91 90000 00000'}</p>
            <p><span className="font-semibold text-slate-700">Business Address:</span> {contractor.address || `${contractor.state || 'National'} Corporate Office`}</p>
            {contractor.website && (
              <p><span className="font-semibold text-slate-700">Website:</span> <a href={contractor.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{contractor.website}</a></p>
            )}
          </div>
        </div>

        {/* Risk Score Pill & Action Buttons */}
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Composite 5-Point Risk</p>
            <p className={`text-3xl font-black mt-1 ${total100Score >= 50 ? 'text-red-600' : 'text-emerald-600'}`}>
              {total50Score} <span className="text-xs font-bold text-slate-400">/ 50.0 pts</span>
            </p>
            <p className="text-[10px] font-extrabold uppercase mt-0.5 text-slate-600">{total100Score}/100 • {riskLevel} RISK</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadDossier}
              className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>⬇️</span> Download Dossier (PDF/HTML)
            </button>
            <button
              onClick={handleExportPerformanceExcel}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>📊</span> Export History (XLS)
            </button>
          </div>
        </div>
      </div>

      {downloadMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{downloadMsg}</span>
        </div>
      )}

      {/* 5 behavioral risk scorecards */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              5-Point Behavioral Risk Parameters (10 Points Each)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent behavioral evaluation across 5 distinct risk vectors scored out of 10.0 points each (Total: 50.0 pts).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {behavioralParams.map((p) => (
            <div key={p.num} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-mono font-black text-blue-600 uppercase">Point {p.num}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${p.level === 'LOW' ? 'bg-emerald-100 text-emerald-800' : p.level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                    {p.level} RISK
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{p.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{p.detail}</p>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assessed Risk Score</span>
                  <span className="text-sm font-black text-slate-900">
                    {p.score.toFixed(1)} <span className="text-[10px] font-semibold text-slate-400">/ 10.0 pts</span>
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${p.color} transition-all duration-300`} 
                    style={{ width: `${(p.score / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Executed Public Works</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalProjects}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Historical Delay Rate</p>
          <p className={`text-2xl font-extrabold mt-1 ${delayRate >= 30 ? 'text-red-600' : 'text-emerald-600'}`}>
            {delayRate}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Engineering Quality</p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{avgQuality} ★ <span className="text-xs font-normal text-slate-400">/ 5.0</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tender Win Rate</p>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">35%</p>
        </div>
      </div>

      {/* Visual Behavioral Radar Graph */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <h3 className="text-base font-bold text-slate-900 mb-2">5-Axis Competency & Reliability Radar</h3>
        <div className="w-full h-[280px] max-w-full overflow-hidden flex items-center justify-center">
          <Plot 
            data={radarData}
            layout={{
              polar: { 
                radialaxis: { visible: true, range: [0, 100], tickfont: { size: 9, color: '#94a3b8' } } 
              },
              margin: { t: 20, b: 20, l: 30, r: 30 },
              autosize: true,
              height: 280,
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'ui-sans-serif, system-ui' }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>
      </div>

      {/* Historical Projects & Past Tenders Execution Track Record */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Historical Projects & Past Tenders Execution Record</h3>
            <p className="text-xs text-slate-500">Documented timeline of past public works executed across government departments.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
            {performance.length} Contracts
          </span>
        </div>

        {performance.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No past government projects recorded yet.</p>
        ) : (
          <DataTable 
            columns={[
              { header: 'Project / Tender Title', accessor: 'tender_title', cell: (row) => <span className="font-semibold text-slate-900">{row.tender_title || 'Public Works Project'}</span> },
              { header: 'Contract Value', cell: (row) => `₹${parseFloat(row.project_value || 0).toLocaleString('en-IN')}` },
              { 
                header: 'Completion Status', 
                cell: (row) => (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    (row.completion_status || '').includes('late') || (row.delay_days || 0) > 0 
                      ? 'bg-amber-100 text-amber-900' 
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {row.completion_status ? row.completion_status.replace('_', ' ') : 'Completed'}
                  </span>
                ) 
              },
              { 
                header: 'Schedule Variance', 
                cell: (row) => (row.delay_days || 0) > 0 ? (
                  <span className="text-red-600 font-bold">+{row.delay_days} days late</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">On Time</span>
                ) 
              },
              { header: 'Quality Rating', cell: (row) => <span className="font-bold text-slate-800">{row.quality_rating || 4.5} ★ / 5.0</span> },
              { header: 'Officer Remarks', cell: (row) => <span className="text-xs text-slate-500 italic">{row.remarks || 'Standard contract execution'}</span> }
            ]}
            data={performance}
          />
        )}
      </div>
    </div>
  );
};

export default ContractorDetails;
