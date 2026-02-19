# Build Order

Implementation phases for Pokerbot. Each phase builds on the previous and results in a testable increment.

**CRITICAL:** This project follows **Test-Driven Development (TDD)**. For each feature:
1. 🔴 **RED**: Write failing test first
2. 🟢 **GREEN**: Write minimal code to pass
3. 🔵 **REFACTOR**: Improve while keeping tests green

See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for complete testing approach.

---

## Overview

```
Phase 1: Foundation        → Project setup, database, auth
Phase 2: Players & Games   → CRUD APIs, admin UI basics
Phase 3: SMS Core          → Twilio send/receive, message logging
Phase 4: Invitation Flow   → Priority algorithm, invite cascade
Phase 5: LLM Integration   → Claude processing, escalation
Phase 6: Calendar          → Google Calendar integration
Phase 7: Scheduled Jobs    → Crons for morning check, timeouts
Phase 8: Polish            → Dashboard, history, monitoring
```

**MVP = Phases 1-4** (functional without LLM - manual message handling)
**Full Product = Phases 1-7**
**Production Ready = All 8 phases**

---

## Phase 1: Foundation

**Goal:** Working Next.js app with database and auth

### TDD Workflow for This Phase

For each feature below, follow this order:
1. Write failing test (RED 🔴)
2. Implement minimal code (GREEN 🟢)
3. Refactor and improve (REFACTOR 🔵)

### Tasks

1. **Project Setup**
   - [ ] Initialize Next.js with TypeScript, Tailwind, App Router
   - [ ] Configure ESLint, Prettier
   - [ ] **Set up Vitest + Testing Library**
   - [ ] Configure test environment (mocks, helpers)
   - [ ] Create folder structure per AGENTS.md

2. **Database** (TDD)
   - [ ] 🔴 Write test: Database connection succeeds
   - [ ] 🔴 Write test: Can query database
   - [ ] 🟢 Set up Prisma with Supabase Postgres
   - [ ] 🟢 Create schema (Players, Games, Invitations, Messages)
   - [ ] 🟢 Generate Prisma client
   - [ ] 🔴 Write test: Seed script creates test data
   - [ ] 🟢 Create seed script with test data
   - [ ] 🔵 Refactor: Extract test fixtures

3. **Auth Middleware** (TDD)
   - [ ] 🔴 Write test: Blocks unauthenticated requests to /admin
   - [ ] 🔴 Write test: Allows authenticated requests with valid session
   - [ ] 🔴 Write test: Rejects invalid/expired sessions
   - [ ] 🟢 Create auth middleware
   - [ ] 🟢 Implement session validation
   - [ ] 🔵 Refactor: Extract session utilities

4. **Login Flow** (TDD)
   - [ ] 🔴 Write test: POST /api/auth/login with valid password succeeds
   - [ ] 🔴 Write test: POST /api/auth/login with invalid password fails
   - [ ] 🔴 Write test: Sets session cookie on success
   - [ ] 🟢 Create login API route
   - [ ] 🟢 Implement password validation
   - [ ] 🟢 Create login page UI
   - [ ] 🔵 Refactor: Extract auth service

5. **Base Layout**
   - [ ] 🔴 Write test: Layout renders navigation
   - [ ] 🔴 Write test: Navigation links are correct
   - [ ] 🟢 Admin layout with nav (Dashboard, Games, Players, Messages)
   - [ ] 🟢 Basic styling with Tailwind
   - [ ] 🔵 Refactor: Extract nav component

### Tests Required (All Must Pass)

**Unit Tests:**
- [ ] Auth middleware validates sessions correctly
- [ ] Password validation works
- [ ] Session cookie parsing/creation

**Integration Tests:**
- [ ] Database connection works
- [ ] Can create/read test data via Prisma
- [ ] POST /api/auth/login creates session
- [ ] Auth middleware blocks unauthenticated API calls

**E2E Tests:**
- [ ] Can visit login page
- [ ] Can log in with correct password
- [ ] Redirects to dashboard after login
- [ ] Cannot access /admin without login

### Deliverable
- ✅ All tests passing (unit + integration + E2E)
- ✅ App runs locally
- ✅ Can log in with password
- ✅ Database tables exist
- ✅ Test coverage >80% for auth logic

---

## Phase 2: Players & Games

**Goal:** CRUD for players and games, basic admin UI

### TDD Workflow for This Phase

**Key principle:** Write integration tests for API routes, unit tests for business logic

### Tasks

