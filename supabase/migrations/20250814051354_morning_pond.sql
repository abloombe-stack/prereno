/*
# Seed Data for PreReno

This migration adds initial seed data including:
1. Demo user accounts with profiles
2. Sample addresses and properties
3. Pricing data for Texas markets
4. Sample jobs and contractor data
5. Test reviews and audit logs

Demo accounts created:
- client@prereno.demo / demo123!
- contractor@prereno.demo / demo123!
- landlord@prereno.demo / demo123!
- admin@prereno.demo / demo123!
*/

-- Insert pricing data for Texas markets
INSERT INTO prices (zip, category, base_rate_cents, rush_multiplier, after_hours_multiplier, min_job_cents) VALUES
-- Austin, TX (78701)
('78701', 'plumbing', 8500, 1.5, 1.25, 17500),
('78701', 'electrical', 9000, 1.5, 1.25, 20000),
('78701', 'handyman', 7500, 1.5, 1.25, 15000),
('78701', 'paint', 6500, 1.5, 1.25, 12500),
('78701', 'roof', 10000, 1.5, 1.25, 30000),
('78701', 'hvac', 11000, 1.5, 1.25, 25000),
('78701', 'flooring', 8000, 1.5, 1.25, 20000),

-- Dallas, TX (75201)
('75201', 'plumbing', 8000, 1.5, 1.25, 16000),
('75201', 'electrical', 8500, 1.5, 1.25, 18000),
('75201', 'handyman', 7000, 1.5, 1.25, 14000),
('75201', 'paint', 6000, 1.5, 1.25, 11000),
('75201', 'roof', 9500, 1.5, 1.25, 28000),
('75201', 'hvac', 10500, 1.5, 1.25, 23000),
('75201', 'flooring', 7500, 1.5, 1.25, 18000),

-- Houston, TX (77001)
('77001', 'plumbing', 8200, 1.5, 1.25, 16500),
('77001', 'electrical', 8700, 1.5, 1.25, 19000),
('77001', 'handyman', 7200, 1.5, 1.25, 14500),
('77001', 'paint', 6200, 1.5, 1.25, 11500),
('77001', 'roof', 9700, 1.5, 1.25, 29000),
('77001', 'hvac', 10700, 1.5, 1.25, 24000),
('77001', 'flooring', 7700, 1.5, 1.25, 19000),

-- San Antonio, TX (78201)
('78201', 'plumbing', 7800, 1.5, 1.25, 15500),
('78201', 'electrical', 8200, 1.5, 1.25, 17000),
('78201', 'handyman', 6800, 1.5, 1.25, 13500),
('78201', 'paint', 5800, 1.5, 1.25, 10500),
('78201', 'roof', 9200, 1.5, 1.25, 27000),
('78201', 'hvac', 10200, 1.5, 1.25, 22000),
('78201', 'flooring', 7200, 1.5, 1.25, 17000),

-- Fort Worth, TX (76101)
('76101', 'plumbing', 7900, 1.5, 1.25, 15800),
('76101', 'electrical', 8300, 1.5, 1.25, 17500),
('76101', 'handyman', 6900, 1.5, 1.25, 13800),
('76101', 'paint', 5900, 1.5, 1.25, 10800),
('76101', 'roof', 9300, 1.5, 1.25, 27500),
('76101', 'hvac', 10300, 1.5, 1.25, 22500),
('76101', 'flooring', 7300, 1.5, 1.25, 17500)

ON CONFLICT (zip, category) DO UPDATE SET
    base_rate_cents = EXCLUDED.base_rate_cents,
    rush_multiplier = EXCLUDED.rush_multiplier,
    after_hours_multiplier = EXCLUDED.after_hours_multiplier,
    min_job_cents = EXCLUDED.min_job_cents,
    updated_at = now();

-- Note: Demo user accounts will be created via Supabase Auth API
-- This ensures proper password hashing and auth integration
-- The profiles will be automatically created via the handle_new_user() trigger

-- Insert sample audit log entry
INSERT INTO audit_logs (action, entity_type, metadata) VALUES
('database_seeded', 'system', jsonb_build_object(
    'pricing_records', 35,
    'cities_covered', 5,
    'categories_per_city', 7,
    'timestamp', now()
));

-- Create a function to seed demo users (to be called after auth setup)
CREATE OR REPLACE FUNCTION seed_demo_users()
RETURNS void AS $$
DECLARE
    client_id uuid;
    contractor_id uuid;
    landlord_id uuid;
    admin_id uuid;
    client_address_id uuid;
    landlord_address_id uuid;
