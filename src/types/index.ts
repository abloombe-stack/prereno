export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  client_id: string
  title: string
  description?: string
  category: 'plumbing' | 'electrical' | 'paint' | 'handyman' | 'roof' | 'hvac' | 'flooring'
  status: 'draft' | 'quoting' | 'awaiting_accept' | 'accepted' | 'scheduled' | 'in_progress' | 'disputed' | 'completed' | 'cancelled'
  photos: string[]
  detected_tags: string[]
  scope_md?: string
  client_price_cents: number
  contractor_net_cents: number
  platform_fee_cents: number
  margin_pct: number
  rush_flag: boolean
  after_hours_flag: boolean
  city: string
  zip: string
  renter_flag: boolean
  landlord_id?: string
  scheduled_at?: string
  created_at: string
  updated_at: string
}

export interface Contractor {
  id: string
  company: string
  license_number: string
  license_state: string
  verified: boolean
  rating: number
  completed_jobs: number
  created_at: string
}

export interface Offer {
  id: string
  job_id: string
  contractor_id: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  counter_amount_cents?: number
  expires_at: string
  accepted_at?: string
  magic_token?: string
  created_at: string
}