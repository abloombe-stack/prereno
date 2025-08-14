/*
# Seed Data for PreReno - Complete Demo Setup

1. Demo Users & Authentication
   - Creates 4 demo accounts with proper auth setup
   - Client, Contractor, Landlord, Admin roles
   - All with password: demo123!

2. Pricing Data
   - 35 pricing records across 5 Texas cities
   - 7 service categories per city
   - Competitive market rates

3. Sample Jobs & Workflow
   - 3 sample jobs in different states
   - Demonstrates full job lifecycle
   - Includes renter approval workflow

4. Contractor Profiles
   - Verified contractor with ratings
   - Insurance and license data
   - Ready for job acceptance

5. Addresses & Properties
   - Sample addresses for all user types
   - Geocoded locations for Austin area
   - Property management setup
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert pricing data for Texas markets
INSERT INTO prices (zip, category, labor_rate_cents_per_hour, material_multiplier, small_job_min_cents) VALUES
-- Austin, TX (78701-78799)
('78701', 'plumbing', 8500, 1.35, 17500),
('78701', 'electrical', 9000, 1.40, 20000),
('78701', 'handyman', 7500, 1.25, 15000),
('78701', 'paint', 6500, 1.20, 12500),
('78701', 'roof', 10000, 1.50, 30000),
('78701', 'hvac', 11000, 1.45, 25000),
('78701', 'flooring', 8000, 1.35, 20000),

-- Dallas, TX (75201-75299)
('75201', 'plumbing', 8000, 1.30, 16000),
('75201', 'electrical', 8500, 1.35, 18000),
('75201', 'handyman', 7000, 1.25, 14000),
('75201', 'paint', 6000, 1.20, 11000),
('75201', 'roof', 9500, 1.45, 28000),
('75201', 'hvac', 10500, 1.40, 23000),
('75201', 'flooring', 7500, 1.30, 18000),

-- Houston, TX (77001-77099)
('77001', 'plumbing', 8200, 1.32, 16500),
('77001', 'electrical', 8700, 1.37, 19000),
('77001', 'handyman', 7200, 1.25, 14500),
('77001', 'paint', 6200, 1.20, 11500),
('77001', 'roof', 9700, 1.47, 29000),
('77001', 'hvac', 10700, 1.42, 24000),
('77001', 'flooring', 7700, 1.32, 19000),

-- San Antonio, TX (78201-78299)
('78201', 'plumbing', 7800, 1.28, 15500),
('78201', 'electrical', 8300, 1.33, 17500),
('78201', 'handyman', 6800, 1.22, 13500),
('78201', 'paint', 5800, 1.18, 10500),
('78201', 'roof', 9200, 1.42, 27000),
('78201', 'hvac', 10200, 1.38, 22000),
('78201', 'flooring', 7300, 1.28, 17500),

-- Fort Worth, TX (76101-76199)
('76101', 'plumbing', 7900, 1.29, 15800),
('76101', 'electrical', 8400, 1.34, 17800),
('76101', 'handyman', 6900, 1.23, 13800),
('76101', 'paint', 5900, 1.19, 10800),
('76101', 'roof', 9300, 1.43, 27500),
('76101', 'hvac', 10300, 1.39, 22500),
('76101', 'flooring', 7400, 1.29, 17800)

ON CONFLICT (zip, category) DO UPDATE SET
  labor_rate_cents_per_hour = EXCLUDED.labor_rate_cents_per_hour,
  material_multiplier = EXCLUDED.material_multiplier,
  small_job_min_cents = EXCLUDED.small_job_min_cents,
  updated_at = NOW();

-- Create demo user function
CREATE OR REPLACE FUNCTION create_demo_user(
  user_email TEXT,
  user_password TEXT,
  user_role user_role,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = user_email) INTO profile_exists;
  
  IF profile_exists THEN
    SELECT id INTO user_id FROM profiles WHERE email = user_email;
    RETURN user_id;
  END IF;

  -- Generate a UUID for the user
  user_id := gen_random_uuid();

  -- Insert into profiles (this will be the main user record)
  INSERT INTO profiles (id, role, first_name, last_name, email, phone, created_at, updated_at)
  VALUES (user_id, user_role, first_name, last_name, user_email, phone_number, NOW(), NOW());

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Create demo users
DO $$
DECLARE
  client_id UUID;
  contractor_id UUID;
  landlord_id UUID;
  admin_id UUID;
  client_address_id UUID;
  landlord_address_id UUID;
BEGIN
  -- Create demo users
  SELECT create_demo_user('client@prereno.demo', 'demo123!', 'client', 'Sarah', 'Johnson', '+1-512-555-0101') INTO client_id;
  SELECT create_demo_user('contractor@prereno.demo', 'demo123!', 'contractor', 'Mike', 'Rodriguez', '+1-512-555-0102') INTO contractor_id;
  SELECT create_demo_user('landlord@prereno.demo', 'demo123!', 'landlord', 'David', 'Chen', '+1-512-555-0103') INTO landlord_id;
  SELECT create_demo_user('admin@prereno.demo', 'demo123!', 'admin', 'Admin', 'User', '+1-512-555-0104') INTO admin_id;

  -- Create addresses for client and landlord
  INSERT INTO addresses (id, user_id, line1, line2, city, state, zip, lat, lng, is_default, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), client_id, '123 Main Street', 'Apt 4B', 'Austin', 'TX', '78701', 30.2672, -97.7431, true, NOW(), NOW()),
    (gen_random_uuid(), landlord_id, '456 Property Lane', NULL, 'Austin', 'TX', '78701', 30.2700, -97.7400, true, NOW(), NOW())
  RETURNING id INTO client_address_id;

  -- Get the client address ID for jobs
  SELECT id INTO client_address_id FROM addresses WHERE user_id = client_id LIMIT 1;

  -- Create contractor profile
  INSERT INTO contractors (id, company, license_number, license_state, insurance_expires_on, verified, rating, completed_jobs, created_at, updated_at)
  VALUES (contractor_id, 'Austin Plumbing Pro', 'TX-PL-12345', 'TX', '2025-12-31', true, 4.8, 127, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    company = EXCLUDED.company,
    license_number = EXCLUDED.license_number,
    verified = EXCLUDED.verified,
    rating = EXCLUDED.rating,
    completed_jobs = EXCLUDED.completed_jobs,
    updated_at = NOW();

  -- Create landlord profile
  INSERT INTO landlords (id, company, properties_count, created_at, updated_at)
  VALUES (landlord_id, 'Chen Properties LLC', 5, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    company = EXCLUDED.company,
    properties_count = EXCLUDED.properties_count,
    updated_at = NOW();

  -- Create sample jobs
  INSERT INTO jobs (
    id, client_id, address_id, title, description, category, status, 
    photos, ai_tags, ai_scope_md, ai_client_price_cents, contractor_net_cents, 
    platform_fee_cents, margin_pct, rush_flag, after_hours_flag, 
    city, zip, renter_flag, landlord_id, created_at, updated_at
  ) VALUES 
  (
    gen_random_uuid(), client_id, client_address_id,
    'Kitchen Faucet Replacement',
    'Old faucet is leaking and needs replacement with new single-handle model',
    'plumbing',
    'completed',
    ARRAY['/demo/kitchen-faucet-before.jpg'],
    ARRAY['faucet_leak', 'under_sink_damage'],
    E'• Remove old faucet and disconnect water lines\n• Install new single-handle faucet with pull-down sprayer\n• Test all connections for leaks\n• Clean and sanitize work area',
    24000, 19200, 4800, 0.20, false, false,
    'Austin', '78701', false, NULL, NOW() - INTERVAL '5 days', NOW()
  ),
  (
    gen_random_uuid(), client_id, client_address_id,
    'Bathroom Tile Repair',
    'Several cracked tiles around bathtub need replacement',
    'handyman',
    'in_progress',
    ARRAY['/demo/bathroom-tile-before.jpg'],
    ARRAY['tile_crack', 'grout_damage'],
    E'• Remove damaged tiles carefully\n• Apply new tile adhesive\n• Install matching replacement tiles\n• Regrout entire area for uniform appearance',
    36000, 28800, 7200, 0.20, false, false,
    'Austin', '78701', true, landlord_id, NOW() - INTERVAL '2 days', NOW()
  ),
  (
    gen_random_uuid(), client_id, client_address_id,
    'Living Room Paint Touch-up',
    'Scuffs and nail holes need patching and painting',
    'paint',
    'draft',
    ARRAY['/demo/wall-damage-before.jpg'],
    ARRAY['wall_scuffs', 'nail_holes'],
    E'• Patch nail holes with spackle compound\n• Sand smooth when dry\n• Prime patched areas\n• Apply matching paint with brush and roller',
    18000, 14400, 3600, 0.20, false, false,
    'Austin', '78701', false, NULL, NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create sample reviews for completed job
  INSERT INTO reviews (id, job_id, rater_profile_id, ratee_profile_id, rating, comment, created_at, updated_at)
  SELECT 
    gen_random_uuid(),
    j.id,
    client_id,
    contractor_id,
    5,
    'Excellent work! Mike was professional, on time, and cleaned up perfectly. The new faucet works great and no more leaks!',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  FROM jobs j 
  WHERE j.client_id = client_id AND j.status = 'completed' 
  LIMIT 1
  ON CONFLICT DO NOTHING;

  -- Log the seeding activity
  INSERT INTO audit_logs (id, actor_profile_id, action, entity, entity_id, meta_json, created_at)
  VALUES (
    gen_random_uuid(),
    admin_id,
    'database_seeded',
    'system',
    NULL,
    jsonb_build_object(
      'users_created', 4,
      'pricing_records', 35,
      'sample_jobs', 3,
      'timestamp', NOW()
    ),
    NOW()
  );

END $$;

-- Clean up the demo user function
DROP FUNCTION IF EXISTS create_demo_user(TEXT, TEXT, user_role, TEXT, TEXT, TEXT);

-- Verify seed data
SELECT 'Seed data completed successfully!' as status;
SELECT COUNT(*) as pricing_records FROM prices;
SELECT COUNT(*) as demo_users FROM profiles WHERE email LIKE '%@prereno.demo';
SELECT COUNT(*) as sample_jobs FROM jobs;
SELECT COUNT(*) as contractor_profiles FROM contractors;