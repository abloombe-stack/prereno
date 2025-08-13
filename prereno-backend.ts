// server/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { Resend } from 'resend';
import twilio from 'twilio';

// Environment variables
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_MESSAGING_SERVICE_SID,
  AI_VISION_API_KEY,
  AI_GPT_API_KEY,
  JWT_SECRET,
  PORT = 3001
} = process.env;

// Initialize services
const app = express();
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const stripe = new Stripe(STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const resend = new Resend(RESEND_API_KEY);
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourapp.com'] : 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Stripe webhook needs raw body
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Types
interface UserProfile {
  id: string;
  role: 'client' | 'landlord' | 'property_manager' | 'contractor' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
}

interface Job {
  id: string;
  client_id: string;
  address_id: string;
  title: string;
  description: string;
  category: string;
  renter_flag: boolean;
  landlord_id?: string;
  property_manager_id?: string;
  status: string;
  scheduled_at?: string;
  city: string;
  zip: string;
  photos: string[];
  lidar_scan_url?: string;
  ai_tags: string[];
  ai_scope_md: string;
  ai_cost_min_cents: number;
  ai_cost_max_cents: number;
  ai_client_price_cents: number;
  contractor_net_cents: number;
  margin_pct: number;
  rush_flag: boolean;
  after_hours_flag: boolean;
}

// Validation schemas
const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  category: z.enum(['plumbing', 'electrical', 'paint', 'handyman', 'roof', 'hvac', 'flooring']),
  address_id: z.string().uuid(),
  renter_flag: z.boolean(),
  landlord_id: z.string().uuid().optional(),
  rush_flag: z.boolean(),
  after_hours_flag: z.boolean()
});

const offerActionSchema = z.object({
  action: z.enum(['accept', 'counter', 'decline']),
  counter_net_cents: z.number().positive().optional()
});

// Authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = user;
    req.profile = profile;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role authorization middleware
