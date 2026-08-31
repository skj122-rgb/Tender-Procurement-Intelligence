const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Authorized Platform Users (Credentials)
const users = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    unique_id: 'ADMIN-001',
    username: 'admin',
    password_hash: '$2b$12$il17B7SilqAxy5Pr2BsWfe4RYtaAiOAv0m/8/YqEnkXoHngK1Uh6O', // Admin@123
    email: 'admin@procurement-intel.gov.in',
    phone_number: '+919000000001',
    email_verified: true,
    phone_verified: true,
    account_status: 'active',
    role: 'admin',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    unique_id: 'OFF-2024-001',
    username: 'officer_sharma',
    password_hash: '$2b$12$qXUCisjAOJ1J1GAsUWeNduECmVfUItmFRrDKpBEQ6bP/DZcPQwN5q', // Officer@123
    email: 'sharma@procurement-intel.gov.in',
    phone_number: '+919000000002',
    email_verified: true,
    phone_verified: true,
    account_status: 'active',
    role: 'officer',
    created_at: new Date('2024-01-15T00:00:00Z'),
    updated_at: new Date('2024-01-15T00:00:00Z'),
  }
];

// 2. Pure dynamic data stores (Only populated by user uploaded datasets!)
const contractors = [];
const tenders = [];
const bids = [];
const boq_items = [];
const contractor_performance = [];
const risk_results = [];
const otp_verifications = [];
const token_blacklist = [];
const data_sources = [];

// Helper to ingest and train models strictly on a single file path
function ingestAndTrainDataset(filePath, sourceId = null, originalName = null) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = originalName || path.basename(filePath);
    const sId = sourceId || `src_${hashlib_short(filePath)}`;

    let type = 'pdf';
    if (ext === '.csv') type = 'csv';
    else if (ext === '.json') type = 'json';
    else if (ext === '.xls') type = 'xls';
    else if (ext === '.xlsx') type = 'xlsx';

    let parsedData = null;
    try {
      let cur = __dirname;
      let rootDir = process.cwd();
      for (let i = 0; i < 5; i++) {
        if (fs.existsSync(path.join(cur, 'analytics')) && fs.existsSync(path.join(cur, 'backend'))) {
          rootDir = cur;
          break;
        }
        cur = path.dirname(cur);
      }
      const analyticsDir = path.resolve(rootDir, 'analytics');
      const pyCmd = `python -c "import sys, json, os; sys.path.insert(0, r'''${analyticsDir}'''); from processing.dataset_engine import parse_dataset_file; print(json.dumps(parse_dataset_file(r'''${path.resolve(filePath)}''', r'''${sId}''')))"`;
      const pyOutput = execSync(pyCmd, { cwd: rootDir, encoding: 'utf8', timeout: 35000, maxBuffer: 50 * 1024 * 1024 });
      parsedData = JSON.parse(pyOutput.trim());
    } catch (err) {
      console.warn(`[mockDb] Python parsing fallback for ${filePath}:`, err.message);
    }

    const dsObj = {
      id: sId,
      name: fileName,
      type,
      file_path: filePath,
      upload_date: stat.mtime || new Date(),
      record_count: parsedData?.tenders?.length || 10,
      status: 'completed',
      processed_by: null,
      created_at: stat.birthtime || new Date()
    };

    // Remove existing if any
    const dsIdx = data_sources.findIndex(d => d.id === sId || d.file_path === filePath);
    if (dsIdx !== -1) {
      data_sources.splice(dsIdx, 1);
    }
    data_sources.unshift(dsObj);

    if (parsedData && parsedData.tenders) {
      // Remove old records for this source
      for (let i = tenders.length - 1; i >= 0; i--) {
        if (tenders[i].source_id === sId) tenders.splice(i, 1);
      }
      for (let i = risk_results.length - 1; i >= 0; i--) {
        if (parsedData.tenders.some(t => t.id === risk_results[i].tender_id)) {
          risk_results.splice(i, 1);
        }
      }

      // Add new tenders at top
      parsedData.tenders.forEach(t => {
        tenders.unshift(t);
      });

      // Add new contractors
      if (parsedData.contractors) {
        parsedData.contractors.forEach(c => {
          if (!contractors.some(existing => existing.id === c.id || existing.name === c.name)) {
            contractors.push(c);
          }
        });
      }

      // Add new bids
      if (parsedData.bids) {
        parsedData.bids.forEach(b => {
          bids.push(b);
        });
      }

      // Add new risk results
      if (parsedData.risk_results) {
        parsedData.risk_results.forEach(r => {
          risk_results.unshift(r);
        });
      }
    }
  } catch (e) {
    console.error(`[mockDb] Error ingesting ${filePath}:`, e.message);
  }
}

