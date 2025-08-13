# PreReno - AI-Powered Home Repair Platform

**Scan → AI Quote in 60s → Local Insured Pro Accepts → Pay → Job Done**

PreReno is a production-ready, mobile-first PWA that delivers instant AI quotes for home repairs from photos, dispatches auto email/SMS bids to insured local contractors, books jobs, and processes payments with a built-in 20% platform margin.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourorg/prereno.git
cd prereno

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Run database migrations
npm run migrate

# Seed the database
npm run seed

# Start development servers
npm run dev

# In another terminal, start Stripe webhook listener
npm run stripe:listen
```

Visit `http://localhost:5173` to see the app running.

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account with API keys
- Resend account for emails
- Twilio account for SMS
- OpenAI API key for AI features

## 🔧 Environment Setup

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy your URL and anon key
3. Run the database schema from `database-schema.sql` in the SQL editor
4. Set up storage buckets:
   - `job-photos` (private, 10MB limit, images only)
   - `documents` (private, 50MB limit, PDFs and images)
   - `avatars` (public, 2MB limit, images only)

### 2. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Enable Stripe Connect for contractor payouts
4. Set up webhook endpoint: `https://yourapp.com/api/webhooks/stripe`
5. Install Stripe CLI for local development: `stripe login`

### 3. Communication Services

