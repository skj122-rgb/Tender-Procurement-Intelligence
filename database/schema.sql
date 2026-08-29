-- ============================================================================
-- GOVERNMENT PROCUREMENT INTELLIGENCE SYSTEM
-- PostgreSQL Schema Definition
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enumerated Types
CREATE TYPE user_role AS ENUM ('officer', 'admin');
CREATE TYPE account_status_type AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE otp_purpose_type AS ENUM (
    'SIGNUP_EMAIL',
    'SIGNUP_PHONE',
    'PASSWORD_RESET_EMAIL',
    'PASSWORD_RESET_PHONE'
);
CREATE TYPE risk_level_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE data_source_type AS ENUM ('csv', 'json', 'pdf', 'api', 'xls', 'xlsx');
CREATE TYPE data_source_status_type AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 3. Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE 1: users
-- ============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_id       VARCHAR(50)  NOT NULL UNIQUE,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone_number    VARCHAR(30)  NOT NULL UNIQUE,
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    phone_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    account_status  account_status_type NOT NULL DEFAULT 'pending',
    role            user_role    NOT NULL DEFAULT 'officer',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: otp_verifications
-- ============================================================================
CREATE TABLE otp_verifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash     VARCHAR(255) NOT NULL,
    purpose      otp_purpose_type NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
    expires_at   TIMESTAMPTZ NOT NULL,
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 3: token_blacklist
-- ============================================================================
CREATE TABLE token_blacklist (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_jti  VARCHAR(255) NOT NULL UNIQUE,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 4: tenders
-- ============================================================================
CREATE TABLE tenders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id       VARCHAR(100) NOT NULL UNIQUE,
    title           VARCHAR(500) NOT NULL,
    department      VARCHAR(255) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    region          VARCHAR(100),
    district        VARCHAR(100),
    estimated_value NUMERIC(18,2) NOT NULL CHECK (estimated_value >= 0),
    tender_status   VARCHAR(50)  NOT NULL DEFAULT 'open',
    open_date       TIMESTAMPTZ,
    close_date      TIMESTAMPTZ,
    award_date      TIMESTAMPTZ,
    description     TEXT,
    source_id       VARCHAR(100),
    cppp_notice_brief JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tender_dates CHECK (
        close_date IS NULL OR open_date IS NULL OR close_date >= open_date
    )
);

CREATE TRIGGER trg_tenders_updated_at
BEFORE UPDATE ON tenders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 5: contractors
-- ============================================================================
CREATE TABLE contractors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    address             TEXT,
    state               VARCHAR(100),
    website             VARCHAR(255),
    contact_email       VARCHAR(255),
    contact_phone       VARCHAR(30),
    established_date    DATE,
    category            VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_contractors_updated_at
BEFORE UPDATE ON contractors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 6: bids
-- ============================================================================
CREATE TABLE bids (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id       UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    contractor_id   UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    bid_amount      NUMERIC(18,2) NOT NULL CHECK (bid_amount >= 0),
    bid_date        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bid_status      VARCHAR(50) NOT NULL DEFAULT 'submitted',
    technical_score NUMERIC(5,2) CHECK (technical_score BETWEEN 0 AND 100),
    financial_score NUMERIC(5,2) CHECK (financial_score BETWEEN 0 AND 100),
    is_winner       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tender_contractor_bid UNIQUE (tender_id, contractor_id)
);

-- ============================================================================
-- TABLE 7: boq_items (Bill of Quantities)
-- ============================================================================
CREATE TABLE boq_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id        UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    item_number      VARCHAR(50) NOT NULL,
    description      TEXT NOT NULL,
    unit             VARCHAR(50) NOT NULL,
    quantity         NUMERIC(14,4) NOT NULL CHECK (quantity >= 0),
    estimated_rate   NUMERIC(18,2) NOT NULL CHECK (estimated_rate >= 0),
    estimated_amount NUMERIC(18,2) NOT NULL CHECK (estimated_amount >= 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tender_boq_item UNIQUE (tender_id, item_number)
);

