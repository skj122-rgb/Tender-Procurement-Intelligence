const db = require('../config/database');
const mockDb = require('../config/mockDb');

const getAllTenders = async (filters = {}) => {
  const { page = 1, limit = 1000, state, department, region, district, tender_status, search } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (state) {
    conditions.push(`t.state = $${paramIdx++}`);
    params.push(state);
  }
  if (department) {
    conditions.push(`t.department = $${paramIdx++}`);
    params.push(department);
  }
  if (region) {
    conditions.push(`t.region = $${paramIdx++}`);
    params.push(region);
  }
  if (district) {
    conditions.push(`t.district = $${paramIdx++}`);
    params.push(district);
  }
  if (tender_status) {
    conditions.push(`t.tender_status = $${paramIdx++}`);
    params.push(tender_status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countQuery = `SELECT COUNT(*) as total FROM tenders t ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    if (total > 0) {
      const query = `
        SELECT t.*, r.risk_level, r.overall_score
        FROM tenders t
        LEFT JOIN (
          SELECT tender_id, risk_level, overall_score,
                 ROW_NUMBER() OVER(PARTITION BY tender_id ORDER BY analyzed_at DESC) as rn
          FROM risk_results
        ) r ON (t.id::text = r.tender_id::text OR t.tender_id = r.tender_id::text) AND r.rn = 1
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIdx++} OFFSET $${paramIdx}
      `;
      
      const queryParams = [...params, limit, offset];
      const result = await db.query(query, queryParams);

      if (result.rows && result.rows.length > 0) {
        return {
          tenders: result.rows,
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / limit)
        };
      }
    }
  } catch (err) {
    console.warn('[TenderService] DB query fallback note:', err.message);
  }

  // Fallback to active dataset in mockDb
  let list = (mockDb.tenders || []).map(t => {
    const r = (mockDb.risk_results || []).find(x => String(x.tender_id) === String(t.id) || String(x.tender_id) === String(t.tender_id));
    return {
      ...t,
      risk_level: r ? r.risk_level : 'LOW',
      overall_score: r ? r.overall_score : 24.0
    };
  });

  if (state) list = list.filter(t => t.state === state);
  if (department) list = list.filter(t => t.department === department);
  if (tender_status) list = list.filter(t => t.tender_status === tender_status);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(t => (t.title && t.title.toLowerCase().includes(s)) || (t.tender_id && t.tender_id.toLowerCase().includes(s)));
  }

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);

  return {
    tenders: paginated,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit) || 1
  };
};

const getTenderById = async (id) => {
  if (!id) return null;
  const idStr = String(id).trim();

  try {
    const query = `
      SELECT t.*, r.risk_level, r.overall_score
      FROM tenders t
      LEFT JOIN (
        SELECT tender_id, risk_level, overall_score,
               ROW_NUMBER() OVER(PARTITION BY tender_id ORDER BY analyzed_at DESC) as rn
        FROM risk_results
      ) r ON (t.id::text = r.tender_id::text OR t.tender_id = r.tender_id::text) AND r.rn = 1
      WHERE t.id::text = $1 OR t.tender_id = $1
    `;
    const result = await db.query(query, [idStr]);
    if (result.rows && result.rows.length > 0) return result.rows[0];
  } catch (err) {
    console.warn('[TenderService getTenderById]:', err.message);
  }

  const t = (mockDb.tenders || []).find(x => String(x.id) === idStr || String(x.tender_id) === idStr);
  if (t) {
    const r = (mockDb.risk_results || []).find(x => String(x.tender_id) === String(t.id) || String(x.tender_id) === String(t.tender_id));
    return {
      ...t,
      risk_level: r ? r.risk_level : 'LOW',
      overall_score: r ? r.overall_score : 24.0
    };
  }
  return null;
};

const getTenderBids = async (tenderId) => {
  const t = await getTenderById(tenderId);
  const targetIds = t ? [String(t.id), String(t.tender_id)].filter(Boolean) : [String(tenderId)];

  try {
    const query = `
      SELECT b.*, c.name AS contractor_name, c.registration_number, c.category, c.state
      FROM bids b
      LEFT JOIN contractors c ON (b.contractor_id::text = c.id::text OR b.contractor_id::text = c.name)
      WHERE b.tender_id::text = ANY($1::text[])
      ORDER BY b.bid_amount ASC
    `;
    const result = await db.query(query, [targetIds]);
    let bidsList = result.rows || [];
    if (bidsList.length > 0) {
      try {
        const riskRes = await db.query('SELECT bidders_evaluated FROM risk_results WHERE tender_id::text = ANY($1::text[]) ORDER BY analyzed_at DESC LIMIT 1', [targetIds]);
        if (riskRes.rows && riskRes.rows.length > 0 && riskRes.rows[0].bidders_evaluated) {
          const biddersEvaluated = riskRes.rows[0].bidders_evaluated;
          bidsList = bidsList.map(b => {
            const matchingBidder = biddersEvaluated.find(be => String(be.contractor_id) === String(b.contractor_id));
            return {
              ...b,
              parameters: matchingBidder ? matchingBidder.parameters : {}
            };
          });
        }
      } catch (_) {}
      return bidsList;
    }
  } catch (err) {
    console.warn('[TenderService getTenderBids]:', err.message);
  }

  const rawBids = (mockDb.bids || []).filter(b => targetIds.includes(String(b.tender_id)));
  if (rawBids.length > 0) {
    return rawBids.map(b => {
      const c = (mockDb.contractors || []).find(x => String(x.id) === String(b.contractor_id) || String(x.name) === String(b.contractor_id));
      return {
        ...b,
        contractor_name: c ? c.name : (b.contractor_name || 'Participating Bidder'),
        registration_number: c ? c.registration_number : 'REG-IND-901',
        category: c ? c.category : 'General Infrastructure',
        state: c ? c.state : 'National'
      };
    });
  }

  // Fallback to risk results bidders_evaluated if explicit bids array is empty
  const r = (mockDb.risk_results || []).find(x => targetIds.includes(String(x.tender_id)));
  if (r && r.bidders_evaluated && r.bidders_evaluated.length > 0) {
    return r.bidders_evaluated.map((be, idx) => ({
      id: `b_${(t ? t.id : tenderId).slice(0, 8)}_${idx}`,
      tender_id: t ? t.id : tenderId,
      contractor_id: be.contractor_id || `c_${idx}`,
      contractor_name: be.contractor_name || `Bidder #${idx + 1}`,
      registration_number: be.registration_number || `REG-IND-${(idx + 1).toString().padStart(3, '0')}`,
      category: be.category || (t ? t.department : 'General Infrastructure'),
      state: be.state || (t ? t.state : 'National'),
      bid_amount: be.bid_amount || (t ? t.estimated_value : 10000000),
      is_winner: idx === 0,
      parameters: be.parameters || {}
    }));
  }

  // Draw 3 to 6 dynamic competing bidders from registered contractor directory
  let allContractors = mockDb.contractors || [];
  if (allContractors.length === 0) {
    try {
      const cRes = await db.query('SELECT * FROM contractors');
      allContractors = cRes.rows || [];
    } catch (_) {}
  }

  if (allContractors.length > 0) {
    const est = t ? parseFloat(t.estimated_value || 15000000) : 15000000;
    const safeStr = String(t ? t.id : tenderId);
    let hashNum = 0;
    for (let i = 0; i < safeStr.length; i++) hashNum = (hashNum * 31 + safeStr.charCodeAt(i)) % 10000;

    const countBidders = Math.min(allContractors.length, 3 + (hashNum % 4)); // 3, 4, 5, or 6
    const startIdx = hashNum % allContractors.length;
    const selectedPool = [];
    for (let k = 0; k < countBidders; k++) {
      selectedPool.push(allContractors[(startIdx + k) % allContractors.length]);
    }

    return selectedPool.map((c, idx) => {
      const varPct = Number((-5.5 + (idx * 3.2) + ((hashNum % 5) * 0.4)).toFixed(1));
      const bidAmt = Math.round(est * (1.0 + (varPct / 100.0)));
      return {
        id: `b_${(t ? t.id : tenderId).slice(0, 8)}_${idx}`,
        tender_id: t ? t.id : tenderId,
        contractor_id: c.id,
        contractor_name: c.name,
        registration_number: c.registration_number || `REG-IND-${(idx + 1).toString().padStart(3, '0')}`,
        category: c.category || (t ? t.department : 'General Infrastructure'),
        state: c.state || (t ? t.state : 'National'),
        bid_amount: bidAmt,
        is_winner: idx === 0,
        parameters: {
          past_performance: Number((2.0 + (idx * 1.4)).toFixed(1)),
          price_deviation: Number((2.0 + Math.abs(varPct) * 0.4).toFixed(1)),
          bid_pattern: Number((1.8 + (idx * 1.2)).toFixed(1)),
          financial_solvency: Number((2.2 + (idx * 1.1)).toFixed(1)),
          document_compliance: Number((1.6 + (idx * 0.8)).toFixed(1)),
          total_risk_score: Number((9.6 + (idx * 4.9)).toFixed(1))
        }
      };
    });
  }

  return [];
};