1. **Priority Algorithm** (TDD - Start Here)
   - [ ] 🔴 Write test: Prioritizes least recently invited
   - [ ] 🔴 Write test: Never-invited players rank first
   - [ ] 🔴 Write test: Response rate breaks ties
   - [ ] 🔴 Write test: Timeout count affects ranking
   - [ ] 🟢 Implement `calculatePriority()` function
   - [ ] 🔵 Refactor: Extract scoring logic

2. **Players API** (TDD)
   - [ ] 🔴 Write test: GET /api/players returns all active players
   - [ ] 🔴 Write test: POST /api/players creates player and sends welcome SMS
   - [ ] 🔴 Write test: POST validates phone number format
   - [ ] 🔴 Write test: POST prevents duplicate phone numbers
   - [ ] 🟢 Implement GET /api/players
   - [ ] 🟢 Implement POST /api/players
   - [ ] 🔴 Write test: GET /api/players/:id returns single player
   - [ ] 🟢 Implement GET /api/players/:id
   - [ ] 🔴 Write test: PATCH /api/players/:id updates fields
   - [ ] 🟢 Implement PATCH /api/players/:id
   - [ ] 🔴 Write test: DELETE /api/players/:id sets opted_out=true
   - [ ] 🟢 Implement DELETE /api/players/:id (soft delete)
   - [ ] 🔵 Refactor: Extract player service layer

3. **Games API** (TDD)
   - [ ] 🔴 Write test: GET /api/games returns all games
   - [ ] 🔴 Write test: POST /api/games creates game with draft status
   - [ ] 🔴 Write test: POST prevents multiple active games
   - [ ] 🔴 Write test: POST validates RSVP deadline is before game time
   - [ ] 🟢 Implement GET /api/games
   - [ ] 🟢 Implement POST /api/games
   - [ ] 🔴 Write test: GET /api/games/:id includes invitations
   - [ ] 🟢 Implement GET /api/games/:id
   - [ ] 🔴 Write test: PATCH /api/games/:id updates game fields
   - [ ] 🟢 Implement PATCH /api/games/:id
   - [ ] 🔴 Write test: DELETE /api/games/:id cancels game
   - [ ] 🟢 Implement DELETE /api/games/:id
   - [ ] 🔵 Refactor: Extract game service layer

4. **Invitations Creation** (TDD)
   - [ ] 🔴 Write test: Creating game auto-creates invitations for all players
   - [ ] 🔴 Write test: Invitations have correct priority order
   - [ ] 🔴 Write test: Invitations start with status='pending'
   - [ ] 🟢 Implement invitation creation on game create
   - [ ] 🔵 Refactor: Extract invitation service

5. **Priority API** (TDD)
   - [ ] 🔴 Write test: GET /api/games/:id/priority returns sorted players
   - [ ] 🔴 Write test: POST /api/games/:id/priority saves reordered list
   - [ ] 🔴 Write test: POST validates all players included
   - [ ] 🟢 Implement GET /api/games/:id/priority
   - [ ] 🟢 Implement POST /api/games/:id/priority
   - [ ] 🔵 Refactor: Validate position uniqueness

6. **Players UI** (Component Tests)
   - [ ] 🔴 Write test: PlayerList renders all players
   - [ ] 🔴 Write test: Add player form validates inputs
   - [ ] 🔴 Write test: Edit player form populates existing data
   - [ ] 🟢 Build players list page with table
   - [ ] 🟢 Add player form/modal
   - [ ] 🟢 Edit player form
   - [ ] 🟢 Show player stats (last invited, response rate)
   - [ ] 🔵 Refactor: Extract PlayerTable component

7. **Games UI** (Component Tests)
   - [ ] 🔴 Write test: GameList renders all games
   - [ ] 🔴 Write test: Create game form validates required fields
   - [ ] 🔴 Write test: Game detail shows invitation status
   - [ ] 🟢 Build games list page
   - [ ] 🟢 Create game form (date, time, location, capacity, deadline)
   - [ ] 🟢 Game detail view
   - [ ] 🔵 Refactor: Extract GameForm component

8. **Priority UI** (Component + E2E Tests)
   - [ ] 🔴 Write test: Drag-and-drop reorders players
   - [ ] 🔴 Write test: Priority factors are displayed
   - [ ] 🔴 Write test: Visual line separates invited/waitlist
   - [ ] 🟢 Implement drag-and-drop player list
   - [ ] 🟢 Show priority factors (last invited, response rate)
   - [ ] 🟢 Visual line between "will invite" and "waitlist"
   - [ ] 🔵 Refactor: Extract PriorityList component

### Tests Required (All Must Pass)

**Unit Tests:**
- [ ] Priority algorithm calculates correctly
- [ ] Player validation (phone format, email, etc.)
- [ ] Game validation (dates, capacity, etc.)
- [ ] Invitation position assignment