const authorize = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.profile || !roles.includes(req.profile.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Magic link token verification
const verifyMagicToken = (req: any, res: any, next: any) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    req.magicData = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Utility functions
const uploadToSupabase = async (file: any, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;
  return data.path;
};

const createSignedUrl = async (bucket: string, path: string, expiresIn = 3600) => {
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl;
};

// AI Processing Functions
const analyzePhotoWithAI = async (photoUrls: string[]): Promise<any> => {
  // Simulate AI vision analysis
  // In production, this would call OpenAI Vision API or similar
  
  const mockTags = [
    'faucet_leak', 'water_stain', 'cabinet_damage', 'pipe_corrosion',
    'grout_damage', 'tile_crack', 'outlet_replace', 'wire_damage'
  ];

  const detectedTags = mockTags.slice(0, Math.floor(Math.random() * 4) + 1);
  
  return {
    tags: detectedTags,
    confidence: 0.85 + Math.random() * 0.15
  };
};

const generateScopeWithGPT = async (tags: string[], category: string): Promise<string> => {
  // Simulate GPT scope generation
  // In production, this would call OpenAI GPT API
  
  const scopeTemplates: { [key: string]: string[] } = {
    plumbing: [
      '• Shut off water supply',
      '• Remove old fixtures',
      '• Install new plumbing components',
      '• Test for leaks and proper flow',
      '• Clean and restore work area'
    ],
    electrical: [
      '• Turn off circuit breaker',
      '• Remove old electrical components',
      '• Install new wiring/fixtures safely',
      '• Test electrical connections',
      '• Restore power and verify operation'
    ],
    handyman: [
      '• Assess and prepare work area',
      '• Remove damaged materials',
      '• Install replacement components',
      '• Apply finishing touches',
      '• Clean and inspect completed work'
    ]
  };

  const template = scopeTemplates[category] || scopeTemplates.handyman;
  return template.join('\n');
};

// Pricing Logic
class PricingEngine {
  static async calculateJobPrice(
    category: string,
    zip: string,
    tags: string[],
    rushFlag: boolean,
    afterHoursFlag: boolean
  ): Promise<{
    laborHours: number;
    laborCostCents: number;
    materialCostCents: number;
    baseCostCents: number;
    adjustedCostCents: number;
    clientPriceCents: number;
    contractorNetCents: number;
    marginPct: number;
  }> {
    
    // Get cost factors for the zip/category
    const { data: costFactors } = await supabase
      .from('cost_factors')
      .select('*')
      .eq('zip', zip)
      .eq('category', category)
      .single();

    const laborRateCents = costFactors?.labor_rate_cents_per_hour || 8000; // $80/hour default
    const materialMultiplier = costFactors?.material_multiplier || 1.3;
    const smallJobMinCents = costFactors?.small_job_min_cents || 15000; // $150 minimum

    // Estimate labor hours based on tags complexity
    const complexityScore = tags.length * 0.5 + (tags.includes('water_damage') ? 1 : 0);
    const laborHours = Math.max(1, Math.min(8, 1 + complexityScore));

    // Calculate base costs
    const laborCostCents = Math.round(laborHours * laborRateCents);
    const materialCostCents = Math.round(laborCostCents * 0.4 * materialMultiplier);
    const baseCostCents = laborCostCents + materialCostCents;

    // Apply small job minimum
    const adjustedBaseCents = Math.max(baseCostCents, smallJobMinCents);

    // Apply rush and after-hours fees
    let adjustedCostCents = adjustedBaseCents;
    if (rushFlag) {
      adjustedCostCents = Math.round(adjustedCostCents * 1.5); // +50% for rush
    }
    if (afterHoursFlag) {
      adjustedCostCents = Math.round(adjustedCostCents * 1.25); // +25% for after hours
    }

    // Apply platform margin (default 20%)
    const marginPct = 0.20;
    const clientPriceCents = Math.round(adjustedCostCents / (1 - marginPct));
    const contractorNetCents = adjustedCostCents;

    return {
      laborHours,
      laborCostCents,
      materialCostCents,
      baseCostCents: adjustedBaseCents,
      adjustedCostCents,
      clientPriceCents,
      contractorNetCents,
      marginPct
    };
  }
}

// Email Templates
class EmailService {
  static async sendContractorBroadcast(
    contractorEmail: string,
    contractorName: string,
    job: Partial<Job>,
    offerToken: string
  ) {
    const acceptUrl = `${process.env.VITE_PUBLIC_URL}/offer/accept/${offerToken}`;
    const counterUrl = `${process.env.VITE_PUBLIC_URL}/offer/counter/${offerToken}`;
    const declineUrl = `${process.env.VITE_PUBLIC_URL}/offer/decline/${offerToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Job Opportunity in ${job.zip}</h2>
        <p>Hi ${contractorName},</p>
        <p>You've got a new opportunity near ${job.zip}.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${job.title} (${job.category})</h3>
          <p><strong>Your net payout:</strong> $${(job.contractor_net_cents! / 100).toFixed(0)}</p>
          <p><strong>Location:</strong> ${job.city}, ${job.zip}</p>
        </div>

        <div style="margin: 30px 0;">
          <a href="${acceptUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">Accept Job</a>
          <a href="${counterUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">Counter</a>
          <a href="${declineUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Decline</a>
        </div>

        <p><small>SLA: First to accept wins. Offer expires in 15 minutes.</small></p>
      </div>
    `;

    await resend.emails.send({
      from: 'PreReno <no-reply@prereno.app>',
      to: contractorEmail,
      subject: `New job in ${job.zip} — ${job.category} — Accept in 15 min`,
      html
    });
  }

  static async sendClientConfirmation(clientEmail: string, job: Job, contractor: any) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Confirmed: Your ${job.category} job is booked</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${job.title}</h3>
          <p><strong>Contractor:</strong> ${contractor.company}</p>
          <p><strong>Price:</strong> $${(job.ai_client_price_cents / 100).toFixed(0)}</p>
          <p><strong>Scheduled:</strong> ${job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : 'TBD'}</p>
        </div>

        <p>Your contractor will contact you to confirm the appointment time.</p>
      </div>
    `;

    await resend.emails.send({
      from: 'PreReno <no-reply@prereno.app>',
      to: clientEmail,
      subject: `Confirmed: your ${job.category} job is booked`,
      html
    });
  }

  static async sendLandlordApproval(landlordEmail: string, job: Job, tenant: UserProfile) {
    const approveUrl = `${process.env.VITE_PUBLIC_URL}/approve/${job.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Approval requested for unit ${job.city}</h2>
        <p>Your tenant ${tenant.first_name} ${tenant.last_name} has requested a ${job.category} repair.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${job.title}</h3>
          <p><strong>Estimated cost:</strong> $${(job.ai_client_price_cents / 100).toFixed(0)}</p>
          <p><strong>Scope:</strong></p>
          <pre style="white-space: pre-wrap;">${job.ai_scope_md}</pre>
        </div>

        <div style="margin: 30px 0;">
          <a href="${approveUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Approve</a>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'PreReno <no-reply@prereno.app>',
      to: landlordEmail,
      subject: `Approval requested for unit ${job.city}`,
      html
    });
  }
}

