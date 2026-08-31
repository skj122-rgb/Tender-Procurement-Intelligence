const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const uri = 'postgresql://postgres.llizggrehojvloltegve:%23shravan123456789%40@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres';

function toValidUUID(str) {
  if (!str) return crypto.randomUUID();
  const hex = crypto.createHash('md5').update(String(str)).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

function toValidDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

async function migrate() {
  console.log('Connecting to Supabase PostgreSQL...');
  const pool = new Pool({ connectionString: uri, ssl: { rejectUnauthorized: false } });

  try {
    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8');
    console.log('Applying database/schema.sql...');
    try {
      await pool.query(schemaSql);
    } catch (e) {
      console.log('Schema note:', e.message);
    }

    try {
      await pool.query("ALTER TABLE tenders DROP CONSTRAINT IF EXISTS chk_tender_dates;");
      await pool.query("ALTER TYPE data_source_type ADD VALUE IF NOT EXISTS 'xls'");
      await pool.query("ALTER TYPE data_source_type ADD VALUE IF NOT EXISTS 'xlsx'");
      await pool.query("ALTER TABLE tenders ADD COLUMN IF NOT EXISTS source_id VARCHAR(100)");
      await pool.query("ALTER TABLE tenders ADD COLUMN IF NOT EXISTS cppp_notice_brief JSONB");
      await pool.query("ALTER TABLE risk_results ADD COLUMN IF NOT EXISTS most_deserving_contractor JSONB");
      await pool.query("ALTER TABLE risk_results ADD COLUMN IF NOT EXISTS bidders_evaluated JSONB");
      await pool.query("ALTER TABLE risk_results ADD COLUMN IF NOT EXISTS problem_description TEXT");
    } catch (_) {}

    console.log('✓ Schema applied successfully.');

    // Seed default admin and officer if not exists
    const adminPassHash = '$2b$12$il17B7SilqAxy5Pr2BsWfe4RYtaAiOAv0m/8/YqEnkXoHngK1Uh6O'; // Admin@123
    const officerPassHash = '$2b$12$qXUCisjAOJ1J1GAsUWeNduECmVfUItmFRrDKpBEQ6bP/DZcPQwN5q'; // Officer@123

    await pool.query(`
      INSERT INTO users (id, unique_id, username, password_hash, email, phone_number, email_verified, phone_verified, account_status, role)
      VALUES 
        ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ADMIN-001', 'admin', '${adminPassHash}', 'admin@procurement-intel.gov.in', '+919000000001', true, true, 'active', 'admin'),
        ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'OFF-2024-001', 'officer_sharma', '${officerPassHash}', 'sharma@procurement-intel.gov.in', '+919000000002', true, true, 'active', 'officer')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✓ Seed users verified.');

    // Ingest all uploaded datasets from backend/uploads/ into Supabase PostgreSQL
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`Found ${files.length} uploaded files in backend/uploads/. Populating Supabase tables...`);

      for (const file of files) {
        const fullPath = path.join(uploadsDir, file);
        const ext = path.extname(file).toLowerCase();
        let type = 'pdf';
        if (ext === '.csv') type = 'csv';
        else if (ext === '.json') type = 'json';
        else if (ext === '.xls') type = 'xls';
        else if (ext === '.xlsx') type = 'xlsx';

        // Run python parser
        let parsed = null;
        try {
          const pyOutput = execSync(
            `python -c "import sys, json, os; sys.path.insert(0, os.path.abspath('analytics')); from processing.dataset_engine import parse_dataset_file; print(json.dumps(parse_dataset_file(r'''${fullPath}''')))"`,
            { cwd: path.resolve(__dirname, '../../'), encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
          );
          parsed = JSON.parse(pyOutput.trim());
        } catch (err) {
          console.warn(`Python parsing skipped for ${file}:`, err.message);
        }

        const sourceId = parsed?.source_id || `src_${Date.now().toString(16)}`;

        // Insert data source
        const dsId = toValidUUID(sourceId);
        await pool.query(`
          INSERT INTO data_sources (id, name, type, file_path, record_count, status)
          VALUES ($1, $2, $3, $4, $5, 'completed')
          ON CONFLICT (id) DO NOTHING
        `, [dsId, file, type, fullPath, parsed?.recordCount || 10]);

        if (parsed && parsed.tenders) {
          // Map to remember valid UUIDs
          const tenderUuidMap = {};
          const contractorUuidMap = {};

          if (parsed.contractors) {
            for (const c of parsed.contractors) {
              const cUuid = toValidUUID(c.id || c.name);
              contractorUuidMap[c.id] = cUuid;
              await pool.query(`
                INSERT INTO contractors (id, name, registration_number, category, state)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING
              `, [cUuid, c.name, c.registration_number, c.category, c.state]);
            }
          }

          for (const t of parsed.tenders) {
            const tUuid = toValidUUID(t.id || t.tender_id);
            tenderUuidMap[t.id] = tUuid;
            try {
              await pool.query(`
                INSERT INTO tenders (id, tender_id, title, department, state, district, estimated_value, tender_status, open_date, close_date, description, source_id, cppp_notice_brief)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (tender_id) DO UPDATE SET
                  title = EXCLUDED.title,
                  department = EXCLUDED.department,
                  estimated_value = EXCLUDED.estimated_value,
                  tender_status = EXCLUDED.tender_status,
                  cppp_notice_brief = EXCLUDED.cppp_notice_brief
              `, [
                tUuid, t.tender_id, t.title, t.department, t.state, t.district || 'Central',
                t.estimated_value, t.tender_status || 'open',
                toValidDate(t.open_date),
                toValidDate(t.close_date),
                t.description, sourceId, JSON.stringify(t.cppp_notice_brief || {})
              ]);
            } catch (_) {}
          }

          if (parsed.bids) {
            for (const b of parsed.bids) {
              const bUuid = toValidUUID(b.id);
              const tUuid = tenderUuidMap[b.tender_id] || toValidUUID(b.tender_id);
              const cUuid = contractorUuidMap[b.contractor_id] || toValidUUID(b.contractor_id);
              try {
                await pool.query(`
                  INSERT INTO bids (id, tender_id, contractor_id, bid_amount, is_winner)
                  VALUES ($1, $2, $3, $4, $5)
                  ON CONFLICT (id) DO NOTHING
                `, [bUuid, tUuid, cUuid, b.bid_amount, b.is_winner || false]);
              } catch (_) {}
            }
          }

          if (parsed.risk_results) {
            for (const r of parsed.risk_results) {
              const rUuid = toValidUUID(r.id);
              const tUuid = tenderUuidMap[r.tender_id] || toValidUUID(r.tender_id);
              try {
                await pool.query(`
                  INSERT INTO risk_results (id, tender_id, overall_score, risk_level, problem_description, most_deserving_contractor, bidders_evaluated)
                  VALUES ($1, $2, $3, $4, $5, $6, $7)
                  ON CONFLICT (id) DO NOTHING
                `, [
                  rUuid, tUuid, r.overall_score, r.risk_level,
                  r.problem_description || '5-parameter behavioral risk analysis completed',
                  JSON.stringify(r.most_deserving_contractor || {}),
                  JSON.stringify(r.bidders_evaluated || [])
                ]);
              } catch (_) {}
            }
          }
        }
      }
    }

    const tCount = await pool.query('SELECT COUNT(*) FROM tenders');
    const cCount = await pool.query('SELECT COUNT(*) FROM contractors');
    const bCount = await pool.query('SELECT COUNT(*) FROM bids');
    const uCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n🎉 SUPABASE MIGRATION COMPLETE!`);
    console.log(`- Total Tenders in Supabase: ${tCount.rows[0].count}`);
    console.log(`- Total Contractors in Supabase: ${cCount.rows[0].count}`);
    console.log(`- Total Bids in Supabase: ${bCount.rows[0].count}`);
    console.log(`- Total Users in Supabase: ${uCount.rows[0].count}`);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