-- ============================================================================
-- TABLE 8: contractor_performance
-- ============================================================================
CREATE TABLE contractor_performance (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id         UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    tender_id             UUID REFERENCES tenders(id) ON DELETE SET NULL,
    project_value         NUMERIC(18,2) NOT NULL CHECK (project_value >= 0),
    completion_status     VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    planned_duration_days INTEGER NOT NULL CHECK (planned_duration_days > 0),
    actual_duration_days  INTEGER CHECK (actual_duration_days >= 0),
    delay_days            INTEGER DEFAULT 0,
    quality_rating        NUMERIC(3,2) CHECK (quality_rating BETWEEN 1.00 AND 5.00),
    remarks               TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 9: risk_results
-- ============================================================================
CREATE TABLE risk_results (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id         UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    contractor_id     UUID REFERENCES contractors(id) ON DELETE CASCADE,
    overall_score     NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    risk_level        risk_level_type NOT NULL,
    price_score       NUMERIC(5,2) CHECK (price_score BETWEEN 0 AND 100),
    bid_pattern_score NUMERIC(5,2) CHECK (bid_pattern_score BETWEEN 0 AND 100),
    boq_score         NUMERIC(5,2) CHECK (boq_score BETWEEN 0 AND 100),
    contractor_score  NUMERIC(5,2) CHECK (contractor_score BETWEEN 0 AND 100),
    document_score    NUMERIC(5,2) CHECK (document_score BETWEEN 0 AND 100),
    reasons           JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence          JSONB NOT NULL DEFAULT '{}'::jsonb,
    analyzed_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 10: data_sources
-- ============================================================================
CREATE TABLE data_sources (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    type         data_source_type NOT NULL,
    file_path    TEXT,
    upload_date  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    record_count INTEGER NOT NULL DEFAULT 0 CHECK (record_count >= 0),
    status       data_source_status_type NOT NULL DEFAULT 'pending',
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 11: documents
-- ============================================================================
CREATE TABLE documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id   UUID REFERENCES tenders(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(100) NOT NULL,
    file_path   TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users & Auth
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_otp_user_purpose ON otp_verifications(user_id, purpose, expires_at);
CREATE INDEX idx_token_blacklist_active ON token_blacklist(token_jti, expires_at);

-- Tenders
CREATE INDEX idx_tenders_dept_state ON tenders(department, state);
CREATE INDEX idx_tenders_status ON tenders(tender_status);
CREATE INDEX idx_tenders_region_district ON tenders(state, region, district);
CREATE INDEX idx_tenders_estimated_val ON tenders(estimated_value);

-- Contractors
CREATE INDEX idx_contractors_state_category ON contractors(state, category);

-- Bids
CREATE INDEX idx_bids_tender ON bids(tender_id);
CREATE INDEX idx_bids_contractor ON bids(contractor_id);
CREATE INDEX idx_bids_tender_amount ON bids(tender_id, bid_amount);

-- BOQ
CREATE INDEX idx_boq_tender ON boq_items(tender_id);

-- Performance
CREATE INDEX idx_perf_contractor ON contractor_performance(contractor_id);
CREATE INDEX idx_perf_tender ON contractor_performance(tender_id);

-- Risk Results
CREATE INDEX idx_risk_tender ON risk_results(tender_id);
CREATE INDEX idx_risk_contractor ON risk_results(contractor_id);
CREATE INDEX idx_risk_level ON risk_results(risk_level);
CREATE INDEX idx_risk_score_desc ON risk_results(overall_score DESC);
CREATE INDEX idx_risk_reasons_gin ON risk_results USING gin (reasons);
CREATE INDEX idx_risk_evidence_gin ON risk_results USING gin (evidence);

-- Data Sources
CREATE INDEX idx_data_sources_status ON data_sources(status);
CREATE INDEX idx_data_sources_type ON data_sources(type);

-- Documents
CREATE INDEX idx_documents_tender ON documents(tender_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
