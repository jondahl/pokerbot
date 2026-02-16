# PokerList - Product Specification

## Overview
An app for managing RSVPs for a periodic private poker game in San Francisco. Two admins (Jon and Matt) manage games via a web interface. All players interact exclusively via SMS.

**Explicitly Out of Scope:**
- Payment/buy-in tracking (handled at the game)
- Poker results or standings tracking
- Player self-registration
- Multiple game types or recurring schedules

---

## Users

### Admins (Jon & Matt)
- Access password-protected web interface
- Create and manage games
- Manage player roster
- View and respond to player messages
- Cancel games

### Players
- Receive SMS invitations
- Respond YES/NO via SMS
- Can ask questions via SMS (admin responds)
- Receive Google Calendar invites when confirmed

---

## Core Features

### Game Management

**Creating a Game:**
- Admin sets: date, time, location (address), capacity (default: 10), RSVP deadline (specific date/time)
- Games are scheduled ad-hoc (not recurring)
- **One active game at a time** - must complete or cancel current game before creating next

**Cancellation:**
- Admin can cancel at any time
- System sends human-written message to all invited/confirmed players
- All calendar events are cancelled

**Under-filled Game:**
- If game can't reach capacity (everyone invited, not enough YES responses)
- Admin manually decides: cancel or proceed with fewer players
- No automatic behavior - admin makes the call

### Player Management

**Player Data:**
- Name
- Phone number
- Email
- Last invited timestamp
- Responsiveness stats:
  - `response_count` - times they said YES or NO
  - `timeout_count` - times they failed to RSVP by deadline

**Adding Players:**
- Admin adds via web interface (name + phone + email)
- Players do not self-register

### Priority Algorithm

Calculated fresh for each game:
1. **Primary factor:** Least recently invited gets priority
2. **Secondary factor:** Responsiveness score (higher response_count, lower timeout_count = better)
3. **Manual override:** Admin can drag-and-drop to reorder before confirming

---

## Invitation Flow

### Step-by-Step Process

1. **Admin creates game** - Sets date/time/location/capacity
2. **Admin sees priority list** - System-generated order based on algorithm
3. **Admin reorders (optional)** - Drag-and-drop to adjust
4. **Admin confirms list** - Locks in the order
5. **System sends initial invites** - Sends to top N players (N = capacity)
6. **Players respond:**
   - YES → Confirmed, receives calendar invite
   - NO → Acknowledged, next person in line gets invited
   - No response by deadline → Auto-decline, invite next person
7. **Game fills** - Stop sending invites
8. **Hard cutoff** - No auto-invites within 4 hours of game start

### Morning-of Reminder

- System texts all confirmed players at **8:15am** on game day
- "Still coming tonight?" - soft reminder, not a hard check
- If they reply NO → invite next person (if outside 4-hour window)
- If they don't reply → **still confirmed** (no auto-boot)
- Calendar decline at any point → Treated as NO, invite next person

### Calendar Integration

- Google Calendar API
- When player says YES: Create event with player as attendee (sent to their email)
- Player receives standard Google Calendar email invite
- Player adds to their own calendar - NOT a shared calendar
- If player declines via calendar: System treats as NO, invites next person
- System needs a service account or OAuth to create events and monitor declines

### Timezone

- All times in Pacific Time (San Francisco-based game)
- Stored in PT, displayed in PT

---

## SMS System

### Provider
Twilio (standard, reliable, good Node.js SDK)

### LLM-Powered Messaging

All player SMS conversations are handled by an LLM (Claude) with human oversight.

**Core Principle:** LLM only auto-responds when **99% confident**. Otherwise, escalates to admin.

**How it works:**
1. Player sends SMS
2. LLM receives message + full context (game details, player status, conversation history)
3. LLM evaluates confidence in appropriate response
4. If ≥99% confident → auto-respond immediately
5. If <99% confident → escalate to admin, draft suggested response
6. Admin approves, edits, or writes custom response
7. LLM learns from admin's response to improve future confidence

**LLM Context (provided with every message):**
- Current game: date, time, location, capacity, RSVP deadline
- Player's status: invited/confirmed/declined/pending, position in queue
- Game status: spots filled, spots remaining, who's confirmed
- Conversation history with this player
- Examples of past admin responses to similar situations

