# Testing Strategy

## Overview

This project follows **Test-Driven Development (TDD)** using the **Red-Green-Refactor** cycle:
1. 🔴 **Red**: Write a failing test first
2. 🟢 **Green**: Write minimal code to make it pass
3. 🔵 **Refactor**: Improve code while keeping tests green

---

## Testing Pyramid

```
        /\
       /  \
      / E2E \       ← Few: Critical user journeys
     /______\
    /        \
   / Integration \   ← Some: API + DB interactions
  /______________\
 /                \
/   Unit Tests     \ ← Many: Pure logic, utilities
/___________________\
```

**Target distribution:**
- 70% Unit Tests (fast, isolated)
- 20% Integration Tests (API routes, DB operations)
- 10% End-to-End Tests (full user flows)

---

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (fast, Vite-native) |
| **@testing-library/react** | React component testing |
| **MSW** (Mock Service Worker) | API mocking |
| **node-mocks-http** | HTTP request/response mocking |
| **Prisma Test Utilities** | Database test helpers |
| **Twilio Test Credentials** | SMS mocking |

---

## Test Types

### 1. Unit Tests

**Purpose:** Test isolated functions and components

**Location:** `src/**/__tests__/*.test.ts` (co-located with source)

**Characteristics:**
- No database
- No external APIs
- Fast (<10ms per test)
- High coverage (aim for 80%+)

**Examples:**
```typescript
// Priority algorithm
describe('calculatePriority', () => {
  it('should prioritize least recently invited player', () => {
    // Red: Write test first
    const players = [
      { id: '1', last_invited_at: new Date('2024-01-15') },
      { id: '2', last_invited_at: new Date('2024-01-10') },
    ];
    const sorted = calculatePriority(players);
    expect(sorted[0].id).toBe('2'); // Oldest invite first
  });
});

// SMS message parsing
describe('parsePlayerResponse', () => {
  it('should detect YES response', () => {
    expect(parsePlayerResponse('yes')).toBe('YES');
    expect(parsePlayerResponse('Yeah!')).toBe('YES');
    expect(parsePlayerResponse('yep')).toBe('YES');
  });
});
```

**What to unit test:**
- Utilities (`lib/utils/*`)
- Business logic (`lib/services/*`)
- Pure functions
- React components (props → render)
- Validation functions
- Priority algorithm
- Message parsing

---

### 2. Integration Tests

**Purpose:** Test multiple components working together

**Location:** `tests/integration/*.test.ts`

**Characteristics:**
- Real database (test DB or in-memory)
- Mocked external APIs (Twilio, Anthropic, Google)
- Moderate speed (50-200ms per test)
- Test actual data flow

**Examples:**
```typescript
// API Route Integration Test
describe('POST /api/players', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should create a player and send welcome SMS', async () => {
    // Red: Write test first
    const mockTwilio = mockTwilioSend();

    const response = await fetch('/api/players', {
      method: 'POST',
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        phone: '+15551234567',
        email: 'john@example.com',
      }),
    });

    expect(response.status).toBe(201);

    const player = await response.json();
    expect(player.id).toBeDefined();

    // Verify DB write
    const dbPlayer = await prisma.player.findUnique({
      where: { id: player.id },
    });
    expect(dbPlayer).toBeTruthy();

    // Verify SMS sent
    expect(mockTwilio.messages.create).toHaveBeenCalledWith({
      to: '+15551234567',
      from: expect.any(String),
      body: expect.stringContaining('poker game'),
    });
  });
});

// Invitation Cascade Integration Test
describe('Invitation Cascade', () => {
  it('should invite next player when someone declines', async () => {
    // Setup: Game with 3 players, capacity 2
    const game = await createTestGame({ capacity: 2 });
    const [p1, p2, p3] = await createTestPlayers(3);
    await createInvitations(game.id, [p1, p2, p3]);

    // Invite first two
    await sendInvites(game.id);

    // First player declines
    await processResponse(p1.id, 'NO');

    // Verify p3 gets invited
    const invitation = await prisma.invitation.findFirst({
      where: { game_id: game.id, player_id: p3.id },
    });
    expect(invitation.status).toBe('invited');
  });
});
```

**What to integration test:**
- API routes with DB operations
- Invitation cascade logic
- Game lifecycle (create → invite → respond → confirm)
- SMS webhook processing
- Calendar event creation
- Authentication flow
- Priority list generation

---

### 3. End-to-End Tests

**Purpose:** Test complete user flows through the UI

**Location:** `tests/e2e/*.test.ts`

