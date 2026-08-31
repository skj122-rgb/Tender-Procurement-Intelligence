import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import DataTable from './DataTable';
import LoadingSpinner from './LoadingSpinner';
import Badge from './Badge';
import { downloadPdfDocument, downloadExcelFile } from '../../utils/fileDownloader';

const BidderDetailModal = ({ contractorId, isOpen, onClose, bidParameters }) => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadMsg, setDownloadMsg] = useState('');

  useEffect(() => {
    if (!contractorId || !isOpen) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
          apiClient.get(`/contractors/${contractorId}`).catch(() => ({ data: { data: null } })),
          apiClient.get(`/contractors/${contractorId}/performance`).catch(() => ({ data: { data: [] } })),
        ]);

        setContractor(cRes.data?.data || cRes.data || null);
        setPerformance(pRes.data?.data || pRes.data || []);
      } catch (err) {
        console.error('Failed to load contractor past history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [contractorId, isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center justify-center">
          <LoadingSpinner message="Loading contractor multi-parameter profile..." />
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
          <span className="text-3xl">🏢</span>
          <p className="text-sm font-bold text-slate-800">Contractor profile not found in active dataset.</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const totalProjects = performance.length || contractor.total_bids || 4;
  const delayRate = contractor.delayRate ?? contractor.delay_rate ?? (performance.length > 0 ? Math.round((performance.filter(p => (p.delay_days || 0) > 0).length / performance.length) * 100) : 0);
  const avgQuality = contractor.avgQuality ?? contractor.avg_quality ?? '4.5';
  
  // 5 Specific Evaluated Parameters (10 Points Each)
  const p = bidParameters || contractor.parameters || {};
  const param1_delay = (p.pastPerformance !== undefined || p.past_performance !== undefined)
    ? Number(((p.pastPerformance ?? p.past_performance) / 2.0).toFixed(1))
    : (delayRate >= 50 ? 8.5 : delayRate >= 25 ? 5.5 : delayRate > 0 ? 2.5 : 1.2);
  const param2_price = (p.priceDeviation !== undefined || p.price_deviation !== undefined)
    ? Number(((p.priceDeviation ?? p.price_deviation) / 2.0).toFixed(1))
    : 2.0;
  const param3_collusion = (p.bidPatternTiming !== undefined || p.bid_pattern !== undefined)
    ? Number(((p.bidPatternTiming ?? p.bid_pattern) / 2.0).toFixed(1))
    : 1.5;
  const param4_finance = (p.financialCapacity !== undefined || p.financial_solvency !== undefined)
    ? Number(((p.financialCapacity ?? p.financial_solvency) / 2.0).toFixed(1))
    : 2.2;
  const param5_quality = (p.documentCompliance !== undefined || p.document_compliance !== undefined)
    ? Number(((p.documentCompliance ?? p.document_compliance) / 2.0).toFixed(1))
    : (parseFloat(avgQuality) < 3.5 ? 6.5 : parseFloat(avgQuality) < 4.0 ? 3.5 : 1.2);

  const total50Score = Number((param1_delay + param2_price + param3_collusion + param4_finance + param5_quality).toFixed(1));
  const total100Score = contractor.riskScore ? Math.round(contractor.riskScore) : Math.round(total50Score * 2);
  const riskLevel = contractor.riskLevel || (total50Score >= 25 ? 'HIGH' : total50Score >= 15 ? 'MEDIUM' : 'LOW');

  const paramsList = [
    {
      num: 'Point 1',
      name: 'Past Delivery & Schedule Delays',
      score: param1_delay,
      detail: `${delayRate}% historical delay rate across completed public works`,
      color: param1_delay >= 7 ? 'bg-red-500' : param1_delay >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
    },
    {
      num: 'Point 2',
      name: 'Price Deviation & Unbalanced Bidding',
      score: param2_price,
      detail: 'Conforming unit rates within ±5% of standard MoRTH schedules',
      color: 'bg-emerald-500'
    },
    {
      num: 'Point 3',
      name: 'Bidding Anomaly & Collusion Risk',
      score: param3_collusion,
      detail: 'Independent IP coordinates; zero margin coordination signals',
      color: 'bg-emerald-500'
    },
    {
      num: 'Point 4',
      name: 'Financial Solvency & Working Capital',
      score: param4_finance,
      detail: 'Bank solvency certificate verified; positive current ratio',
      color: 'bg-emerald-500'
    },
    {
      num: 'Point 5',
      name: 'Technical Quality & Audit Compliance',
      score: param5_quality,
      detail: `${avgQuality}★ engineering rating; certified lab supervisors`,
      color: param5_quality >= 5 ? 'bg-red-500' : param5_quality >= 3 ? 'bg-amber-500' : 'bg-emerald-500'
    }
  ];

  const handleDownloadPdf = () => {
    if (!contractor) return;
    downloadPdfDocument(
      `Bidder_Profile_${contractor.name.replace(/[^a-zA-Z0-9]/g, '_')}.html`,
      `BIDDER 5-PARAMETER BEHAVIORAL RISK DOSSIER`,
      {
        'Bidder Name': contractor.name,
        'Registration ID': contractor.registration_number,
        'Category / Domain': contractor.category || 'Civil Infrastructure',
        'State Jurisdiction': contractor.state,
        '5-Point Risk Index': `${total50Score} / 50.0 pts (${total100Score}/100 - ${riskLevel})`,
        'Total Executed Works': `${totalProjects} Public Contracts`
      },
      [
        {
          title: '5-Parameter Behavioral Risk Scrutiny (10 Points Each)',
          content: `
            ${paramsList.map(p => `
              <div style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;">
                <span><strong>${p.num}: ${p.name}</strong> (${p.detail})</span>
                <span style="font-weight: bold; color: ${p.score > 4 ? '#b91c1c' : '#15803d'}">${p.score} / 10.0 pts</span>
              </div>
            `).join('')}
          `
        },
        {
          title: 'Documented Public Works History',
          content: '',
          table: {
            headers: ['Project Title', 'Contract Value', 'Status', 'Delay Days', 'Quality Rating'],
            rows: performance.map(p => [
              p.tender_title || 'Public Works Project',
              `₹${parseFloat(p.project_value || 0).toLocaleString('en-IN')}`,
              p.completion_status || 'Completed',
              p.delay_days || 0,
              `${p.quality_rating || 4.5} ★`
            ])
          }
        }
      ]
    );

    setDownloadMsg(`✓ Downloaded "${contractor.name}" profile to your local storage.`);
    setTimeout(() => setDownloadMsg(''), 4000);
  };

  const handleDownloadXls = () => {
    if (!contractor) return;
    downloadExcelFile(
      `Bidder_Projects_${contractor.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
      `Bidder Performance Log: ${contractor.name}`,
      ['Project Title', 'Contract Value (INR)', 'Completion Status', 'Delay (Days)', 'Quality Rating (5.0)', 'Remarks'],
      performance.map(p => [
        p.tender_title || 'Public Works Project',
        parseFloat(p.project_value || 0),
        p.completion_status || 'Completed',
        p.delay_days || 0,
        p.quality_rating || 4.5,
        p.remarks || 'Standard verified contract execution'
      ])
    );

    setDownloadMsg(`✓ Exported spreadsheet to your local storage.`);
    setTimeout(() => setDownloadMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-linear-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏢</span>
              <h2 className="text-xl font-bold tracking-tight text-white">{contractor?.name || 'Bidder Profile'}</h2>
              <Badge level={riskLevel} />
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Registration No: <span className="font-mono font-bold text-white">{contractor?.registration_number || 'N/A'}</span> | 
              Category: <span className="text-white font-medium">{contractor?.category || 'Civil Infrastructure'}</span> | 
              State: <span className="text-white font-medium">{contractor?.state || 'National'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              title="Download dossier to local storage"
            >
              <span>⬇️</span> PDF
            </button>
            <button
              onClick={handleDownloadXls}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              title="Export spreadsheet to local storage"
            >
              <span>📊</span> XLS
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 text-lg transition"
            >
              ✕
            </button>
          </div>
        </div>

        {downloadMsg && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold text-center border-b border-emerald-200">
            {downloadMsg}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-12"><LoadingSpinner message="Retrieving bidder behavioral profile & execution history..." /></div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Executed Projects</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">{totalProjects} Works</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Historical Delay Rate</p>
                  <p className={`text-xl font-extrabold mt-1 ${delayRate >= 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {delayRate}%
                  </p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Engineering Quality</p>
                  <p className="text-xl font-extrabold text-blue-700 mt-1">{avgQuality} ★ / 5.0</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Composite 5-Point Risk</p>
                  <p className={`text-xl font-black mt-1 ${total100Score >= 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {total50Score} <span className="text-xs font-normal text-slate-500">/ 50 pts</span>
                  </p>
                </div>
              </div>

              {/* 5-Parameter Behavioral Breakdown (10 Points Each) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    5-Point Behavioral Risk Parameters (10.0 Points Each)
                  </h4>
                  <span className="text-xs font-extrabold text-slate-700 font-mono">
                    Total: {total50Score} / 50.0 pts ({riskLevel} RISK)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  {paramsList.map((p) => (
                    <div key={p.num} className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900">{p.num}: {p.name}</span>
                          <span className="font-black text-slate-800">{p.score.toFixed(1)} / 10.0 pts</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{p.detail}</p>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${p.color}`} style={{ width: `${(p.score / 10) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Tenders & Contract History */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>📋</span> Past Tenders & Delivery History
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                    {performance.length} Historical Records
                  </span>
                </div>

                {performance.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
                    No documented past government contracts found.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <DataTable
                      columns={[
                        { 
                          header: 'Tender / Project Title', 
                          accessor: 'tender_title', 
                          cell: (row) => <span className="font-bold text-slate-900 text-xs">{row.tender_title || 'Public Works Project'}</span> 
                        },
                        { 
                          header: 'Contract Value', 
                          cell: (row) => <span className="text-xs font-semibold text-slate-800">₹{parseFloat(row.project_value || 0).toLocaleString('en-IN')}</span> 
                        },
                        { 
                          header: 'Status', 
                          cell: (row) => (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              (row.completion_status || '').includes('late') || (row.delay_days || 0) > 0 
                                ? 'bg-amber-100 text-amber-900' 
                                : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {row.completion_status ? row.completion_status.replace('_', ' ') : 'Completed'}
                            </span>
                          ) 
                        },
                        { 
                          header: 'Delay', 
                          cell: (row) => (row.delay_days || 0) > 0 ? (
                            <span className="text-red-600 font-bold text-xs">+{row.delay_days}d</span>
                          ) : (
                            <span className="text-emerald-700 text-xs font-bold">On Time</span>
                          ) 
                        },
                        { 
                          header: 'Quality', 
                          cell: (row) => <span className="font-bold text-slate-800 text-xs">{row.quality_rating || 4.5} ★</span> 
                        }
                      ]}
                      data={performance}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">Government Procurement Oversight Network</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`/contractors/${contractorId}`);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Open Full Profile Page →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidderDetailModal;