**High-confidence auto-responses (99%+):**
- "YES" → confirm, send calendar invite
- "NO" → acknowledge, invite next person
- "What time?" → reply with game time
- "What's the address?" → reply with location
- "I'll be late" → "No problem, see you when you get there"
- "STOP" → opt out confirmation
- Clear re-confirmation of YES on game day

**Escalate to admin (<99% confidence):**
- "Can I bring a friend?"
- "I said no but changed my mind"
- "Is [name] coming?"
- Ambiguous messages
- Anything the LLM is unsure about
- First interaction with a new type of question

### Learning Mechanism

When admin handles an escalation:
1. Admin sees LLM's suggested response (if any)
2. Admin approves, edits, or writes custom response
3. System stores the (message pattern → approved response) as training example
4. LLM uses these examples to increase confidence on similar future messages

**Storage:** Approved responses stored in database as "learned responses" with:
- Original message pattern/intent
- Context snapshot (game status, player status)
- Approved response
- Admin who approved

Over time, LLM becomes more confident on recurring patterns and escalates less.

### SMS Hygiene
- First message to new player includes opt-out instructions
- Every game invite includes: "Want off this list? Reply STOP"
- Opt-out removes player from future invites

### Admin Notifications
- **Escalations only** - Admin notified (email + SMS) when LLM needs help
- No notification for auto-handled messages
- Dashboard shows all conversations for review if desired

---

## LLM Personality & Guidelines

### Personality
- Friendly, casual, brief
- Sounds like a real person (Jon or Matt), not a bot
- Uses player's first name
- No corporate/formal language
- Matches the vibe of a private poker game among friends

### System-Initiated Messages
These are sent proactively by the system (LLM generates based on guidelines):

1. **First-time player intro** - Welcome, brief explanation, opt-out info
2. **Game invite** - Date/time/location, RSVP deadline, casual tone
3. **Last-minute invite** - More urgent, someone dropped, quick response needed
4. **Yes confirmation** - You're in, calendar invite coming
5. **No acknowledgment** - Thanks, maybe next time
6. **Morning reminder** - Soft check-in on game day
7. **Opt-out confirmation** - You've been removed, can rejoin anytime

### Player-Initiated Responses
LLM handles conversationally based on context:

- **Logistics questions** - Time, address, who's coming (if appropriate)
- **Status changes** - "Actually I can't make it" → process as NO
- **Timing concerns** - "I'll be late" → reassurance
- **Ambiguous/complex** - Escalate to admin

### Admin-Initiated Messages
Admin composes these directly (not LLM-generated):

- **Game cancelled** - Human writes the message
- **Custom outreach** - Any non-standard communication

---

## Admin Web Interface

### Authentication
- Simple shared password (both admins use same password)

### Pages/Features

**Dashboard:**
- Current/upcoming game status
- Recent player messages requiring response

**Create Game:**
- Form: date, time, location, capacity
- Shows priority-ordered player list
- Drag-and-drop reordering
- Confirm button to start invites

**Player Roster:**
- List all players
- Add new player (name, phone, email)
- View player stats (last invited, response rate)
- Remove/deactivate player

**Escalation Queue:**
- Messages where LLM needs admin help
- Shows: player message, LLM's suggested response (if any), context
- Admin can: approve suggestion, edit and send, or write custom response
- Approved responses feed back into LLM learning

**Conversation History:**
- All SMS conversations (view-only unless escalated)
- Filter by game or player
- See which messages were auto-handled vs admin-handled
- Override/correct if LLM made a mistake (rare)

**Active Game View:**
- Real-time status of current game
- See all invitations: who's confirmed, declined, pending, not yet invited
- See who's next in line if someone drops
- Quick actions: manually invite someone, mark someone as declined

**Game History:**
- Past games list
- Per game: who was invited, who confirmed, who declined/timed out

---

## Technical Architecture

### Stack
- **Framework:** Next.js (App Router)
- **Hosting:** Vercel
- **Database:** Vercel Postgres
- **SMS:** Twilio
- **LLM:** Claude API (Anthropic)
- **Calendar:** Google Calendar API
- **Auth:** Simple password middleware

