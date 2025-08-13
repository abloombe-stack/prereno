// server/src/tests/pricing.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingEngine } from '../services/pricing';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('@supabase/supabase-js');
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
};

describe('PricingEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock cost factors data
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: {
        labor_rate_cents_per_hour: 8000, // $80/hour
        material_multiplier: 1.3,
        small_job_min_cents: 15000 // $150 minimum
      }
    });
  });

  it('should calculate basic job pricing correctly', async () => {
    const result = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      false, // no rush
      false  // no after hours
    );

    expect(result.laborHours).toBeGreaterThan(0);
    expect(result.clientPriceCents).toBeGreaterThan(result.contractorNetCents);
    expect(result.marginPct).toBe(0.20);
    expect(result.baseCostCents).toBeGreaterThanOrEqual(15000); // Minimum job cost
  });

  it('should apply rush fee correctly', async () => {
    const normalResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      false,
      false
    );

    const rushResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      true, // rush job
      false
    );

    expect(rushResult.adjustedCostCents).toBe(Math.round(normalResult.baseCostCents * 1.5));
    expect(rushResult.clientPriceCents).toBeGreaterThan(normalResult.clientPriceCents);
  });

  it('should apply after-hours fee correctly', async () => {
    const normalResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      false,
      false
    );

    const afterHoursResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      false,
      true // after hours
    );

    expect(afterHoursResult.adjustedCostCents).toBe(Math.round(normalResult.baseCostCents * 1.25));
  });

  it('should apply both rush and after-hours fees', async () => {
    const normalResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      false,
      false
    );

    const bothFeesResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      true,  // rush
      true   // after hours
    );

    const expectedCost = Math.round(normalResult.baseCostCents * 1.5 * 1.25);
    expect(bothFeesResult.adjustedCostCents).toBe(expectedCost);
  });

  it('should enforce minimum job cost', async () => {
    // Test with minimal tags to get low base cost
    const result = await PricingEngine.calculateJobPrice(
      'handyman',
      '78701',
      [], // no tags
      false,
      false
    );

    expect(result.baseCostCents).toBeGreaterThanOrEqual(15000);
  });

  it('should scale pricing with complexity', async () => {
    const simpleResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      false,
      false
    );

    const complexResult = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak', 'water_damage', 'pipe_corrosion', 'cabinet_damage'],
      false,
      false
    );

    expect(complexResult.laborHours).toBeGreaterThan(simpleResult.laborHours);
    expect(complexResult.baseCostCents).toBeGreaterThan(simpleResult.baseCostCents);
  });

  it('should round prices to whole dollars', async () => {
    const result = await PricingEngine.calculateJobPrice(
      'plumbing',
      '78701',
      ['faucet_leak'],
      false,
      false
    );

    expect(result.clientPriceCents % 100).toBe(0); // Should be whole dollars
    expect(result.contractorNetCents % 100).toBe(0);
  });
});

// server/src/tests/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Authentication', () => {
  it('should reject requests without token', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .send({
        title: 'Test Job',
        category: 'plumbing'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('No token provided');
  });

  it('should reject invalid tokens', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        title: 'Test Job',
        category: 'plumbing'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });
});

// server/src/tests/validation.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

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

