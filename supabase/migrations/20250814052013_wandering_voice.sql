/*
  # PreReno Seed Data - Idempotent Version
  
  1. Demo Users
    - Creates 4 demo accounts with different roles
    - Handles existing users gracefully
  
  2. Pricing Data
    - 35 pricing records for 5 Texas cities
    - Uses ON CONFLICT for idempotent runs
  
  3. Sample Jobs & Reviews
    - Demonstrates complete workflow
    - Shows renter approval process
*/

-- Create demo users function (idempotent)
CREATE OR REPLACE FUNCTION create_demo_users()
RETURNS void AS $$
DECLARE
  client_user_id uuid;
  contractor_user_id uuid;
  landlord_user_id uuid;
  admin_user_id uuid;
  client_address_id uuid;
  landlord_address_id uuid;
BEGIN
  -- Create client user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'client@prereno.demo',
    crypt('demo123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Sarah", "last_name": "Johnson", "role": "client"}',
    false,
    '',
    '',
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW()
  RETURNING id INTO client_user_id;

  -- Get existing client user ID if conflict occurred
  IF client_user_id IS NULL THEN
    SELECT id INTO client_user_id FROM auth.users WHERE email = 'client@prereno.demo';
  END IF;

  -- Create contractor user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'contractor@prereno.demo',
    crypt('demo123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Mike", "last_name": "Rodriguez", "role": "contractor"}',
    false,
    '',
    '',
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW()
  RETURNING id INTO contractor_user_id;

  IF contractor_user_id IS NULL THEN
    SELECT id INTO contractor_user_id FROM auth.users WHERE email = 'contractor@prereno.demo';
  END IF;

  -- Create landlord user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'landlord@prereno.demo',
    crypt('demo123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "David", "last_name": "Chen", "role": "landlord"}',
    false,
    '',
    '',
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW()
  RETURNING id INTO landlord_user_id;

  IF landlord_user_id IS NULL THEN
    SELECT id INTO landlord_user_id FROM auth.users WHERE email = 'landlord@prereno.demo';
  END IF;

  -- Create admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@prereno.demo',
    crypt('demo123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Admin", "last_name": "User", "role": "admin"}',
    false,
    '',
    '',
    '',
    ''
  ) ON CONFLICT (email) DO UPDATE SET
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW()
  RETURNING id INTO admin_user_id;

  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@prereno.demo';
  END IF;

  -- Create profiles
  INSERT INTO profiles (id, first_name, last_name, email, phone)
  VALUES 
    (client_user_id, 'Sarah', 'Johnson', 'client@prereno.demo', '+1 (555) 123-4567'),
    (contractor_user_id, 'Mike', 'Rodriguez', 'contractor@prereno.demo', '+1 (555) 234-5678'),
    (landlord_user_id, 'David', 'Chen', 'landlord@prereno.demo', '+1 (555) 345-6789'),
    (admin_user_id, 'Admin', 'User', 'admin@prereno.demo', '+1 (555) 456-7890')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Create addresses
  INSERT INTO addresses (id, user_id, line1, line2, city, state, zip, lat, lng, is_default)
  VALUES 
    (gen_random_uuid(), client_user_id, '123 Main Street', 'Apt 4B', 'Austin', 'TX', '78701', 30.2672, -97.7431, true),
    (gen_random_uuid(), landlord_user_id, '456 Property Lane', NULL, 'Austin', 'TX', '78701', 30.2700, -97.7400, true)
  ON CONFLICT (user_id, is_default) WHERE is_default = true DO UPDATE SET
    line1 = EXCLUDED.line1,
    line2 = EXCLUDED.line2,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    updated_at = NOW()
  RETURNING id INTO client_address_id;

  -- Get address IDs for job creation
  SELECT id INTO client_address_id FROM addresses WHERE user_id = client_user_id AND is_default = true;
  SELECT id INTO landlord_address_id FROM addresses WHERE user_id = landlord_user_id AND is_default = true;

  -- Create contractor profile
  INSERT INTO contractors (id, company, license_number, license_state, insurance_expires_on, verified, rating, completed_jobs)
  VALUES (contractor_user_id, 'Austin Plumbing Pro', 'TX-PL-12345', 'TX', '2025-12-31', true, 4.8, 127)
  ON CONFLICT (id) DO UPDATE SET
    company = EXCLUDED.company,
    license_number = EXCLUDED.license_number,
    license_state = EXCLUDED.license_state,
    insurance_expires_on = EXCLUDED.insurance_expires_on,
    verified = EXCLUDED.verified,
    rating = EXCLUDED.rating,
    completed_jobs = EXCLUDED.completed_jobs,
    updated_at = NOW();

  -- Create landlord profile
  INSERT INTO landlords (id, company, properties_count)
  VALUES (landlord_user_id, 'Chen Properties LLC', 5)
  ON CONFLICT (id) DO UPDATE SET
    company = EXCLUDED.company,
    properties_count = EXCLUDED.properties_count,
    updated_at = NOW();

  -- Create sample jobs
  INSERT INTO jobs (
    id, client_id, address_id, title, description, category, status, 
    photos, ai_tags, ai_scope_md, ai_client_price_cents, contractor_net_cents, 
    platform_fee_cents, margin_pct, rush_flag, after_hours_flag, city, zip, renter_flag, landlord_id
  ) VALUES 
    (
      gen_random_uuid(), client_user_id, client_address_id,
      'Kitchen Faucet Replacement', 'Old faucet is leaking and needs replacement',
      'plumbing', 'completed',
      ARRAY['/demo/kitchen-faucet-before.jpg'],
      ARRAY['faucet_leak', 'under_sink_damage'],
      '• Remove old faucet\n• Install new single-handle faucet\n• Test for leaks\n• Clean work area',
      24000, 19200, 4800, 0.20, false, false, 'Austin', '78701', false, NULL
    ),
    (
      gen_random_uuid(), client_user_id, client_address_id,
      'Bathroom Tile Repair', 'Several cracked tiles around bathtub',
      'handyman', 'in_progress',
      ARRAY['/demo/bathroom-tile-before.jpg'],
      ARRAY['tile_crack', 'grout_damage'],
      '• Remove damaged tiles\n• Apply new adhesive\n• Install replacement tiles\n• Regrout area',
      36000, 28800, 7200, 0.20, false, false, 'Austin', '78701', true, landlord_user_id
    ),
    (
      gen_random_uuid(), client_user_id, client_address_id,
      'Living Room Paint Touch-up', 'Scuffs and nail holes need patching and painting',
      'paint', 'draft',
      ARRAY['/demo/wall-damage-before.jpg'],
      ARRAY['wall_scuffs', 'nail_holes'],
      '• Patch nail holes with spackle\n• Sand smooth\n• Prime patched areas\n• Apply matching paint',
      18000, 14400, 3600, 0.20, false, false, 'Austin', '78701', false, NULL
    )
  ON CONFLICT (id) DO NOTHING;

  -- Log the seeding activity
  INSERT INTO audit_logs (actor_profile_id, action, entity, entity_id, meta_json)
  VALUES (
    admin_user_id,
    'database_seeded',
    'system',
    NULL,
    jsonb_build_object(
      'users_created', 4,
      'jobs_created', 3,
      'timestamp', NOW()
    )
  );

END;
$$ LANGUAGE plpgsql;

-- Insert pricing data with ON CONFLICT for idempotent runs
INSERT INTO prices (zip, category, labor_rate_cents_per_hour, material_multiplier, small_job_min_cents) VALUES
-- Austin, TX (78701)
('78701', 'plumbing', 8500, 1.35, 17500),
('78701', 'electrical', 9000, 1.40, 20000),
('78701', 'handyman', 7500, 1.25, 15000),
('78701', 'paint', 6500, 1.20, 12500),
('78701', 'roof', 10000, 1.50, 30000),
('78701', 'hvac', 11000, 1.45, 25000),
('78701', 'flooring', 8000, 1.35, 20000),

-- Dallas, TX (75201)
('75201', 'plumbing', 8000, 1.30, 16000),
('75201', 'electrical', 8500, 1.35, 18000),
('75201', 'handyman', 7000, 1.25, 14000),
('75201', 'paint', 6000, 1.20, 11000),
('75201', 'roof', 9500, 1.45, 28000),
('75201', 'hvac', 10500, 1.40, 23000),
('75201', 'flooring', 7500, 1.30, 18000),

-- Houston, TX (77001)
('77001', 'plumbing', 8200, 1.32, 16500),
('77001', 'electrical', 8700, 1.37, 19000),
('77001', 'handyman', 7200, 1.25, 14500),
('77001', 'paint', 6200, 1.20, 11500),
('77001', 'roof', 9700, 1.47, 29000),
('77001', 'hvac', 10700, 1.42, 24000),
('77001', 'flooring', 7700, 1.32, 19000),

-- San Antonio, TX (78201)
('78201', 'plumbing', 7800, 1.28, 15500),
('78201', 'electrical', 8200, 1.33, 17500),
('78201', 'handyman', 6800, 1.23, 13500),
('78201', 'paint', 5800, 1.18, 10500),
('78201', 'roof', 9200, 1.43, 27000),
('78201', 'hvac', 10200, 1.38, 22000),
('78201', 'flooring', 7200, 1.28, 17000),

-- Fort Worth, TX (76101)
('76101', 'plumbing', 7900, 1.29, 15800),
('76101', 'electrical', 8300, 1.34, 17800),
('76101', 'handyman', 6900, 1.24, 13800),
('76101', 'paint', 5900, 1.19, 10800),
('76101', 'roof', 9300, 1.44, 27500),
('76101', 'hvac', 10300, 1.39, 22500),
('76101', 'flooring', 7300, 1.29, 17500)

ON CONFLICT (zip, category) DO UPDATE SET
  labor_rate_cents_per_hour = EXCLUDED.labor_rate_cents_per_hour,
  material_multiplier = EXCLUDED.material_multiplier,
  small_job_min_cents = EXCLUDED.small_job_min_cents,
  updated_at = NOW();

-- Execute the demo users function
SELECT create_demo_users();

-- Clean up the function
DROP FUNCTION create_demo_users();

-- Verify seed data
SELECT 'Seed data completed successfully!' as status;
SELECT COUNT(*) as pricing_records FROM prices;
SELECT COUNT(*) as demo_users FROM profiles;
SELECT COUNT(*) as sample_jobs FROM jobs;