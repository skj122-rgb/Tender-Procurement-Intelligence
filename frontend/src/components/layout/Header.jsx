import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'National Intelligence Dashboard';
    if (path.startsWith('/data-center')) return 'Data Center & Model Ingestion';
    if (path.startsWith('/tenders')) return 'Tenders & Procurement Catalog';
    if (path.startsWith('/contractors')) return 'Contractor Profiles & Performance';
    if (path.startsWith('/risk-analysis')) return 'Tender Risk & Anomaly Center';
    if (path.startsWith('/reports')) return 'Official Intelligence Dossiers';
    if (path.startsWith('/compare-bidders')) return 'Bidder Evaluation Matrix';
    if (path.startsWith('/profile')) return 'Officer Credentials & Security Profile';
    return 'Government Procurement Intelligence';
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 sticky top-0">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 text-slate-500 hover:text-slate-800 focus:outline-none md:hidden p-1.5 rounded-lg hover:bg-slate-100"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Real-Time Pulse Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Risk Engine Live</span>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative group">
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.username?.charAt(0)?.toUpperCase() || 'O'}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-slate-900 leading-tight">{user?.username || 'Officer Sharma'}</p>
              <p className="text-slate-500 font-medium capitalize mt-0.5">{user?.role || 'Officer'}</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 hidden group-hover:block border border-slate-200 divide-y divide-slate-100 z-50">
            <div className="px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-900">{user?.username || 'Officer'}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || 'officer@procurement.gov.in'}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
              >
                <span>👤</span> My Profile & Credentials
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
              >
                <span>📄</span> Export Reports
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
