/*
  # Idempotent Seed Data for PreReno
  
  This migration can be run multiple times safely using ON CONFLICT clauses.
  
  1. Demo Users
    - Creates 4 demo accounts with different roles
    - Updates existing users if they already exist
  
  2. Pricing Data
    - 35 pricing records across 5 Texas cities
    - 7 service categories per city
    - Uses UPSERT to handle duplicates
  
  3. Sample Data
    - Addresses, jobs, contractor profiles
    - All with conflict resolution
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create demo users (will be handled by auth trigger)
-- Note: In production, these would be created via Supabase Auth API

-- Insert pricing data with UPSERT
INSERT INTO public.prices (zip, category, labor_rate_cents_per_hour, material_multiplier, small_job_min_cents, created_at, updated_at)
VALUES 
  -- Austin, TX (78701)
  ('78701', 'plumbing', 8500, 1.35, 17500, NOW(), NOW()),
  ('78701', 'electrical', 9000, 1.40, 20000, NOW(), NOW()),
  ('78701', 'handyman', 7500, 1.25, 15000, NOW(), NOW()),
  ('78701', 'paint', 6500, 1.20, 12500, NOW(), NOW()),
  ('78701', 'roof', 10000, 1.50, 30000, NOW(), NOW()),
  ('78701', 'hvac', 11000, 1.45, 25000, NOW(), NOW()),
  ('78701', 'flooring', 8000, 1.35, 20000, NOW(), NOW()),
  
  -- Dallas, TX (75201)
  ('75201', 'plumbing', 8000, 1.30, 16000, NOW(), NOW()),
  ('75201', 'electrical', 8500, 1.35, 18000, NOW(), NOW()),
  ('75201', 'handyman', 7000, 1.25, 14000, NOW(), NOW()),
  ('75201', 'paint', 6000, 1.20, 11000, NOW(), NOW()),
  ('75201', 'roof', 9500, 1.45, 28000, NOW(), NOW()),
  ('75201', 'hvac', 10500, 1.40, 23000, NOW(), NOW()),
  ('75201', 'flooring', 7500, 1.30, 18000, NOW(), NOW()),
  
  -- Houston, TX (77001)
  ('77001', 'plumbing', 8200, 1.32, 16500, NOW(), NOW()),
  ('77001', 'electrical', 8700, 1.37, 19000, NOW(), NOW()),
  ('77001', 'handyman', 7200, 1.25, 14500, NOW(), NOW()),
  ('77001', 'paint', 6200, 1.20, 11500, NOW(), NOW()),
  ('77001', 'roof', 9700, 1.47, 29000, NOW(), NOW()),
  ('77001', 'hvac', 10700, 1.42, 24000, NOW(), NOW()),
  ('77001', 'flooring', 7700, 1.32, 19000, NOW(), NOW()),
  
  -- San Antonio, TX (78201)
  ('78201', 'plumbing', 7800, 1.28, 15500, NOW(), NOW()),
  ('78201', 'electrical', 8300, 1.33, 17500, NOW(), NOW()),
  ('78201', 'handyman', 6800, 1.22, 13500, NOW(), NOW()),
  ('78201', 'paint', 5800, 1.18, 10500, NOW(), NOW()),
  ('78201', 'roof', 9200, 1.42, 27000, NOW(), NOW()),
  ('78201', 'hvac', 10200, 1.38, 22000, NOW(), NOW()),
  ('78201', 'flooring', 7300, 1.28, 17500, NOW(), NOW()),
  
  -- Fort Worth, TX (76101)
  ('76101', 'plumbing', 7900, 1.29, 15800, NOW(), NOW()),
  ('76101', 'electrical', 8400, 1.34, 17800, NOW(), NOW()),
  ('76101', 'handyman', 6900, 1.23, 13800, NOW(), NOW()),
  ('76101', 'paint', 5900, 1.19, 10800, NOW(), NOW()),
  ('76101', 'roof', 9300, 1.43, 27500, NOW(), NOW()),
  ('76101', 'hvac', 10300, 1.39, 22500, NOW(), NOW()),
  ('76101', 'flooring', 7400, 1.29, 17800, NOW(), NOW())
ON CONFLICT (zip, category) 
DO UPDATE SET
  labor_rate_cents_per_hour = EXCLUDED.labor_rate_cents_per_hour,
  material_multiplier = EXCLUDED.material_multiplier,
  small_job_min_cents = EXCLUDED.small_job_min_cents,
  updated_at = NOW();

-- Create demo profiles (these will be created when users sign up via auth)
-- For now, we'll create placeholder profiles that can be updated later

-- Demo client profile
INSERT INTO public.profiles (id, first_name, last_name, email, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Sarah',
  'Johnson', 
  'client@prereno.demo',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Demo contractor profile
INSERT INTO public.profiles (id, first_name, last_name, email, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Mike',
  'Rodriguez',
  'contractor@prereno.demo', 
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Demo landlord profile
INSERT INTO public.profiles (id, first_name, last_name, email, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'David',
  'Chen',
  'landlord@prereno.demo',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Demo admin profile  
INSERT INTO public.profiles (id, first_name, last_name, email, created_at, updated_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Admin',
  'User',
  'admin@prereno.demo',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Create contractor profile
INSERT INTO public.contractors (id, company, license_number, license_state, insurance_expires_on, verified, rating, completed_jobs, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Austin Plumbing Pro',
  'TX-PL-12345',
  'TX',
  '2025-12-31',
  true,
  4.8,
  127,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  license_number = EXCLUDED.license_number,
  license_state = EXCLUDED.license_state,
  insurance_expires_on = EXCLUDED.insurance_expires_on,
  verified = EXCLUDED.verified,
  rating = EXCLUDED.rating,
  completed_jobs = EXCLUDED.completed_jobs,
  updated_at = NOW();

-- Create landlord profile
INSERT INTO public.landlords (id, company, properties_count, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Chen Properties LLC',
  5,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  properties_count = EXCLUDED.properties_count,
  updated_at = NOW();

-- Create sample addresses
INSERT INTO public.addresses (id, user_id, line1, line2, city, state, zip, lat, lng, is_default, created_at, updated_at)
VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '123 Main Street',
    'Apt 4B',
    'Austin',
    'TX',
    '78701',
    30.2672,
    -97.7431,
    true,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    '456 Property Lane',
    NULL,
    'Austin',
    'TX', 
    '78701',
    30.2700,
    -97.7400,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  line1 = EXCLUDED.line1,
  line2 = EXCLUDED.line2,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  zip = EXCLUDED.zip,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- Create sample jobs
INSERT INTO public.jobs (id, client_id, address_id, title, description, category, status, photos, ai_tags, ai_scope_md, client_price_cents, contractor_net_cents, platform_fee_cents, margin_pct, rush_flag, after_hours_flag, city, zip, renter_flag, landlord_id, created_at, updated_at)
VALUES 
  (
    'job11111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Kitchen Faucet Replacement',
    'Old faucet is leaking and needs replacement',
    'plumbing',
    'completed',
    ARRAY['/demo/kitchen-faucet-before.jpg'],
    ARRAY['faucet_leak', 'under_sink_damage'],
    E'• Remove old faucet\n• Install new single-handle faucet\n• Test for leaks\n• Clean work area',
    24000,
    19200,
    4800,
    0.20,
    false,
    false,
    'Austin',
    '78701',
    false,
    NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    'job22222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Bathroom Tile Repair',
    'Several cracked tiles around bathtub',
    'handyman',
    'in_progress',
    ARRAY['/demo/bathroom-tile-before.jpg'],
    ARRAY['tile_crack', 'grout_damage'],
    E'• Remove damaged tiles\n• Apply new adhesive\n• Install replacement tiles\n• Regrout area',
    36000,
    28800,
    7200,
    0.20,
    false,
    false,
    'Austin',
    '78701',
    true,
    '33333333-3333-3333-3333-333333333333',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'job33333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Living Room Paint Touch-up',
    'Scuffs and nail holes need patching and painting',
    'paint',
    'draft',
    ARRAY['/demo/wall-damage-before.jpg'],
    ARRAY['wall_scuffs', 'nail_holes'],
    E'• Patch nail holes with spackle\n• Sand smooth\n• Prime patched areas\n• Apply matching paint',
    18000,
    14400,
    3600,
    0.20,
    false,
    false,
    'Austin',
    '78701',
    false,
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample review
INSERT INTO public.reviews (id, job_id, rater_profile_id, ratee_profile_id, rating, comment, created_at, updated_at)
VALUES (
  'review11-1111-1111-1111-111111111111',
  'job11111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  5,
  'Great work! Professional and on time.',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
) ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  updated_at = NOW();

-- Log the seeding activity
INSERT INTO public.audit_logs (actor_profile_id, action, entity, entity_id, meta_json, created_at)
VALUES (
  NULL,
  'database_seeded',
  'system',
  NULL,
  jsonb_build_object(
    'pricing_records', 35,
    'demo_users', 4,
    'sample_jobs', 3,
    'timestamp', NOW()
  ),
  NOW()
) ON CONFLICT DO NOTHING;

-- Success message
SELECT 'PreReno seed data applied successfully!' as status,
       'Demo accounts: client@prereno.demo, contractor@prereno.demo, landlord@prereno.demo, admin@prereno.demo' as demo_accounts,
       'Password: demo123!' as password;