**Characteristics:**
- Real browser (Playwright)
- Test database
- Mocked external APIs
- Slow (1-5 seconds per test)
- Critical paths only

**Examples:**
```typescript
// E2E: Admin creates game and sends invites
test('Admin can create game and send invites', async ({ page }) => {
  // Login
  await page.goto('/admin/login');
  await page.fill('[name="password"]', 'admin-password');
  await page.click('button[type="submit"]');

  // Create game
  await page.goto('/admin/games/new');
  await page.fill('[name="date"]', '2024-03-15');
  await page.fill('[name="time"]', '19:00');
  await page.fill('[name="location"]', 'Mux Office');

  // Verify priority list shows
  await expect(page.locator('.player-list')).toBeVisible();

  // Confirm and send
  await page.click('button:has-text("Send Invites")');

  // Verify success
  await expect(page.locator('.success-message')).toContainText('Invites sent');

  // Verify game appears in dashboard
  await page.goto('/admin');
  await expect(page.locator('.active-game')).toContainText('Mux Office');
});

// E2E: Full game flow
test('Complete game flow from creation to completion', async ({ page }) => {
  // 1. Admin creates game
  // 2. System sends SMS invites (mocked)
  // 3. Players respond YES (simulate via webhook)
  // 4. Game fills to capacity
  // 5. Calendar invites sent (mocked)
  // 6. Morning check sent (triggered)
  // 7. Game completes
  // 8. Stats updated

  // ... full flow test
});
```

**What to E2E test:**
- Login → create game → send invites
- Player response → confirmation → calendar
- Escalation flow (message → admin reviews → responds)
- Game cancellation → notifications sent
- Full game lifecycle (creation to completion)

---

## TDD Workflow

### Red-Green-Refactor Cycle

```
1. 🔴 RED: Write failing test
   ├─ Define expected behavior
   ├─ Write test that fails
   └─ Run test suite (should fail)

2. 🟢 GREEN: Make it pass
   ├─ Write minimal code
   ├─ Run test suite (should pass)
   └─ Don't worry about perfection

3. 🔵 REFACTOR: Improve code
   ├─ Clean up implementation
   ├─ Extract functions
   ├─ Improve naming
   └─ Run test suite (should still pass)

4. Repeat
```

### Example TDD Session

**Task:** Implement priority algorithm

**Step 1: RED** 🔴
```typescript
// lib/priority/__tests__/calculate-priority.test.ts
describe('calculatePriority', () => {
  it('should prioritize least recently invited player', () => {
    const players = [
      { id: '1', name: 'Alice', last_invited_at: new Date('2024-01-15') },
      { id: '2', name: 'Bob', last_invited_at: new Date('2024-01-10') },
    ];

    const sorted = calculatePriority(players);

    expect(sorted[0].id).toBe('2'); // Bob invited earlier
    expect(sorted[1].id).toBe('1'); // Alice invited later
  });
});
```

