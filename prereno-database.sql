-- PreReno Database Schema and Migrations
-- Execute these SQL commands in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'landlord', 'property_manager', 'contractor', 'admin');
CREATE TYPE job_category AS ENUM ('plumbing', 'electrical', 'paint', 'handyman', 'roof', 'hvac', 'flooring');
CREATE TYPE job_status AS ENUM ('draft', 'quoting', 'awaiting_accept', 'accepted', 'scheduled', 'in_progress', 'disputed', 'completed', 'cancelled');
CREATE TYPE offer_type AS ENUM ('broadcast', 'accept', 'counter', 'decline', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'refunded', 'failed');
CREATE TYPE background_check_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('COI', 'license', 'permit', 'estimate_pdf', 'invoice_pdf', 'insurance_report');
CREATE TYPE referral_status AS ENUM ('sent', 'signed_up', 'booked');

-- 1. User Profiles Table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'client',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Addresses Table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contractors Table (extends profiles for contractor-specific data)
CREATE TABLE contractors (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    ein_vat TEXT,
    license_number TEXT NOT NULL,
    license_state TEXT NOT NULL,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expires_on DATE,
    insurance_document_url TEXT,
    background_check_status background_check_status DEFAULT 'pending',
    stripe_account_id TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Jobs Table (main job entity)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    category job_category NOT NULL,
    renter_flag BOOLEAN DEFAULT FALSE,
    landlord_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    property_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    building_rules_json JSONB,
    status job_status DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    lidar_scan_url TEXT,
    ai_tags TEXT[] DEFAULT '{}',
    ai_scope_md TEXT,
    ai_cost_min_cents INTEGER,
    ai_cost_max_cents INTEGER,
    ai_client_price_cents INTEGER,
    contractor_net_cents INTEGER,
    margin_pct DECIMAL(5,4) DEFAULT 0.2000,
    rush_flag BOOLEAN DEFAULT FALSE,
    after_hours_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Job Offers Table (contractor responses to jobs)
CREATE TABLE job_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    offer_type offer_type NOT NULL DEFAULT 'broadcast',
    counter_net_cents INTEGER,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, contractor_id)
);

-- 6. Payments Table (financial transactions)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL,
    fee_cents INTEGER NOT NULL,
    status payment_status DEFAULT 'pending',
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Documents Table (file storage references)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    url TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reviews Table (ratings and feedback)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    rater_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ratee_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, rater_profile_id, ratee_profile_id)
);

-- 9. Referrals Table (referral tracking)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referee_email TEXT NOT NULL,
    status referral_status DEFAULT 'sent',
    reward_cents INTEGER DEFAULT 2500, -- $25 default
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_profile_id, referee_email)
);

-- 10. Cost Factors Table (pricing data by location/category)
CREATE TABLE cost_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip TEXT NOT NULL,
    category job_category NOT NULL,
    labor_rate_cents_per_hour INTEGER NOT NULL,
    material_multiplier DECIMAL(3,2) DEFAULT 1.30,
    small_job_min_cents INTEGER DEFAULT 15000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zip, category)
);

-- 11. Audit Logs Table (activity tracking)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    meta_json JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_addresses_profile_id ON addresses(profile_id);
CREATE INDEX idx_addresses_zip ON addresses(zip);
CREATE INDEX idx_contractors_verified ON contractors(verified);
CREATE INDEX idx_contractors_license_state ON contractors(license_state);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_zip ON jobs(zip);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_job_offers_job_id ON job_offers(job_id);
CREATE INDEX idx_job_offers_contractor_id ON job_offers(contractor_id);
CREATE INDEX idx_job_offers_expires_at ON job_offers(expires_at);
CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_cost_factors_zip_category ON cost_factors(zip, category);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_addresses BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_contractors BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_jobs BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_job_offers BEFORE UPDATE ON job_offers FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_reviews BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_referrals BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_cost_factors BEFORE UPDATE ON cost_factors FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Addresses policies
CREATE POLICY "Users can manage their own addresses" ON addresses FOR ALL USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Contractors policies
CREATE POLICY "Contractors can view their own data" ON contractors FOR SELECT USING (id = auth.uid());
CREATE POLICY "Contractors can update their own data" ON contractors FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage contractors" ON contractors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can view verified contractors" ON contractors FOR SELECT USING (
    verified = TRUE AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('client', 'landlord', 'property_manager'))
);