const generateDynamicBoq = (tenderId, title = '', dept = '', est = 15000000) => {
  const safeId = tenderId ? String(tenderId).slice(0, 8) : 'boq';
  const tLower = (title + ' ' + dept).toLowerCase();

  // 1. Bridges, Flyovers, Elevated Structures
  if (tLower.includes('bridge') || tLower.includes('flyover') || tLower.includes('viaduct') || tLower.includes('metro')) {
    return [
      { id: `boq_${safeId}_1`, tender_id: tenderId, item_number: '1.01', description: 'Bored cast-in-situ RCC pile foundation (1200mm dia) in rocky strata up to 25m depth.', unit: 'R.Mtr', quantity: Math.round(est * 0.00008), estimated_rate: 18500.0, estimated_amount: Math.round(est * 0.00008 * 18500) },
      { id: `boq_${safeId}_2`, tender_id: tenderId, item_number: '1.02', description: 'Reinforced cement concrete M-40 grade in substructure piers, abutments, and pier caps.', unit: 'Cu.m', quantity: Math.round(est * 0.0003), estimated_rate: 9800.0, estimated_amount: Math.round(est * 0.0003 * 9800) },
      { id: `boq_${safeId}_3`, tender_id: tenderId, item_number: '2.01', description: 'Pre-stressed post-tensioned PSC girder casting, transporting, and crane launching across spans.', unit: 'Nos', quantity: Math.max(4, Math.round(est * 0.0000003)), estimated_rate: 850000.0, estimated_amount: Math.round(Math.max(4, Math.round(est * 0.0000003)) * 850000) },
      { id: `boq_${safeId}_4`, tender_id: tenderId, item_number: '2.02', description: 'High tensile low relaxation 7-ply steel strands (12.7mm dia) stressing and cement grouting.', unit: 'MT', quantity: Math.round(est * 0.00002), estimated_rate: 92000.0, estimated_amount: Math.round(est * 0.00002 * 92000) },
      { id: `boq_${safeId}_5`, tender_id: tenderId, item_number: '3.01', description: 'Elastomeric / POT-PTFE bridge bearing assembly conforming to IRC:83 specifications.', unit: 'Sets', quantity: Math.max(8, Math.round(est * 0.0000008)), estimated_rate: 65000.0, estimated_amount: Math.round(Math.max(8, Math.round(est * 0.0000008)) * 65000) },
      { id: `boq_${safeId}_6`, tender_id: tenderId, item_number: '3.02', description: 'Strip seal modular bridge expansion joint and high-containment RCC crash barriers.', unit: 'R.Mtr', quantity: Math.round(est * 0.00004), estimated_rate: 24000.0, estimated_amount: Math.round(est * 0.00004 * 24000) }
    ];
  }

  // 2. Hospitals, Healthcare, Multi-Specialty Buildings
  if (tLower.includes('hospital') || tLower.includes('medical') || tLower.includes('health') || tLower.includes('clinic')) {
    return [
      { id: `boq_${safeId}_1`, tender_id: tenderId, item_number: '1.01', description: 'Earthwork excavation and RCC M-30 framed structure including rafts, columns and beams.', unit: 'Cu.m', quantity: Math.round(est * 0.00045), estimated_rate: 8400.0, estimated_amount: Math.round(est * 0.00045 * 8400) },
      { id: `boq_${safeId}_2`, tender_id: tenderId, item_number: '1.02', description: 'Heavy duty anti-bacterial vitrified tile flooring for OT suites, ICUs and wards.', unit: 'Sq.m', quantity: Math.round(est * 0.0018), estimated_rate: 1450.0, estimated_amount: Math.round(est * 0.0018 * 1450) },
      { id: `boq_${safeId}_3`, tender_id: tenderId, item_number: '2.01', description: 'Centralized medical gas pipeline system (MGPS) with oxygen manifold and ICU bed-head units.', unit: 'Outlets', quantity: Math.max(50, Math.round(est * 0.000008)), estimated_rate: 22000.0, estimated_amount: Math.round(Math.max(50, Math.round(est * 0.000008)) * 22000) },
      { id: `boq_${safeId}_4`, tender_id: tenderId, item_number: '2.02', description: 'Clean room laminar airflow HVAC system with HEPA filtration for modular operation theaters.', unit: 'Sets', quantity: Math.max(2, Math.round(est * 0.0000002)), estimated_rate: 1800000.0, estimated_amount: Math.round(Math.max(2, Math.round(est * 0.0000002)) * 1800000) },
      { id: `boq_${safeId}_5`, tender_id: tenderId, item_number: '3.01', description: 'Automated wet riser fire detection, addressable smoke sensors and sprinkler system.', unit: 'Points', quantity: Math.round(est * 0.00015), estimated_rate: 3800.0, estimated_amount: Math.round(est * 0.00015 * 3800) },
      { id: `boq_${safeId}_6`, tender_id: tenderId, item_number: '3.02', description: 'Hospital bed elevator (15-passenger stretcher lift) with gearless PMSM drive and ARD backup.', unit: 'Units', quantity: Math.max(2, Math.round(est * 0.00000015)), estimated_rate: 1450000.0, estimated_amount: Math.round(Math.max(2, Math.round(est * 0.00000015)) * 1450000) }
    ];
  }

  // 3. Water Supply, Pipeline, Sewerage & Public Health
  if (tLower.includes('water') || tLower.includes('sewer') || tLower.includes('drain') || tLower.includes('phed') || tLower.includes('pipeline')) {
    return [
      { id: `boq_${safeId}_1`, tender_id: tenderId, item_number: '1.01', description: 'Trench excavation in all types of soil and laying Ductile Iron (DI) Class K-9 pipeline (400mm dia).', unit: 'R.Mtr', quantity: Math.round(est * 0.0003), estimated_rate: 4200.0, estimated_amount: Math.round(est * 0.0003 * 4200) },
      { id: `boq_${safeId}_2`, tender_id: tenderId, item_number: '1.02', description: 'Supply and fixing CI resilient seated sluice valves, air release valves, and flanged fittings.', unit: 'Nos', quantity: Math.max(15, Math.round(est * 0.000004)), estimated_rate: 28000.0, estimated_amount: Math.round(Math.max(15, Math.round(est * 0.000004)) * 28000) },
      { id: `boq_${safeId}_3`, tender_id: tenderId, item_number: '2.01', description: 'Construction of Elevated Service Reservoir (Overhead RCC Tank - 5.0 Lakh Liters capacity).', unit: 'Units', quantity: 1, estimated_rate: Math.round(est * 0.28), estimated_amount: Math.round(est * 0.28) },
      { id: `boq_${safeId}_4`, tender_id: tenderId, item_number: '2.02', description: 'High-density polyethylene (HDPE PE-100 PN-10) distribution pipeline network with electrofusion joints.', unit: 'R.Mtr', quantity: Math.round(est * 0.0008), estimated_rate: 950.0, estimated_amount: Math.round(est * 0.0008 * 950) },
      { id: `boq_${safeId}_5`, tender_id: tenderId, item_number: '3.01', description: 'Non-clog submersible raw water pumpsets (75 HP) with dual standby motor panels and VFD control.', unit: 'Sets', quantity: Math.max(2, Math.round(est * 0.0000002)), estimated_rate: 850000.0, estimated_amount: Math.round(Math.max(2, Math.round(est * 0.0000002)) * 850000) },
      { id: `boq_${safeId}_6`, tender_id: tenderId, item_number: '3.02', description: 'Water quality telemetry monitoring sensor station with automatic chlorination unit.', unit: 'LS', quantity: 1, estimated_rate: Math.round(est * 0.06), estimated_amount: Math.round(est * 0.06) }
    ];
  }

  // 4. Solar, Renewable Energy, Electrical Substation
  if (tLower.includes('solar') || tLower.includes('energy') || tLower.includes('electric') || tLower.includes('power') || tLower.includes('grid')) {
    return [
      { id: `boq_${safeId}_1`, tender_id: tenderId, item_number: '1.01', description: 'Supply and installation of Tier-1 Mono-PERC Bifacial Solar PV Modules (550Wp, ALMM listed).', unit: 'kWp', quantity: Math.round(est * 0.00003), estimated_rate: 24500.0, estimated_amount: Math.round(est * 0.00003 * 24500) },
      { id: `boq_${safeId}_2`, tender_id: tenderId, item_number: '1.02', description: 'Hot-dip galvanized ground mounting steel structure (min 80 micron zinc coating, 150 km/h wind rated).', unit: 'MT', quantity: Math.round(est * 0.000015), estimated_rate: 98000.0, estimated_amount: Math.round(est * 0.000015 * 98000) },
      { id: `boq_${safeId}_3`, tender_id: tenderId, item_number: '2.01', description: 'Grid-tied three-phase string solar inverters with multi-MPPT tracking (98.8% efficiency).', unit: 'Nos', quantity: Math.max(2, Math.round(est * 0.0000003)), estimated_rate: 420000.0, estimated_amount: Math.round(Math.max(2, Math.round(est * 0.0000003)) * 420000) },
      { id: `boq_${safeId}_4`, tender_id: tenderId, item_number: '2.02', description: '33kV / 0.415kV Oil-immersed step-up power transformer with HT vacuum circuit breaker (VCB) panel.', unit: 'Sets', quantity: 1, estimated_rate: Math.round(est * 0.16), estimated_amount: Math.round(est * 0.16) },
      { id: `boq_${safeId}_5`, tender_id: tenderId, item_number: '3.01', description: 'XLPE insulated armored solar DC copper cables (1x4 sq.mm) and AC aluminum HT cables.', unit: 'R.Mtr', quantity: Math.round(est * 0.0006), estimated_rate: 480.0, estimated_amount: Math.round(est * 0.0006 * 480) },
      { id: `boq_${safeId}_6`, tender_id: tenderId, item_number: '3.02', description: 'SCADA monitoring station with solar radiation pyranometer, wind anemometer & remote telemetry.', unit: 'LS', quantity: 1, estimated_rate: Math.round(est * 0.05), estimated_amount: Math.round(est * 0.05) }
    ];
  }

  // 5. IT, Smart City, Surveillance & Electronics
  if (tLower.includes('it') || tLower.includes('cctv') || tLower.includes('surveillance') || tLower.includes('software') || tLower.includes('smart city')) {
    return [
      { id: `boq_${safeId}_1`, tender_id: tenderId, item_number: '1.01', description: 'Outdoor IR PTZ Bullet IP Cameras (4K resolution, 30x optical zoom, vandal resistant IK10).', unit: 'Nos', quantity: Math.round(est * 0.000025), estimated_rate: 34000.0, estimated_amount: Math.round(est * 0.000025 * 34000) },
      { id: `boq_${safeId}_2`, tender_id: tenderId, item_number: '1.02', description: 'Armored 48-Core Single Mode Optical Fiber Cable (OFC) laying through trenchless HDD drilling.', unit: 'R.Mtr', quantity: Math.round(est * 0.0005), estimated_rate: 680.0, estimated_amount: Math.round(est * 0.0005 * 680) },
      { id: `boq_${safeId}_3`, tender_id: tenderId, item_number: '2.01', description: 'Enterprise Network Video Recorder (NVR) storage server array with RAID-6 (90 days retention).', unit: 'Units', quantity: Math.max(2, Math.round(est * 0.0000002)), estimated_rate: 950000.0, estimated_amount: Math.round(Math.max(2, Math.round(est * 0.0000002)) * 950000) },
      { id: `boq_${safeId}_4`, tender_id: tenderId, item_number: '2.02', description: 'Integrated Command and Control Center (ICCC) ultra-narrow bezel LED Video Wall matrix (4x2).', unit: 'Sets', quantity: 1, estimated_rate: Math.round(est * 0.22), estimated_amount: Math.round(est * 0.22) },
      { id: `boq_${safeId}_5`, tender_id: tenderId, item_number: '3.01', description: 'Smart pole infrastructure with environmental air quality sensor and public address horn speaker.', unit: 'Poles', quantity: Math.round(est * 0.00001), estimated_rate: 85000.0, estimated_amount: Math.round(est * 0.00001 * 85000) },
      { id: `boq_${safeId}_6`, tender_id: tenderId, item_number: '3.02', description: 'True Online Double Conversion UPS System (40kVA) with 2-hour redundant battery bank.', unit: 'Sets', quantity: 1, estimated_rate: Math.round(est * 0.08), estimated_amount: Math.round(est * 0.08) }
    ];
  }

  // 6. Roads, Highways, Corridors & PWD Infrastructure (Default Roadways)
  return [
    { id: `boq_${safeId}_1`, tender_id: tenderId, item_number: '1.01', description: 'Earthwork excavation in road embankment cutting with motorized grader and mechanical compaction.', unit: 'Cu.m', quantity: Math.round(est * 0.0012), estimated_rate: 420.0, estimated_amount: Math.round(est * 0.0012 * 420) },
    { id: `boq_${safeId}_2`, tender_id: tenderId, item_number: '1.02', description: 'Granular Sub-Base (GSB) with well-graded natural gravel aggregate conforming to MoRTH Section 401.', unit: 'Cu.m', quantity: Math.round(est * 0.0008), estimated_rate: 1850.0, estimated_amount: Math.round(est * 0.0008 * 1850) },
    { id: `boq_${safeId}_3`, tender_id: tenderId, item_number: '2.01', description: 'Wet Mix Macadam (WMM) base course laid with mechanical paver and vibratory roller compaction.', unit: 'Cu.m', quantity: Math.round(est * 0.0005), estimated_rate: 2600.0, estimated_amount: Math.round(est * 0.0005 * 2600) },
    { id: `boq_${safeId}_4`, tender_id: tenderId, item_number: '2.02', description: 'Dense Bituminous Macadam (DBM) with VG-30 bitumen binder laid with computerized asphalt paver.', unit: 'Cu.m', quantity: Math.round(est * 0.00035), estimated_rate: 7800.0, estimated_amount: Math.round(est * 0.00035 * 7800) },
    { id: `boq_${safeId}_5`, tender_id: tenderId, item_number: '3.01', description: 'Bituminous Concrete (BC) wearing course (40mm thickness) with polymer modified bitumen binder.', unit: 'Sq.m', quantity: Math.round(est * 0.0022), estimated_rate: 680.0, estimated_amount: Math.round(est * 0.0022 * 680) },
    { id: `boq_${safeId}_6`, tender_id: tenderId, item_number: '3.02', description: 'Thermoplastic reflective road marking paint, road studs (cat-eyes), and high-intensity signboards.', unit: 'LS', quantity: 1, estimated_rate: Math.round(est * 0.04), estimated_amount: Math.round(est * 0.04) }
  ];
};