**Run:** `npm test` → ❌ FAIL (function doesn't exist)

**Step 2: GREEN** 🟢
```typescript
// lib/priority/calculate-priority.ts
export function calculatePriority(players) {
  return players.sort((a, b) => {
    return a.last_invited_at - b.last_invited_at;
  });
}
```

**Run:** `npm test` → ✅ PASS

**Step 3: REFACTOR** 🔵
```typescript
// lib/priority/calculate-priority.ts
import { Player } from '@/types';

export function calculatePriority(players: Player[]): Player[] {
  // Sort by last_invited_at ascending (least recent first)
  return [...players].sort((a, b) => {
    if (!a.last_invited_at) return -1; // Never invited = highest priority
    if (!b.last_invited_at) return 1;
    return a.last_invited_at.getTime() - b.last_invited_at.getTime();
  });
}
```

**Run:** `npm test` → ✅ STILL PASS

**Step 4: Add more tests (RED again)**
```typescript
it('should prioritize never-invited players first', () => {
  const players = [
    { id: '1', last_invited_at: new Date('2024-01-10') },
    { id: '2', last_invited_at: null }, // Never invited
  ];

  const sorted = calculatePriority(players);
  expect(sorted[0].id).toBe('2'); // Never invited = first
});

it('should use response rate as tiebreaker', () => {
  const sameDate = new Date('2024-01-10');
  const players = [
    { id: '1', last_invited_at: sameDate, response_count: 5, timeout_count: 2 },
    { id: '2', last_invited_at: sameDate, response_count: 8, timeout_count: 1 },
  ];

  const sorted = calculatePriority(players);
  expect(sorted[0].id).toBe('2'); // Better response rate
});
```

**Run:** `npm test` → ❌ FAIL → Implement → ✅ PASS → Refactor → Repeat

---

## Test Organization

### File Structure

```
pokerbot/
├── src/
│   ├── lib/
│   │   ├── priority/
│   │   │   ├── calculate-priority.ts
│   │   │   └── __tests__/
│   │   │       └── calculate-priority.test.ts    # Unit test (co-located)
│   │   ├── sms/
│   │   │   ├── parse-response.ts
│   │   │   └── __tests__/
│   │   │       └── parse-response.test.ts
│   │   └── services/
│   │       ├── invitation-service.ts
│   │       └── __tests__/
│   │           └── invitation-service.test.ts
│   ├── app/
│   │   └── api/
│   │       └── players/
│   │           └── route.ts
│   └── components/
│       └── PlayerList/
│           ├── PlayerList.tsx
│           └── __tests__/
│               └── PlayerList.test.tsx
├── tests/
│   ├── integration/
│   │   ├── api-players.test.ts                   # Integration tests
│   │   ├── api-games.test.ts
│   │   ├── invitation-cascade.test.ts
│   │   └── sms-webhook.test.ts
│   ├── e2e/
│   │   ├── admin-create-game.test.ts             # E2E tests
│   │   ├── game-lifecycle.test.ts
│   │   └── player-response-flow.test.ts
│   └── helpers/
│       ├── test-db.ts                            # Test utilities
│       ├── mock-twilio.ts
│       └── fixtures.ts
└── vitest.config.ts
```

### Naming Conventions

**Unit tests:**
- `[feature].test.ts` for functions
- `[Component].test.tsx` for React components
- Co-located with source in `__tests__/` folders

**Integration tests:**
- `[feature-name].test.ts`
- Grouped by domain (api, services, workflows)

**E2E tests:**
- `[user-flow].test.ts`
- Named after user stories

---

## Mocking Strategy

### External Services

**Always mock in tests:**
- Twilio (SMS)
- Anthropic (Claude API)
- Google Calendar API
- Email sending

**Use real in tests:**
- Database (via test DB or transactions)
- Next.js routing
- React rendering

### Mock Examples

**Twilio:**
```typescript
// tests/helpers/mock-twilio.ts
export function mockTwilioSend() {
  const mock = vi.fn();
  vi.mock('twilio', () => ({
    default: vi.fn(() => ({
      messages: {
        create: mock,
      },
    })),
  }));
  return { messages: { create: mock } };
}
```

**Claude API:**
```typescript
// tests/helpers/mock-claude.ts
export function mockClaudeResponse(response: string, confidence: number) {
  vi.mock('@anthropic-ai/sdk', () => ({
    default: vi.fn(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ text: JSON.stringify({ response, confidence }) }],
        }),
      },
    })),
  }));
}
```

**Google Calendar:**
```typescript
// tests/helpers/mock-calendar.ts
export function mockGoogleCalendar() {
  const createEvent = vi.fn().mockResolvedValue({
    data: { id: 'test-event-id', htmlLink: 'https://...' },
  });

  vi.mock('googleapis', () => ({
    google: {
      calendar: () => ({
        events: { insert: createEvent, delete: vi.fn() },
      }),
    },
  }));

  return { createEvent };
}
```

---

## Database Testing

### Strategy: Isolated Transactions

Each test runs in a transaction that gets rolled back:

```typescript
// tests/helpers/test-db.ts
import { PrismaClient } from '@prisma/client';

export async function createTestContext() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  return {
    prisma,
    async cleanup() {
      await prisma.$disconnect();
    },
  };
}

// In test
let ctx;
beforeEach(async () => {
  ctx = await createTestContext();
});

afterEach(async () => {
  await ctx.cleanup();
});
```

### Test Fixtures

```typescript
// tests/helpers/fixtures.ts
export async function createTestPlayer(overrides = {}) {
  return await prisma.player.create({
    data: {
      first_name: 'Test',
      last_name: 'Player',
      email: 'test@example.com',
      phone: '+15551234567',
      ...overrides,
    },
  });
}

export async function createTestGame(overrides = {}) {
  return await prisma.game.create({
    data: {
      date: new Date('2024-03-15'),
      time: '19:00',
      location: 'Test Location',
      capacity: 10,
      rsvp_deadline: new Date('2024-03-14T18:00:00'),
      status: 'draft',
      ...overrides,
    },
  });
}
```

---

## Coverage Goals

| Type | Target | Why |
|------|--------|-----|
| **Unit Tests** | 80%+ | Core logic should be well-tested |
| **Integration Tests** | 60%+ | API routes and workflows covered |
| **E2E Tests** | Critical paths only | Expensive, focus on key flows |

**Run coverage:**
```bash
npm run test:coverage
```

**Coverage reports:** `coverage/index.html`

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3  # Upload coverage
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npm run test:unit          # Fast unit tests only
npm run lint
npm run typecheck
```

---

## Test Commands

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Development workflow:**
```bash
# Watch mode during development
npm run test:watch

# Run all tests before commit
npm test

# Check coverage
npm run test:coverage
```

---

## Per-Phase Testing Requirements

Each phase MUST include tests before being marked complete:

### Phase 1: Foundation
- ✅ Auth middleware (unit + integration)
- ✅ Database connection (integration)
- ✅ Login flow (E2E)

### Phase 2: Players & Games
- ✅ CRUD operations (unit + integration)
- ✅ Validation logic (unit)
- ✅ API routes (integration)
- ✅ Priority algorithm (unit)

### Phase 3: SMS Core
- ✅ SMS sending (unit + integration, mocked Twilio)
- ✅ Webhook processing (integration)
- ✅ Message parsing (unit)

### Phase 4: Invitation Flow
- ✅ Invitation cascade (integration)
- ✅ Status transitions (unit)
- ✅ Full game flow (E2E)

### Phase 5: LLM Integration
- ✅ Claude API calls (unit, mocked)
- ✅ Confidence scoring (unit)
- ✅ Escalation logic (integration)

### Phase 6: Calendar
- ✅ Event creation (integration, mocked Google)
- ✅ Decline detection (integration)
- ✅ Calendar flow (E2E)

### Phase 7: Scheduled Jobs
- ✅ Cron triggers (integration)
- ✅ Morning check (integration)
- ✅ Timeout processing (integration)

### Phase 8: Polish
- ✅ Dashboard rendering (E2E)
- ✅ Error handling (unit + integration)

---

## Best Practices

### ✅ DO

- Write tests before implementation (TDD)
- Keep tests simple and readable
- Test behavior, not implementation
- Use descriptive test names
- Mock external services
- Test edge cases and error conditions
- Run tests before committing
- Maintain test fixtures
- Keep tests fast

### ❌ DON'T

- Skip tests to "move faster"
- Test implementation details
- Write brittle tests (coupled to structure)
- Use real API keys in tests
- Share state between tests
- Write slow tests unnecessarily
- Ignore failing tests
- Test framework internals
- Over-mock (mock everything)

---

## Example Test Files

### Unit Test Example

```typescript
// src/lib/priority/__tests__/calculate-priority.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePriority } from '../calculate-priority';

describe('calculatePriority', () => {
  it('should prioritize least recently invited player', () => {
    const players = [
      { id: '1', last_invited_at: new Date('2024-01-15'), response_count: 5, timeout_count: 1 },
      { id: '2', last_invited_at: new Date('2024-01-10'), response_count: 5, timeout_count: 1 },
    ];

    const sorted = calculatePriority(players);

    expect(sorted[0].id).toBe('2');
  });

  it('should handle null last_invited_at', () => {
    const players = [
      { id: '1', last_invited_at: new Date('2024-01-10'), response_count: 5, timeout_count: 1 },
      { id: '2', last_invited_at: null, response_count: 5, timeout_count: 1 },
    ];

    const sorted = calculatePriority(players);

    expect(sorted[0].id).toBe('2'); // Never invited = highest priority
  });
});
```

### Integration Test Example

```typescript
// tests/integration/api-players.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext } from '../helpers/test-db';
import { mockTwilioSend } from '../helpers/mock-twilio';

describe('POST /api/players', () => {
  let ctx;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should create player and send welcome SMS', async () => {
    const twilioMock = mockTwilioSend();

    const response = await fetch('http://localhost:3000/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        phone: '+15551234567',
        email: 'john@example.com',
      }),
    });

    expect(response.status).toBe(201);

    const player = await response.json();
    expect(player.id).toBeDefined();

    // Verify DB write
    const dbPlayer = await ctx.prisma.player.findUnique({
      where: { id: player.id },
    });
    expect(dbPlayer).toBeTruthy();

    // Verify SMS sent
    expect(twilioMock.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+15551234567',
        body: expect.stringContaining('poker'),
      })
    );
  });
});
```

---

*Last updated: Feb 16, 2026*