describe('Input Validation', () => {
  it('should validate correct job data', () => {
    const validData = {
      title: 'Kitchen Faucet Repair',
      description: 'Replace leaking kitchen faucet',
      category: 'plumbing' as const,
      address_id: '123e4567-e89b-12d3-a456-426614174000',
      renter_flag: false,
      rush_flag: false,
      after_hours_flag: false
    };

    const result = createJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid category', () => {
    const invalidData = {
      title: 'Test Job',
      description: 'Test description',
      category: 'invalid-category',
      address_id: '123e4567-e89b-12d3-a456-426614174000',
      renter_flag: false,
      rush_flag: false,
      after_hours_flag: false
    };

    const result = createJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const invalidData = {
      title: '',
      description: 'Test description',
      category: 'plumbing' as const,
      address_id: '123e4567-e89b-12d3-a456-426614174000',
      renter_flag: false,
      rush_flag: false,
      after_hours_flag: false
    };

    const result = createJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID', () => {
    const invalidData = {
      title: 'Test Job',
      description: 'Test description',
      category: 'plumbing' as const,
      address_id: 'not-a-uuid',
      renter_flag: false,
      rush_flag: false,
      after_hours_flag: false
    };

    const result = createJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

// client/src/tests/JobCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCard } from '../components/JobCard';

const mockJob = {
  id: '1',
  title: 'Kitchen Faucet Repair',
  description: 'Replace leaking faucet',
  category: 'plumbing' as const,
  status: 'completed' as const,
  photos: ['/test-image.jpg'],
  aiTags: ['faucet_leak'],
  aiScopeMd: 'Test scope',
  aiClientPriceCents: 25000,
  contractorNetCents: 20000,
  marginPct: 0.20,
  rushFlag: false,
  afterHoursFlag: false,
  city: 'Austin',
  zip: '78701',
  renterFlag: false,
  createdAt: '2025-01-01T00:00:00Z'
};

describe('JobCard', () => {
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Kitchen Faucet Repair')).toBeInTheDocument();
    expect(screen.getByText('Austin, 78701')).toBeInTheDocument();
    expect(screen.getByText('$250')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('shows renter badge when applicable', () => {
    const renterJob = { ...mockJob, renterFlag: true };
    render(<JobCard job={renterJob} />);

    expect(screen.getByText('Renter')).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    const expensiveJob = { ...mockJob, aiClientPriceCents: 123456 };
    render(<JobCard job={expensiveJob} />);

    expect(screen.getByText('$1235')).toBeInTheDocument();
  });
});

// e2e/tests/job-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Job Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.goto('/');
    await page.click('text=Get Started');
    // Assume we have a test user setup
  });

  test('client can create job and get quote', async ({ page }) => {
    // Navigate to new job form
    await page.click('text=Scan & Quote Now');
    
    // Upload photos
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-fixtures/kitchen-faucet.jpg']);
    
    await page.click('text=Next: Add Details');
    
    // Fill job details
    await page.fill('input[placeholder*="Kitchen Faucet"]', 'Kitchen Faucet Replacement');
    await page.selectOption('select', 'plumbing');
    await page.fill('input[placeholder*="123 Main St"]', '123 Test St, Austin, TX 78701');
    
    await page.click('text=Get AI Quote');
    
    // Wait for AI analysis
    await expect(page.locator('text=Analyzing photos')).toBeVisible();
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 10000 });
    
    // Verify quote is displayed
    await expect(page.locator('text=$')).toBeVisible();
    await expect(page.locator('text=Detected Issues')).toBeVisible();
    await expect(page.locator('text=Scope of Work')).toBeVisible();
    
    // Book the job
    await page.click('text=Book at This Price');
    
    // Verify redirect to jobs list
    await expect(page.url()).toContain('/jobs');
    await expect(page.locator('text=Kitchen Faucet Replacement')).toBeVisible();
  });

  test('contractor can accept job via magic link', async ({ page, context }) => {
    // Simulate contractor receiving email with magic link
    const magicToken = 'test-magic-token-12345';
    
    await page.goto(`/offer/accept/${magicToken}`);
    
    // Should see job details
    await expect(page.locator('text=Accept Job Offer')).toBeVisible();
    await expect(page.locator('text=Kitchen Faucet Replacement')).toBeVisible();
    
    // Accept the job
    await page.click('text=Accept Job');
    
    // Should see success message
    await expect(page.locator('text=Job accepted successfully')).toBeVisible();
  });

  test('client can pay for accepted job', async ({ page }) => {
    // Navigate to job that was accepted
    await page.goto('/app/jobs/test-job-id');
    
    await expect(page.locator('text=accepted')).toBeVisible();
    await page.click('text=Pay Now');
    
    // Fill payment form (using Stripe test card)
    await page.fill('[placeholder="1234 1234 1234 1234"]', '4242424242424242');
    await page.fill('[placeholder="MM / YY"]', '12/25');
    await page.fill('[placeholder="CVC"]', '123');
    await page.fill('[placeholder="Full name"]', 'Test Customer');
    
    await page.click('text=Pay $250');
    
    // Verify payment success
    await expect(page.locator('text=Payment successful')).toBeVisible();
    await expect(page.locator('text=scheduled')).toBeVisible();
  });

  test('contractor can mark job complete', async ({ page }) => {
    // Login as contractor
    await page.goto('/contractor/dashboard');
    
    // Find job in progress
    await page.click('text=Kitchen Faucet Replacement');
    
    // Upload after photos
    await page.click('text=Mark Complete');
    const fileInput = page.locator('input[type="file"]').last();
    await fileInput.setInputFiles(['./test-fixtures/completed-faucet.jpg']);
    
    await page.click('text=Submit Completion');
    
    // Verify status change
    await expect(page.locator('text=ready_for_review')).toBeVisible();
  });

  test('client can approve and rate completed job', async ({ page }) => {
    // Navigate to completed job
    await page.goto('/app/jobs/test-job-id');
    
    await expect(page.locator('text=ready_for_review')).toBeVisible();
    
    // Approve the work
    await page.click('text=Approve Work');
    
    // Rate the contractor
    await page.click('[data-rating="5"]'); // 5 stars
    await page.fill('textarea[placeholder*="review"]', 'Excellent work! Very professional.');
    
    await page.click('text=Submit Review');
    
    // Verify completion
    await expect(page.locator('text=completed')).toBeVisible();
    await expect(page.locator('text=Payment released')).toBeVisible();
  });
});

test.describe('Renter Flow with Landlord Approval', () => {
  test('renter can request landlord approval', async ({ page }) => {
    await page.goto('/app/new-job');
    
    // Create job as renter
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-fixtures/bathroom-tile.jpg']);
    
    await page.click('text=Next: Add Details');
    
    await page.fill('input[placeholder*="title"]', 'Bathroom Tile Repair');
    await page.selectOption('select', 'handyman');
    await page.check('text=I\'m a renter');
    
    await page.click('text=Get AI Quote');
    await expect(page.locator('text=AI Analysis Complete')).toBeVisible({ timeout: 10000 });
    
    await page.click('text=Book at This Price');
    
    // Should see landlord approval message
    await expect(page.locator('text=Landlord approval required')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate network error
    await page.route('/api/jobs', route => route.abort());
    
    await page.goto('/app/new-job');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(['./test-fixtures/test-image.jpg']);
    
    await page.click('text=Get AI Quote');
    
    // Should show error message
    await expect(page.locator('text=Something went wrong')).toBeVisible();
    await expect(page.locator('text=Try again')).toBeVisible();
  });

  test('validates form inputs', async ({ page }) => {
    await page.goto('/app/new-job');
    
    // Try to proceed without photos
    await page.click('text=Next: Add Details');
    
    // Should show validation error
    await expect(page.locator('text=At least one photo is required')).toBeVisible();
  });
});

// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:client',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev:server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
    },
  ],
});

// server/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
});

// client/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
});

// client/src/tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// server/src/tests/setup.ts
import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock external services
vi.mock('@supabase/supabase-js');
vi.mock('stripe');
vi.mock('twilio');
vi.mock('resend');