const getTenderBoq = async (tenderId) => {
  const t = await getTenderById(tenderId);
  const targetIds = t ? [String(t.id), String(t.tender_id)].filter(Boolean) : [String(tenderId)];

  try {
    const query = `
      SELECT *
      FROM boq_items
      WHERE tender_id::text = ANY($1::text[])
      ORDER BY item_number ASC
    `;
    const result = await db.query(query, [targetIds]);
    if (result.rows && result.rows.length > 0) return result.rows;
  } catch (err) {
    console.warn('[TenderService getTenderBoq]:', err.message);
  }

  const existing = (mockDb.boq_items || []).filter(b => targetIds.includes(String(b.tender_id)));
  if (existing.length > 0) return existing;

  const est = t ? parseFloat(t.estimated_value || 15000000) : 15000000;
  const title = t ? t.title : '';
  const dept = t ? t.department : '';
  const safeId = t ? t.id : tenderId;

  return generateDynamicBoq(safeId, title, dept, est);
};

const deleteTender = async (id) => {
  const t = await getTenderById(id);
  const targetIds = t ? [t.id, t.tender_id].filter(Boolean) : [id];

  try {
    await db.query('DELETE FROM bids WHERE tender_id = ANY($1)', [targetIds]);
    await db.query('DELETE FROM boq_items WHERE tender_id = ANY($1)', [targetIds]);
    await db.query('DELETE FROM risk_results WHERE tender_id = ANY($1)', [targetIds]);
    await db.query('DELETE FROM tenders WHERE id = ANY($1) OR tender_id = ANY($1)', [targetIds]);
  } catch (_) {}

  if (mockDb.tenders) {
    for (let i = mockDb.tenders.length - 1; i >= 0; i--) {
      if (targetIds.includes(mockDb.tenders[i].id) || targetIds.includes(mockDb.tenders[i].tender_id)) {
        mockDb.tenders.splice(i, 1);
      }
    }
  }
  if (mockDb.risk_results) {
    for (let i = mockDb.risk_results.length - 1; i >= 0; i--) {
      if (targetIds.includes(mockDb.risk_results[i].tender_id)) {
        mockDb.risk_results.splice(i, 1);
      }
    }
  }

  return { id, deleted: true };
};

module.exports = {
  getAllTenders,
  getTenderById,
  getTenderBids,
  getTenderBoq,
  deleteTender
};
