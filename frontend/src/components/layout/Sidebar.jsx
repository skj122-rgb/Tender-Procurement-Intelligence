import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Data Center', path: '/data-center', icon: '💾' },
    { name: 'Tenders Catalog', path: '/tenders', icon: '📄' },
    { name: 'Contractors Directory', path: '/contractors', icon: '🏢' },
    { name: 'Bidder Risk Analysis', path: '/risk-analysis', icon: '⚠️' },
    { name: 'Reports & Dossiers', path: '/reports', icon: '📈' },
    { name: 'My Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-0 flex flex-col border-r border-slate-800`}>
      <div className="flex items-center justify-between h-16 px-5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-lg shadow-sm">
            🛡️
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">Procurement Intel</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Govt of India Oversight</p>
          </div>
        </div>
        <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white p-1">
          ✕
        </button>
      </div>

      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-semibold text-slate-300">
            {user?.role === 'admin' ? 'Super Admin Mode' : 'Officer Access'}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="mr-3 text-base">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition mb-2"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center font-bold text-xs">
            {user?.username?.charAt(0)?.toUpperCase() || 'O'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.username || 'Officer Sharma'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.uniqueId || user?.unique_id || 'OFF-2024-001'}</p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-xl transition-colors"
        >
          <span className="mr-2.5 text-base">🚪</span>
          Sign Out
        </button>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 px-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>Oversight Team (6 Engg)</span>
          <span className="font-mono text-slate-400">v2.4.2</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