**Integration Tests:**
- [ ] Players CRUD API routes work with DB
- [ ] Games CRUD API routes work with DB
- [ ] Creating game creates invitations
- [ ] Reordering priority updates positions
- [ ] Cannot create second active game

**E2E Tests:**
- [ ] Admin can add player via UI
- [ ] Admin can create game via UI
- [ ] Priority list shows and can be reordered
- [ ] Changes persist after page reload

### Deliverable
- ✅ All tests passing (unit + integration + E2E)
- ✅ Can add/edit/view players
- ✅ Can create games with custom player order
- ✅ Invitations created in database
- ✅ Priority algorithm working correctly
- ✅ Test coverage >75%

---

## Phase 3: SMS Core

**Goal:** Send and receive SMS, log all messages

### TDD Workflow for This Phase

**Key principle:** Mock Twilio in all tests - never send real SMS in tests

### Tasks

1. **Twilio Client** (TDD)
   - [ ] 🔴 Write test: sendSMS() calls Twilio API with correct params
   - [ ] 🔴 Write test: sendSMS() logs message to database
   - [ ] 🔴 Write test: sendSMS() handles Twilio errors gracefully
   - [ ] 🔴 Write test: sendSMS() validates E.164 phone format
   - [ ] 🟢 Create `lib/sms/twilio.ts` client
   - [ ] 🟢 Implement `sendSMS(to, body)` function
   - [ ] 🟢 Add error handling and logging
   - [ ] 🔵 Refactor: Extract message logger

2. **Message Parsing** (TDD)
   - [ ] 🔴 Write test: parseResponse('yes') returns 'YES'
   - [ ] 🔴 Write test: parseResponse('no') returns 'NO'
   - [ ] 🔴 Write test: parseResponse('STOP') returns 'STOP'
   - [ ] 🔴 Write test: parseResponse handles variations (yeah, nope, etc.)
   - [ ] 🟢 Implement message parser
   - [ ] 🔵 Refactor: Use keyword dictionary

3. **Send SMS API** (TDD)
   - [ ] 🔴 Write test: POST /api/messages sends SMS via Twilio
   - [ ] 🔴 Write test: POST /api/messages logs to DB
   - [ ] 🔴 Write test: POST /api/messages requires auth
   - [ ] 🔴 Write test: POST /api/messages validates phone number
   - [ ] 🟢 Implement POST /api/messages
   - [ ] 🔵 Refactor: Extract message service

4. **Receive SMS Webhook** (TDD)
   - [ ] 🔴 Write test: POST /api/webhooks/twilio/sms validates signature
   - [ ] 🔴 Write test: Webhook rejects invalid signature
   - [ ] 🔴 Write test: Webhook finds player by phone
   - [ ] 🔴 Write test: Webhook handles unknown phone number
   - [ ] 🔴 Write test: Webhook logs inbound message to DB
   - [ ] 🟢 Implement POST /api/webhooks/twilio/sms
   - [ ] 🟢 Validate Twilio signature
   - [ ] 🟢 Find player by phone number
   - [ ] 🟢 Log inbound message to database
   - [ ] 🔵 Refactor: Extract webhook handler

5. **Welcome Message** (TDD)
   - [ ] 🔴 Write test: Creating player sends welcome SMS
   - [ ] 🔴 Write test: Welcome message includes opt-out instructions
   - [ ] 🔴 Write test: Welcome SMS logged to DB
   - [ ] 🟢 Send welcome SMS when player is created
   - [ ] 🟢 Use template from MESSAGES.md
   - [ ] 🔵 Refactor: Extract message templates

6. **Opt-Out Handling** (TDD)
   - [ ] 🔴 Write test: 'STOP' keyword sets opted_out=true
   - [ ] 🔴 Write test: Sends opt-out confirmation
   - [ ] 🔴 Write test: Opted-out players excluded from invites
   - [ ] 🟢 Detect "STOP" keyword in webhook
   - [ ] 🟢 Set player.opted_out = true
   - [ ] 🟢 Send opt-out confirmation
   - [ ] 🔵 Refactor: Extract opt-out handler

7. **Messages UI** (Component Tests)
   - [ ] 🔴 Write test: ConversationView renders message history
   - [ ] 🔴 Write test: Reply form sends message
   - [ ] 🔴 Write test: Messages grouped by player
   - [ ] 🟢 Conversation view per player
   - [ ] 🟢 Show message history (inbound/outbound)
   - [ ] 🟢 Manual reply form (admin sends message)
   - [ ] 🔵 Refactor: Extract MessageThread component

### Tests Required (All Must Pass)

**Unit Tests:**
- [ ] sendSMS() calls Twilio correctly (mocked)
- [ ] Message parser handles all response types
- [ ] Phone number validation works
- [ ] Opt-out detection works