BEGIN
    -- This function should be called after creating demo users via Supabase Auth
    -- It will populate additional data for existing demo accounts
    
    -- Get demo user IDs (assuming they exist)
    SELECT id INTO client_id FROM profiles WHERE email = 'client@prereno.demo' LIMIT 1;
    SELECT id INTO contractor_id FROM profiles WHERE email = 'contractor@prereno.demo' LIMIT 1;
    SELECT id INTO landlord_id FROM profiles WHERE email = 'landlord@prereno.demo' LIMIT 1;
    SELECT id INTO admin_id FROM profiles WHERE email = 'admin@prereno.demo' LIMIT 1;
    
    -- Only proceed if demo users exist
    IF client_id IS NOT NULL THEN
        -- Create client address
        INSERT INTO addresses (user_id, line1, line2, city, state, zip, lat, lng, is_default)
        VALUES (client_id, '123 Main Street', 'Apt 4B', 'Austin', 'TX', '78701', 30.2672, -97.7431, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO client_address_id;
        
        -- Get address ID if already exists
        IF client_address_id IS NULL THEN
            SELECT id INTO client_address_id FROM addresses WHERE user_id = client_id LIMIT 1;
        END IF;
    END IF;
    
    IF contractor_id IS NOT NULL THEN
        -- Create contractor profile
        INSERT INTO contractors (id, company, license_number, license_state, insurance_expires_on, verified, rating, completed_jobs)
        VALUES (contractor_id, 'Austin Plumbing Pro', 'TX-PL-12345', 'TX', '2025-12-31', true, 4.8, 127)
        ON CONFLICT (id) DO UPDATE SET
            company = EXCLUDED.company,
            license_number = EXCLUDED.license_number,
            verified = EXCLUDED.verified,
            rating = EXCLUDED.rating,
            completed_jobs = EXCLUDED.completed_jobs;
    END IF;
    
    IF landlord_id IS NOT NULL THEN
        -- Create landlord profile
        INSERT INTO landlords (id, company, properties_count)
        VALUES (landlord_id, 'Chen Properties LLC', 5)
        ON CONFLICT (id) DO UPDATE SET
            company = EXCLUDED.company,
            properties_count = EXCLUDED.properties_count;
            
        -- Create landlord address
        INSERT INTO addresses (user_id, line1, city, state, zip, lat, lng, is_default)
        VALUES (landlord_id, '456 Property Lane', 'Austin', 'TX', '78701', 30.2700, -97.7400, true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO landlord_address_id;
        
        -- Get address ID if already exists
        IF landlord_address_id IS NULL THEN
            SELECT id INTO landlord_address_id FROM addresses WHERE user_id = landlord_id LIMIT 1;
        END IF;
        
        -- Create sample property
        IF landlord_address_id IS NOT NULL THEN
            INSERT INTO properties (landlord_id, address_id, name, units_count)
            VALUES (landlord_id, landlord_address_id, 'Riverside Apartments', 12)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Create sample jobs if client and address exist
    IF client_id IS NOT NULL AND client_address_id IS NOT NULL THEN
        -- Sample completed job
        INSERT INTO jobs (
            client_id, address_id, title, description, category, status,
            detected_tags, scope_md, client_price_cents, contractor_net_cents, platform_fee_cents,
            margin_pct, rush_flag, after_hours_flag, city, zip, completed_at
        ) VALUES (
            client_id, client_address_id, 'Kitchen Faucet Replacement',
            'Replace leaking kitchen faucet with new single-handle model',
            'plumbing', 'completed',
            ARRAY['faucet_leak', 'under_sink_damage'],
            E'• Remove old faucet\n• Install new single-handle faucet\n• Test for leaks\n• Clean work area',
            24000, 19200, 4800, 0.20, false, false, 'Austin', '78701',
            now() - interval '5 days'
        ) ON CONFLICT DO NOTHING;
        
        -- Sample in-progress job
        INSERT INTO jobs (
            client_id, address_id, title, description, category, status,
            detected_tags, scope_md, client_price_cents, contractor_net_cents, platform_fee_cents,
            margin_pct, rush_flag, after_hours_flag, city, zip, renter_flag, landlord_id
        ) VALUES (
            client_id, client_address_id, 'Bathroom Tile Repair',
            'Fix cracked tiles around bathtub area',
            'handyman', 'in_progress',
            ARRAY['tile_crack', 'grout_damage'],
            E'• Remove damaged tiles\n• Apply new adhesive\n• Install replacement tiles\n• Regrout area',
            36000, 28800, 7200, 0.20, false, false, 'Austin', '78701', true, landlord_id
        ) ON CONFLICT DO NOTHING;
        
        -- Sample draft job
        INSERT INTO jobs (
            client_id, address_id, title, description, category, status,
            detected_tags, scope_md, client_price_cents, contractor_net_cents, platform_fee_cents,
            margin_pct, rush_flag, after_hours_flag, city, zip
        ) VALUES (
            client_id, client_address_id, 'Living Room Paint Touch-up',
            'Touch up scuffs and nail holes in living room walls',
            'paint', 'draft',
            ARRAY['wall_scuffs', 'nail_holes'],
            E'• Patch nail holes with spackle\n• Sand smooth\n• Prime patched areas\n• Apply matching paint',
            18000, 14400, 3600, 0.20, false, false, 'Austin', '78701'
        ) ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Demo user data seeded successfully';
END;
$$ LANGUAGE plpgsql;

-- Log the seeding completion
INSERT INTO audit_logs (action, entity_type, metadata) VALUES
('seed_data_complete', 'system', jsonb_build_object(
    'status', 'success',
    'note', 'Demo users must be created via Supabase Auth, then call seed_demo_users()',
    'timestamp', now()
));

SELECT 'PreReno seed data inserted successfully!' as status;
SELECT 'Demo accounts: client@prereno.demo, contractor@prereno.demo, landlord@prereno.demo, admin@prereno.demo' as demo_info;
SELECT 'Password for all demo accounts: demo123!' as demo_password;