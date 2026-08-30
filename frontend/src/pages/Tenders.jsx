import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import DataTable from '../components/common/DataTable';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Tenders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState('');
  const [limit, setLimit] = useState(500);
  const navigate = useNavigate();

  const fetchTenders = async () => {
    try {
      setLoading(true);
      // Fetch with limit to load all available tenders
      const res = await apiClient.get(`/tenders?limit=${limit}`);
      const list = res.data?.data?.tenders || res.data?.tenders || [];
      setTenders(list);
    } catch (err) {
      console.error('Failed to fetch tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, [limit]);

  const [deletingTenderId, setDeletingTenderId] = useState(null);

  const handleDeleteTender = async (e, tenderId, tenderTitle) => {
    if (e && e.stopPropagation) e.stopPropagation();

    try {
      setDeletingTenderId(tenderId);
      setActionFeedback('');
      // Optimistically remove from state immediately
      setTenders(prev => prev.filter(t => t.id !== tenderId && t.tender_id !== tenderId));
      await apiClient.delete(`/tenders/${encodeURIComponent(tenderId)}`);
      setActionFeedback(`✓ Tender "${tenderTitle}" successfully removed from the catalog.`);
      const res = await apiClient.get(`/tenders?limit=${limit}`);
      if (res.data?.data?.tenders) {
        setTenders(res.data.data.tenders);
      }
    } catch (err) {
      setActionFeedback('Delete error: ' + (err.response?.data?.message || err.message));
      await fetchTenders();
    } finally {
      setDeletingTenderId(null);
    }
  };

  const filteredTenders = tenders.filter(t => {
    const matchesSearch = !searchTerm || 
      (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.tender_id && t.tender_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.state && t.state.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDept = !departmentFilter || t.department === departmentFilter;
    const matchesState = !stateFilter || t.state === stateFilter;
    const matchesStatus = !statusFilter || (t.tender_status && t.tender_status.toLowerCase() === statusFilter.toLowerCase());
    
    return matchesSearch && matchesDept && matchesState && matchesStatus;
  });

  const uniqueDepts = Array.from(new Set(tenders.map(t => t.department).filter(Boolean))).sort();
  const uniqueStates = Array.from(new Set(tenders.map(t => t.state).filter(Boolean))).sort();

  const totalCount = tenders.length;
  const openCount = tenders.filter(t => (t.tender_status || 'open').toLowerCase() === 'open').length;
  const evalCount = tenders.filter(t => (t.tender_status || '').toLowerCase() === 'evaluation').length;
  const awardedCount = tenders.filter(t => (t.tender_status || '').toLowerCase() === 'awarded').length;
  const closedCount = tenders.filter(t => (t.tender_status || '').toLowerCase() === 'closed').length;

  const columns = [
    { 
      header: 'Tender ID / Ref', 
      accessor: 'tender_id',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-blue-700">{row.tender_id || 'TND-2024'}</span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.id?.slice(0, 14)}...</p>
        </div>
      )
    },
    { 
      header: 'Project Title & Scope', 
      accessor: 'title', 
      cell: (row) => (
        <div className="max-w-md">
          <p className="font-semibold text-slate-900 leading-snug">{row.title}</p>
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{row.description || 'Public works infrastructure schedule.'}</p>
        </div>
      ) 
    },
    { 
      header: 'Department', 
      accessor: 'department',
      cell: (row) => <span className="text-xs font-semibold text-slate-700">{row.department}</span>
    },
    { 
      header: 'State / Region', 
      cell: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.state || 'National'}</span>
          {row.district && <p className="text-[10px] text-slate-500">{row.district}</p>}
        </div>
      )
    },
    { 
      header: 'Estimated Value', 
      cell: (row) => {
        const val = parseFloat(row.estimated_value || row.estimatedValue || 0);
        return <span className="font-bold text-slate-900">₹{val.toLocaleString('en-IN')}</span>;
      } 
    },
    { 
      header: 'Procurement Status', 
      cell: (row) => {
        const status = (row.tender_status || row.status || 'OPEN').toUpperCase();
        return (
          <span className={`text-[11px] uppercase px-2.5 py-1 font-extrabold rounded-full ${
            status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
            status === 'EVALUATION' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            status === 'AWARDED' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
            'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            {status}
          </span>
        );
      } 
    },
    { 
      header: 'Actions', 
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/tenders/${row.id}`); }}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            View Details →
          </button>
          <button 
            onClick={(e) => handleDeleteTender(e, row.id, row.title)}
            disabled={deletingTenderId === row.id}
            className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
            title="Delete tender"
          >
            {deletingTenderId === row.id ? '⏳' : '🗑️'}
          </button>
        </div>
      )
    }
  ];

  if (loading && tenders.length === 0) return <LoadingSpinner message="Loading complete national monitored tender catalog..." />;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Counts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📋</span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">National Monitored Tender Catalog</h1>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-full border border-blue-100">
                {totalCount} Total Available Tenders
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live repository of central, state, and GeM procurement tenders currently tracked by the intelligence platform.
            </p>
          </div>

          {/* Quick status pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                statusFilter === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                statusFilter === 'open' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter('evaluation')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                statusFilter === 'evaluation' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              Evaluation ({evalCount})
            </button>
            <button
              onClick={() => setStatusFilter('awarded')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                statusFilter === 'awarded' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              Awarded ({awardedCount})
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                statusFilter === 'closed' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold ${actionFeedback.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {actionFeedback}
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-3 border-t border-slate-100 items-center">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by ID, project title, department, or state..." />
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select 
              className="rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold p-2.5 bg-white border"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments ({uniqueDepts.length})</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
              className="rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold p-2.5 bg-white border"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States ({uniqueStates.length})</option>
              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {(searchTerm || departmentFilter || stateFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDepartmentFilter('');
                  setStateFilter('');
                  setStatusFilter('');
                }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>Showing <strong>{filteredTenders.length}</strong> of <strong>{totalCount}</strong> available government tenders</span>
          {filteredTenders.length === 0 && <span className="text-red-500 font-semibold">No matching tenders found. Try clearing filters.</span>}
        </div>

        <DataTable 
          columns={columns} 
          data={filteredTenders} 
          onRowClick={(row) => navigate(`/tenders/${row.id}`)} 
        />
      </div>
    </div>
  );
};

export default Tenders;