**Integration Tests:**
- [ ] POST /api/messages sends SMS and logs to DB
- [ ] Webhook validates signature correctly
- [ ] Webhook logs inbound messages
- [ ] STOP keyword triggers opt-out flow
- [ ] Welcome message sent on player creation

**E2E Tests:**
- [ ] Admin can send message from UI
- [ ] Incoming SMS appears in conversation view
- [ ] STOP message opts out player

### Deliverable
- ✅ All tests passing (unit + integration + E2E)
- ✅ Can send SMS from admin UI
- ✅ Incoming SMS logged and visible
- ✅ Welcome message sent on player create
- ✅ STOP keyword works
- ✅ Test coverage >80% for SMS logic

---

## Phase 4: Invitation Flow

**Goal:** Full invitation flow without LLM (keyword-based responses)

**⚠️ MVP MILESTONE**: Completing this phase = functional poker invite system

### TDD Workflow for This Phase

**Key principle:** Integration tests for full flows, unit tests for state transitions

### Tasks

1. **Invitation State Machine** (TDD - Start Here)
   - [ ] 🔴 Write test: pending → invited transition valid
   - [ ] 🔴 Write test: invited → confirmed transition valid
   - [ ] 🔴 Write test: invited → declined transition valid
   - [ ] 🔴 Write test: invited → timeout transition valid
   - [ ] 🔴 Write test: confirmed → declined transition valid (day-of dropout)
   - [ ] 🔴 Write test: Invalid transitions rejected
   - [ ] 🟢 Implement invitation state machine
   - [ ] 🔵 Refactor: Extract transition validator

2. **Confirm Game & Send Invites** (TDD)
   - [ ] 🔴 Write test: POST /api/games/:id/confirm locks priority order
   - [ ] 🔴 Write test: Sends SMS to top N players (N = capacity)
   - [ ] 🔴 Write test: Updates invitation status → invited
   - [ ] 🔴 Write test: Updates player.last_invited_at timestamps
   - [ ] 🔴 Write test: Cannot confirm game twice
   - [ ] 🔴 Write test: Cannot confirm without players
   - [ ] 🟢 Implement POST /api/games/:id/confirm
   - [ ] 🟢 Send invite SMS to top N players
   - [ ] 🟢 Update invitation statuses
   - [ ] 🟢 Update player timestamps
   - [ ] 🔵 Refactor: Extract invitation sender service

3. **Process YES Response** (TDD)
   - [ ] 🔴 Write test: 'yes' sets invitation.status → confirmed
   - [ ] 🔴 Write test: Sends confirmation SMS
   - [ ] 🔴 Write test: Updates player.response_count++
   - [ ] 🔴 Write test: Handles variations (yeah, yep, y, in)
   - [ ] 🔴 Write test: Stops sending more invites when game full
   - [ ] 🟢 Implement YES response handler
   - [ ] 🟢 Send confirmation SMS (from MESSAGES.md)
   - [ ] 🔵 Refactor: Extract response handler

