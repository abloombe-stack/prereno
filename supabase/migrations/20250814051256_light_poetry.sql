/*
# PreReno Initial Database Schema

This migration creates the complete database schema for PreReno including:
1. Custom types and enums
2. Core tables with relationships
3. Row Level Security policies
4. Performance indexes
5. Trigger functions

All tables include proper RLS policies for multi-tenant security.
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing types if they exist to avoid conflicts
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS job_category CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS offer_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'contractor', 'landlord', 'admin');
CREATE TYPE job_category AS ENUM ('plumbing', 'electrical', 'paint', 'handyman', 'roof', 'hvac', 'flooring');
CREATE TYPE job_status AS ENUM ('draft', 'quoting', 'awaiting_accept', 'accepted', 'scheduled', 'in_progress', 'disputed', 'completed', 'cancelled');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    avatar_url text,
    stripe_customer_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    line1 text NOT NULL,
    line2 text,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    lat decimal(10,8),
    lng decimal(11,8),
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Contractors Table
CREATE TABLE IF NOT EXISTS contractors (
    id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    company text NOT NULL,
    license_number text NOT NULL,
    license_state text NOT NULL,
    insurance_expires_on date,
    stripe_account_id text,
    verified boolean DEFAULT false,
    rating numeric(3,2) DEFAULT 0,
    completed_jobs integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Landlords Table
CREATE TABLE IF NOT EXISTS landlords (
    id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    company text,
    properties_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id uuid NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
    address_id uuid NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
    name text NOT NULL,
    units_count integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    address_id uuid NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    category job_category NOT NULL,
    status job_status DEFAULT 'draft',
    renter_flag boolean DEFAULT false,
    landlord_id uuid REFERENCES landlords(id),
    property_id uuid REFERENCES properties(id),
    detected_tags text[] DEFAULT '{}',
    scope_md text,
    client_price_cents integer,
    contractor_net_cents integer,
    platform_fee_cents integer,
    margin_pct numeric(5,4) DEFAULT 0.2000,
    rush_flag boolean DEFAULT false,
    after_hours_flag boolean DEFAULT false,
    scheduled_at timestamptz,
    completed_at timestamptz,
    city text NOT NULL,
    zip text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. Job Photos Table
CREATE TABLE IF NOT EXISTS job_photos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    url text NOT NULL,
    is_before boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 8. Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    status offer_status DEFAULT 'pending',
    counter_amount_cents integer,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    magic_token text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(job_id, contractor_id)
);

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contractor_id uuid REFERENCES contractors(id) ON DELETE CASCADE,
    stripe_payment_intent_id text NOT NULL UNIQUE,
    amount_cents integer NOT NULL,
    platform_fee_cents integer NOT NULL,
    contractor_net_cents integer NOT NULL,
    status payment_status DEFAULT 'pending',
    paid_at timestamptz,
    released_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 10. Approvals Table (for renter jobs)
CREATE TABLE IF NOT EXISTS approvals (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    landlord_id uuid NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
    status approval_status DEFAULT 'pending',
    message text,
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 11. Email Log Table
CREATE TABLE IF NOT EXISTS email_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email text NOT NULL,
    from_email text NOT NULL,
    subject text NOT NULL,
    template_name text,
    status text NOT NULL,
    resend_id text,
    error_message text,
    unsubscribe_token text,
    created_at timestamptz DEFAULT now()
);

-- 12. SMS Log Table
CREATE TABLE IF NOT EXISTS sms_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_phone text NOT NULL,
    from_phone text NOT NULL,
    message text NOT NULL,
    status text NOT NULL,
    twilio_sid text,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- 14. Prices Table (for dynamic pricing)
CREATE TABLE IF NOT EXISTS prices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip text NOT NULL,
    category job_category NOT NULL,
    base_rate_cents integer NOT NULL,
    rush_multiplier numeric(3,2) DEFAULT 1.5,
    after_hours_multiplier numeric(3,2) DEFAULT 1.25,
    min_job_cents integer DEFAULT 15000,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(zip, category)
);

-- 15. Files Table (for document storage)
CREATE TABLE IF NOT EXISTS files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
    filename text NOT NULL,
    url text NOT NULL,
    mime_type text,
    size_bytes integer,
    created_at timestamptz DEFAULT now()
);

-- 16. Webhook Events Table
CREATE TABLE IF NOT EXISTS webhook_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id text NOT NULL UNIQUE,
    event_type text NOT NULL,
    processed boolean DEFAULT false,
    data jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_zip ON addresses(zip);
CREATE INDEX IF NOT EXISTS idx_contractors_verified ON contractors(verified);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_zip ON jobs(zip);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_offers_job_id ON offers(job_id);
CREATE INDEX IF NOT EXISTS idx_offers_contractor_id ON offers(contractor_id);
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_approvals_job_id ON approvals(job_id);
CREATE INDEX IF NOT EXISTS idx_approvals_landlord_id ON approvals(landlord_id);
CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_log_created_at ON sms_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prices_zip_category ON prices(zip, category);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS addresses_updated_at ON addresses;
CREATE TRIGGER addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS contractors_updated_at ON contractors;
CREATE TRIGGER contractors_updated_at BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS landlords_updated_at ON landlords;
CREATE TRIGGER landlords_updated_at BEFORE UPDATE ON landlords FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS offers_updated_at ON offers;
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS approvals_updated_at ON approvals;
CREATE TRIGGER approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS prices_updated_at ON prices;
CREATE TRIGGER prices_updated_at BEFORE UPDATE ON prices FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION uid() RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (uid() = id);

-- Addresses policies
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (uid() = user_id);

-- Contractors policies
DROP POLICY IF EXISTS "Contractors can manage own data" ON contractors;
CREATE POLICY "Contractors can manage own data" ON contractors FOR ALL USING (uid() = id);

DROP POLICY IF EXISTS "Clients can view verified contractors" ON contractors;
CREATE POLICY "Clients can view verified contractors" ON contractors FOR SELECT USING (verified = true);

-- Landlords policies
DROP POLICY IF EXISTS "Landlords can manage own data" ON landlords;
CREATE POLICY "Landlords can manage own data" ON landlords FOR ALL USING (uid() = id);

-- Properties policies
DROP POLICY IF EXISTS "Landlords can manage own properties" ON properties;
CREATE POLICY "Landlords can manage own properties" ON properties FOR ALL USING (
    EXISTS (SELECT 1 FROM landlords WHERE landlords.id = uid() AND landlords.id = properties.landlord_id)
);

-- Jobs policies
DROP POLICY IF EXISTS "Clients can manage own jobs" ON jobs;
CREATE POLICY "Clients can manage own jobs" ON jobs FOR ALL USING (uid() = client_id);

DROP POLICY IF EXISTS "Contractors can view jobs with offers" ON jobs;
CREATE POLICY "Contractors can view jobs with offers" ON jobs FOR SELECT USING (
    EXISTS (SELECT 1 FROM offers WHERE offers.job_id = jobs.id AND offers.contractor_id = uid())
);

DROP POLICY IF EXISTS "Landlords can view tenant jobs" ON jobs;
CREATE POLICY "Landlords can view tenant jobs" ON jobs FOR SELECT USING (
    renter_flag = true AND EXISTS (SELECT 1 FROM landlords WHERE landlords.id = uid() AND landlords.id = jobs.landlord_id)
);

-- Job photos policies
DROP POLICY IF EXISTS "Job photos follow job permissions" ON job_photos;
CREATE POLICY "Job photos follow job permissions" ON job_photos FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_photos.job_id 
        AND (
            jobs.client_id = uid() 
            OR EXISTS (SELECT 1 FROM offers WHERE offers.job_id = jobs.id AND offers.contractor_id = uid())
            OR (jobs.renter_flag = true AND EXISTS (SELECT 1 FROM landlords WHERE landlords.id = uid() AND landlords.id = jobs.landlord_id))
        )
    )
);

-- Offers policies
DROP POLICY IF EXISTS "Contractors can manage own offers" ON offers;
CREATE POLICY "Contractors can manage own offers" ON offers FOR ALL USING (uid() = contractor_id);

DROP POLICY IF EXISTS "Job owners can view offers" ON offers;
CREATE POLICY "Job owners can view offers" ON offers FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = offers.job_id AND jobs.client_id = uid())
);

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
    uid() = client_id OR uid() = contractor_id
);

-- Approvals policies
DROP POLICY IF EXISTS "Landlords can manage own approvals" ON approvals;
CREATE POLICY "Landlords can manage own approvals" ON approvals FOR ALL USING (uid() = landlord_id);

DROP POLICY IF EXISTS "Job owners can view approvals" ON approvals;
CREATE POLICY "Job owners can view approvals" ON approvals FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = approvals.job_id AND jobs.client_id = uid())
);

-- Email log policies
DROP POLICY IF EXISTS "Users can view own email logs" ON email_log;
CREATE POLICY "Users can view own email logs" ON email_log FOR SELECT USING (
    to_email = (SELECT email FROM profiles WHERE id = uid())
);

-- SMS log policies
DROP POLICY IF EXISTS "Users can view own SMS logs" ON sms_log;
CREATE POLICY "Users can view own SMS logs" ON sms_log FOR SELECT USING (
    to_phone = (SELECT phone FROM profiles WHERE id = uid())
);

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (uid() = user_id);

-- Prices policies (public read access)
DROP POLICY IF EXISTS "Anyone can view prices" ON prices;
CREATE POLICY "Anyone can view prices" ON prices FOR SELECT TO anon, authenticated USING (true);

-- Files policies
DROP POLICY IF EXISTS "Users can manage own files" ON files;
CREATE POLICY "Users can manage own files" ON files FOR ALL USING (uid() = user_id);

DROP POLICY IF EXISTS "Job participants can view job files" ON files;
CREATE POLICY "Job participants can view job files" ON files FOR SELECT USING (
    job_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = files.job_id 
        AND (
            jobs.client_id = uid() 
            OR EXISTS (SELECT 1 FROM offers WHERE offers.job_id = jobs.id AND offers.contractor_id = uid())
        )
    )
);

-- Webhook events policies
DROP POLICY IF EXISTS "Service role can manage webhook events" ON webhook_events;
CREATE POLICY "Service role can manage webhook events" ON webhook_events FOR ALL USING (true);

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

DROP TRIGGER IF EXISTS job_status_change_trigger ON jobs;
CREATE TRIGGER job_status_change_trigger
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_status_change();

-- Create user profile trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

SELECT 'PreReno database schema created successfully!' as status;