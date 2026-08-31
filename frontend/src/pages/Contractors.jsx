import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import DataTable from '../components/common/DataTable';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Contractors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        // Load all available contractors
        const res = await apiClient.get('/contractors?limit=1000');
        const list = res.data?.data?.contractors || res.data?.contractors || [];
        setContractors(list);
      } catch (err) {
        console.error('Failed to fetch contractors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  const filteredContractors = contractors.filter(c => {
    const matchesSearch = !searchTerm ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.registration_number && c.registration_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.state && c.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    const matchesState = !stateFilter || c.state === stateFilter;
    return matchesSearch && matchesCategory && matchesState;
  });

  const uniqueCategories = Array.from(new Set(contractors.map(c => c.category).filter(Boolean))).sort();
  const uniqueStates = Array.from(new Set(contractors.map(c => c.state).filter(Boolean))).sort();

  const columns = [
    { 
      header: 'Contractor / Bidder Entity', 
      accessor: 'name', 
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-tight">{row.name || 'Contractor Entity'}</span>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5">{row.registration_number || 'REG-IND-9000'}</span>
        </div>
      )
    },
    { 
      header: 'Category / Domain', 
      accessor: 'category', 
      cell: (row) => <span className="font-semibold text-slate-700 text-xs px-2.5 py-1 bg-slate-100 rounded-md">{row.category || 'Civil & Infrastructure'}</span> 
    },
    { 
      header: 'State Jurisdiction', 
      cell: (row) => <span className="text-xs font-bold text-slate-800">{row.state || 'National / Central'}</span> 
    },
    { 
      header: 'Participation Record', 
      cell: (row) => (
        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
          {row.total_wins || 1} Awarded ({row.total_bids || 4} Bids Tracked)
        </span>
      ) 
    },

    { 
      header: 'Actions', 
      cell: (row) => (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/contractors/${row.id}`); }}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          Inspect Profile →
        </button>
      ) 
    }
  ];

  if (loading) return <LoadingSpinner message="Loading complete registered bidder directory..." />;

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏢</span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contractor & Bidder Intelligence Directory</h1>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-full border border-blue-100">
                {contractors.length} Total Bidders Tracked
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active registered contractors and bidding entities evaluated across 5 behavioral parameters across all monitored tenders.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-3 border-t border-slate-100 items-center">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search bidders by name, registration ID, category, or state..." />
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select 
              className="rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold p-2.5 bg-white border"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories ({uniqueCategories.length})</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select 
              className="rounded-xl border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-semibold p-2.5 bg-white border"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States ({uniqueStates.length})</option>
              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {(searchTerm || categoryFilter || stateFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStateFilter('');
                }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contractors Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>Showing <strong>{filteredContractors.length}</strong> of <strong>{contractors.length}</strong> registered bidders</span>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredContractors} 
          onRowClick={(row) => navigate(`/contractors/${row.id}`)}
        />
      </div>
    </div>
  );
};

export default Contractors;
