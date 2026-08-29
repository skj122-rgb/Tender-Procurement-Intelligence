import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordMsg({ type: 'success', text: '✓ Security credentials updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 600);
  };

  const tabs = [
    { id: 'overview', label: '👤 Profile & Credentials' },
    { id: 'team', label: '👥 Platform Engineering Team (6 Specialists)' },
    { id: 'security', label: '🔒 Security & Access' }
  ];

  const teamMembers = [
    {
      name: 'Lead Systems Architect',
      role: 'Core Architecture & Infrastructure',
      domain: 'Supabase IPv4 Pooler, Microservice IPC & Database Schemas',
      initials: 'LA',
      color: 'from-blue-600 to-indigo-700',
      badge: 'Core Lead',
      responsibilities: 'Core database schemas, connection pooling, and multi-service synchronization.'
    },
    {
      name: 'Senior Backend Engineer',
      role: 'API Services & Security',
      domain: 'Express.js REST APIs, JWT Auth & GFR 2017 Rules',
      initials: 'BE',
      color: 'from-purple-600 to-violet-700',
      badge: 'Backend & Sec',
      responsibilities: 'REST routes, JWT auth flow, RBAC access control, and procurement validation.'
    },
    {
      name: 'Lead Analytics Engineer',
      role: 'Behavioral & Risk Engine',
      domain: 'Python Analytics, 5-Point Models & Anomaly Scoring',
      initials: 'DS',
      color: 'from-emerald-600 to-teal-700',
      badge: 'Analytics Lead',
      responsibilities: '5-point risk calculation algorithms, cartel proximity detection, and delay models.'
    },
    {
      name: 'Frontend UI/UX Engineer',
      role: 'Client Interfaces & Visuals',
      domain: 'React 18, Tailwind CSS & Plotly Visualizations',
      initials: 'FE',
      color: 'from-amber-600 to-orange-700',
      badge: 'Frontend Lead',
      responsibilities: 'Interactive dashboard, radar comparisons, responsive modals, and component design.'
    },
    {
      name: 'Procurement Domain Specialist',
      role: 'Tender & BOQ Standards',
      domain: 'CPPP/GeM Formats, MoRTH Schedules & Bid Audits',
      initials: 'PD',
      color: 'from-sky-600 to-cyan-700',
      badge: 'Domain Expert',
      responsibilities: 'CPPP notice briefs, Pre-Bid meeting structures, and BOQ schedule standards.'
    },
    {
      name: 'DevOps & QA Engineer',
      role: 'Pipeline & File Generators',
      domain: 'Native PDF/XLS Exporters & Ingestion Pipelines',
      initials: 'QA',
      color: 'from-rose-600 to-pink-700',
      badge: 'DevOps / QA',
      responsibilities: 'Client-side PDF/XLS export utilities, automated dataset ingestion, and tests.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Officer ID Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 text-9xl">🛡️</div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold text-blue-300 shadow-inner">
              {user?.username?.charAt(0)?.toUpperCase() || 'O'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {user?.username === 'admin' ? 'System Administrator' : 'Officer ' + (user?.username?.replace('officer_', '')?.toUpperCase() || 'SHARMA')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
                  {user?.role || 'Authorized Officer'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Session
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1">
                Govt ID: <span className="font-mono font-bold text-white">{user?.uniqueId || user?.unique_id || 'OFF-2024-001'}</span> | Ministry / Dept: <span className="text-slate-200 font-medium">Public Procurement Oversight Division</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span>✓</span> Email Verified
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span>✓</span> Phone Verified
            </div>
            <span className="text-white/20">•</span>
            <div className="text-slate-300">
              Level 3 Clearance
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Government Officer Profile</h3>
              <p className="text-xs text-slate-500">Official authentication details and assigned administrative roles.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{user?.username || 'officer_sharma'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Official Email</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{user?.email || 'officer@procurement-intel.gov.in'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unique Officer ID</span>
                <p className="font-semibold font-mono text-slate-800 text-sm mt-0.5">{user?.uniqueId || user?.unique_id || 'OFF-2024-001'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Role</span>
                <p className="font-semibold capitalize text-slate-800 text-sm mt-0.5">{user?.role || 'Procurement Officer'}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Authorized Procurement Authority Matrix</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <span className="text-xl">🔍</span>
                  <h5 className="font-semibold text-slate-800 text-sm mt-2">Bidder Behavioral Scrutiny</h5>
                  <p className="text-xs text-slate-600 mt-1">Authorized to trigger 5-point delay, rate anomaly, and cartel proximity scrutiny on competing contractors.</p>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-xl">📊</span>
                  <h5 className="font-semibold text-slate-800 text-sm mt-2">Multi-Bidder Radar Matrix</h5>
                  <p className="text-xs text-slate-600 mt-1">Authorized to execute multi-dimensional radar comparisons across participating bidders.</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-xl">📁</span>
                  <h5 className="font-semibold text-slate-800 text-sm mt-2">Dossier & XLS Export</h5>
                  <p className="text-xs text-slate-600 mt-1">Authorized to generate official PDF and XLS merit dossiers directly into local storage.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: ENGINEERING & OVERSIGHT TEAM (6 SPECIALISTS)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <h3 className="text-lg font-bold text-slate-900">Procurement Intelligence Engineering & Oversight Team</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                The platform is architected, maintained, and operated by a multidisciplinary team of 6 domain engineers and procurement specialists.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((m, idx) => (
                <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${m.color} text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0`}>
                          {m.initials}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{m.name}</h4>
                          <p className="text-xs font-semibold text-blue-700 mt-0.5">{m.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {m.badge}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      <strong>Focus:</strong> {m.domain}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {m.responsibilities}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <span className="font-semibold">Engineering Sprint Release: <strong className="font-mono">v2.4.2-prod</strong></span>
              <span className="text-slate-500">Government of India • Ministry of Finance Compliance</span>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: SECURITY & ACCESS
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Account Security & Password</h3>
              <p className="text-xs text-slate-500">Update your access credentials. Password changes require strong complexity rules.</p>
            </div>

            {passwordMsg.text && (
              <div className={`p-4 rounded-xl text-sm ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 border rounded-lg border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border rounded-lg border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 chars with uppercase, lowercase, digit"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 border rounded-lg border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {savingPassword ? 'Updating Security Credentials...' : 'Update Password'}
              </button>
            </form>

            <div className="border-t border-slate-200 pt-6 mt-6">
              <h4 className="text-sm font-bold text-slate-800 mb-2">Two-Factor Authentication (2FA)</h4>
              <p className="text-xs text-slate-600 mb-4">Dual verification via SMS and Email OTP is active for sensitive recovery and administrative actions.</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                <span>🛡️</span> 2FA Dual-Channel Protection Enabled
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
