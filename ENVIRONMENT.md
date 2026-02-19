# Environment Setup

Guide for setting up local development and required external services.

---

## Required Accounts

| Service | Purpose | Signup |
|---------|---------|--------|
| **Vercel** | Hosting, Postgres database | [vercel.com](https://vercel.com) |
| **Twilio** | SMS sending/receiving | [twilio.com](https://twilio.com) |
| **Anthropic** | Claude API for LLM | [console.anthropic.com](https://console.anthropic.com) |
| **Google Cloud** | Calendar API | [console.cloud.google.com](https://console.cloud.google.com) |

---

## Environment Variables

Create a `.env.local` file (never commit this):

```bash
# Database (Vercel Postgres)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# Google Calendar
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REFRESH_TOKEN="..."
GOOGLE_CALENDAR_ID="primary"  # or specific calendar ID

# Admin Auth
ADMIN_PASSWORD="..."

# Admin Notifications
ADMIN_PHONE_JON="+1..."
ADMIN_PHONE_MATT="+1..."
ADMIN_EMAIL_JON="..."
ADMIN_EMAIL_MATT="..."

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or production URL
```

---

## Service Setup Instructions

### 1. Vercel & Database

**Create project:**
```bash
npx create-next-app@latest pokerbot --typescript --tailwind --app
cd pokerbot
vercel link
```

**Add Postgres:**
1. Go to Vercel Dashboard → Storage → Create Database → Postgres
2. Connect to your project
3. Copy connection strings to `.env.local`

**Pull env vars locally:**
```bash
vercel env pull .env.local
```

### 2. Twilio

**Get credentials:**
1. Sign up at [twilio.com](https://twilio.com)
2. Go to Console → Account Info
3. Copy Account SID and Auth Token

**Get a phone number:**
1. Console → Phone Numbers → Buy a Number
2. Choose a US number with SMS capability
3. Copy the number (E.164 format: +1XXXXXXXXXX)

**Configure webhook:**
1. Phone Numbers → Manage → Active Numbers → Click your number
2. Under "Messaging", set webhook:
   - When a message comes in: `https://your-app.vercel.app/api/webhooks/twilio/sms`
   - HTTP POST

**For local development:**
```bash
# Install ngrok
brew install ngrok

# Expose local server
ngrok http 3000

# Use ngrok URL in Twilio webhook temporarily
# https://xxxx.ngrok.io/api/webhooks/twilio/sms
```

### 3. Anthropic (Claude)

**Get API key:**
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Go to API Keys
3. Create new key, copy it

**Usage:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### 4. Google Calendar

**Create OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (or select existing)
3. Enable Google Calendar API:
   - APIs & Services → Library → Google Calendar API → Enable
4. Create credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret

**Get refresh token (one-time setup):**
```bash
# We'll create a helper script for this
npm run setup:google-auth
```

This will:
1. Open browser for OAuth consent
2. Get authorization code
3. Exchange for refresh token
4. Save to `.env.local`

**Alternative: Service Account (simpler for single calendar):**
1. Create Service Account in Google Cloud Console
2. Download JSON key file
3. Share your Google Calendar with the service account email
4. Use service account credentials instead of OAuth

---

## Local Development

### Initial Setup

```bash
# Clone repo
git clone <repo-url>
cd pokerbot

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Fill in .env.local with your credentials

# Generate Prisma client (if using Prisma)
npx prisma generate

# Push database schema
npx prisma db push

# Start dev server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:int     # Run integration tests
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (DB GUI)
```

### Testing Webhooks Locally

**Twilio SMS:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Update Twilio webhook to ngrok URL
# Send a test SMS to your Twilio number
```

**Google Calendar:**
- Calendar webhooks require HTTPS with valid certificate
- For local dev, poll instead of webhooks
- Or use ngrok and configure push notifications

---

## Database Management

### Migrations (Prisma)

```bash
# Create migration after schema change
npx prisma migrate dev --name describe_change

# Apply migrations to production
npx prisma migrate deploy

# Reset database (DANGEROUS - deletes data)
npx prisma migrate reset
```

### Seed Data

```bash
# Run seed script
npx prisma db seed
```

Seed script should create:
- Test players (with your phone numbers for testing)
- No games (start fresh)

---

## Vercel Deployment

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

- All variables from `.env.local`
- Set `NEXT_PUBLIC_APP_URL` to your production URL

### Cron Jobs

Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/morning-check",
      "schedule": "15 8 * * *"
    },
    {
      "path": "/api/cron/deadline-check",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/calendar-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Note: Cron times are in UTC. Adjust for Pacific Time:
- 8:15am PT = 16:15 UTC (or 15:15 UTC during DST)

### Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Testing Checklist

After setup, verify each integration:

### Database
- [ ] Can connect to Postgres
- [ ] Can run migrations
- [ ] Can read/write data

### Twilio
- [ ] Can send SMS to your phone
- [ ] Webhook receives incoming SMS
- [ ] Phone number is correct format

### Claude
- [ ] API key works
- [ ] Can get response from Claude

### Google Calendar
- [ ] Can create calendar event
- [ ] Can read event status
- [ ] Webhook/polling detects declines

### End-to-End
- [ ] Create test player (yourself)
- [ ] Create test game
- [ ] Receive invite SMS
- [ ] Reply YES, get confirmation
- [ ] Calendar invite arrives
- [ ] Morning check works (manually trigger)

---

## Troubleshooting

### "Database connection failed"
- Check POSTGRES_URL is correct
- Ensure IP is whitelisted in Vercel
- Try POSTGRES_URL_NON_POOLING for migrations

### "Twilio webhook not receiving"
- Check ngrok is running (local dev)
- Check webhook URL in Twilio console
- Check Vercel function logs (production)

### "Claude API error"
- Check API key is valid
- Check you have credits/quota
- Check request format matches API docs

### "Google Calendar permission denied"
- Ensure Calendar API is enabled
- Check OAuth scopes include calendar access
- For service account: share calendar with service account email

---

## Cost Estimates

| Service | Pricing | Estimated Monthly |
|---------|---------|-------------------|
| Vercel | Free tier / $20 Pro | $0-20 |
| Vercel Postgres | Free tier: 256MB | $0 |
| Twilio SMS | $0.0079/msg outbound, $0.0075/msg inbound | ~$5-10 |
| Anthropic Claude | ~$0.003-0.015 per 1K tokens | ~$5-10 |
| Google Calendar | Free | $0 |

**Estimated total:** $10-40/month for moderate usage

---

*Last updated: Feb 15, 2025*
