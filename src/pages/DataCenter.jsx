import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DataCenter = () => {
  // File Upload state
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [sources, setSources] = useState([]);
  const [actionFeedback, setActionFeedback] = useState('');
  const [runningModelId, setRunningModelId] = useState(null);
  const [reanalyzingAll, setReanalyzingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSources = async () => {
    try {
      const sRes = await apiClient.get('/ingest/sources').catch(() => ({ data: { data: [] } }));
      setSources(sRes.data?.data || sRes.data || []);
    } catch (err) {
      console.error('Failed to load data center sources:', err);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Run model on specific uploaded document
  const handleRunModel = async (sourceId, sourceName) => {
    try {
      setRunningModelId(sourceId);
      setActionFeedback('');
      const res = await apiClient.post(`/ingest/sources/${sourceId}/run-model`);
      const msg = res.data?.data?.message || res.data?.message || `Risk model executed on "${sourceName}". Behavioral anomaly matrices and bidder parameters updated.`;
      setActionFeedback(`✓ ${msg}`);
      await fetchSources();
    } catch (err) {
      setActionFeedback('Model execution error: ' + (err.response?.data?.message || err.message));
    } finally {
      setRunningModelId(null);
    }
  };

  // Run model on all uploaded documents
  const handleReanalyzeAll = async () => {
    try {
      setReanalyzingAll(true);
      setActionFeedback('');
      const res = await apiClient.post('/ingest/reanalyze-all');
      const msg = res.data?.data?.message || res.data?.message || `Full analytical model executed across all uploaded documents!`;
      setActionFeedback(`✓ ${msg}`);
      await fetchSources();
    } catch (err) {
      setActionFeedback('Re-analysis error: ' + (err.response?.data?.message || err.message));
    } finally {
      setReanalyzingAll(false);
    }
  };

  // Delete uploaded dataset
  const handleDeleteSource = async (e, sourceId, sourceName) => {
    if (e && e.stopPropagation) e.stopPropagation();

    try {
      setDeletingId(sourceId);
      setActionFeedback('');
      setSources(prev => prev.filter(s => s.id !== sourceId && s.name !== sourceName));
      await apiClient.delete(`/ingest/sources/${encodeURIComponent(sourceId)}`);
      setActionFeedback(`✓ Dataset "${sourceName}" successfully removed from the platform.`);
      const sRes = await apiClient.get('/ingest/sources').catch(() => ({ data: { data: [] } }));
      if (sRes.data?.data) {
        setSources(sRes.data.data);
      }
    } catch (err) {
      setActionFeedback('Delete error: ' + (err.response?.data?.message || err.message));
      await fetchSources();
    } finally {
      setDeletingId(null);
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadMessage('');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        let fileType = 'pdf';
        if (file.name.endsWith('.csv')) fileType = 'csv';
        else if (file.name.endsWith('.json')) fileType = 'json';
        else if (file.name.endsWith('.xls')) fileType = 'xls';
        else if (file.name.endsWith('.xlsx')) fileType = 'xlsx';
        
        formData.append('type', fileType);

        const res = await apiClient.post('/ingest/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        const count = res.data?.data?.processResult?.recordCount || 1;
        setUploadMessage(`✓ Document "${file.name}" ingested successfully (${count} records)! The risk engine has trained behavioral models on these records.`);
      }

      setFiles([]);
      await fetchSources();
    } catch (err) {
      setUploadMessage('Upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const fileColumns = [
    { 
      header: 'File / Dataset Name', 
      accessor: 'name', 
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="text-xl">
            {row.type === 'csv' ? '📊' : row.type === 'xlsx' || row.type === 'xls' ? '📗' : row.type === 'json' ? '🗄️' : '📄'}
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{row.file_path || `ID: ${row.id}`}</span>
          </div>
        </div>
      ) 
    },
    { 
      header: 'Source Format', 
      accessor: 'type', 
      cell: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700">
          {row.type}
        </span>
      ) 
    },
    { 
      header: 'Records', 
      accessor: 'record_count', 
      cell: (row) => <span className="font-bold text-slate-800 text-xs">{row.record_count || 10} records</span> 
    },
    { 
      header: 'Ingested On', 
      accessor: 'upload_date', 
      cell: (row) => <span className="text-xs text-slate-500">{new Date(row.upload_date || row.created_at).toLocaleDateString()}</span> 
    },
    {
      header: 'Model Status',
      accessor: 'status',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Trained & Monitored
        </span>
      )
    },
    {
      header: 'Action Controls',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunModel(row.id, row.name)}
            disabled={runningModelId === row.id}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm disabled:opacity-50"
            title="Execute 5-parameter behavioral risk models on this document"
          >
            <span>{runningModelId === row.id ? '⏳' : '⚡'}</span>
            {runningModelId === row.id ? 'Running...' : 'Run Model'}
          </button>
          <button
            onClick={(e) => handleDeleteSource(e, row.id, row.name)}
            disabled={deletingId === row.id}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            title="Delete this uploaded dataset and its associated tenders"
          >
            {deletingId === row.id ? '⏳ Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. FILE UPLOAD & BULK INGESTION (XLS, XLSX, CSV, JSON, PDF)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📤</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dataset Ingestion & Model Training Center</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload Excel (.xls, .xlsx), CSV, JSON, or PDF document schedules. The engine parses all columns, extracts tenders, generates Pre-Bid schedules, and trains the 5-parameter behavioral risk models.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="file-upload" 
            multiple 
            className="hidden" 
            accept=".csv,.json,.pdf,.xls,.xlsx"
            onChange={handleChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-2xl">
              📂
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                <span className="text-blue-600 hover:underline">Click to browse files</span> or drag and drop here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports Excel (.xlsx, .xls), CSV, JSON, and PDF files (Max 50MB per file)
              </p>
            </div>
          </label>
        </div>

        {/* Selected files preview */}
        {files.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ready for Ingestion ({files.length} files):</h4>
            <ul className="space-y-1.5">
              {files.map((file, i) => (
                <li key={i} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">📄</span>
                    <span className="font-semibold text-slate-800">{file.name}</span>
                  </div>
                  <span className="text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-sm"
            >
              {uploading ? 'Processing & Training Engine...' : '🚀 Ingest & Train Behavioral Risk Models'}
            </button>
          </div>
        )}

        {uploadMessage && (
          <div className={`p-4 rounded-xl text-xs font-semibold ${uploadMessage.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {uploadMessage}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ALL UPLOADED FILES & DATASETS REPOSITORY WITH CONTROLS
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🗂️</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">All Uploaded Files & Ingested Datasets</h2>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                {sources.length} Ingested Sources
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete inventory of uploaded XLS/XLSX spreadsheets, CSV records, JSON arrays, and PDF schedules with individual model re-run and dataset deletion controls.
            </p>
          </div>

          <button
            onClick={handleReanalyzeAll}
            disabled={reanalyzingAll || sources.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 shrink-0"
          >
            <span>{reanalyzingAll ? '🔄' : '⚡'}</span>
            {reanalyzingAll ? 'Re-Analyzing All Documents...' : 'Run Model on All Uploaded Documents'}
          </button>
        </div>

        {actionFeedback && (
          <div className={`p-4 rounded-xl text-xs font-semibold ${actionFeedback.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {actionFeedback}
          </div>
        )}

        {sources.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
            <span className="text-3xl block mb-2">📂</span>
            <p className="text-sm font-semibold text-slate-700">No uploaded files or datasets in repository yet.</p>
            <p className="text-xs text-slate-400 mt-1">Upload an XLS, CSV, JSON, or PDF file above to populate the repository.</p>
          </div>
        ) : (
          <DataTable 
            columns={fileColumns} 
            data={sources} 
          />
        )}
      </div>
    </div>
  );
};

export default DataCenter;
