-- ============================================================================
-- SEED DATA — Development / Demo
-- ============================================================================

-- Insert demo admin user (password: Admin@123)
-- bcrypt hash for 'Admin@123' with 12 rounds
INSERT INTO users (unique_id, username, password_hash, email, phone_number, email_verified, phone_verified, account_status, role)
VALUES (
    'ADMIN-001',
    'admin',
    '$2b$12$il17B7SilqAxy5Pr2BsWfe4RYtaAiOAv0m/8/YqEnkXoHngK1Uh6O',
    'admin@procurement-intel.gov.in',
    '+919000000001',
    true,
    true,
    'active',
    'admin'
);

-- Insert demo officer user (password: Officer@123)
INSERT INTO users (unique_id, username, password_hash, email, phone_number, email_verified, phone_verified, account_status, role)
VALUES (
    'OFF-2024-001',
    'officer_sharma',
    '$2b$12$qXUCisjAOJ1J1GAsUWeNduECmVfUItmFRrDKpBEQ6bP/DZcPQwN5q',
    'sharma@procurement-intel.gov.in',
    '+919000000002',
    true,
    true,
    'active',
    'officer'
);

-- ============================================================================
-- Sample Contractors
-- ============================================================================
INSERT INTO contractors (name, registration_number, address, state, website, contact_email, contact_phone, established_date, category) VALUES
('Bharat Construction Ltd.', 'REG-BC-001', '12, MG Road, New Delhi', 'Delhi', 'https://bharatconstruction.example.com', 'info@bharatconstruction.com', '+919111111001', '2005-03-15', 'Construction'),
('Infra Solutions Pvt. Ltd.', 'REG-IS-002', '45, Industrial Area, Pune', 'Maharashtra', 'https://infrasolutions.example.com', 'contact@infrasolutions.com', '+919111111002', '2010-07-22', 'Infrastructure'),
('Green Earth Builders', 'REG-GE-003', '78, NH-8, Jaipur', 'Rajasthan', NULL, 'info@greenearth.com', '+919111111003', '2012-01-10', 'Construction'),
('National Roads Corp.', 'REG-NR-004', '23, Sector 62, Noida', 'Uttar Pradesh', 'https://nationalroads.example.com', 'nrc@nationalroads.com', '+919111111004', '2008-11-05', 'Roads'),
('Metro Build Associates', 'REG-MB-005', '56, Anna Salai, Chennai', 'Tamil Nadu', NULL, 'info@metrobuild.com', '+919111111005', '2015-06-18', 'Metro/Urban'),
('Himalayan Works Ltd.', 'REG-HW-006', '90, Mall Road, Shimla', 'Himachal Pradesh', 'https://himalayanworks.example.com', 'hw@himalayanworks.com', '+919111111006', '2003-09-01', 'Construction'),
('Delta Engineering Co.', 'REG-DE-007', '34, IT Park, Hyderabad', 'Telangana', NULL, 'delta@engineering.com', '+919111111007', '2011-04-25', 'Engineering'),
('Sunrise Infra Pvt. Ltd.', 'REG-SI-008', '67, Ring Road, Lucknow', 'Uttar Pradesh', 'https://sunriseinfra.example.com', 'info@sunriseinfra.com', '+919111111008', '2014-02-14', 'Infrastructure');

-- ============================================================================
-- Sample Tenders
-- ============================================================================
INSERT INTO tenders (tender_id, title, department, state, region, district, estimated_value, tender_status, open_date, close_date, award_date, description) VALUES
('TND-2024-001', 'Construction of District Hospital Building', 'Health & Family Welfare', 'Maharashtra', 'Western', 'Pune', 45000000.00, 'awarded', '2024-01-15', '2024-02-28', '2024-03-15', 'Construction of a 200-bed district hospital with modern facilities.'),
('TND-2024-002', 'National Highway NH-48 Expansion (Phase 2)', 'National Highways Authority', 'Rajasthan', 'Northern', 'Jaipur', 180000000.00, 'awarded', '2024-02-01', '2024-03-15', '2024-04-01', '4-lane expansion of NH-48 from Jaipur to Ajmer, 85 km stretch.'),
('TND-2024-003', 'Smart City Water Supply Network', 'Urban Development', 'Tamil Nadu', 'Southern', 'Chennai', 72000000.00, 'open', '2024-03-01', '2024-04-30', NULL, 'Installation of smart water supply network covering 12 wards.'),
('TND-2024-004', 'Rural Road Connectivity Project', 'Rural Development', 'Uttar Pradesh', 'Central', 'Lucknow', 35000000.00, 'awarded', '2024-01-20', '2024-03-05', '2024-03-20', 'Construction of 45 km rural roads connecting 15 villages.'),
('TND-2024-005', 'Government School Renovation (50 Schools)', 'Education', 'Delhi', 'NCR', 'New Delhi', 28000000.00, 'under_evaluation', '2024-04-01', '2024-05-15', NULL, 'Renovation and modernization of 50 government schools.'),
('TND-2024-006', 'Solar Power Plant Installation (5MW)', 'Renewable Energy', 'Rajasthan', 'Western', 'Jodhpur', 95000000.00, 'open', '2024-04-15', '2024-06-01', NULL, 'Installation of 5MW solar power plant on government land.'),
('TND-2024-007', 'Bridge Construction over River Ganga', 'Public Works', 'Uttar Pradesh', 'Eastern', 'Varanasi', 250000000.00, 'awarded', '2023-11-01', '2024-01-15', '2024-02-01', 'Construction of a 4-lane bridge over River Ganga.'),
('TND-2024-008', 'Metro Rail Extension (Line 3)', 'Metro Rail Corporation', 'Maharashtra', 'Western', 'Mumbai', 500000000.00, 'open', '2024-05-01', '2024-07-31', NULL, 'Extension of Metro Line 3 by 12 km with 8 new stations.'),
('TND-2024-009', 'IT Infrastructure for e-Governance', 'Information Technology', 'Telangana', 'Southern', 'Hyderabad', 15000000.00, 'awarded', '2024-02-15', '2024-03-30', '2024-04-10', 'Setting up IT infrastructure for state e-governance portal.'),
('TND-2024-010', 'Flood Protection Embankment', 'Water Resources', 'Himachal Pradesh', 'Northern', 'Kullu', 42000000.00, 'under_evaluation', '2024-03-20', '2024-05-05', NULL, 'Construction of flood protection embankment along Beas river.');