**Resend (Email):**
1. Sign up at [resend.com](https://resend.com)
2. Add your domain and verify DNS
3. Get your API key

**Twilio (SMS):**
1. Create account at [twilio.com](https://twilio.com)
2. Get Account SID, Auth Token, and Messaging Service SID
3. Verify your phone number for testing

### 4. AI Services

**OpenAI:**
1. Get API key from [openai.com](https://openai.com)
2. Ensure you have access to Vision API and GPT-4

## 📝 Environment Variables

Create `.env` file in the root directory:

```bash
# App Configuration
VITE_APP_NAME=PreReno
VITE_PUBLIC_URL=http://localhost:5173
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_MESSAGING_SERVICE_SID=MG...

# AI Services
AI_VISION_API_KEY=your-openai-key
AI_GPT_API_KEY=your-openai-key

# Optional: Maps
MAPBOX_TOKEN=pk.ey...
```

### Production Environment Variables

For production, also add:

```bash
NODE_ENV=production
VITE_PUBLIC_URL=https://yourapp.com

# Database (if using external Postgres)
DATABASE_URL=postgresql://user:pass@host:5432/prereno

# Security
CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

## 🏗️ Project Structure

```
prereno/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API calls and business logic
│   │   ├── types/         # TypeScript type definitions
│   │   └── tests/         # Unit tests
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── types/         # TypeScript types
│   │   ├── scripts/       # Database scripts
│   │   └── tests/         # Unit tests
│   └── package.json
├── e2e/                   # End-to-end tests
│   ├── tests/             # Playwright test files
│   └── package.json
├── docs/                  # Documentation
│   ├── api.yaml          # OpenAPI specification
│   └── deployment.md     # Deployment guide
├── database-schema.sql    # Database setup
└── package.json          # Root package.json
```

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Start only frontend
npm run dev:server       # Start only backend

# Building
npm run build            # Build both client and server
npm run build:client     # Build frontend for production
npm run build:server     # Compile TypeScript backend

# Testing
npm run test             # Run all tests
npm run test:client      # Run frontend unit tests
npm run test:server      # Run backend unit tests
npm run test:e2e         # Run end-to-end tests

# Code Quality
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with test data

# Stripe
npm run stripe:listen    # Start webhook forwarding
```

## 🧪 Testing

### Unit Tests

Run with `npm run test`. Tests cover:

- **Pricing Engine**: Complex pricing calculations with rush fees, minimums, and margins
- **Input Validation**: Zod schema validation for all API endpoints
- **Authentication**: JWT token verification and role-based access
- **Business Logic**: Job creation, offer management, payment processing

### End-to-End Tests

Run with `npm run test:e2e`. Critical user flows:

1. **Complete Job Flow**: Client creates job → contractor accepts → payment → completion
2. **Renter Flow**: Renter requests repair → landlord approval → normal flow
3. **Magic Link Actions**: Contractor email/SMS links work correctly
4. **Payment Processing**: Stripe integration works end-to-end
5. **Error Handling**: Network failures and validation errors

### Load Testing

Test contractor dispatch with `npm run test:load`:

- Broadcast to 100+ contractors
- Ensure first-accept wins atomically
- Other contractors get graceful "already taken" response

## 🚀 Deployment

### Recommended Stack

- **Frontend**: Vercel or Netlify
- **Backend**: Railway, Render, or DigitalOcean App Platform
- **Database**: Supabase (includes auth, storage, real-time)
- **CDN**: Cloudflare for images and static assets

### Quick Deploy to Vercel + Railway

1. **Frontend (Vercel):**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from client directory
   cd client
   vercel --prod
   ```

2. **Backend (Railway):**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Deploy from server directory
   cd server
   railway login
   railway init
   railway up
   ```

3. **Environment Variables:**
   - Set all production env vars in both platforms
   - Update CORS origins and webhook URLs
   - Test all integrations

### Database Migration

For production deployment:

```bash
# Connect to production database
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Seed production data
npm run seed:prod
```

### Health Checks

Monitor these endpoints:

- `GET /api/health` - API server status
- `GET /api/cost/zip/78701/category/plumbing` - Database connectivity
- Stripe webhook delivery in dashboard
- Supabase real-time connections

## 📊 Analytics & Monitoring

### Key Metrics Tracked

- **North Star**: GMV (Gross Merchandise Value)
- **Take Rate**: Platform fee percentage (~20%)
- **Time-to-Quote**: AI analysis speed
- **Accept-within-SLA**: Contractor response rate
- **1st-Job Success**: Completion rate for new users
- **Repeat Rate**: Customer retention
- **Refund Rate**: Dispute resolution

### Monitoring Setup

Add to production:

```bash
# Error tracking
npm install @sentry/node @sentry/react

# Analytics
npm install @analytics/core @analytics/segment-plugin

# Performance monitoring
npm install @vercel/analytics
```

## 🔐 Security Features

- **Row Level Security (RLS)**: Supabase policies enforce data access
- **Input Validation**: Zod schemas on all endpoints
- **Rate Limiting**: Prevent API abuse
- **Signed URLs**: Temporary file access
- **Audit Logging**: Track all user actions
- **PII Minimization**: GDPR-compliant data handling

## 🎯 Key Features

### ✅ Core Customer Promise
- Upload photos → AI quote in 60 seconds
- Verified, insured local contractors
- Secure payment with escrow
- 20% platform margin (configurable)

### ✅ User Roles & Permissions
- **Clients**: Create jobs, pay, rate contractors
- **Renters**: Landlord approval workflow
- **Landlords**: Approve tenant requests, manage properties
- **Contractors**: Accept jobs, get paid, build reputation
- **Admins**: Verify contractors, resolve disputes

### ✅ AI Pipeline
- Vision API detects repair issues from photos
- GPT generates human-readable work scope
- Smart pricing based on location and complexity
- Confidence scoring for quality control

### ✅ Payment Processing
- Stripe Payment Intents for secure transactions
- Stripe Connect for contractor payouts
- Automatic fee calculation and splitting
- Dispute resolution with partial refunds

### ✅ Communication System
- Email broadcasts to contractors (Resend)
- SMS alerts for urgent offers (Twilio)
- Magic link authentication for contractors
- Real-time status updates (Supabase Realtime)

## 🏪 Demo Accounts

For testing and demos:

```
# Client Account
Email: client@prereno.demo
Password: demo123!

# Contractor Account  
Email: contractor@prereno.demo
Password: demo123!

# Landlord Account
Email: landlord@prereno.demo
Password: demo123!

# Admin Account
Email: admin@prereno.demo
Password: demo123!
```

## 🔍 Troubleshooting

### Common Issues

**Supabase Connection Errors:**
- Check your URL and keys in `.env`
- Verify RLS policies are set up correctly
- Ensure storage buckets exist

**Stripe Webhook Issues:**
- Use `stripe listen` for local development
- Verify webhook secret matches your `.env`
- Check webhook delivery in Stripe dashboard

**Email/SMS Not Sending:**
- Verify API keys for Resend/Twilio
- Check domain verification for Resend
- Ensure phone numbers are verified in Twilio

**AI Analysis Failing:**
- Check OpenAI API key and credits
- Verify image uploads to Supabase storage
- Monitor API rate limits

**File Upload Problems:**
- Check Supabase storage policies
- Verify CORS settings for file uploads
- Ensure file size limits are configured

### Debug Mode

Enable detailed logging:

```bash
DEBUG=prereno:* npm run dev
```

### Performance Issues

Common fixes:
- Enable database indexes (see schema)
- Use CDN for image delivery
- Implement proper caching headers
- Monitor bundle size with `npm run analyze`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm run test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards

- TypeScript for all new code
- ESLint + Prettier for formatting
- Test coverage > 80%
- Mobile-first responsive design
- Accessibility (WCAG 2.1 AA)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and `/docs` folder
- **Issues**: Create GitHub issue with reproduction steps
- **Email**: support@prereno.app
- **Discord**: [Join our community](https://discord.gg/prereno)

---

## 📋 Configuration Files

### .env.example
```bash
# Copy this file to .env and fill in your values

# App Configuration
VITE_APP_NAME=PreReno
VITE_PUBLIC_URL=http://localhost:5173
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (Resend)
RESEND_API_KEY=re_...

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AI Services (OpenAI)
AI_VISION_API_KEY=sk-...
AI_GPT_API_KEY=sk-...

# Optional: Maps
MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ...
```

### .eslintrc.js
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'prereno-blue': {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'PreReno - AI Home Repairs',
        short_name: 'PreReno',
        description: 'Get instant AI quotes for home repairs',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          utils: ['date-fns', 'clsx']
        }
      }
    }
  }
});
```

### .husky/pre-commit
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### .github/workflows/ci.yml
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test
    
    - name: Run build
      run: npm run build
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CI: true
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: e2e/playwright-report/
        retention-days: 30

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Production
      run: |
        echo "Deploy to production infrastructure"
        # Add your deployment commands here
```

---

**Built with ❤️ by the PreReno team**

*Ready to ship! This production-grade codebase includes everything needed to launch your AI-powered home repair platform.*