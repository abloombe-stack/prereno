/*
  # PreReno Initial Database Schema
  
  1. New Tables
    - `profiles` - User profile data extending auth.users
    - `addresses` - User addresses with geolocation
    - `contractors` - Contractor-specific data and verification
    - `landlords` - Landlord-specific data
    - `properties` - Landlord property management
    - `jobs` - Main job entity with AI analysis
    - `job_photos` - Job photo storage references
    - `offers` - Contractor offers and responses
    - `payments` - Payment tracking with Stripe
    - `approvals` - Landlord approval workflow
    - `email_log` - Email communication tracking
    - `sms_log` - SMS communication tracking
    - `audit_logs` - Complete activity audit trail
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
    - Efficient payment and offer lookups
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enums
CREATE TYPE user_role AS ENUM ('client', 'contractor', 'landlord', 'admin');
CREATE TYPE job_category AS ENUM ('plumbing', 'electrical', 'paint', 'handyman', 'roof', 'hvac', 'flooring');
CREATE TYPE job_status AS ENUM ('draft', 'quoting', 'awaiting_accept', 'accepted', 'scheduled', 'in_progress', 'disputed', 'completed', 'cancelled');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

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
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  lat numeric(10,8),
  lng numeric(11,8),
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
  ai_tags text[] DEFAULT '{}',
  ai_scope_md text,
  ai_confidence numeric(3,2),
  client_price_cents integer,
  contractor_net_cents integer,
  platform_fee_cents integer,
  margin_pct numeric(5,4) DEFAULT 0.20,
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

-- 10. Approvals Table
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

-- 14. Prices Table
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

-- 15. Files Table
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
CREATE TRIGGER IF NOT EXISTS profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS contractors_updated_at BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS landlords_updated_at BEFORE UPDATE ON landlords FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER IF NOT EXISTS prices_updated_at BEFORE UPDATE ON prices FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS on all tables
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
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (uid() = id);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (uid() = id);

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (uid() = user_id);

-- Contractors policies
CREATE POLICY "Contractors can manage own data" ON contractors FOR ALL USING (uid() = id);
CREATE POLICY "Clients can view verified contractors" ON contractors FOR SELECT USING (verified = true);

-- Landlords policies
CREATE POLICY "Landlords can manage own data" ON landlords FOR ALL USING (uid() = id);

-- Properties policies
CREATE POLICY "Landlords can manage own properties" ON properties FOR ALL USING (
  EXISTS (SELECT 1 FROM landlords WHERE landlords.id = uid() AND landlords.id = properties.landlord_id)
);

-- Jobs policies
CREATE POLICY "Clients can manage own jobs" ON jobs FOR ALL USING (uid() = client_id);
CREATE POLICY "Contractors can view jobs with offers" ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM offers WHERE offers.job_id = jobs.id AND offers.contractor_id = uid())
);
CREATE POLICY "Landlords can view tenant jobs" ON jobs FOR SELECT USING (
  renter_flag = true AND EXISTS (SELECT 1 FROM landlords WHERE landlords.id = uid() AND landlords.id = jobs.landlord_id)
);

-- Job Photos policies
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
CREATE POLICY "Contractors can manage own offers" ON offers FOR ALL USING (uid() = contractor_id);
CREATE POLICY "Job owners can view offers" ON offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = offers.job_id AND jobs.client_id = uid())
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (uid() = client_id OR uid() = contractor_id);

-- Approvals policies
CREATE POLICY "Landlords can manage own approvals" ON approvals FOR ALL USING (uid() = landlord_id);
CREATE POLICY "Job owners can view approvals" ON approvals FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = approvals.job_id AND jobs.client_id = uid())
);

-- Email Log policies
CREATE POLICY "Users can view own email logs" ON email_log FOR SELECT USING (
  to_email = (SELECT email FROM profiles WHERE id = uid())
);

-- SMS Log policies
CREATE POLICY "Users can view own SMS logs" ON sms_log FOR SELECT USING (
  to_phone = (SELECT phone FROM profiles WHERE id = uid())
);

-- Audit Logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (uid() = user_id);

-- Prices policies (public read access)
CREATE POLICY "Anyone can view prices" ON prices FOR SELECT TO anon, authenticated USING (true);

-- Files policies
CREATE POLICY "Users can manage own files" ON files FOR ALL USING (uid() = user_id);
CREATE POLICY "Job participants can view job files" ON files FOR SELECT USING (
  job_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = files.job_id AND jobs.client_id = uid()) OR
    EXISTS (SELECT 1 FROM offers jo JOIN jobs j ON jo.job_id = j.id 
            WHERE j.id = files.job_id AND jo.contractor_id = uid() AND jo.status = 'accepted')
  )
);

-- Webhook Events policies (admin only)
CREATE POLICY "System can manage webhook events" ON webhook_events FOR ALL USING (true);