-- ============================================================================
-- Sample Bids
-- ============================================================================
INSERT INTO bids (tender_id, contractor_id, bid_amount, bid_date, bid_status, technical_score, financial_score, is_winner)
SELECT t.id, c.id, bid_amount, bid_date::timestamptz, bid_status, tech_score, fin_score, winner
FROM (VALUES
    ('TND-2024-001', 'REG-BC-001', 43500000.00, '2024-02-20', 'accepted', 85.50, 90.00, true),
    ('TND-2024-001', 'REG-IS-002', 47200000.00, '2024-02-22', 'rejected', 78.00, 72.50, false),
    ('TND-2024-001', 'REG-GE-003', 44800000.00, '2024-02-25', 'rejected', 80.00, 85.00, false),
    ('TND-2024-002', 'REG-NR-004', 172000000.00, '2024-03-10', 'accepted', 92.00, 88.50, true),
    ('TND-2024-002', 'REG-IS-002', 185000000.00, '2024-03-12', 'rejected', 75.50, 70.00, false),
    ('TND-2024-004', 'REG-NR-004', 33500000.00, '2024-02-28', 'accepted', 88.00, 91.00, true),
    ('TND-2024-004', 'REG-SI-008', 36200000.00, '2024-03-01', 'rejected', 72.00, 68.50, false),
    ('TND-2024-005', 'REG-BC-001', 26500000.00, '2024-05-01', 'submitted', 82.50, NULL, false),
    ('TND-2024-005', 'REG-GE-003', 27800000.00, '2024-05-05', 'submitted', 79.00, NULL, false),
    ('TND-2024-005', 'REG-HW-006', 29500000.00, '2024-05-08', 'submitted', 74.50, NULL, false),
    ('TND-2024-007', 'REG-IS-002', 245000000.00, '2024-01-10', 'accepted', 90.00, 87.00, true),
    ('TND-2024-007', 'REG-BC-001', 260000000.00, '2024-01-12', 'rejected', 85.00, 78.00, false),
    ('TND-2024-007', 'REG-NR-004', 248000000.00, '2024-01-13', 'rejected', 88.50, 82.50, false),
    ('TND-2024-009', 'REG-DE-007', 14200000.00, '2024-03-20', 'accepted', 95.00, 92.00, true),
    ('TND-2024-009', 'REG-SI-008', 15800000.00, '2024-03-22', 'rejected', 70.00, 65.00, false)
) AS v(tender_ref, contractor_reg, bid_amount, bid_date, bid_status, tech_score, fin_score, winner)
JOIN tenders t ON t.tender_id = v.tender_ref
JOIN contractors c ON c.registration_number = v.contractor_reg;