-- Jobs policies
CREATE POLICY "Clients can manage their own jobs" ON jobs FOR ALL USING (
    client_id = auth.uid() OR
    (renter_flag = TRUE AND landlord_id = auth.uid()) OR
    (property_manager_id = auth.uid())
);
CREATE POLICY "Contractors can view jobs with offers" ON jobs FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_offers WHERE job_id = jobs.id AND contractor_id = auth.uid()) OR
    status = 'awaiting_accept'
);
CREATE POLICY "Admins can view all jobs" ON jobs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Job offers policies
CREATE POLICY "Contractors can view their own offers" ON job_offers FOR SELECT USING (contractor_id = auth.uid());
CREATE POLICY "Contractors can create offers" ON job_offers FOR INSERT WITH CHECK (contractor_id = auth.uid());
CREATE POLICY "Contractors can update their own offers" ON job_offers FOR UPDATE USING (contractor_id = auth.uid());
CREATE POLICY "Job owners can view offers for their jobs" ON job_offers FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_offers.job_id AND client_id = auth.uid())
);
CREATE POLICY "Admins can view all offers" ON job_offers FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
    client_id = auth.uid() OR contractor_id = auth.uid()
);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Documents policies
CREATE POLICY "Users can manage their own documents" ON documents FOR ALL USING (
    owner_profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Job participants can view job documents" ON documents FOR SELECT USING (
    job_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM jobs WHERE id = documents.job_id AND client_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM job_offers jo JOIN jobs j ON jo.job_id = j.id 
                WHERE j.id = documents.job_id AND jo.contractor_id = auth.uid() AND jo.offer_type = 'accept')
    )
);

-- Reviews policies
CREATE POLICY "Users can view reviews about themselves" ON reviews FOR SELECT USING (
    rater_profile_id = auth.uid() OR ratee_profile_id = auth.uid()
);
CREATE POLICY "Users can create reviews for jobs they participated in" ON reviews FOR INSERT WITH CHECK (
    rater_profile_id = auth.uid() AND (
        EXISTS (SELECT 1 FROM jobs WHERE id = reviews.job_id AND client_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM job_offers jo JOIN jobs j ON jo.job_id = j.id 
                WHERE j.id = reviews.job_id AND jo.contractor_id = auth.uid() AND jo.offer_type = 'accept')
    )
);
CREATE POLICY "Public can view contractor reviews" ON reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM contractors WHERE id = ratee_profile_id AND verified = TRUE)
);

-- Referrals policies
CREATE POLICY "Users can manage their own referrals" ON referrals FOR ALL USING (referrer_profile_id = auth.uid());

-- Cost factors policies (public read access for pricing estimates)
CREATE POLICY "Public can view cost factors" ON cost_factors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage cost factors" ON cost_factors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs FOR SELECT USING (
    actor_profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Create Storage Buckets (run these in Supabase Storage settings or via API)
-- These commands would be run via Supabase client or dashboard

/*
-- Job Photos Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'job-photos',
    'job-photos',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Documents Bucket  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents', 
    false,
    52428800, -- 50MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
);

-- Profile Photos Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);
*/

-- Storage RLS Policies (add these via Supabase dashboard or API)
/*
-- Job Photos Storage Policies
CREATE POLICY "Users can upload job photos" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their job photos" ON storage.objects FOR SELECT
USING (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Job participants can view job photos" ON storage.objects FOR SELECT
USING (
    bucket_id = 'job-photos' AND
    EXISTS (
        SELECT 1 FROM jobs j 
        WHERE j.client_id = auth.uid() 
        AND (storage.foldername(name))[1] = j.client_id::text
    )
);

-- Documents Storage Policies  
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their documents" ON storage.objects FOR SELECT  
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatar Storage Policies
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
*/

