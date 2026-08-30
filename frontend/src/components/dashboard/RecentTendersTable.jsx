import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';

const RecentTendersTable = ({ tenders }) => {
  const navigate = useNavigate();

  const columns = [
    { 
      header: 'Tender Reference', 
      cell: (row) => <span className="font-mono font-bold text-xs text-blue-700">{row.tender_id || row.id || 'TND-2024'}</span>
    },
    { 
      header: 'Project Title', 
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 leading-snug">{row.title}</span>
          <p className="text-[11px] text-slate-500 mt-0.5">{row.state ? `${row.state} • ${row.department}` : row.department}</p>
        </div>
      ) 
    },
    { 
      header: 'Department', 
      accessor: 'department',
      cell: (row) => <span className="text-xs font-medium text-slate-700">{row.department || 'Public Works'}</span>
    },
    { 
      header: 'Estimated Value', 
      cell: (row) => {
        const val = parseFloat(row.estimated_value || row.estimatedValue || 0);
        return <span className="font-bold text-slate-900">₹{val.toLocaleString('en-IN')}</span>;
      } 
    },
    { 
      header: 'Status', 
      cell: (row) => {
        const status = (row.tender_status || row.status || 'OPEN').toUpperCase();
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
            status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' :
            status === 'EVALUATION' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
          }`}>
            {status}
          </span>
        );
      }
    }
  ];

  return (
    <div className="mt-4">
      <DataTable 
        columns={columns} 
        data={tenders} 
        onRowClick={(row) => navigate(`/tenders/${row.id}`)} 
      />
    </div>
  );
};

export default RecentTendersTable;
