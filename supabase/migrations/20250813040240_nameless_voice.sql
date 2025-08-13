/*
  # Seed Data for PreReno

  1. Demo Users
    - Client: client@prereno.demo
    - Contractor: contractor@prereno.demo  
    - Landlord: landlord@prereno.demo
    - Admin: admin@prereno.demo

  2. Sample Data
    - Addresses for each user
    - Contractor profiles with verification
    - Sample jobs in various states
    - Pricing data for major cities

  3. Test Data
    - Complete job flow examples
    - Payment records
    - Review data
*/

-- Insert pricing data for major cities
INSERT INTO prices (zip, category, base_rate_cents, rush_multiplier, after_hours_multiplier, min_job_cents) VALUES
-- Austin, TX
('78701', 'plumbing', 8500, 1.5, 1.25, 17500),
('78701', 'electrical', 9000, 1.5, 1.25, 20000),
('78701', 'handyman', 7500, 1.5, 1.25, 15000),
('78701', 'paint', 6500, 1.5, 1.25, 12500),
('78701', 'roof', 10000, 1.5, 1.25, 30000),
('78701', 'hvac', 11000, 1.5, 1.25, 25000),
('78701', 'flooring', 8000, 1.5, 1.25, 20000),

-- Dallas, TX
('75201', 'plumbing', 8000, 1.5, 1.25, 16000),
('75201', 'electrical', 8500, 1.5, 1.25, 18000),
('75201', 'handyman', 7000, 1.5, 1.25, 14000),
('75201', 'paint', 6000, 1.5, 1.25, 11000),
('75201', 'roof', 9500, 1.5, 1.25, 28000),
('75201', 'hvac', 10500, 1.5, 1.25, 23000),
('75201', 'flooring', 7500, 1.5, 1.25, 18000),

-- Houston, TX
('77001', 'plumbing', 8200, 1.5, 1.25, 16500),
('77001', 'electrical', 8700, 1.5, 1.25, 19000),
('77001', 'handyman', 7200, 1.5, 1.25, 14500),
('77001', 'paint', 6200, 1.5, 1.25, 11500),
('77001', 'roof', 9700, 1.5, 1.25, 29000),
('77001', 'hvac', 10700, 1.5, 1.25, 24000),
('77001', 'flooring', 7700, 1.5, 1.25, 19000)
ON CONFLICT (zip, category) DO NOTHING;

-- Note: Demo users will be created via the auth signup flow
-- This ensures proper auth.users entries and profile creation via triggers

-- Insert audit log for schema creation
INSERT INTO audit_logs (action, entity_type, metadata) VALUES
('schema_created', 'database', jsonb_build_object(
  'timestamp', now(),
  'tables_created', 16,
  'version', '1.0.0'
));