-- Insert seed data
INSERT INTO cost_factors (zip, category, labor_rate_cents_per_hour, material_multiplier, small_job_min_cents) VALUES
-- Austin, TX
('78701', 'plumbing', 8500, 1.35, 17500),
('78701', 'electrical', 9000, 1.40, 20000),
('78701', 'handyman', 7500, 1.25, 15000),
('78701', 'paint', 6500, 1.20, 12500),
('78701', 'roof', 10000, 1.50, 30000),
('78701', 'hvac', 11000, 1.45, 25000),
('78701', 'flooring', 8000, 1.35, 20000),

-- Dallas, TX  
('75201', 'plumbing', 8000, 1.30, 16000),
('75201', 'electrical', 8500, 1.35, 18000),
('75201', 'handyman', 7000, 1.25, 14000),
('75201', 'paint', 6000, 1.20, 11000),
('75201', 'roof', 9500, 1.45, 28000),
('75201', 'hvac', 10500, 1.40, 23000),
('75201', 'flooring', 7500, 1.30, 18000),

-- Houston, TX
('77001', 'plumbing', 8200, 1.32, 16500),
('77001', 'electrical', 8700, 1.37, 19000),
('77001', 'handyman', 7200, 1.25, 14500),
('77001', 'paint', 6200, 1.20, 11500),
('77001', 'roof', 9700, 1.47, 29000),
('77001', 'hvac', 10700, 1.42, 24000),
('77001', 'flooring', 7700, 1.32, 19000);

-- Create views for analytics (optional)
CREATE OR REPLACE VIEW contractor_stats AS
SELECT 
    c.id,
    c.company,
    c.verified,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(DISTINCT jo.job_id) FILTER (WHERE jo.offer_type = 'accept') as completed_jobs,
    COUNT(DISTINCT jo.job_id) FILTER (WHERE jo.offer_type = 'broadcast') as total_offers
FROM contractors c
LEFT JOIN job_offers jo ON c.id = jo.contractor_id
LEFT JOIN reviews r ON c.id = r.ratee_profile_id
GROUP BY c.id, c.company, c.verified;

CREATE OR REPLACE VIEW job_metrics AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as jobs_created,
    COUNT(*) FILTER (WHERE status = 'completed') as jobs_completed,
    AVG(ai_client_price_cents) as avg_job_value,
    SUM(ai_client_price_cents) FILTER (WHERE status = 'completed') as total_gmv
FROM jobs
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Helper functions
CREATE OR REPLACE FUNCTION get_contractor_rating(contractor_id UUID)
RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews 
        WHERE ratee_profile_id = contractor_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_job_distance(job_id UUID, contractor_lat DECIMAL, contractor_lng DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    job_lat DECIMAL;
    job_lng DECIMAL;
BEGIN
    SELECT a.lat, a.lng INTO job_lat, job_lng
    FROM jobs j
    JOIN addresses a ON j.address_id = a.id
    WHERE j.id = job_id;
    
    -- Simple distance calculation (Haversine formula would be more accurate)
    RETURN SQRT(POWER(job_lat - contractor_lat, 2) + POWER(job_lng - contractor_lng, 2));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification function for real-time updates
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'job_status_changed',
            json_build_object(
                'job_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'client_id', NEW.client_id
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_status_change_trigger
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_status_change();

-- Final notes and setup verification
SELECT 'PreReno database schema created successfully!' as status;
SELECT 'Remember to:' as reminder;
SELECT '1. Configure storage buckets in Supabase dashboard' as step_1;
SELECT '2. Set up storage RLS policies' as step_2;  
SELECT '3. Configure email and SMS providers' as step_3;
SELECT '4. Add Stripe webhook endpoints' as step_4;
SELECT '5. Seed additional cost_factors for your markets' as step_5;