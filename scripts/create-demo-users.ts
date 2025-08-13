import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const DEMO_PASSWORD = 'demo123!'

async function createDemoUsers() {
  console.log('🌱 Creating demo users...')

  const demoUsers = [
    {
      email: 'client@prereno.demo',
      password: DEMO_PASSWORD,
      role: 'client',
      firstName: 'Sarah',
      lastName: 'Johnson'
    },
    {
      email: 'contractor@prereno.demo',
      password: DEMO_PASSWORD,
      role: 'contractor',
      firstName: 'Mike',
      lastName: 'Rodriguez'
    },
    {
      email: 'landlord@prereno.demo',
      password: DEMO_PASSWORD,
      role: 'landlord',
      firstName: 'David',
      lastName: 'Chen'
    },
    {
      email: 'admin@prereno.demo',
      password: DEMO_PASSWORD,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    }
  ]

  const createdUsers = []

  for (const user of demoUsers) {
    try {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role
        }
      })

      if (authError) {
        console.warn(`User ${user.email} might already exist:`, authError.message)
        continue
      }

      if (authUser.user) {
        // Create profile (should be handled by trigger, but let's ensure it)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email
          })

        if (profileError) {
          console.error(`Profile creation error for ${user.email}:`, profileError)
        } else {
          createdUsers.push({ ...user, id: authUser.user.id })
          console.log(`✅ Created user: ${user.email}`)
        }

        // Create role-specific records
        if (user.role === 'contractor') {
          await supabase.from('contractors').upsert({
            id: authUser.user.id,
            company: 'Austin Plumbing Pro',
            license_number: 'TX-PL-12345',
            license_state: 'TX',
            insurance_expires_on: '2025-12-31',
            verified: true,
            rating: 4.8,
            completed_jobs: 127
          })
        } else if (user.role === 'landlord') {
          await supabase.from('landlords').upsert({
            id: authUser.user.id,
            company: 'Chen Properties LLC',
            properties_count: 5
          })
        }

        // Create default address for client and landlord
        if (user.role === 'client' || user.role === 'landlord') {
          await supabase.from('addresses').insert({
            user_id: authUser.user.id,
            line1: user.role === 'client' ? '123 Main Street' : '456 Property Lane',
            line2: user.role === 'client' ? 'Apt 4B' : null,
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            lat: 30.2672,
            lng: -97.7431,
            is_default: true
          })
        }
      }
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error)
    }
  }

  // Create sample jobs for the client
  const clientUser = createdUsers.find(u => u.role === 'client')
  const landlordUser = createdUsers.find(u => u.role === 'landlord')

  if (clientUser) {
    const { data: clientAddress } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', clientUser.id)
      .single()

    if (clientAddress) {
      const sampleJobs = [
        {
          title: 'Kitchen Faucet Replacement',
          description: 'Old faucet is leaking and needs replacement',
          category: 'plumbing',
          status: 'completed',
          ai_tags: ['faucet_leak', 'under_sink_damage'],
          ai_scope_md: '• Remove old faucet\n• Install new single-handle faucet\n• Test for leaks\n• Clean work area',
          client_price_cents: 24000,
          contractor_net_cents: 19200,
          platform_fee_cents: 4800
        },
        {
          title: 'Bathroom Tile Repair',
          description: 'Several cracked tiles around bathtub',
          category: 'handyman',
          status: 'in_progress',
          ai_tags: ['tile_crack', 'grout_damage'],
          ai_scope_md: '• Remove damaged tiles\n• Apply new adhesive\n• Install replacement tiles\n• Regrout area',
          client_price_cents: 36000,
          contractor_net_cents: 28800,
          platform_fee_cents: 7200,
          renter_flag: true,
          landlord_id: landlordUser?.id
        }
      ]

      for (const job of sampleJobs) {
        await supabase.from('jobs').insert({
          client_id: clientUser.id,
          address_id: clientAddress.id,
          city: 'Austin',
          zip: '78701',
          margin_pct: 0.20,
          rush_flag: false,
          after_hours_flag: false,
          ...job
        })
      }

      console.log('✅ Created sample jobs')
    }
  }

  console.log('\n🎯 Demo accounts created:')
  console.log('Client: client@prereno.demo / demo123!')
  console.log('Contractor: contractor@prereno.demo / demo123!')
  console.log('Landlord: landlord@prereno.demo / demo123!')
  console.log('Admin: admin@prereno.demo / demo123!')
}

// Run if called directly
if (require.main === module) {
  createDemoUsers().catch(console.error)
}

export default createDemoUsers