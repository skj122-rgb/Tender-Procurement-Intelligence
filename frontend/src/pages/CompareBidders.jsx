import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import apiClient from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import BidderDetailModal from '../components/common/BidderDetailModal';
import { downloadPdfDocument, downloadExcelFile } from '../utils/fileDownloader';

const CompareBidders = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramTenderId = searchParams.get('tenderId');

  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState(paramTenderId || '');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState('');

  // Modal state for contractor detail
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const res = await apiClient.get('/tenders?limit=1000');
        const list = res.data?.data?.tenders || res.data?.tenders || [];
        setTenders(list);
        if (!selectedTenderId && list.length > 0) {
          setSelectedTenderId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load tenders list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, []);

  useEffect(() => {
    if (!selectedTenderId) return;
    const loadComparison = async () => {
      try {
        setAnalyzing(true);
        const res = await apiClient.get(`/tenders/${selectedTenderId}/compare`);
        setComparisonData(res.data?.data || null);
      } catch (err) {
        console.error('Failed to load bidder comparison data:', err);
      } finally {
        setAnalyzing(false);
      }
    };
    loadComparison();
  }, [selectedTenderId]);

  if (loading) return <LoadingSpinner message="Loading 5-parameter bidder behavioral intelligence across all monitored tenders..." />;

  const bidders = comparisonData?.comparison || [];
  const estimatedValue = parseFloat(comparisonData?.estimatedValue || 10000000);
  const selectedTender = tenders.find(t => t.id === selectedTenderId);

  // Helper to convert parameters to 10 points each
  const get10PtParams = (b) => {
    if (b && b.parameters) {
      const p = b.parameters;
      const rawP1 = p.pastPerformance ?? p.past_performance ?? (b.delayRate * 0.2);
      const rawP2 = p.priceDeviation ?? p.price_deviation ?? Math.abs(b.priceDeviation || 0);
      const rawP3 = p.bidPatternTiming ?? p.bid_pattern ?? (b.submissionMinutesBeforeClosing < 5 ? 6.5 : 2.0);
      const rawP4 = p.financialCapacity ?? p.financial_solvency ?? 3.5;
      const rawP5 = p.documentCompliance ?? p.document_compliance ?? 3.0;

      const p1 = Number(Math.min(10, Math.max(0.5, rawP1 / 2)).toFixed(1));
      const p2 = Number(Math.min(10, Math.max(0.5, rawP2 / 2)).toFixed(1));
      const p3 = Number(Math.min(10, Math.max(0.5, rawP3 / 2)).toFixed(1));
      const p4 = Number(Math.min(10, Math.max(0.5, rawP4 / 2)).toFixed(1));
      const p5 = Number(Math.min(10, Math.max(0.5, rawP5 / 2)).toFixed(1));
      
      const total50 = Number((p1 + p2 + p3 + p4 + p5).toFixed(1));
      const total100 = b.riskScore ? Math.round(b.riskScore) : Math.round(total50 * 2);
      return { p1, p2, p3, p4, p5, total50, total100 };
    }

    const p1 = b.delayRate >= 50 ? 8.5 : b.delayRate >= 25 ? 5.5 : b.delayRate > 0 ? 2.5 : 1.2;
    const p2 = Math.abs(b.priceDeviation || 0) > 20 ? 8.0 : Math.abs(b.priceDeviation || 0) > 10 ? 5.0 : 1.8;
    const p3 = (b.submissionMinutesBeforeClosing && b.submissionMinutesBeforeClosing < 5) ? 6.5 : 1.5;
    const p4 = 2.0;
    const p5 = parseFloat(b.avgQuality || 4.5) < 3.5 ? 6.5 : parseFloat(b.avgQuality || 4.5) < 4.0 ? 3.5 : 1.2;
    const total50 = Number((p1 + p2 + p3 + p4 + p5).toFixed(1));
    return { p1, p2, p3, p4, p5, total50, total100: b.riskScore ? Math.round(b.riskScore) : Math.round(total50 * 2) };
  };

  // Build Radar Chart Data comparing all bidders on the 5 core parameters
  const radarData = bidders.map((b, i) => {
    const scores = get10PtParams(b);
    const s1 = Math.max(0, 100 - (scores.p1 * 10));
    const s2 = Math.max(0, 100 - (scores.p2 * 10));
    const s3 = Math.max(0, 100 - (scores.p3 * 10));
    const s4 = Math.max(0, 100 - (scores.p4 * 10));
    const s5 = Math.max(0, 100 - (scores.p5 * 10));

    return {
      type: 'scatterpolar',
      r: [s1, s2, s3, s4, s5, s1],
      theta: [
        '1. Delivery Record', 
        '2. Price Reasonableness', 
        '3. Anti-Collusion', 
        '4. Solvency Capacity', 
        '5. Quality Standard', 
        '1. Delivery Record'
      ],
      fill: 'toself',
      name: b.contractorName || `Bidder #${i + 1}`,
    };
  });

  // Download Handlers
  const handleExportComparisonXls = () => {
    if (!selectedTender) return;
    downloadExcelFile(
      `Bidder_Comparison_${selectedTender.tender_id || 'TND'}.csv`,
      `Bidder Behavioral 5-Parameter Comparison - ${selectedTender.title}`,
      [
        'Bidder Name',
        'Registration ID',
        'Category',
        'State',
        'Submitted Bid (INR)',
        'Price Variance (%)',
        'Point 1: Delivery Delay (/10)',
        'Point 2: Price Deviation (/10)',
        'Point 3: Collusion Anomaly (/10)',
        'Point 4: Solvency (/10)',
        'Point 5: Quality (/10)',
        'Composite 5-Point Risk (/50)',
        'Normalized Risk (/100)',
        'Merit Classification'
      ],
      bidders.map(b => {
        const sc = get10PtParams(b);
        return [
          b.contractorName,
          b.registrationNumber || 'N/A',
          b.category || 'Civil',
          b.state || 'National',
          parseFloat(b.bidAmount || 0),
          `${b.priceDeviation}%`,
          sc.p1,
          sc.p2,
          sc.p3,
          sc.p4,
          sc.p5,
          sc.total50,
          sc.total100,
          b.riskLevel || 'LOW'
        ];
      })
    );

    setDownloadFeedback(`✓ Exported comparison spreadsheet directly to your local storage.`);
    setTimeout(() => setDownloadFeedback(''), 5000);
  };

  const handleDownloadComparisonPdf = () => {
    if (!selectedTender) return;
    downloadPdfDocument(
      `Bidder_Comparison_${selectedTender.tender_id || 'TND'}.html`,
      `BIDDER 5-PARAMETER BEHAVIORAL COMPARISON MATRIX`,
      {
        'Tender Title': selectedTender.title,
        'Tender Reference ID': selectedTender.tender_id || 'N/A',
        'Department': selectedTender.department,
        'Estimated Tender Value': `₹${estimatedValue.toLocaleString('en-IN')}`,
        'Participating Bidders Evaluated': `${bidders.length} Contractor Entities`,
        'Evaluation Framework': '5 Behavioral Points (10.0 Pts Each / Total 50.0 Pts)'
      },
      [
        {
          title: '1. Comparative 5-Parameter Behavioral Risk Table',
          content: '',
          table: {
            headers: ['Bidder Entity', 'Bid Quote', 'Variance', 'P1 Delay', 'P2 Price', 'P3 Timing', 'P4 Finance', 'P5 Quality', 'Total / 50'],
            rows: bidders.map(b => {
              const sc = get10PtParams(b);
              return [
                b.contractorName,
                `₹${parseFloat(b.bidAmount || 0).toLocaleString('en-IN')}`,
                `${b.priceDeviation > 0 ? '+' : ''}${b.priceDeviation}%`,
                `${sc.p1}/10`,
                `${sc.p2}/10`,
                `${sc.p3}/10`,
                `${sc.p4}/10`,
                `${sc.p5}/10`,
                `<strong>${sc.total50} / 50</strong>`
              ];
            })
          }
        },
        {
          title: '2. 5-Parameter Evaluation Criteria Breakdown',
          content: `
            <ul style="margin: 0; padding-left: 20px; font-size: 11px;">
              <li><strong>Point 1 - Past Delivery & Delay Record (10 Pts):</strong> Historical completion track record and schedule variance across public contracts.</li>
              <li><strong>Point 2 - Price Deviation & Rate Aggression (10 Pts):</strong> Scrutiny of unit rates against engineer estimates for predatory pricing.</li>
              <li><strong>Point 3 - Anti-Collusion & Submission Anomaly (10 Pts):</strong> Independence of submission timestamps, network IP origin, and bid rotation signals.</li>
              <li><strong>Point 4 - Financial Solvency & Working Capital (10 Pts):</strong> Bank solvency certification, balance sheet liquidity, and capital depth.</li>
              <li><strong>Point 5 - Technical Quality & Audit Compliance (10 Pts):</strong> Star rating audits, certified testing deployment, and supervisory qualifications.</li>
            </ul>
          `
        }
      ]
    );

    setDownloadFeedback(`✓ Downloaded comparative dossier directly to your local storage.`);
    setTimeout(() => setDownloadFeedback(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚖️</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bidder Behavioral Anomaly & 5-Parameter Matrix</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            5 distinct risk parameters scored out of <strong>10.0 points each</strong> (Total 50.0 pts) for every competing contractor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedTenderId}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            className="p-2.5 border rounded-xl bg-white border-slate-300 text-xs font-bold focus:ring-blue-500 focus:border-blue-500 max-w-xs truncate shadow-sm"
          >
            {tenders.map(t => (
              <option key={t.id} value={t.id}>{t.tender_id || t.title} - {t.title.slice(0, 32)}...</option>
            ))}
          </select>

          <button
            onClick={handleDownloadComparisonPdf}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            title="Download comparative dossier to local storage"
          >
            <span>⬇️</span> PDF
          </button>

          <button
            onClick={handleExportComparisonXls}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            title="Export spreadsheet to local storage"
          >
            <span>📊</span> XLS
          </button>
        </div>
      </div>

      {downloadFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{downloadFeedback}</span>
        </div>
      )}

      {analyzing ? (
        <div className="py-16"><LoadingSpinner message="Evaluating 5 behavioral risk parameters for participating bidders..." /></div>
      ) : bidders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <p className="text-sm font-medium">No bidders submitted bids for this tender schedule yet.</p>
          <button 
            onClick={() => navigate('/tenders')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            Browse All Tenders
          </button>
        </div>
      ) : (
        <>
      {/* Bidder 5-parameter scorecards */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🔍</span> Participating Bidder Risk Profiles ({bidders.length} Bidders Evaluated)
              </h2>
              <span className="text-xs text-slate-500">Each parameter scored on a separate 10.0 Point Scale</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {bidders.map((b, idx) => {
                const isWinner = b.isWinner;
                const riskLevel = b.riskLevel || 'LOW';
                const sc = get10PtParams(b);

                return (
                  <div
                    key={b.contractorId || idx}
                    onClick={() => {
                      setSelectedContractorId(b.contractorId);
                      setIsModalOpen(true);
                    }}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer hover:shadow-md transition duration-150 flex flex-col justify-between ${
                      isWinner ? 'border-blue-300 ring-1 ring-blue-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            {b.registrationNumber || `REG-${idx + 1}`}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-blue-600 transition">
                            {b.contractorName}
                          </h3>
                          <p className="text-xs text-slate-500">{b.category || 'Civil Infrastructure'} • {b.state || 'National'}</p>
                        </div>
                        <Badge level={riskLevel} />
                      </div>

                      {/* Financial & Bid Summary */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Submitted Bid:</span>
                          <span className="font-bold text-slate-900">₹{parseFloat(b.bidAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Price Variance:</span>
                          <span className={`font-bold ${b.priceDeviation < -15 ? 'text-amber-600' : 'text-blue-700'}`}>
                            {b.priceDeviation > 0 ? `+${b.priceDeviation}%` : `${b.priceDeviation}%`}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Composite 5-Pt Risk:</span>
                          <span className="font-black text-slate-900">{sc.total50} / 50.0 pts</span>
                        </div>
                      </div>

                      {/* 5 Core Behavioral Risk Parameters (10 Points Each) */}
                      <div className="space-y-2.5 mb-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">5 Evaluated Points (10.0 Pts Each):</p>
                        
                        {/* Point 1. Past Performance */}
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                            <span>Point 1: Delivery Delay ({b.delayRate}% delays)</span>
                            <span className={sc.p1 >= 6 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                              {sc.p1.toFixed(1)} / 10.0 pts
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sc.p1 >= 6 ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${(sc.p1 / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Point 2. Price Deviation */}
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                            <span>Point 2: Price Deviation ({b.priceDeviation}%)</span>
                            <span className={sc.p2 >= 5 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                              {sc.p2.toFixed(1)} / 10.0 pts
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sc.p2 >= 5 ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${(sc.p2 / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Point 3. Bid Pattern & Timing */}
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                            <span>Point 3: Anti-Collusion & Timing</span>
                            <span className={sc.p3 >= 5 ? 'text-red-600 font-bold' : 'text-slate-700'}>
                              {sc.p3.toFixed(1)} / 10.0 pts
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sc.p3 >= 5 ? 'bg-red-500' : 'bg-purple-500'}`}
                              style={{ width: `${(sc.p3 / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Point 4. Financial Capacity */}
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                            <span>Point 4: Financial Solvency</span>
                            <span className="text-slate-700">{sc.p4.toFixed(1)} / 10.0 pts</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(sc.p4 / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Point 5. Technical Quality */}
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                            <span>Point 5: Quality & Audit Compliance</span>
                            <span className="text-slate-700">{sc.p5.toFixed(1)} / 10.0 pts</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${(sc.p5 / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContractorId(b.contractorId);
                        setIsModalOpen(true);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 mt-2"
                    >
                      <span>🔍</span> Inspect 5-Point Dossier
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5-point radar overlay */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">5-Point Multi-Bidder Behavioral Radar Matrix</h3>
                <p className="text-xs text-slate-500">Superimposed multi-dimensional competency and risk distribution comparison across all {bidders.length} bidding contractors.</p>
              </div>
            </div>

            <div className="w-full h-[360px] flex items-center justify-center">
              <Plot 
                data={radarData}
                layout={{
                  polar: { 
                    radialaxis: { 
                      visible: true, 
                      range: [0, 100], 
                      tickfont: { size: 9, color: '#94a3b8' } 
                    } 
                  },
                  margin: { t: 30, b: 30, l: 40, r: 40 },
                  autosize: true,
                  height: 360,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'ui-sans-serif, system-ui' },
                  legend: { orientation: 'h', y: -0.15, x: 0.1 }
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          </div>
        </>
      )}

      {/* Contractor Past Tenders Modal */}
      <BidderDetailModal
        contractorId={selectedContractorId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default CompareBidders;
