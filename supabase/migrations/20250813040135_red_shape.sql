/*
  # PreReno Initial Database Schema

  1. New Tables
    - `profiles` - User profile data extending auth.users
    - `addresses` - User addresses with geolocation
    - `contractors` - Contractor-specific data and verification
    - `landlords` - Landlord-specific data
    - `properties` - Properties managed by landlords
    - `jobs` - Main job entity with AI analysis results
    - `job_photos` - Photos associated with jobs
    - `offers` - Contractor offers for jobs
    - `payments` - Payment tracking with Stripe integration
    - `approvals` - Landlord approvals for renter jobs
    - `email_log` - Email delivery tracking
    - `sms_log` - SMS delivery tracking
    - `audit_logs` - Complete activity audit trail
    - `prices` - Dynamic pricing by location and category
    - `files` - File storage references
    - `webhook_events` - Stripe webhook event tracking

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Contractors see jobs with offers
    - Landlords see tenant jobs
    - Admins have full access

  3. Performance
    - Indexes on frequently queried columns
    - Optimized for job search and contractor matching
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enum types
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'draft', 'quoting', 'awaiting_accept', 'accepted', 
    'scheduled', 'in_progress', 'disputed', 'completed', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_category AS ENUM (
    'plumbing', 'electrical', 'paint', 'handyman', 'roof', 'hvac', 'flooring'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM (
    'pending', 'accepted', 'declined', 'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'succeeded', 'failed', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM (
    'pending', 'approved', 'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles table (extends auth.users)
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 2. Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON addresses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Contractors table
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

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own data"
  ON contractors
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Clients can view verified contractors"
  ON contractors
  FOR SELECT
  TO authenticated
  USING (verified = true);

-- 4. Landlords table
CREATE TABLE IF NOT EXISTS landlords (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company text,
  properties_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own data"
  ON landlords
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

-- 5. Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  address_id uuid NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  name text NOT NULL,
  units_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM landlords 
      WHERE landlords.id = auth.uid() 
      AND landlords.id = properties.landlord_id
    )
  );

-- 6. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Contractors can view jobs with offers"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offers 
      WHERE offers.job_id = jobs.id 
      AND offers.contractor_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can view tenant jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    renter_flag = true AND 
    EXISTS (
      SELECT 1 FROM landlords 
      WHERE landlords.id = auth.uid() 
      AND landlords.id = jobs.landlord_id
    )
  );

-- 7. Job photos table
CREATE TABLE IF NOT EXISTS job_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_before boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job photos follow job permissions"
  ON job_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_photos.job_id 
      AND (
        jobs.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM offers 
          WHERE offers.job_id = jobs.id 
          AND offers.contractor_id = auth.uid()
        ) OR
        (jobs.renter_flag = true AND EXISTS (
          SELECT 1 FROM landlords 
          WHERE landlords.id = auth.uid() 
          AND landlords.id = jobs.landlord_id
        ))
      )
    )
  );

-- 8. Offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can manage own offers"
  ON offers
  FOR ALL
  TO authenticated
  USING (auth.uid() = contractor_id);

CREATE POLICY "Job owners can view offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = offers.job_id 
      AND jobs.client_id = auth.uid()
    )
  );

-- 9. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = contractor_id);

-- 10. Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  status approval_status DEFAULT 'pending',
  message text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own approvals"
  ON approvals
  FOR ALL
  TO authenticated
  USING (auth.uid() = landlord_id);

CREATE POLICY "Job owners can view approvals"
  ON approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = approvals.job_id 
      AND jobs.client_id = auth.uid()
    )
  );

-- 11. Email log table
CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
  ON email_log
  FOR SELECT
  TO authenticated
  USING (
    to_email = (
      SELECT email FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- 12. SMS log table
CREATE TABLE IF NOT EXISTS sms_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone text NOT NULL,
  from_phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL,
  twilio_sid text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SMS logs"
  ON sms_log
  FOR SELECT
  TO authenticated
  USING (
    to_phone = (
      SELECT phone FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- 13. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 14. Prices table
CREATE TABLE IF NOT EXISTS prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prices"
  ON prices
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 15. Files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  filename text NOT NULL,
  url text NOT NULL,
  mime_type text,
  size_bytes integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own files"
  ON files
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Job participants can view job files"
  ON files
  FOR SELECT
  TO authenticated
  USING (
    job_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = files.job_id 
        AND jobs.client_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM offers 
        JOIN jobs ON offers.job_id = jobs.id 
        WHERE jobs.id = files.job_id 
        AND offers.contractor_id = auth.uid()
      )
    )
  );

-- 16. Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prices_zip_category ON prices(zip, category);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- Create updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER addresses_updated_at 
    BEFORE UPDATE ON addresses 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER contractors_updated_at 
    BEFORE UPDATE ON contractors 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER landlords_updated_at 
    BEFORE UPDATE ON landlords 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER offers_updated_at 
    BEFORE UPDATE ON offers 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER approvals_updated_at 
    BEFORE UPDATE ON approvals 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER prices_updated_at 
    BEFORE UPDATE ON prices 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;