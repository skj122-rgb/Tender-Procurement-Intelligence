
-- SEED DATA — Development / Demo

-- Insert demo admin user (password: Admin@123)
-- bcrypt hash for 'Admin@123' with 12 rounds
INSERT INTO users (unique_id, username, password_hash, email, phone_number, email_verified, phone_verified, account_status, role)
VALUES (
    'ADMIN-001',
    'admin',
    '$2b$12$il17B7SilqAxy5Pr2BsWfe4RYtaAiOAv0m/8/YqEnkXoHngK1Uh6O',c
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


