# Decision Log

Architectural and implementation decisions made during development.

---

## 2025-02-24: Database Connection Pooling Strategy

**Context:** Prisma on Vercel serverless functions needs proper database connection handling with Supabase.

**Options Considered:**
1. Direct connection to Supabase (port 5432 on db.xxx.supabase.co)
2. Transaction Pooler (port 6543) - PgBouncer in transaction mode
3. Session Pooler (port 5432 on pooler.supabase.com)

**Decision:** Session Pooler (port 5432)

**Rationale:**
- Direct connection fails due to IPv6 requirements on Vercel serverless
- Transaction Pooler uses PgBouncer which doesn't support prepared statements (Prisma error: "prepared statement 's0' already exists")
- Session Pooler supports prepared statements and works with Prisma

**Configuration:**
```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-X-REGION.pooler.supabase.com:5432/postgres
```

**Consequences:**
- Slightly higher latency than transaction pooler
- Works reliably with Prisma on Vercel serverless

---

## 2025-02-24: Google Calendar Credentials on Vercel

**Context:** Service account JSON file can't be deployed to Vercel serverless.

**Options Considered:**
1. Upload file to deployment (not possible with serverless)
2. Store JSON as environment variable (unwieldy, special characters)
3. Base64 encode the JSON

**Decision:** Base64 encode the JSON

**Rationale:** Clean, single environment variable, easy to decode at runtime.

**Implementation:**
```bash
# Encode locally:
base64 -i service-account.json | tr -d '\n'

# Set as GOOGLE_SERVICE_ACCOUNT_JSON env var in Vercel
```

**Code in `src/lib/calendar/google.ts`:**
```typescript
function loadCredentials(): Record<string, unknown> {
  // Try base64-encoded JSON first (Vercel)
  const base64Json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (base64Json) {
    const json = Buffer.from(base64Json, 'base64').toString('utf8');
    return JSON.parse(json);
  }
  // Fall back to file path (local dev)
  const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (serviceAccountFile) {
    return JSON.parse(fs.readFileSync(serviceAccountFile, 'utf8'));
  }
  throw new Error('Google Calendar credentials not configured');
}
```

---

## 2025-02-24: Vercel Cron Job Frequency

**Context:** Vercel Hobby plan has cron job limitations.

**Options Considered:**
1. Hourly cron jobs (as specified in original design)
2. Daily cron jobs (Hobby plan limit)
3. Upgrade to Pro plan

**Decision:** Daily cron jobs for Hobby plan

**Rationale:** Hobby plan only allows daily cron jobs. The deadline-check cron runs once per day at 9am PT.

**Configuration (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Consequences:**
- Deadline checks happen once daily instead of hourly
- May need to upgrade to Pro for more frequent checks in production

---

## 2025-02-24: Invitation Flow - Two-Step Activation

**Context:** Should invitations be sent automatically when players are added to a game?

**Options Considered:**
1. Auto-send invitations when players added
2. Require explicit "Send Invitations" action
3. Two-step: Activate game, then send invitations

**Decision:** Two-step activation

**Rationale:**
- Games start in "Draft" status for setup
- Admin activates game when ready
- Admin explicitly clicks "Send Invitations" to trigger SMS
- Provides control and prevents accidental sends

**Flow:**
1. Create game (status: draft)
2. Add players to queue (status: pending / "In Queue")
3. Click "Activate Game" (status: active)
4. Click "Send Invitations" (sends SMS, status changes to "invited")

**UI Changes:**
- "Activate Game" button on game detail page for draft games
- "Send Invitations" button only appears for active games
- Yellow instruction banner explains the flow for draft games

---

## 2025-02-24: Invitation Capacity Calculation

**Context:** When sending invitations, how do we determine spots available?

**Options Considered:**
1. Count only confirmed players
2. Count confirmed + invited (waiting for response)

**Decision:** Count confirmed + invited

**Rationale:**
- If we only count confirmed, we'd over-invite
- Example: capacity 10, 3 confirmed, 5 invited = 2 spots, not 7
- Invited players are "holding" spots until they respond

**Implementation:**
```typescript
const activeCount = await getActiveInvitationCount(gameId); // confirmed + invited
const spotsToFill = game.capacity - activeCount;
```

---

## 2025-02-24: Message Logging for Debugging

**Context:** SMS sending failures were silent, making debugging difficult.

**Decision:** Add comprehensive console logging to invitation flow

**Implementation:**
- Log game capacity, active count, spots to fill before sending
- Log each invitation attempt with player name and phone
- Log success/failure of each SMS send
- Log final count of sent invitations

**Consequences:**
- Vercel logs show exactly what happened
- Easy to diagnose "No invitations to send" issues

---

## 2025-02-24: Environment Separation (Dev/Prod)

**Context:** Need separate environments for development and production.

**Decision:** Use Vercel's environment system

**Configuration:**
- `main` branch → Production
- `dev` branch → Preview
- Separate Supabase projects for each environment
- Environment variables scoped to Production or Preview

**Environment Variables:**
| Variable | Production | Preview |
|----------|------------|---------|
| DATABASE_URL | prod-db | dev-db |
| TWILIO_* | shared | shared |
| ANTHROPIC_API_KEY | shared | shared |
| GOOGLE_* | shared | shared |
| ADMIN_PASSWORD | prod-specific | dev-specific |
| CRON_SECRET | prod-specific | dev-specific |

---

## 2025-02-24: Middleware Route Protection

**Context:** Admin dashboard should require authentication.

**Decision:** Next.js middleware with JWT session

**Implementation:**
- Middleware at `src/middleware.ts`
- Protects all routes except `/login`
- Uses `jose` library for JWT (Edge-compatible)
- 7-day session expiration
- ADMIN_PASSWORD used as JWT signing key

**Matcher Pattern:**
```typescript
matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
```

**Bug Fixed:** Original regex had trailing `|` creating empty alternative, preventing middleware from matching.

---

## Future Considerations

### Upgrade Path
- Consider Vercel Pro for hourly cron jobs
- Consider dedicated database for higher traffic

### Not Implemented (Intentionally)
- Player self-registration (admin-only)
- Multiple simultaneous games
- Payment/buy-in tracking
- Recurring game schedules

---

*Last updated: Feb 24, 2025*