-- ============================================================================
-- Sample BOQ Items
-- ============================================================================
INSERT INTO boq_items (tender_id, item_number, description, unit, quantity, estimated_rate, estimated_amount)
SELECT t.id, item_number, description, unit, quantity, rate, amount
FROM (VALUES
    ('TND-2024-001', 'BOQ-001', 'Earth excavation and leveling', 'Cubic Meter', 5000.0000, 450.00, 2250000.00),
    ('TND-2024-001', 'BOQ-002', 'RCC Foundation work', 'Cubic Meter', 2000.0000, 8500.00, 17000000.00),
    ('TND-2024-001', 'BOQ-003', 'Brick masonry walls', 'Square Meter', 8000.0000, 1200.00, 9600000.00),
    ('TND-2024-001', 'BOQ-004', 'Plumbing and sanitary work', 'Lump Sum', 1.0000, 5500000.00, 5500000.00),
    ('TND-2024-001', 'BOQ-005', 'Electrical wiring and fixtures', 'Lump Sum', 1.0000, 4800000.00, 4800000.00),
    ('TND-2024-002', 'BOQ-001', 'Road base preparation', 'Kilometer', 85.0000, 500000.00, 42500000.00),
    ('TND-2024-002', 'BOQ-002', 'Bituminous surface layer', 'Kilometer', 85.0000, 800000.00, 68000000.00),
    ('TND-2024-002', 'BOQ-003', 'Drainage and culvert work', 'Number', 25.0000, 1200000.00, 30000000.00),
    ('TND-2024-002', 'BOQ-004', 'Road marking and signage', 'Kilometer', 85.0000, 150000.00, 12750000.00)
) AS v(tender_ref, item_number, description, unit, quantity, rate, amount)
JOIN tenders t ON t.tender_id = v.tender_ref;

-- ============================================================================
-- Sample Contractor Performance
-- ============================================================================
INSERT INTO contractor_performance (contractor_id, tender_id, project_value, completion_status, planned_duration_days, actual_duration_days, delay_days, quality_rating, remarks)
SELECT c.id, t.id, project_value, comp_status, planned, actual, delay, quality, remarks
FROM (VALUES
    ('REG-BC-001', 'TND-2024-001', 43500000.00, 'in_progress', 365, NULL, 0, NULL, 'Project ongoing, on schedule'),
    ('REG-NR-004', 'TND-2024-002', 172000000.00, 'in_progress', 730, NULL, 45, NULL, 'Minor delays due to monsoon'),
    ('REG-NR-004', 'TND-2024-004', 33500000.00, 'completed', 180, 210, 30, 3.50, 'Completed with minor delays'),
    ('REG-IS-002', 'TND-2024-007', 245000000.00, 'in_progress', 1095, NULL, 0, NULL, 'Major bridge construction underway'),
    ('REG-DE-007', 'TND-2024-009', 14200000.00, 'completed', 120, 115, 0, 4.50, 'Completed ahead of schedule, excellent quality')
) AS v(contractor_reg, tender_ref, project_value, comp_status, planned, actual, delay, quality, remarks)
JOIN contractors c ON c.registration_number = v.contractor_reg
JOIN tenders t ON t.tender_id = v.tender_ref;

-- ============================================================================
-- Sample Risk Results
-- ============================================================================
INSERT INTO risk_results (tender_id, contractor_id, overall_score, risk_level, price_score, bid_pattern_score, boq_score, contractor_score, document_score, reasons, evidence)
SELECT t.id, c.id, overall, risk_lvl::risk_level_type, price, bid_pat, boq, contr, doc,
       reasons::jsonb, evidence::jsonb
FROM (VALUES
    ('TND-2024-001', 'REG-BC-001', 35.00, 'MEDIUM', 8.00, 10.00, 5.00, 7.00, 5.00,
     '["Bid amount is 3.3% below estimated value - within normal range", "Three bidders participated - adequate competition", "Review recommended: contractor has limited completed projects in this category"]',
     '{"priceDeviation": -3.3, "bidderCount": 3, "bidSpread": 0.08, "contractorProjectCount": 2}'),
    ('TND-2024-002', 'REG-NR-004', 52.00, 'MEDIUM', 12.00, 14.00, 8.00, 12.00, 6.00,
     '["Bid amount is 4.4% below estimated value", "Only 2 bidders - limited competition detected", "Potential anomaly: contractor shows delay pattern in historical projects", "Review recommended: high-value tender with limited competition"]',
     '{"priceDeviation": -4.4, "bidderCount": 2, "bidSpread": 0.07, "contractorDelayRate": 0.5, "historicalDelays": 1}'),
    ('TND-2024-007', 'REG-IS-002', 28.00, 'LOW', 5.00, 6.00, 4.00, 8.00, 5.00,
     '["Price within expected range for bridge construction", "Three bidders with healthy competition", "Contractor has adequate experience in infrastructure projects"]',
     '{"priceDeviation": -2.0, "bidderCount": 3, "bidSpread": 0.06, "contractorProjectCount": 5}'),
    ('TND-2024-009', 'REG-DE-007', 18.00, 'LOW', 3.00, 4.00, 2.00, 5.00, 4.00,
     '["Bid pricing is competitive and within expected range", "Contractor has excellent historical performance", "No significant anomalies detected"]',
     '{"priceDeviation": -5.3, "bidderCount": 2, "contractorQualityRating": 4.5, "completedOnTime": true}')
) AS v(tender_ref, contractor_reg, overall, risk_lvl, price, bid_pat, boq, contr, doc, reasons, evidence)
JOIN tenders t ON t.tender_id = v.tender_ref
JOIN contractors c ON c.registration_number = v.contractor_reg;