4. **Process NO Response** (TDD)
   - [ ] 🔴 Write test: 'no' sets invitation.status → declined
   - [ ] 🔴 Write test: Sends acknowledgment SMS
   - [ ] 🔴 Write test: Updates player.response_count++
   - [ ] 🔴 Write test: Triggers invite cascade
   - [ ] 🔴 Write test: Handles variations (nope, can't, out)
   - [ ] 🟢 Implement NO response handler
   - [ ] 🟢 Send acknowledgment SMS
   - [ ] 🟢 Trigger invite cascade
   - [ ] 🔵 Refactor: Share response handler logic

5. **Invite Cascade** (TDD - Critical Logic)
   - [ ] 🔴 Write test: Decline triggers cascade if spots available
   - [ ] 🔴 Write test: Finds next pending player by position
   - [ ] 🔴 Write test: Sends invite to next player
   - [ ] 🔴 Write test: Updates invitation status → invited
   - [ ] 🔴 Write test: No cascade if game full
   - [ ] 🔴 Write test: No cascade within 4 hours of game start
   - [ ] 🔴 Write test: No cascade if no pending players
   - [ ] 🟢 Implement invite cascade logic
   - [ ] 🟢 Check spots available
   - [ ] 🟢 Find next pending player by position
   - [ ] 🟢 Send invite SMS
   - [ ] 🟢 Respect 4-hour cutoff
   - [ ] 🔵 Refactor: Extract cascade service

6. **4-Hour Cutoff Logic** (TDD)
   - [ ] 🔴 Write test: isWithinCutoff(gameTime, 4 hours) returns true/false
   - [ ] 🔴 Write test: Cutoff blocks cascade
   - [ ] 🔴 Write test: Cutoff blocks timeout invites
   - [ ] 🟢 Implement cutoff check utility
   - [ ] 🔵 Refactor: Make cutoff hours configurable

7. **Last-Minute Invites** (TDD)
   - [ ] 🔴 Write test: Detect if within 24 hours of game
   - [ ] 🔴 Write test: Uses last-minute SMS template
   - [ ] 🔴 Write test: Last-minute template has urgency keywords
   - [ ] 🟢 Implement last-minute detection
   - [ ] 🟢 Use last-minute template from MESSAGES.md
   - [ ] 🔵 Refactor: Extract template selector

8. **Active Game UI** (Component + E2E Tests)
   - [ ] 🔴 Write test: ActiveGameView renders three columns
   - [ ] 🔴 Write test: Confirmed players in left column
   - [ ] 🔴 Write test: Pending in middle, queue in right
   - [ ] 🔴 Write test: "Invite Next" button works
   - [ ] 🔴 Write test: "Mark Declined" button works
   - [ ] 🟢 Build three-column view: Confirmed | Pending | Queue
   - [ ] 🟢 Add real-time updates (polling every 5s)
   - [ ] 🟢 Manual actions: Invite Next, Mark Declined
   - [ ] 🔵 Refactor: Extract InvitationColumn component

### Integration Tests (Full Flows)

**Critical Scenarios to Test:**
- [ ] **Full game flow**: Create → confirm → 2 YES → game fills → no more invites
- [ ] **Cascade flow**: Create → confirm → YES → NO → next player invited
- [ ] **Multiple cascade**: Create → confirm → 3 NO in a row → 3 players invited
- [ ] **Game fills exactly**: Capacity 10 → 10 YES → all confirmed
- [ ] **Under-capacity**: Capacity 10 → everyone invited → only 7 YES → game proceeds
- [ ] **4-hour cutoff**: Player drops 3 hours before game → no replacement
- [ ] **Last-minute invite**: Player drops 6 hours before → next player gets urgent SMS

### Tests Required (All Must Pass)

**Unit Tests:**
- [ ] State machine transitions valid
- [ ] Cutoff logic correct (timezone-aware)
- [ ] Next player selection algorithm
- [ ] Message template selection

**Integration Tests:**
- [ ] Confirming game sends invites correctly
- [ ] YES response confirms and stops cascade when full
- [ ] NO response triggers cascade
- [ ] Cascade invites correct next player
- [ ] 4-hour cutoff blocks cascade
- [ ] Last-minute template used appropriately
- [ ] Full game lifecycle from start to fill

**E2E Tests:**
- [ ] Admin confirms game and sees invites sent
- [ ] Active game view updates as responses come in
- [ ] Manual "Invite Next" works
- [ ] Game shows "Full" when capacity reached

### Deliverable
- ✅ **MVP COMPLETE**: Full invitation flow works
- ✅ All tests passing (unit + integration + E2E)
- ✅ Can create game, send invites, players respond
- ✅ Cascade works automatically
- ✅ 4-hour cutoff enforced
- ✅ Manual override actions work
- ✅ Test coverage >85% for invitation logic

---

## Phase 5: LLM Integration

**Goal:** Claude processes messages with confidence scoring

### Tasks

1. **Claude Setup**
   - [ ] Create `lib/llm/claude.ts` client
   - [ ] Load system prompt from SYSTEM_PROMPT.md
   - [ ] Load learned responses from JSON

2. **Message Processing**
   - [ ] Build context (player, game, conversation history)
   - [ ] Send to Claude with system prompt
   - [ ] Parse JSON response
   - [ ] Store confidence score

3. **Auto-Respond Logic**
   - [ ] If confidence ≥ 99%: auto-respond
   - [ ] Execute side effects (confirm, decline, etc.)
   - [ ] Log handling_type = 'auto'

4. **Escalation Logic**
   - [ ] If confidence < 99%: escalate
   - [ ] Store suggested response and reason
   - [ ] Set escalation_status = 'pending'
   - [ ] Notify admins (email + SMS)

5. **Escalation Queue UI**
   - [ ] List pending escalations
   - [ ] Show: player message, context, LLM suggestion
   - [ ] Approve / Edit / Custom response buttons
   - [ ] Mark resolved after response

6. **Admin Notifications**
   - [ ] Send email to admins on escalation
   - [ ] Send SMS to admins on escalation
   - [ ] Include player name and message preview

7. **Learned Responses**
   - [ ] Create `src/data/learned-responses.json`
   - [ ] Seed with common patterns
   - [ ] Load into LLM context

### Tests
- [ ] Claude client returns valid JSON
- [ ] High-confidence triggers auto-respond
- [ ] Low-confidence triggers escalation
- [ ] Escalation creates pending record
- [ ] Admin notification sent

### Deliverable
- LLM handles routine messages automatically
- Complex messages escalate to admin
- Admins can respond from escalation queue

---

## Phase 6: Calendar Integration

**Goal:** Google Calendar invites and decline detection

### Tasks

1. **Google Calendar Setup**
   - [ ] Create `lib/calendar/google.ts` client
   - [ ] OAuth or service account auth
   - [ ] Test connection

2. **Create Event on YES**
   - [ ] When player confirms, create calendar event
   - [ ] Include game details (time, location, entry instructions)
   - [ ] Add player as attendee (by email)
   - [ ] Store google_calendar_event_id on invitation

3. **Decline Detection**
   - [ ] Polling: Check event attendee status periodically
   - [ ] Or: Set up push notifications (webhook)
   - [ ] If declined: trigger same flow as SMS "NO"

4. **Cancel Event on Decline**
   - [ ] When player drops (SMS or calendar), delete their event
   - [ ] Update invitation.calendar_status

5. **Cancel All Events on Game Cancel**
   - [ ] When admin cancels game, delete all calendar events
   - [ ] Batch operation

6. **Cron: Calendar Sync**
   - [ ] `POST /api/cron/calendar-sync`
   - [ ] Run every 15 minutes
   - [ ] Check all pending calendar events for declines

### Tests
- [ ] Event created with correct details
- [ ] Player receives calendar invite email
- [ ] Decline detected and processed
- [ ] Event deleted when player drops

### Deliverable
- Players get calendar invites when they confirm
- Calendar declines trigger automatic replacement
- Game cancellation clears all calendar events

---

## Phase 7: Scheduled Jobs

**Goal:** Automated cron jobs for morning check and timeouts

### Tasks

1. **Morning Check Cron**
   - [ ] `POST /api/cron/morning-check`
   - [ ] Runs at 8:15am PT on game day
   - [ ] Find games happening today
   - [ ] Send morning check SMS to all confirmed players
   - [ ] Update invitation.morning_check_sent_at

2. **Morning Check Responses**
   - [ ] Process YES: Update morning_check_response = confirmed
   - [ ] Process NO: Decline player, trigger cascade (if >4hr)
   - [ ] Silence: No action (still confirmed)

3. **Deadline Check Cron**
   - [ ] `POST /api/cron/deadline-check`
   - [ ] Runs hourly
   - [ ] Find invited players past deadline
   - [ ] Set status → timeout
   - [ ] Update player.timeout_count
   - [ ] Trigger cascade (if >4hr from game)

4. **Vercel Cron Config**
   - [ ] Configure vercel.json with cron schedules
   - [ ] Handle timezone (PT vs UTC)
   - [ ] Add cron secret for security

### Tests
- [ ] Morning check sends to correct players
- [ ] Morning NO triggers cascade
- [ ] Deadline timeout marks correctly
- [ ] Cascade respects 4-hour cutoff

### Deliverable
- Morning confirmations go out automatically
- Deadline timeouts processed automatically
- System runs hands-off

---

## Phase 8: Polish

**Goal:** Dashboard, history, monitoring, error handling

### Tasks

1. **Dashboard**
   - [ ] Active game summary card
   - [ ] Pending escalations alert
   - [ ] Recent activity feed
   - [ ] Quick stats

2. **Game History**
   - [ ] List of past games
   - [ ] Per-game: who confirmed, declined, timed out
   - [ ] Click to expand details

3. **Player Stats**
   - [ ] Response rate calculation
   - [ ] Last N games history
   - [ ] Visual indicators (good/bad responder)

4. **Error Handling**
   - [ ] Twilio failure: log, alert admin, mark message failed
   - [ ] Claude failure: auto-escalate
   - [ ] Calendar failure: log, continue (non-blocking)
   - [ ] Graceful degradation

5. **Logging & Monitoring**
   - [ ] Structured logging (JSON)
   - [ ] Vercel Analytics integration
   - [ ] Error tracking (Sentry optional)

6. **Edge Cases**
   - [ ] Player texts when no active game
   - [ ] Unknown phone number texts in
   - [ ] Duplicate responses
   - [ ] Rate limiting

7. **Mobile-Friendly Admin UI**
   - [ ] Responsive design
   - [ ] Escalation queue works on phone
   - [ ] Quick actions accessible

### Tests
- [ ] Dashboard shows correct data
- [ ] History accurately reflects past games
- [ ] Error handling doesn't crash app

### Deliverable
- **Production Ready**
- Polished admin experience
- Handles edge cases gracefully
- Observable and maintainable

---

## Implementation Notes

### Per-Phase Checklist (TDD Enforcement)

Before marking a phase complete:
- [ ] **All tests written BEFORE implementation** (TDD)
- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing for phase features
- [ ] Test coverage report generated
- [ ] All tasks completed
- [ ] Code reviewed for quality
- [ ] No skipped/pending tests
- [ ] Spec updated if needed
- [ ] Decisions logged if any
- [ ] Committed with clear messages

**⚠️ CRITICAL:** Tests must be written FIRST (RED), then implementation (GREEN), then refactored (REFACTOR). Do not skip this process.

### Dependencies Between Phases

```
Phase 1 ─→ Phase 2 ─→ Phase 3 ─→ Phase 4 (MVP)
                           ↓
                      Phase 5 ─→ Phase 6 ─→ Phase 7 ─→ Phase 8
```

- Phases 1-4 are sequential (each depends on previous)
- Phase 5 requires Phase 3 (SMS)
- Phase 6 requires Phase 4 (invitation flow)
- Phase 7 requires Phase 4 + 6
- Phase 8 can start after Phase 5

### Parallel Work Opportunities

If multiple people/agents working:
- Phase 5 (LLM) can start once Phase 3 (SMS) is done
- Phase 6 (Calendar) can start once Phase 4 (Invitations) is done
- UI polish can happen alongside backend work

---

## Quick Reference: What's Testable When

| After Phase | You Can Test |
|-------------|--------------|
| 1 | Login, see empty dashboard |
| 2 | Add players, create games, see priority list |
| 3 | Send/receive SMS, see message history |
| 4 | **Full game flow**: create → invite → respond → cascade |
| 5 | LLM auto-responds, escalations appear |
| 6 | Calendar invites sent, declines detected |
| 7 | Morning checks and timeouts automatic |
| 8 | Polished, production-ready |

---

## TDD Workflow: Practical Guide

### Daily Development Cycle

**Start each feature with this process:**

```bash
# 1. Pull latest and ensure tests pass
git pull
npm test

# 2. Create feature branch
git checkout -b feature/priority-algorithm

# 3. Start test watcher
npm run test:watch

# 4. RED: Write failing test
# Edit: src/lib/priority/__tests__/calculate-priority.test.ts
# Run: Tests fail ❌

# 5. GREEN: Make it pass
# Edit: src/lib/priority/calculate-priority.ts
# Run: Tests pass ✅

# 6. REFACTOR: Improve code
# Edit: Clean up, extract functions
# Run: Tests still pass ✅

# 7. Repeat for next test case

# 8. Commit when feature complete
git add .
git commit -m "feat: implement priority algorithm

- Prioritizes least recently invited
- Handles never-invited players
- Uses response rate as tiebreaker

Tests: Unit (100% coverage)"

# 9. Run full test suite before push
npm test
npm run test:integration
npm run typecheck

# 10. Push
git push origin feature/priority-algorithm
```

### Example TDD Session

**Feature:** Priority algorithm (from Phase 2)

**Step 1: RED 🔴 (Write failing test)**

```typescript
// src/lib/priority/__tests__/calculate-priority.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePriority } from '../calculate-priority';

describe('calculatePriority', () => {
  it('should prioritize least recently invited player', () => {
    const players = [
      { id: '1', name: 'Alice', last_invited_at: new Date('2024-01-15') },
      { id: '2', name: 'Bob', last_invited_at: new Date('2024-01-10') },
    ];

    const sorted = calculatePriority(players);

    expect(sorted[0].id).toBe('2'); // Bob (older) first
    expect(sorted[1].id).toBe('1'); // Alice (newer) second
  });
});
```

**Run:** `npm test` → ❌ FAIL (function doesn't exist)

**Step 2: GREEN 🟢 (Minimal implementation)**

```typescript
// src/lib/priority/calculate-priority.ts
export function calculatePriority(players) {
  return players.sort((a, b) =>
    a.last_invited_at.getTime() - b.last_invited_at.getTime()
  );
}
```

**Run:** `npm test` → ✅ PASS

**Step 3: REFACTOR 🔵 (Improve code)**

```typescript
// src/lib/priority/calculate-priority.ts
import { Player } from '@/types';

/**
 * Calculates priority order for game invitations
 * Primary factor: Least recently invited
 * Returns new array, doesn't mutate input
 */
export function calculatePriority(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const aTime = a.last_invited_at?.getTime() ?? 0;
    const bTime = b.last_invited_at?.getTime() ?? 0;
    return aTime - bTime;
  });
}
```

**Run:** `npm test` → ✅ STILL PASS

**Step 4: Add more tests (RED again) 🔴**

```typescript
it('should prioritize never-invited players first', () => {
  const players = [
    { id: '1', last_invited_at: new Date('2024-01-10') },
    { id: '2', last_invited_at: null }, // Never invited
  ];

  const sorted = calculatePriority(players);
  expect(sorted[0].id).toBe('2'); // Never invited = first
});
```

**Run:** `npm test` → ❌ FAIL

**Fix and iterate...**

### Red-Green-Refactor Tips

**🔴 RED: Writing Good Tests**

**DO:**
- Write test name that describes behavior
- Test one thing per test
- Use descriptive variable names
- Include edge cases
- Test error conditions

**DON'T:**
- Write multiple assertions for different behaviors
- Test implementation details
- Use unclear test names
- Skip edge cases

**Example:**
```typescript
// ❌ BAD
it('works', () => {
  expect(fn()).toBeTruthy();
});

// ✅ GOOD
it('should return empty array when no players provided', () => {
  const result = calculatePriority([]);
  expect(result).toEqual([]);
});
```

**🟢 GREEN: Writing Minimal Code**

**DO:**
- Write simplest code that passes
- Focus on making test green
- Don't optimize yet
- Don't add extra features

**DON'T:**
- Over-engineer the solution
- Add features not tested
- Optimize prematurely
- Write unnecessary code

**🔵 REFACTOR: Improving Code**

**DO:**
- Extract repeated code
- Improve naming
- Add types
- Simplify logic
- Keep tests green

**DON'T:**
- Change behavior
- Skip running tests
- Refactor without tests
- Make large changes

### Test Organization Best Practices

**File naming:**
```
src/lib/priority/
  ├── calculate-priority.ts          # Implementation
  └── __tests__/
      └── calculate-priority.test.ts # Tests (co-located)
```

**Test structure:**
```typescript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Reset state
  });

  describe('happy path', () => {
    it('should do X when Y', () => {
      // Arrange: Set up test data
      const input = createTestData();

      // Act: Execute function
      const result = functionUnderTest(input);

      // Assert: Verify result
      expect(result).toEqual(expected);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => { ... });
    it('should handle null values', () => { ... });
  });

  describe('error cases', () => {
    it('should throw error when invalid', () => {
      expect(() => fn()).toThrow('Invalid input');
    });
  });
});
```

### Common Testing Patterns

**1. Testing API Routes (Integration)**

```typescript
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/players/route';

describe('POST /api/players', () => {
  it('should create player', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { first_name: 'John', phone: '+15551234567' },
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = res._getJSONData();
    expect(data.id).toBeDefined();
  });
});
```

**2. Testing with Database (Integration)**

```typescript
import { createTestContext } from '@/tests/helpers/test-db';

describe('Player service', () => {
  let ctx;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup(); // Rolls back transaction
  });

  it('should create player in DB', async () => {
    const player = await createPlayer(ctx.prisma, {
      first_name: 'John',
      phone: '+15551234567',
    });

    expect(player.id).toBeDefined();
  });
});
```

**3. Testing React Components**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerList } from './PlayerList';

describe('PlayerList', () => {
  it('should render players', () => {
    const players = [{ id: '1', name: 'John' }];
    render(<PlayerList players={players} />);

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should call onAdd when button clicked', () => {
    const onAdd = vi.fn();
    render(<PlayerList players={[]} onAdd={onAdd} />);

    fireEvent.click(screen.getByText('Add Player'));
    expect(onAdd).toHaveBeenCalled();
  });
});
```

### When Tests Fail

**Process:**

1. **Read the error message carefully**
   - What was expected?
   - What was received?
   - Which test failed?

2. **Check recent changes**
   - Did you change the implementation?
   - Did you change the test?
   - Are tests stale?

3. **Debug systematically**
   ```typescript
   it('should calculate correctly', () => {
     const result = calculate(input);
     console.log('Result:', result); // Add logging
     expect(result).toBe(expected);
   });
   ```

4. **Fix the right thing**
   - Is the test wrong? → Fix test
   - Is the code wrong? → Fix code
   - Is it a real bug? → Fix and add regression test

5. **Verify the fix**
   - Run failing test → should pass
   - Run all tests → should pass
   - Understand why it failed

### Test Coverage

**Check coverage:**
```bash
npm run test:coverage
open coverage/index.html
```

**Target coverage:**
- Unit tests: >80%
- Integration tests: >60%
- Critical logic (invitation flow, priority): >90%

**What to do with low coverage:**
1. Identify untested code in report
2. Write tests for missing branches
3. Don't chase 100% blindly (diminishing returns)
4. Focus on business logic over boilerplate

---

*Last updated: Feb 16, 2026*
