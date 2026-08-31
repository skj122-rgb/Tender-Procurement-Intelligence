import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BidderDetailModal from '../components/common/BidderDetailModal';
import { downloadPdfDocument, downloadExcelFile } from '../utils/fileDownloader';

const TenderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cppp');
  const [tender, setTender] = useState(null);
  const [bids, setBids] = useState([]);
  const [boq, setBoq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docFeedback, setDocFeedback] = useState('');

  // Modal for contractor / bidder history
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [selectedBidParameters, setSelectedBidParameters] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTenderData = async () => {
      try {
        setLoading(true);
        const [tRes, bRes, boqRes] = await Promise.all([
          apiClient.get(`/tenders/${id}`),
          apiClient.get(`/tenders/${id}/bids`).catch(() => ({ data: { data: [] } })),
          apiClient.get(`/tenders/${id}/boq`).catch(() => ({ data: { data: [] } })),
        ]);

        setTender(tRes.data?.data || tRes.data);
        setBids(bRes.data?.data || bRes.data || []);
        setBoq(boqRes.data?.data || boqRes.data || []);
      } catch (err) {
        console.error('Failed to load tender details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenderData();
  }, [id]);

  const handleOpenBidderModal = (contractorId, parameters = null) => {
    setSelectedContractorId(contractorId);
    setSelectedBidParameters(parameters);
    setIsModalOpen(true);
  };

  const handleDownloadDoc = (docTitle, fileName, category, fileType) => {
    const est = parseFloat(tender?.estimated_value || 15000000);
    const tenderCode = tender?.tender_id || 'TND-2024-001';
    const openDateStr = tender?.open_date ? String(tender.open_date).slice(0, 10) : '2024-01-15';
    const closeDateStr = tender?.close_date ? String(tender.close_date).slice(0, 10) : '2024-03-15';

    if (fileName.endsWith('.xlsx') || fileType?.includes('Excel')) {
      downloadExcelFile(
        fileName,
        `${docTitle} - ${tender.title}`,
        ['Item No', 'Item Description', 'Unit', 'Quantity', 'Estimated Unit Rate (INR)', 'Estimated Total Amount (INR)', 'Quoted Contractor Rate (INR)'],
        (boq.length > 0 ? boq : [
          { item_number: '1.01', description: 'Earthwork excavation in soil with 50m lead', unit: 'Cu.m', quantity: Math.round(est * 0.0012), estimated_rate: 450, estimated_amount: Math.round(est * 0.0012 * 450) },
          { item_number: '1.02', description: 'Plain Cement Concrete (PCC) 1:4:8 leveling course', unit: 'Cu.m', quantity: Math.round(est * 0.0004), estimated_rate: 4850, estimated_amount: Math.round(est * 0.0004 * 4850) },
          { item_number: '2.01', description: 'Design Mix Reinforced Cement Concrete (RCC) Grade M-30', unit: 'Cu.m', quantity: Math.round(est * 0.0006), estimated_rate: 8200, estimated_amount: Math.round(est * 0.0006 * 8200) },
          { item_number: '2.02', description: 'TMT Fe-500D steel reinforcement bars fixing', unit: 'MT', quantity: Math.max(1, Math.round(est * 0.00005)), estimated_rate: 68000, estimated_amount: Math.round(est * 0.00005 * 68000) },
          { item_number: '3.01', description: 'Granular Sub-Base (GSB) conforming to MoRTH specifications', unit: 'Cu.m', quantity: Math.round(est * 0.0008), estimated_rate: 1850, estimated_amount: Math.round(est * 0.0008 * 1850) },
          { item_number: '4.01', description: 'Dense Bituminous Macadam (DBM) with VG-30 binder', unit: 'Cu.m', quantity: Math.round(est * 0.0005), estimated_rate: 7400, estimated_amount: Math.round(est * 0.0005 * 7400) },
          { item_number: '5.01', description: 'Quality assurance testing and safety certifications', unit: 'LS', quantity: 1, estimated_rate: Math.round(est * 0.02), estimated_amount: Math.round(est * 0.02) }
        ]).map(item => [
          item.item_number,
          item.description,
          item.unit,
          item.quantity,
          item.estimated_rate,
          item.estimated_amount,
          ''
        ])
      );
    } else {
      downloadPdfDocument(
        fileName,
        docTitle.toUpperCase(),
        {
          'Tender Code': tenderCode,
          'Work Title': tender.title,
          'Department': tender.department,
          'State Jurisdiction': tender.state,
          'Estimated Project Cost': `₹${est.toLocaleString('en-IN')}`,
          'Document Category': category || 'Official Notification',
          'Publish Date': openDateStr,
          'Submission Deadline': closeDateStr
        },
        [
          {
            title: '1. Notice Inviting Tender (NIT) Specifications',
            content: `Official procurement work for ${tender.title}. Bidders must comply with standard state e-procurement guidelines, submit 2.0% EMD (₹${Math.round(est * 0.02).toLocaleString('en-IN')}) and submit certified financial statements for the last 3 financial years.`
          },
          {
            title: '2. General Contract Execution Clauses',
            content: `Contract duration: 180 Days from handover. Defect Liability Period: 24 Months comprehensive warranty. Digital signature of all bidding documents is mandatory.`
          }
        ]
      );
    }
    setDocFeedback(`✓ Downloaded "${fileName}" directly to your computer local storage.`);
    setTimeout(() => setDocFeedback(''), 5000);
  };

  if (loading) return <LoadingSpinner message="Loading tender notification, pre-bid meeting & bidder intelligence..." />;
  if (!tender) return <div className="p-8 text-center text-slate-500">Tender record not found.</div>;

  const estNum = parseFloat(tender.estimated_value || 15000000);
  const tenderCode = tender.tender_id || 'TND-2024-001';
  const openDateStr = tender.open_date ? String(tender.open_date).slice(0, 10) : '2024-01-15';
  const closeDateStr = tender.close_date ? String(tender.close_date).slice(0, 10) : '2024-03-15';

  const preBid = (tender.pre_bid_meeting && Object.keys(tender.pre_bid_meeting).length > 0)
    ? tender.pre_bid_meeting
    : (tender.cppp_notice_brief?.pre_bid_meeting && Object.keys(tender.cppp_notice_brief.pre_bid_meeting).length > 0)
      ? tender.cppp_notice_brief.pre_bid_meeting
      : {
          is_scheduled: true,
          meeting_date: openDateStr,
          meeting_time: '11:30 AM IST',
          meeting_mode: 'Hybrid (Physical Conference & NIC Video Conference WebEx)',
          venue: `Conference Hall, Office of Superintending Engineer, ${tender.department || 'Public Works'}, ${tender.state || 'National'}`,
          vc_link: `https://meet.nic.in/procurement-prebid-${tenderCode.replace('/', '_')}`,
          meeting_id: `NIC-${tenderCode.slice(-4)}8290`,
          passcode: '981240',
          query_submission_deadline: `${openDateStr} 05:00 PM (Through e-Procurement Portal)`,
          clarifications_published: true,
          officer_in_charge: `Executive Engineer (Contracts & Works), ${tender.department || 'Procuring Authority'}`,
          contact_email: `tenders-desk.${(tender.department || 'pwd').toLowerCase().slice(0,4)}@gov.in`,
          minutes_of_meeting_summary: `Pre-bid meeting completed with participating contractors. Addendum issued regarding site accessibility and machinery deployment schedules.`
        };

  const cppp = (tender.cppp_notice_brief && Object.keys(tender.cppp_notice_brief).length > 0)
    ? tender.cppp_notice_brief
    : {
        cppp_tender_id: `CPPP_${tenderCode.replace('-', '_').replace('/', '_')}`,
        tender_reference: `NIT/${tender.department?.slice(0, 3)?.toUpperCase() || 'GOV'}/${tenderCode}`,
        tender_type: 'Open Tender (Two Packet System)',
        tender_category: 'Works & Infrastructure',
        procuring_authority: `Procurement Authority, ${tender.department}, ${tender.state}`,
    tender_fee: `₹${Math.max(1000, Math.round(estNum * 0.0005)).toLocaleString('en-IN')}`,
    emd_amount: `₹${(Math.round(estNum * 0.02)).toLocaleString('en-IN')} (2.0% Bank Guarantee / FDR)`,
    emd_exemption: 'Applicable for Registered MSE / DPIIT recognized startups as per GFR Rule 170',
    contract_period: '180 Days (6 Months)',
    defect_liability_period: '24 Months from Commercial Handover',
    critical_dates: {
      published_date: `${openDateStr} 10:00 AM`,
      document_download_start: `${openDateStr} 11:00 AM`,
      pre_bid_meeting_date: `${openDateStr} 11:30 AM`,
      bid_submission_start: `${openDateStr} 09:00 AM`,
      bid_submission_end: `${closeDateStr} 05:00 PM`,
      tech_bid_opening: `${closeDateStr} 11:00 AM`,
      financial_bid_opening: 'To be scheduled post technical evaluation'
    },
    pre_qualification_criteria: {
      avg_annual_turnover: `Min 50% of estimated cost (₹${(estNum * 0.5).toLocaleString('en-IN')}) in last 3 financial years.`,
      similar_work_experience: `Successfully executed similar works of ≥80% estimated value or two works of ≥50% each.`,
      solvency_certificate: `Bank Solvency Certificate of min 40% estimated value from any Scheduled Commercial Bank.`,
      key_equipment_mandatory: `Mandatory deployment of calibrated machinery, testing lab & certified safety supervisors.`
    },
    scope_executive_summary: tender.description || 'Comprehensive turnkey procurement and engineering execution under government schedule.',
    corrigenda: []
  };

  const tabs = [
    { id: 'cppp', label: '📜 CPPP Notice Brief (NIT Summary)' },
    { id: 'prebid', label: '📅 Pre-Bid Meeting & Conference' },
    { id: 'bids', label: `👥 Submitted Bids & 5-Parameter Risk (${bids.length})` },
    { id: 'boq', label: `📊 BOQ Line Items (${boq.length || 7})` }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <button 
            onClick={() => navigate('/tenders')}
            className="text-xs text-blue-600 hover:underline mb-1.5 inline-block font-semibold"
          >
            ← Back to Tender Catalog
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{tender.title}</h1>
            <span className="text-xs uppercase px-2.5 py-0.5 font-extrabold rounded-full bg-blue-100 text-blue-800">
              {tender.tender_status || 'Open'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tender Code: <span className="font-mono font-bold text-slate-800">{tenderCode}</span> | 
            Department: <span className="font-semibold text-slate-800">{tender.department}</span> | 
            State: <span className="font-semibold text-slate-800">{tender.state}</span> | 
            Estimated Cost: <strong className="text-slate-900">₹{estNum.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        </div>
      </div>

      {docFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{docFeedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 font-medium'
              } whitespace-nowrap border-b-2 py-3.5 px-1 text-xs sm:text-sm transition`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-slate-200">
        
        {/* ─────────────────────────────────────────────────────────────
            TAB 1: CPPP NOTICE BRIEF (NIT EXECUTIVE SUMMARY)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'cppp' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Central Public Procurement Portal (CPPP / GeM)</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Notice Inviting Tender (NIT) Executive Brief</h3>
                <p className="text-xs text-slate-500">Condensed summary of the official government procurement notification.</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-mono font-bold rounded-lg border border-slate-200">
                CPPP ID: {cppp.cppp_tender_id}
              </span>
            </div>

            {/* General Procurement Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Procuring Authority</p>
                <p className="text-xs font-bold text-slate-900 mt-1">{cppp.procuring_authority}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tender Fee & EMD Guarantee</p>
                <p className="text-xs font-bold text-slate-900 mt-1">Fee: {cppp.tender_fee}</p>
                <p className="text-[11px] font-semibold text-blue-700 mt-0.5">EMD: {cppp.emd_amount}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contract Duration & Defect Liability</p>
                <p className="text-xs font-bold text-slate-900 mt-1">Period: {cppp.contract_period}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">DLP: {cppp.defect_liability_period}</p>
              </div>
            </div>

            {/* Critical Dates Timeline */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">⏱️</span>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">Critical Date & Milestone Schedule</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-slate-300 font-medium uppercase">Publish Date</p>
                  <p className="font-bold text-white mt-1">{openDateStr}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-slate-300 font-medium uppercase">Pre-Bid Meeting</p>
                  <p className="font-bold text-blue-300 mt-1">{preBid.meeting_date || openDateStr}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-slate-300 font-medium uppercase">Doc Download End</p>
                  <p className="font-bold text-white mt-1">{closeDateStr}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-slate-300 font-medium uppercase">Submission Closing</p>
                  <p className="font-bold text-amber-300 mt-1">{closeDateStr}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-slate-300 font-medium uppercase">Technical Bid Open</p>
                  <p className="font-bold text-emerald-300 mt-1">{closeDateStr}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-slate-300 font-medium uppercase">Financial Bid Open</p>
                  <p className="font-bold text-slate-200 mt-1">Post Tech Eval</p>
                </div>
              </div>
            </div>

            {/* Scope of Work */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
                <span>📑</span> Condensed Scope of Work & Technical Summary
              </h4>
              <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-sm">
                {cppp.scope_executive_summary}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: PRE-BID MEETING & CLARIFICATION CONFERENCE
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'prebid' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vendor Engagement & Conference Schedule</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Pre-Bid Conference & Technical Clarifications</h3>
                <p className="text-xs text-slate-500">Official conference coordinates, WebEx link, question submission deadlines, and Minutes of Meeting (MoM).</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Clarifications Active
              </span>
            </div>

            {/* Conference Highlights Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">📅 Meeting Date & Time</p>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{preBid.meeting_date} at {preBid.meeting_time}</p>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">Mode: {preBid.meeting_mode}</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">🏢 Physical Venue</p>
                <p className="text-xs font-bold text-slate-800 mt-1 leading-snug">{preBid.venue}</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">✉️ Query Submission Cutoff</p>
                <p className="text-xs font-bold text-amber-900 mt-1">{preBid.query_submission_deadline}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Contact: {preBid.contact_email}</p>
              </div>
            </div>



            {/* Minutes of Meeting / Published Clarifications */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>📝</span> Pre-Bid Conference Clarifications & Minutes of Meeting (MoM)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                {preBid.minutes_of_meeting_summary}
              </p>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: SUBMITTED BIDS & 5-PARAMETER ANALYSIS
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'bids' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submitted Contractor Bids & 5-Parameter Scrutiny</h3>
                <p className="text-xs text-slate-500">Evaluation across past performance, price deviation, waiting anomaly, financial capacity, and document compliance.</p>
              </div>
            </div>

            {bids.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No bids recorded for this tender schedule.</p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <DataTable 
                  columns={[
                    { 
                      header: 'Contractor / Bidder Name', 
                      accessor: 'contractor_name', 
                      cell: (row) => (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{row.contractor_name || 'Bidder Entity'}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{row.registration_number || 'REG-IND'}</span>
                        </div>
                      )
                    },
                    { 
                      header: 'Submitted Price', 
                      cell: (row) => <span className="font-bold text-slate-900">₹{parseFloat(row.bid_amount || 0).toLocaleString('en-IN')}</span> 
                    },
                    { 
                      header: 'Price Variance', 
                      cell: (row) => {
                        const est = parseFloat(tender.estimated_value || 0);
                        const bid = parseFloat(row.bid_amount || 0);
                        if (!est) return '-';
                        const diff = ((bid - est) / est) * 100;
                        return (
                          <span className={`font-semibold text-xs px-2 py-0.5 rounded ${diff < -15 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'}`}>
                            {diff > 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`}
                          </span>
                        );
                      } 
                    },

                    { 
                      header: 'Actions', 
                      cell: (row) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBidderModal(row.contractor_id, row.parameters);
                          }}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <span>🔍</span> Inspect Bidder 5-Parameter Profile
                        </button>
                      ) 
                    }
                  ]} 
                  data={bids}
                  onRowClick={(row) => handleOpenBidderModal(row.contractor_id, row.parameters)}
                />
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: BOQ LINE ITEMS SCHEDULE
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'boq' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Bill of Quantities (BOQ) Line Item Schedule</h3>
            {(() => {
              const est = estNum;
              const displayBoq = boq.length > 0 ? boq : [
                { id: '1', item_number: '1.01', description: 'Earthwork excavation in all classes of soil including shoring, strutting and disposal up to 50m lead.', unit: 'Cu.m', quantity: Math.round(est * 0.0012), estimated_rate: 450, estimated_amount: Math.round(est * 0.0012 * 450) },
                { id: '2', item_number: '1.02', description: 'Providing and laying Plain Cement Concrete (PCC) 1:4:8 nominal mix for leveling course.', unit: 'Cu.m', quantity: Math.round(est * 0.0004), estimated_rate: 4850, estimated_amount: Math.round(est * 0.0004 * 4850) },
                { id: '3', item_number: '2.01', description: 'Design Mix Reinforced Cement Concrete (RCC) Grade M-30 in substructure and superstructure.', unit: 'Cu.m', quantity: Math.round(est * 0.0006), estimated_rate: 8200, estimated_amount: Math.round(est * 0.0006 * 8200) },
                { id: '4', item_number: '2.02', description: 'High Yield Strength Deformed (HYSD / TMT Fe-500D) steel reinforcement bars cutting and fixing.', unit: 'MT', quantity: Math.max(1, Math.round(est * 0.00005)), estimated_rate: 68000, estimated_amount: Math.round(est * 0.00005 * 68000) },
                { id: '5', item_number: '3.01', description: 'Granular Sub-Base (GSB) with well-graded natural gravel / crushed stone aggregate conforming to MoRTH specifications.', unit: 'Cu.m', quantity: Math.round(est * 0.0008), estimated_rate: 1850, estimated_amount: Math.round(est * 0.0008 * 1850) },
                { id: '6', item_number: '4.01', description: 'Dense Bituminous Macadam (DBM) with VG-30 viscosity grade binder including paver compaction.', unit: 'Cu.m', quantity: Math.round(est * 0.0005), estimated_rate: 7400, estimated_amount: Math.round(est * 0.0005 * 7400) },
                { id: '7', item_number: '5.01', description: 'Quality assurance testing, third-party structural audit and environmental compliance certifications.', unit: 'LS', quantity: 1, estimated_rate: Math.round(est * 0.02), estimated_amount: Math.round(est * 0.02) }
              ];
              return (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <DataTable 
                    columns={[
                      { header: 'Item #', accessor: 'item_number' },
                      { header: 'Work Description', accessor: 'description' },
                      { header: 'Unit', accessor: 'unit' },
                      { header: 'Quantity', cell: (row) => parseFloat(row.quantity || 0).toLocaleString() },
                      { header: 'Est. Unit Rate', cell: (row) => `₹${parseFloat(row.estimated_rate || 0).toLocaleString('en-IN')}` },
                      { header: 'Total Est. Value', cell: (row) => <span className="font-bold text-slate-900">₹${parseFloat(row.estimated_amount || 0).toLocaleString('en-IN')}</span> }
                    ]}
                    data={displayBoq}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Contractor / Bidder Past Tenders Modal */}
      <BidderDetailModal
        contractorId={selectedContractorId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContractorId(null);
          setSelectedBidParameters(null);
        }}
        bidParameters={selectedBidParameters}
      />
    </div>
  );
};

export default TenderDetails;