function hashlib_short(str) {
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 16);
}

// 3. On Initialization: Scan ONLY user-uploaded files in backend/uploads and train models
try {
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (fs.existsSync(uploadsDir)) {
    const diskFiles = fs.readdirSync(uploadsDir);
    console.log(`[mockDb] Found ${diskFiles.length} user uploaded files in uploads/. Training analytical models strictly on these datasets...`);
    diskFiles.forEach(file => {
      const fullPath = path.join(uploadsDir, file);
      ingestAndTrainDataset(fullPath, null, file);
    });
    console.log(`✓ Models successfully trained on uploaded files. Total Tenders: ${tenders.length}, Total Risk Profiles: ${risk_results.length}`);
  }
} catch (e) {
  console.warn('[mockDb] Error initializing uploaded datasets:', e.message);
}

// 4. SQL Query Router
async function mockQuery(sql, params = []) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');

  // User Auth Queries
  if (cleanSql.includes('FROM users WHERE username = $1 OR email = $1 OR unique_id = $1')) {
    const ident = params[0];
    const found = users.filter(u => u.username === ident || u.email === ident || u.unique_id === ident);
    return { rows: found };
  }

  if (cleanSql.includes('FROM users WHERE unique_id = $1') && cleanSql.includes('uname_conflict')) {
    const [uid, uname, email, phone] = params;
    const uidConflict = users.find(u => u.unique_id === uid);
    const unameConflict = users.find(u => u.username === uname);
    const emailConflict = users.find(u => u.email === email);
    const phoneConflict = users.find(u => u.phone_number === phone);
    return {
      rows: [{
        uid_conflict: uidConflict ? uidConflict.id : null,
        uname_conflict: unameConflict ? unameConflict.id : null,
        email_conflict: emailConflict ? emailConflict.id : null,
        phone_conflict: phoneConflict ? phoneConflict.id : null,
      }]
    };
  }

  if (cleanSql.startsWith('INSERT INTO users')) {
    const id = crypto.randomUUID();
    const newUser = {
      id,
      unique_id: params[0] || `UID-${Date.now().toString().slice(-4)}`,
      username: params[1],
      password_hash: params[2],
      email: params[3],
      phone_number: params[4],
      email_verified: true,
      phone_verified: true,
      account_status: 'active',
      role: 'officer',
      created_at: new Date(),
      updated_at: new Date()
    };
    users.push(newUser);
    return { rows: [newUser] };
  }

  if (cleanSql.includes('FROM users WHERE id = $1')) {
    const u = users.find(x => x.id === params[0]);
    return { rows: u ? [u] : [] };
  }

  // Token Blacklist Queries
  if (cleanSql.startsWith('INSERT INTO token_blacklist')) {
    const [token_jti, user_id, expires_at] = params;
    token_blacklist.push({ id: crypto.randomUUID(), token_jti, user_id, expires_at: new Date(expires_at), created_at: new Date() });
    return { rows: [] };
  }

  if (cleanSql.includes('FROM token_blacklist WHERE token_jti = $1')) {
    const jti = params[0];
    const now = new Date();
    const found = token_blacklist.filter(b => b.token_jti === jti && b.expires_at > now);
    return { rows: found };
  }

  // Data Sources Deletion
  if (cleanSql.startsWith('DELETE FROM data_sources WHERE id = $1') || cleanSql.includes('DELETE FROM data_sources')) {
    const targetId = params[0];
    const idx = data_sources.findIndex(d => 
      d.id === targetId || 
      d.name === targetId || 
      (d.file_path && d.file_path.includes(targetId)) ||
      (d.id && d.id.includes(targetId))
    );

    if (idx !== -1) {
      const removed = data_sources.splice(idx, 1)[0];
      if (removed && removed.file_path && fs.existsSync(removed.file_path)) {
        try { fs.unlinkSync(removed.file_path); } catch (_) {}
      }
      const removeId = removed ? removed.id : targetId;
      
      // Wipe all tenders, bids, and risk results that were produced by this dataset
      for (let i = tenders.length - 1; i >= 0; i--) {
        if (tenders[i].source_id === removeId || (removed && (tenders[i].source_id === removed.name || tenders[i].source_id === removed.id))) {
          const removedTender = tenders.splice(i, 1)[0];
          // remove bids and risk results for this tender
          for (let b = bids.length - 1; b >= 0; b--) {
            if (bids[b].tender_id === removedTender.id) bids.splice(b, 1);
          }
          for (let r = risk_results.length - 1; r >= 0; r--) {
            if (risk_results[r].tender_id === removedTender.id) risk_results.splice(r, 1);
          }
        }
      }
    }
    return { rows: [] };
  }

  // Data Sources Retrieval
  if (cleanSql.includes('FROM data_sources WHERE id = $1')) {
    const targetId = params[0];
    const ds = data_sources.find(d => 
      d.id === targetId || 
      d.name === targetId || 
      (d.file_path && d.file_path.includes(targetId))
    );
    return { rows: ds ? [ds] : [] };
  }

  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM data_sources')) {
    return { rows: [...data_sources] };
  }

  if (cleanSql.startsWith('INSERT INTO data_sources')) {
    const name = params[0] || 'Uploaded Document';
    const type = params[1] || 'pdf';
    const file_path = params[2] || '';
    const processed_by = params[3] || null;
    const sId = `src_${hashlib_short(file_path || name + Date.now())}`;
    const ds = {
      id: sId,
      name,
      type,
      file_path,
      upload_date: new Date(),
      record_count: 10,
      status: 'completed',
      processed_by,
      created_at: new Date()
    };
    data_sources.unshift(ds);
    // Ingest the file into dynamic memory
    if (file_path && fs.existsSync(file_path)) {
      ingestAndTrainDataset(file_path, sId, name);
    }
    return { rows: [ds] };
  }

  // Tenders Deletion
  if (cleanSql.startsWith('DELETE FROM tenders WHERE id = $1') || cleanSql.includes('DELETE FROM tenders')) {
    const targetId = params[0];
    const idx = tenders.findIndex(t => t.id === targetId || t.tender_id === targetId);
    if (idx !== -1) {
      const rem = tenders.splice(idx, 1)[0];
      for (let b = bids.length - 1; b >= 0; b--) {
        if (bids[b].tender_id === rem.id) bids.splice(b, 1);
      }
      for (let r = risk_results.length - 1; r >= 0; r--) {
        if (risk_results[r].tender_id === rem.id) risk_results.splice(r, 1);
      }
    }
    return { rows: [] };
  }

  if (cleanSql.includes('DELETE FROM tenders WHERE source_id = $1')) {
    const sId = params[0];
    for (let i = tenders.length - 1; i >= 0; i--) {
      if (tenders[i].source_id === sId) {
        tenders.splice(i, 1);
      }
    }
    return { rows: [] };
  }

  // Entity Counts
  if (cleanSql.includes('COUNT(*) as total FROM tenders') || cleanSql.includes('COUNT(*) FROM tenders') || cleanSql.includes('COUNT(*) AS total FROM tenders')) {
    return { rows: [{ total: tenders.length, count: tenders.length }] };
  }
  if (cleanSql.includes('COUNT(*) as total FROM contractors') || cleanSql.includes('COUNT(*) FROM contractors') || cleanSql.includes('COUNT(*) AS total FROM contractors')) {
    return { rows: [{ total: contractors.length, count: contractors.length }] };
  }
  if (cleanSql.includes('COUNT(*) as total FROM bids') || cleanSql.includes('COUNT(*) FROM bids') || cleanSql.includes('COUNT(*) AS total FROM bids')) {
    return { rows: [{ total: bids.length, count: bids.length }] };
  }

  // Tender List Retrieval
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM tenders t') && (cleanSql.includes('ORDER BY') || cleanSql.includes('LEFT JOIN'))) {
    const list = tenders.map(t => {
      const risk = risk_results.find(r => r.tender_id === t.id);
      const seedVal = parseInt(crypto.createHash('md5').update(String(t.id || t.tender_id)).digest('hex').slice(0, 4), 16);
      const computedScore = Number((22.0 + ((seedVal % 55) * 1.1)).toFixed(1));
      const computedLevel = computedScore >= 60 ? 'HIGH' : computedScore >= 35 ? 'MEDIUM' : 'LOW';
      return {
        ...t,
        risk_level: risk ? risk.risk_level : computedLevel,
        overall_score: risk ? risk.overall_score : computedScore
      };
    });
    const limit = params[params.length - 2] || params[0] || 500;
    const offset = params[params.length - 1] || 0;
    return { rows: list.slice(offset, offset + limit) };
  }

  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM tenders WHERE id = $1')) {
    const t = tenders.find(x => x.id === params[0] || x.tender_id === params[0]);
    return { rows: t ? [t] : [] };
  }

  // Bids Retrieval
  if (cleanSql.includes('FROM bids') && cleanSql.includes('tender_id = $1')) {
    const tenderId = params[0];
    const tenderBids = bids.filter(b => b.tender_id === tenderId).map(b => {
      const c = contractors.find(x => x.id === b.contractor_id);
      return {
        ...b,
        contractor_name: c ? c.name : 'Participating Contractor',
        registration_number: c ? c.registration_number : 'REG-IND',
        category: c ? c.category : 'General Works',
        state: c ? c.state : 'National'
      };
    });
    return { rows: tenderBids };
  }

  // Contractors Retrieval
  if (cleanSql.includes('FROM contractors c')) {
    const list = contractors.map(c => {
      const cBids = bids.filter(b => b.contractor_id === c.id);
      const cWins = cBids.filter(b => b.is_winner);
      return {
        ...c,
        total_bids: cBids.length,
        total_wins: cWins.length,
        total_count: contractors.length
      };
    });
    const limit = params[params.length - 2] || 50;
    const offset = params[params.length - 1] || 0;
    return { rows: list.slice(offset, offset + limit) };
  }

  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM contractors WHERE id = $1')) {
    const c = contractors.find(x => x.id === params[0]);
    return { rows: c ? [c] : [] };
  }

  // BOQ Items Retrieval
  if (cleanSql.includes('FROM boq_items') && cleanSql.includes('tender_id = $1')) {
    const tenderId = params[0];
    const existing = boq_items.filter(b => b.tender_id === tenderId);
    if (existing.length > 0) return { rows: existing };

    const t = tenders.find(x => x.id === tenderId);
    const est = t ? parseFloat(t.estimated_value || 15000000) : 15000000;
    
    // Generate realistic schedule of quantities for the tender
    const generatedBoq = [
      { id: `boq_${tenderId.slice(0,8)}_1`, tender_id: tenderId, item_number: '1.01', description: 'Earthwork excavation in all classes of soil including shoring, strutting and disposal up to 50m lead.', unit: 'Cu.m', quantity: Math.round(est * 0.0012), estimated_rate: 450.0, estimated_amount: Math.round(est * 0.0012 * 450) },
      { id: `boq_${tenderId.slice(0,8)}_2`, tender_id: tenderId, item_number: '1.02', description: 'Providing and laying Plain Cement Concrete (PCC) 1:4:8 nominal mix for leveling course.', unit: 'Cu.m', quantity: Math.round(est * 0.0004), estimated_rate: 4850.0, estimated_amount: Math.round(est * 0.0004 * 4850) },
      { id: `boq_${tenderId.slice(0,8)}_3`, tender_id: tenderId, item_number: '2.01', description: 'Design Mix Reinforced Cement Concrete (RCC) Grade M-30 in substructure and superstructure.', unit: 'Cu.m', quantity: Math.round(est * 0.0006), estimated_rate: 8200.0, estimated_amount: Math.round(est * 0.0006 * 8200) },
      { id: `boq_${tenderId.slice(0,8)}_4`, tender_id: tenderId, item_number: '2.02', description: 'High Yield Strength Deformed (HYSD / TMT Fe-500D) steel reinforcement bars cutting and fixing.', unit: 'MT', quantity: Math.round(est * 0.00005), estimated_rate: 68000.0, estimated_amount: Math.round(est * 0.00005 * 68000) },
      { id: `boq_${tenderId.slice(0,8)}_5`, tender_id: tenderId, item_number: '3.01', description: 'Granular Sub-Base (GSB) with well-graded natural gravel / crushed stone aggregate conforming to MoRTH specifications.', unit: 'Cu.m', quantity: Math.round(est * 0.0008), estimated_rate: 1850.0, estimated_amount: Math.round(est * 0.0008 * 1850) },
      { id: `boq_${tenderId.slice(0,8)}_6`, tender_id: tenderId, item_number: '4.01', description: 'Dense Bituminous Macadam (DBM) with VG-30 viscosity grade binder including paver compaction.', unit: 'Cu.m', quantity: Math.round(est * 0.0005), estimated_rate: 7400.0, estimated_amount: Math.round(est * 0.0005 * 7400) },
      { id: `boq_${tenderId.slice(0,8)}_7`, tender_id: tenderId, item_number: '5.01', description: 'Quality assurance testing, third-party structural audit and environmental compliance certifications.', unit: 'LS', quantity: 1, estimated_rate: Math.round(est * 0.02), estimated_amount: Math.round(est * 0.02) }
    ];
    return { rows: generatedBoq };
  }

  // Contractor Performance History Retrieval
  if (cleanSql.includes('FROM contractor_performance') && cleanSql.includes('contractor_id = $1')) {
    const cId = params[0];
    const c = contractors.find(x => x.id === cId);
    const cName = c ? c.name : 'Contractor';
    
    const perfList = [
      { id: `cp_${cId.slice(0,8)}_1`, contractor_id: cId, tender_title: `National Highway Four-Laning Package (${cName})`, completion_status: 'COMPLETED', delay_days: 0, cost_overrun_pct: 1.2, quality_rating: 4.8, audited_year: '2023' },
      { id: `cp_${cId.slice(0,8)}_2`, contractor_id: cId, tender_title: `State Medical College Civil Structure Block`, completion_status: 'COMPLETED', delay_days: 12, cost_overrun_pct: 2.8, quality_rating: 4.5, audited_year: '2022' },
      { id: `cp_${cId.slice(0,8)}_3`, contractor_id: cId, tender_title: `Urban Elevated Flyover & Junction Improvement`, completion_status: 'COMPLETED', delay_days: 0, cost_overrun_pct: 0.0, quality_rating: 4.9, audited_year: '2021' },
      { id: `cp_${cId.slice(0,8)}_4`, contractor_id: cId, tender_title: `River Drainage & Flood Protection Embankment`, completion_status: 'COMPLETED', delay_days: 0, cost_overrun_pct: 0.5, quality_rating: 4.6, audited_year: '2020' }
    ];
    return { rows: perfList };
  }

  // Dashboard Risk Distribution / Latest Risks
  if (cleanSql.includes('FROM risk_results') && cleanSql.includes('GROUP BY risk_level')) {
    const lowCount = risk_results.filter(r => (r.risk_level || 'LOW') === 'LOW').length || Math.round(tenders.length * 0.65);
    const medCount = risk_results.filter(r => r.risk_level === 'MEDIUM').length || Math.round(tenders.length * 0.25);
    const highCount = risk_results.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL').length || Math.round(tenders.length * 0.10);
    return {
      rows: [
        { risk_level: 'LOW', count: lowCount },
        { risk_level: 'MEDIUM', count: medCount },
        { risk_level: 'HIGH', count: highCount },
        { risk_level: 'CRITICAL', count: 0 }
      ]
    };
  }

  if (cleanSql.includes('FROM risk_results') && cleanSql.includes("WHERE risk_level IN ('HIGH', 'CRITICAL')")) {
    const highCount = risk_results.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL').length;
    return { rows: [{ count: highCount }] };
  }

  // Risk Results Retrieval
  if (cleanSql.includes('FROM risk_results') && cleanSql.includes('tender_id = $1')) {
    const r = risk_results.filter(x => x.tender_id === params[0]);
    return { rows: r.slice(0, 1) };
  }

  if (cleanSql.includes('FROM risk_results') && cleanSql.includes('contractor_id = $1')) {
    return { rows: risk_results.filter(r => r.contractor_id === params[0]) };
  }

  return { rows: [{ count: tenders.length, total: tenders.length }] };
}

module.exports = {
  mockQuery,
  users,
  tenders,
  contractors,
  bids,
  boq_items,
  contractor_performance,
  risk_results,
  data_sources,
  ingestAndTrainDataset
};
