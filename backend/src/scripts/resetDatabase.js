const db = require('../config/database');

async function resetDb() {
  try {
    console.log('1. Truncating all data tables...');
    await db.query('TRUNCATE TABLE bids, risk_results, boq_items, contractor_performance, tenders, contractors, data_sources CASCADE');
    console.log('✓ Tables truncated.');

    console.log('1b. Cleaning up uploaded files...');
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
          console.log(`- Deleted uploaded file: ${file}`);
        } catch (e) {
          console.warn(`Could not delete file ${file}:`, e.message);
        }
      }
    }
    console.log('✓ Uploads folder cleaned.');

    console.log('2. Verifying the 2 authorized platform users...');
    const adminHash = '$2b$12$il17B7SilqAxy5Pr2BsWfe4RYtaAiOAv0m/8/YqEnkXoHngK1Uh6O'; // Admin@123
    const officerHash = '$2b$12$qXUCisjAOJ1J1GAsUWeNduECmVfUItmFRrDKpBEQ6bP/DZcPQwN5q'; // Officer@123

    await db.query(`
      INSERT INTO users (id, unique_id, username, password_hash, email, phone_number, email_verified, phone_verified, account_status, role)
      VALUES 
        ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ADMIN-001', 'admin', $1, 'admin@procurement-intel.gov.in', '+919000000001', true, true, 'active', 'admin'),
        ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'OFF-2024-001', 'officer_sharma', $2, 'sharma@procurement-intel.gov.in', '+919000000002', true, true, 'active', 'officer')
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        account_status = 'active'
    `, [adminHash, officerHash]);
    console.log('✓ Admin and Officer users ready.');

    const usersRes = await db.query('SELECT username, role, email FROM users ORDER BY created_at ASC');
    console.log('Active Users in DB:', usersRes.rows);

    const tRes = await db.query('SELECT COUNT(*) FROM tenders');
    const cRes = await db.query('SELECT COUNT(*) FROM contractors');
    const bRes = await db.query('SELECT COUNT(*) FROM bids');
    console.log(`Database state: Tenders=${tRes.rows[0].count}, Contractors=${cRes.rows[0].count}, Bids=${bRes.rows[0].count}`);
    console.log('✓ Database is now in pristine empty state with only 2 users.');
  } catch (err) {
    console.error('Reset error:', err.message);
  } finally {
    process.exit(0);
  }
}

resetDb();