// SMS Service
class SMSService {
  static async sendContractorAlert(phone: string, jobTitle: string, zip: string, token: string) {
    const acceptUrl = `${process.env.VITE_PUBLIC_URL}/offer/accept/${token}`;
    
    const message = `New PreReno job: ${jobTitle} in ${zip}. Accept: ${acceptUrl} (15 min to respond)`;

    await twilioClient.messages.create({
      body: message,
      messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
      to: phone
    });
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'client' } = req.body;

    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (authUser.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          role,
          first_name: firstName,
          last_name: lastName
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    res.json({ user: authUser.user, session: authUser.session });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Job management routes
app.post('/api/jobs', authenticate, upload.array('photos', 5), async (req, res) => {
  try {
    const validation = createJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { title, description, category, address_id, renter_flag, landlord_id, rush_flag, after_hours_flag } = validation.data;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

    // Upload photos to Supabase Storage
    const photoUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${req.user.id}/${Date.now()}-${i}.${file.originalname.split('.').pop()}`;
      const path = await uploadToSupabase(file, 'job-photos', fileName);
      photoUrls.push(path);
    }

    // Get address details for pricing
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .single();

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // AI Analysis
    const aiTags = await analyzePhotoWithAI(photoUrls);
    const aiScope = await generateScopeWithGPT(aiTags.tags, category);
    
    // Calculate pricing
    const pricing = await PricingEngine.calculateJobPrice(
      category,
      address.zip,
      aiTags.tags,
      rush_flag,
      after_hours_flag
    );

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        client_id: req.user.id,
        address_id,
        title,
        description,
        category,
        renter_flag,
        landlord_id,
        status: 'draft',
        city: address.city,
        zip: address.zip,
        photos: photoUrls,
        ai_tags: aiTags.tags,
        ai_scope_md: aiScope,
        ai_cost_min_cents: Math.round(pricing.clientPriceCents * 0.9),
        ai_cost_max_cents: Math.round(pricing.clientPriceCents * 1.1),
        ai_client_price_cents: pricing.clientPriceCents,
        contractor_net_cents: pricing.contractorNetCents,
        margin_pct: pricing.marginPct,
        rush_flag,
        after_hours_flag
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return res.status(500).json({ error: 'Failed to create job' });
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      actor_profile_id: req.user.id,
      action: 'job_created',
      entity: 'job',
      entity_id: job.id,
      meta_json: { ai_confidence: aiTags.confidence }
    });

    res.json({
      job,
      pricing,
      ai_analysis: {
        tags: aiTags.tags,
        confidence: aiTags.confidence,
        scope: aiScope
      }
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/jobs/:id/book', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('client_id', req.user.id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'draft') {
      return res.status(400).json({ error: 'Job cannot be booked in current status' });
    }

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'awaiting_accept' })
      .eq('id', id);

    // Get available contractors in the area
    const { data: contractors } = await supabase
      .from('contractors')
      .select('*, profiles!inner(id, first_name, last_name, email, phone)')
      .eq('verified', true)
      .ilike('license_state', job.zip.substring(0, 2) + '%'); // Basic geo matching

    // Create offers and send notifications
    const offers = [];
    for (const contractor of contractors || []) {
      // Create magic link token
      const token = jwt.sign(
        { 
          contractor_id: contractor.id,
          job_id: job.id,
          action: 'offer',
          exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
        },
        JWT_SECRET!
      );

      // Create offer record
      const { data: offer } = await supabase
        .from('job_offers')
        .insert({
          job_id: job.id,
          contractor_id: contractor.id,
          offer_type: 'broadcast',
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      offers.push(offer);

      // Send email and SMS notifications
      try {
        await EmailService.sendContractorBroadcast(
          contractor.profiles.email,
          contractor.profiles.first_name,
          job,
          token
        );

        if (contractor.profiles.phone) {
          await SMSService.sendContractorAlert(
            contractor.profiles.phone,
            job.title,
            job.zip,
            token
          );
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
      }
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      actor_profile_id: req.user.id,
      action: 'job_booked',
      entity: 'job',
      entity_id: job.id,
      meta_json: { contractors_notified: contractors?.length || 0 }
    });

    res.json({ 
      message: 'Job booked successfully',
      offers_sent: offers.length
    });
  } catch (error) {
    console.error('Job booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Offer management routes
app.post('/api/offers/:token/accept', verifyMagicToken, async (req, res) => {
  try {
    const { contractor_id, job_id } = req.magicData;

    // Check if offer is still valid and job is available
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .eq('status', 'awaiting_accept')
      .single();

    if (!job) {
      return res.status(400).json({ error: 'Job is no longer available' });
    }

    // Atomic update: accept the offer and update job status
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: 'accepted',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      })
      .eq('id', job_id)
      .eq('status', 'awaiting_accept'); // Ensure still available

    if (updateError) {
      return res.status(400).json({ error: 'Job was already accepted by another contractor' });
    }

    // Update the specific offer
    await supabase
      .from('job_offers')
      .update({ 
        offer_type: 'accept',
        accepted_at: new Date().toISOString()
      })
      .eq('job_id', job_id)
      .eq('contractor_id', contractor_id);

    // Expire all other offers
    await supabase
      .from('job_offers')
      .update({ offer_type: 'expired' })
      .eq('job_id', job_id)
      .neq('contractor_id', contractor_id);

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: job.ai_client_price_cents,
      currency: 'usd',
      metadata: {
        job_id: job.id,
        contractor_id,
        client_id: job.client_id
      }
    });

    // Store payment record
    await supabase.from('payments').insert({
      job_id: job.id,
      client_id: job.client_id,
      contractor_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: job.ai_client_price_cents,
      fee_cents: job.ai_client_price_cents - job.contractor_net_cents,
      status: 'pending'
    });

    // Get contractor and client details for notifications
    const { data: contractor } = await supabase
      .from('contractors')
      .select('*, profiles!inner(*)')
      .eq('id', contractor_id)
      .single();

    const { data: client } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', job.client_id)
      .single();

    // Send confirmation emails
    if (client && contractor) {
      await EmailService.sendClientConfirmation(
        client.email,
        job,
        contractor
      );
    }

    res.json({ 
      message: 'Offer accepted successfully',
      payment_intent_client_secret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Offer accept error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/offers/:token/counter', verifyMagicToken, async (req, res) => {
  try {
    const { contractor_id, job_id } = req.magicData;
    const validation = offerActionSchema.safeParse(req.body);
    
    if (!validation.success || !validation.data.counter_net_cents) {
      return res.status(400).json({ error: 'Counter amount required' });
    }

    const { counter_net_cents } = validation.data;

    // Get original job pricing
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (!job || job.status !== 'awaiting_accept') {
      return res.status(400).json({ error: 'Job is no longer available' });
    }

    // Check if counter is within acceptable range (±20% of original)
    const maxCounter = job.contractor_net_cents * 1.2;
    const minCounter = job.contractor_net_cents * 0.8;

    if (counter_net_cents > maxCounter || counter_net_cents < minCounter) {
      return res.status(400).json({ 
        error: 'Counter offer outside acceptable range',
        range: { min: minCounter, max: maxCounter }
      });
    }

    // Update offer with counter
    await supabase
      .from('job_offers')
      .update({
        offer_type: 'counter',
        counter_net_cents
      })
      .eq('job_id', job_id)
      .eq('contractor_id', contractor_id);

    // Auto-approve if within 10% of original
    const autoApproveThreshold = job.contractor_net_cents * 1.1;
    if (counter_net_cents <= autoApproveThreshold) {
      // Accept the counter automatically
      const newClientPrice = Math.round(counter_net_cents / (1 - job.margin_pct));
      
      await supabase
        .from('jobs')
        .update({
          status: 'accepted',
          contractor_net_cents: counter_net_cents,
          ai_client_price_cents: newClientPrice,
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', job_id);

      return res.json({ 
        message: 'Counter offer auto-approved',
        new_price: newClientPrice
      });
    }

    // Otherwise, require admin/client approval
    res.json({ 
      message: 'Counter offer submitted for review',
      status: 'pending_approval'
    });
  } catch (error) {
    console.error('Counter offer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/offers/:token/decline', verifyMagicToken, async (req, res) => {
  try {
    const { contractor_id, job_id } = req.magicData;

    await supabase
      .from('job_offers')
      .update({ offer_type: 'decline' })
      .eq('job_id', job_id)
      .eq('contractor_id', contractor_id);

    res.json({ message: 'Offer declined' });
  } catch (error) {
    console.error('Offer decline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment routes
app.post('/api/payments/:job_id/confirm', authenticate, async (req, res) => {
  try {
    const { job_id } = req.params;
    const { payment_intent_id } = req.body;

    // Confirm payment with Stripe
    const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', payment_intent_id);

      // Update job status
      await supabase
        .from('jobs')
        .update({ status: 'scheduled' })
        .eq('id', job_id);

      res.json({ message: 'Payment confirmed', status: 'succeeded' });
    } else {
      res.status(400).json({ error: 'Payment failed', status: paymentIntent.status });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Job completion routes
app.post('/api/jobs/:id/complete', authenticate, authorize(['contractor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { after_photos } = req.body;

    // Verify contractor owns this job
    const { data: job } = await supabase
      .from('jobs')
      .select('*, job_offers!inner(contractor_id)')
      .eq('id', id)
      .eq('job_offers.contractor_id', req.profile.id)
      .eq('job_offers.offer_type', 'accept')
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Update job status
    await supabase
      .from('jobs')
      .update({ 
        status: 'ready_for_review',
        // after_photos would be stored in a separate table or JSON field
      })
      .eq('id', id);

    res.json({ message: 'Job marked as complete' });
  } catch (error) {
    console.error('Job completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/jobs/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Verify client owns this job
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('client_id', req.user.id)
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get payment info
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('job_id', id)
      .eq('status', 'succeeded')
      .single();

    if (!payment) {
      return res.status(400).json({ error: 'No valid payment found' });
    }

    // Release payment to contractor (this would typically involve Stripe Transfer)
    await supabase
      .from('payments')
      .update({ 
        status: 'released',
        released_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', id);

    // Add review
    if (rating && payment.contractor_id) {
      await supabase.from('reviews').insert({
        job_id: id,
        rater_profile_id: req.user.id,
        ratee_profile_id: payment.contractor_id,
        rating,
        comment
      });
    }

    res.json({ message: 'Job approved and payment released' });
  } catch (error) {
    console.error('Job approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Landlord approval routes
app.post('/api/approvals/:job_id/landlord', authenticate, authorize(['landlord', 'property_manager']), async (req, res) => {
  try {
    const { job_id } = req.params;
    const { action, message } = req.body; // approve, request_changes, decline

    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .eq('landlord_id', req.user.id)
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Log approval decision
    await supabase.from('audit_logs').insert({
      actor_profile_id: req.user.id,
      action: `landlord_${action}`,
      entity: 'job',
      entity_id: job_id,
      meta_json: { message }
    });

    if (action === 'approve') {
      // Continue with normal job flow
      res.json({ message: 'Job approved by landlord' });
    } else {
      // Handle other actions (changes/decline)
      res.json({ message: `Job ${action} by landlord` });
    }
  } catch (error) {
    console.error('Landlord approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes
app.get('/api/admin/contractors/pending', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { data: contractors } = await supabase
      .from('contractors')
      .select('*, profiles!inner(*)')
      .eq('verified', false);

    res.json(contractors);
  } catch (error) {
    console.error('Admin contractors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/contractors/:id/verify', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    await supabase
      .from('contractors')
      .update({ verified })
      .eq('id', id);

    res.json({ message: `Contractor ${verified ? 'verified' : 'rejected'}` });
  } catch (error) {
    console.error('Contractor verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe webhook handler
app.post('/api/webhooks/stripe', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET!);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        
        if (paymentIntent.metadata.job_id) {
          await supabase
            .from('jobs')
            .update({ status: 'scheduled' })
            .eq('id', paymentIntent.metadata.job_id);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', failedPayment.id);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Public cost estimation endpoint
app.get('/api/cost/zip/:zip/category/:category', async (req, res) => {
  try {
    const { zip, category } = req.params;

    const { data: costFactors } = await supabase
      .from('cost_factors')
      .select('*')
      .eq('zip', zip)
      .eq('category', category)
      .single();

    if (!costFactors) {
      return res.status(404).json({ error: 'Cost data not available for this area' });
    }

    // Return simplified cost guide
    res.json({
      zip,
      category,
      labor_rate_per_hour: costFactors.labor_rate_cents_per_hour / 100,
      typical_range: {
        min: costFactors.small_job_min_cents / 100,
        max: (costFactors.small_job_min_cents * 5) / 100
      }
    });
  } catch (error) {
    console.error('Cost estimation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics endpoint
app.post('/api/metrics/track', async (req, res) => {
  try {
    const { event, properties } = req.body;
    
    // Store in audit_logs for simple analytics
    await supabase.from('audit_logs').insert({
      actor_profile_id: req.user?.id || null,
      action: 'metric_tracked',
      entity: 'analytics',
      entity_id: null,
      meta_json: { event, properties, timestamp: new Date().toISOString() }
    });

    res.json({ tracked: true });
  } catch (error) {
    console.error('Metrics tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`PreReno API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;