### Key Integrations

**Twilio:**
- Send SMS via API
- Receive SMS via webhook
- All messages from single Twilio number

**Claude API:**
- Process all inbound SMS
- Generate contextual responses
- Confidence scoring for auto-respond vs escalate
- System prompt includes: personality guidelines, game context, player context, learned examples

**Google Calendar:**
- Create events with attendees
- Webhook or polling for decline notifications

---

## Data Model (Draft)

### Players
```
id, name, phone, email,
last_invited_at, response_count, timeout_count,
opted_out, created_at, updated_at
```

### Games
```
id, date, time, location, capacity,
rsvp_deadline, status (draft/active/completed/cancelled),
created_at, updated_at
```

### Invitations
```
id, game_id, player_id,
position (priority order), status (pending/invited/confirmed/declined/timeout),
invited_at, responded_at, response,
created_at, updated_at
```

### Messages
```
id, player_id, game_id (nullable),
direction (inbound/outbound), body,
handling_type (auto/escalated/admin_override),
llm_confidence (float, for inbound messages),
sent_at, created_at
```

### Learned Responses
```
id, message_pattern, intent_category,
context_snapshot (JSON: game status, player status),
approved_response, approved_by_admin,
created_at
```
Used to improve LLM confidence over time. When LLM sees a similar pattern with similar context, it can reference approved responses to increase confidence.

---

## Resolved Questions

All questions resolved during spec interview:

1. **Timeout logic:** Auto-decline when deadline passes → automatically invite next person. No reminders.

2. **RSVP deadline format:** Specific date/time set per game by admin (e.g., "respond by Tuesday 6pm").

3. **Morning confirmation timing:** 8:15am game day. This is a **soft reminder** - if they don't reply, they're still confirmed. Purpose is to remind and give chance to free up spots if plans changed.

4. **Last-minute invite window:** Within 24 hours of game start. Uses more urgent message template.

5. **Unrecognized SMS response:** LLM handles if ≥99% confident, otherwise escalates to admin. LLM learns from admin responses.

6. **Waitlist visibility:** Invisible. Players not yet invited don't hear anything unless a spot opens.

7. **Multiple simultaneous games:** One active game at a time. Must complete or cancel before creating next.

8. **Admin notifications:** Email + SMS to both admins on LLM escalations only (not every message).

9. **Morning-of no-response:** They're still confirmed. The morning check is a soft reminder, not a hard confirmation gate.

10. **Player wants back in after saying NO:** Handled by human via blended messaging ("Let me see" / "I can get you in" / "Sorry, full").

11. **Under-filled game:** Admin decides whether to cancel or proceed with fewer players. No automatic behavior.

12. **Admin availability:** It's on the admins to be responsive. No escalation system needed.

---

## To Draft

- **LLM System Prompt:** Need to write the personality guidelines and context template for Claude
- **Example responses:** Seed the learned_responses table with initial examples for common patterns

---

## Deployment

- Vercel (automatic deploys from GitHub)
- Environment variables for:
  - Database connection
  - Twilio credentials (Account SID, Auth Token, Phone Number)
  - Claude API key (Anthropic)
  - Google Calendar API credentials
  - Admin password
  - Admin notification contacts (Jon's email/phone, Matt's email/phone)

---

---

## Interview Log (Key Decisions)

Captured from spec interview for reference:

1. **SMS over WhatsApp** - All players US-based (San Francisco), SMS more universal
2. **LLM-powered messaging** - Claude handles all SMS, auto-responds when ≥99% confident, escalates otherwise
3. **LLM learning** - Admin responses feed back into LLM to improve future confidence
4. **Priority resets each game** - Recalculated fresh, not cumulative ranking
5. **Simple auth** - Shared password fine for two admins
6. **Vercel Postgres over Supabase** - Simpler, tightly integrated, sufficient for needs
7. **LLM handles edge cases with oversight** - Player wants back in, ambiguous messages escalate to admin
8. **No automation within 4 hours** - Hard cutoff to prevent awkward last-minute invites

---

*Last updated: Feb 15, 2025 - Updated to LLM-powered messaging with learning*
