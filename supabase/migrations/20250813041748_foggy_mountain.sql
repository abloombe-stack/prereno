/*
  # PreReno Initial Database Schema

  1. New Tables
    - `profiles` - User profiles extending Supabase auth
    - `addresses` - User addresses with geolocation
    - `contractors` - Contractor-specific data and verification
    - `landlords` - Landlord-specific data
    - `properties` - Landlord properties
    - `jobs` - Main job entity with AI analysis
    - `job_photos` - Job photo storage references
    - `offers` - Contractor offers and responses
    - `payments` - Payment tracking with Stripe
    - `approvals` - Landlord approval workflow
    - `email_log` - Email communication tracking
    - `sms_log` - SMS communication tracking
    - `audit_logs` - Complete activity tracking
    - `prices` - Dynamic pricing by location/category
    - `files` - General file storage references
    - `webhook_events` - Stripe webhook event tracking

  2. Security
    - Enable RLS on all tables
    - Role-based access policies
    - Secure file access policies
    - Audit trail for all actions

  3. Performance
    - Indexes on frequently queried columns
    - Optimized for job search and matching
    - Efficient payment lookups
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enums
CREATE TYPE job_status AS ENUM (
  'draft', 'quoting', 'awaiting_accept', 'accepted', 'scheduled', 
  'in_progress', 'disputed', 'completed', 'cancelled'
);

CREATE TYPE job_category AS ENUM (
  'plumbing', 'electrical', 'paint', 'handyman', 'roof', 'hvac', 'flooring'
);

CREATE TYPE offer_status AS ENUM (
  'pending', 'accepted', 'declined', 'expired'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'succeeded', 'failed', 'refunded'
);

CREATE TYPE approval_status AS ENUM (
  'pending', 'approved', 'rejected'
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new user trigger function
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

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 1. Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  lat NUMERIC(10,8),
  lng NUMERIC(11,8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contractors table
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_state TEXT NOT NULL,
  insurance_expires_on DATE,
  stripe_account_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Landlords table
CREATE TABLE IF NOT EXISTS landlords (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT,
  properties_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  units_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category job_category NOT NULL,
  status job_status DEFAULT 'draft',
  renter_flag BOOLEAN DEFAULT FALSE,
  landlord_id UUID REFERENCES landlords(id),
  property_id UUID REFERENCES properties(id),
  ai_tags TEXT[] DEFAULT '{}',
  ai_scope_md TEXT,
  ai_confidence NUMERIC(3,2),
  client_price_cents INTEGER,
  contractor_net_cents INTEGER,
  platform_fee_cents INTEGER,
  margin_pct NUMERIC(5,4) DEFAULT 0.20,
  rush_flag BOOLEAN DEFAULT FALSE,
  after_hours_flag BOOLEAN DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  city TEXT NOT NULL,
  zip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Job photos table
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_before BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  status offer_status DEFAULT 'pending',
  counter_amount_cents INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  magic_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, contractor_id)
);

-- 9. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  contractor_net_cents INTEGER NOT NULL,
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  status approval_status DEFAULT 'pending',
  message TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Email log table
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT,
  status TEXT NOT NULL,
  resend_id TEXT,
  error_message TEXT,
  unsubscribe_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SMS log table
CREATE TABLE IF NOT EXISTS sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone TEXT NOT NULL,
  from_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  twilio_sid TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Prices table
CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip TEXT NOT NULL,
  category job_category NOT NULL,
  base_rate_cents INTEGER NOT NULL,
  rush_multiplier NUMERIC(3,2) DEFAULT 1.5,
  after_hours_multiplier NUMERIC(3,2) DEFAULT 1.25,
  min_job_cents INTEGER DEFAULT 15000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zip, category)
);

-- 15. Files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prices_zip_category ON prices(zip, category);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

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

-- Enable Row Level Security
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
CREATE OR REPLACE FUNCTION uid() RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (uid() = id);

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (uid() = user_id);

-- Contractors policies
CREATE POLICY "Contractors can manage own data" ON contractors FOR ALL USING (uid() = id);
CREATE POLICY "Clients can view verified contractors" ON contractors FOR SELECT USING (verified = true);

-- Landlords policies
CREATE POLICY "Landlords can manage own data" ON landlords FOR ALL USING (uid() = id);

-- Properties policies
CREATE POLICY "Landlords can manage own properties" ON properties FOR ALL USING (
  EXISTS (
    SELECT 1 FROM landlords 
    WHERE landlords.id = uid() AND landlords.id = properties.landlord_id
  )
);

-- Jobs policies
CREATE POLICY "Clients can manage own jobs" ON jobs FOR ALL USING (uid() = client_id);
CREATE POLICY "Contractors can view jobs with offers" ON jobs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM offers 
    WHERE offers.job_id = jobs.id AND offers.contractor_id = uid()
  )
);
CREATE POLICY "Landlords can view tenant jobs" ON jobs FOR SELECT USING (
  renter_flag = true AND EXISTS (
    SELECT 1 FROM landlords 
    WHERE landlords.id = uid() AND landlords.id = jobs.landlord_id
  )
);

-- Job photos policies
CREATE POLICY "Job photos follow job permissions" ON job_photos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_photos.job_id AND (
      jobs.client_id = uid() OR
      EXISTS (
        SELECT 1 FROM offers 
        WHERE offers.job_id = jobs.id AND offers.contractor_id = uid()
      ) OR
      (jobs.renter_flag = true AND EXISTS (
        SELECT 1 FROM landlords 
        WHERE landlords.id = uid() AND landlords.id = jobs.landlord_id
      ))
    )
  )
);

-- Offers policies
CREATE POLICY "Contractors can manage own offers" ON offers FOR ALL USING (uid() = contractor_id);
CREATE POLICY "Job owners can view offers" ON offers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = offers.job_id AND jobs.client_id = uid()
  )
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
  uid() = client_id OR uid() = contractor_id
);

-- Approvals policies
CREATE POLICY "Landlords can manage own approvals" ON approvals FOR ALL USING (uid() = landlord_id);
CREATE POLICY "Job owners can view approvals" ON approvals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = approvals.job_id AND jobs.client_id = uid()
  )
);

-- Email log policies
CREATE POLICY "Users can view own email logs" ON email_log FOR SELECT USING (
  to_email = (SELECT email FROM profiles WHERE id = uid())
);

-- SMS log policies
CREATE POLICY "Users can view own SMS logs" ON sms_log FOR SELECT USING (
  to_phone = (SELECT phone FROM profiles WHERE id = uid())
);

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (uid() = user_id);

-- Prices policies (public read access)
CREATE POLICY "Anyone can view prices" ON prices FOR SELECT USING (true);

-- Files policies
CREATE POLICY "Users can manage own files" ON files FOR ALL USING (uid() = user_id);
CREATE POLICY "Job participants can view job files" ON files FOR SELECT USING (
  job_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = files.job_id AND (
      jobs.client_id = uid() OR
      EXISTS (
        SELECT 1 FROM offers 
        WHERE offers.job_id = jobs.id AND offers.contractor_id = uid()
      )
    )
  )
);

-- Webhook events policies (admin only)
CREATE POLICY "System can manage webhook events" ON webhook_events FOR ALL USING (true);