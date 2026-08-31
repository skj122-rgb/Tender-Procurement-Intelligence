import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BidderDetailModal from '../components/common/BidderDetailModal';

const RiskAnalysis = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/contractors');
        const list = res.data?.data?.contractors || res.data?.contractors || [];
        setContractors(list);
      } catch (err) {
        console.error('Failed to load contractors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContractors();
  }, []);

  const enrichedContractors = contractors.map((c) => {
    const score = c.riskScore ?? c.risk_score ?? 25.0;
    const level = c.riskLevel ?? c.risk_level ?? (score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW');
    const delayRate = c.delayRate ?? c.delay_rate ?? 0;
    const avgQuality = c.avgQuality ?? c.avg_quality ?? 4.5;
    
    let keySignal = c.keySignal ?? c.key_signal;
    if (!keySignal) {
      if (delayRate >= 50) keySignal = `⚠️ Severe Delay Risk: ${delayRate}% of past public works delayed.`;
      else if (delayRate > 0) keySignal = `⚠️ Schedule Variance: ${delayRate}% historical delay rate.`;
      else if (avgQuality >= 4.5) keySignal = `🛡️ Verified High Engineering Quality: ${avgQuality}★ rating.`;
      else keySignal = 'Clean on-time track record with verified quality standards.';
    }

    return {
      ...c,
      riskScore: score,
      riskLevel: level,
      delayRate,
      avgQuality,
      keySignal
    };
  });

  const filteredList = filter === 'ALL' 
    ? enrichedContractors 
    : enrichedContractors.filter(c => c.riskLevel === filter || (filter === 'DELAY' && c.delayRate >= 30));

  const columns = [
    { 
      header: 'Bidder / Contractor', 
      accessor: 'name',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 hover:text-blue-600 transition">{row.name}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.registration_number}</span>
        </div>
      )
    },
    { header: 'Category', accessor: 'category' },
    { header: 'State Jurisdiction', accessor: 'state' },
    { 
      header: 'Historical Delay Rate', 
      cell: (row) => (
        <span className={`font-bold text-xs ${row.delayRate >= 30 ? 'text-red-600' : 'text-emerald-700'}`}>
          {row.delayRate}% of works
        </span>
      ) 
    },
    { 
      header: 'Quality Rating', 
      cell: (row) => <span className="font-bold text-slate-800 text-xs">{row.avgQuality} ★ / 5.0</span> 
    },

    {
      header: 'Key Behavioral Signal',
      cell: (row) => <span className="text-xs text-slate-600 leading-snug">{row.keySignal}</span>
    },
    { 
      header: 'Actions', 
      cell: (row) => (
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            setSelectedContractorId(row.id);
            setIsModalOpen(true);
          }}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          Inspect Profile
        </button>
      )
    }
  ];

  if (loading) return <LoadingSpinner message="Evaluating bidder behavioral risk metrics..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚠️</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bidder Behavioral & Contractor Risk Intelligence</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            National directory ranking participating contractors across historical delay probability, quality consistency, and pricing behavior.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase">Filter Risk:</label>
          <select 
            className="p-2.5 border rounded-xl bg-white border-slate-300 text-xs font-bold focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Bidders</option>
            <option value="DELAY">Elevated Delay Rate (&gt;30%)</option>
            <option value="HIGH">High Priority Risk</option>
            <option value="MEDIUM">Medium Priority Risk</option>
            <option value="LOW">Low Risk (Compliant)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredList}
          onRowClick={(row) => {
            setSelectedContractorId(row.id);
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Bidder Detail Modal */}
      <BidderDetailModal
        contractorId={selectedContractorId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default RiskAnalysis;
