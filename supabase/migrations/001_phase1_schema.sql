-- Phase 1 Schema: Auth, Subscriptions, Scans, Monitoring
-- Run against Supabase project: hiewpucvyhuctrmmgrpy

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscriptions / plan tracking
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free',          -- 'free', 'starter', 'pro'
    status TEXT NOT NULL DEFAULT 'active',      -- 'active', 'cancelled', 'past_due'
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Scans
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',     -- 'pending', 'running', 'complete', 'failed'
    risk_score INTEGER,
    risk_label TEXT,                            -- 'Low', 'Medium', 'High', 'Critical'
    subdomain_count INTEGER DEFAULT 0,
    open_ports_count INTEGER DEFAULT 0,
    cve_count INTEGER DEFAULT 0,
    result_json JSONB,                         -- full scan result blob
    error_message TEXT,
    scan_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Monitored domains (for scheduled re-scanning / alerts)
CREATE TABLE IF NOT EXISTS monitored_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    scan_frequency TEXT NOT NULL DEFAULT 'weekly',  -- 'daily', 'weekly', 'monthly'
    last_scanned_at TIMESTAMPTZ,
    last_scan_id UUID REFERENCES scans(id),
    alert_on_new_subdomain BOOLEAN DEFAULT TRUE,
    alert_on_new_cve BOOLEAN DEFAULT TRUE,
    alert_on_risk_increase BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, domain)
);

-- RLS: Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only see their own data
CREATE POLICY "Users see own subscriptions"
    ON subscriptions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users see own scans"
    ON scans FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users see own monitored domains"
    ON monitored_domains FOR ALL
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_domain ON scans(domain);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX idx_monitored_domains_user_id ON monitored_domains(user_id);

-- Auto-provision free subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
