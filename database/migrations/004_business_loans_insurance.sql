-- Business, Loans, and Insurance Migration
-- Migration: 004_business_loans_insurance
-- Description: Add business accounts, lending, and insurance functionality

-- ============================================================================
-- BUSINESS ACCOUNTS
-- ============================================================================

-- Business profiles
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(100),
    registration_number VARCHAR(100),
    tax_id VARCHAR(50),
    incorporation_country VARCHAR(2),
    business_address JSONB,
    website_url TEXT,
    employee_count INTEGER,
    annual_revenue DECIMAL(15, 2),
    industry VARCHAR(100),
    business_description TEXT,
    compliance_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business team members
CREATE TABLE business_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ,
    UNIQUE(business_id, user_id)
);

-- ============================================================================
-- LOANS AND LENDING
-- ============================================================================

-- Loan applications
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_amount DECIMAL(20, 2) NOT NULL,
    loan_currency stablecoin_symbol NOT NULL,
    collateral_amount DECIMAL(36, 18) NOT NULL,
    collateral_token VARCHAR(20) NOT NULL,
    collateral_chain chain_id NOT NULL,
    ltv_ratio DECIMAL(5, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    loan_term_months INTEGER NOT NULL,
    application_status VARCHAR(50) DEFAULT 'pending',
    risk_assessment JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active loans
CREATE TABLE active_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES loan_applications(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    principal_amount DECIMAL(20, 2) NOT NULL,
    outstanding_balance DECIMAL(20, 2) NOT NULL,
    interest_accrued DECIMAL(20, 2) DEFAULT 0,
    collateral_locked DECIMAL(36, 18) NOT NULL,
    current_ltv DECIMAL(5, 2) NOT NULL,
    liquidation_threshold DECIMAL(5, 2) NOT NULL,
    next_payment_due TIMESTAMPTZ,
    payment_amount DECIMAL(20, 2) NOT NULL,
    loan_status VARCHAR(50) DEFAULT 'active',
    disbursed_at TIMESTAMPTZ NOT NULL,
    maturity_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Loan payments
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES active_loans(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    payment_amount DECIMAL(20, 2) NOT NULL,
    principal_portion DECIMAL(20, 2) NOT NULL,
    interest_portion DECIMAL(20, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INSURANCE
-- ============================================================================

-- Insurance policies
CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_name VARCHAR(200) NOT NULL,
    policy_type VARCHAR(100) NOT NULL,
    coverage_amount DECIMAL(20, 2) NOT NULL,
    premium_amount DECIMAL(20, 2) NOT NULL,
    premium_frequency VARCHAR(20) NOT NULL,
    coverage_details JSONB NOT NULL,
    policy_status VARCHAR(50) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    next_premium_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insurance claims
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claim_amount DECIMAL(20, 2) NOT NULL,
    claim_reason TEXT NOT NULL,
    incident_date TIMESTAMPTZ NOT NULL,
    supporting_documents JSONB,
    claim_status VARCHAR(50) DEFAULT 'submitted',
    assessor_notes TEXT,
    payout_amount DECIMAL(20, 2),
    payout_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_team_members_business_id ON business_team_members(business_id);
CREATE INDEX idx_business_team_members_user_id ON business_team_members(user_id);
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(application_status);
CREATE INDEX idx_active_loans_user_id ON active_loans(user_id);
CREATE INDEX idx_active_loans_status ON active_loans(loan_status);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_status ON insurance_policies(policy_status);
CREATE INDEX idx_insurance_claims_policy_id ON insurance_claims(policy_id);
CREATE INDEX idx_insurance_claims_user_id ON insurance_claims(user_id);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON loan_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_active_loans_updated_at BEFORE UPDATE ON active_loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();