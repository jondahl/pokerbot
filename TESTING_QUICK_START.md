# Testing Quick Start

Quick reference for running tests in the Pokerbot project.

---

## Setup (One-time)

```bash
# Install dependencies (includes Vitest, Testing Library, etc.)
npm install

# Verify test setup
npm test -- --version
```

---

## Running Tests

### Development (Watch Mode)

```bash
# Run all tests in watch mode (re-runs on file changes)
npm run test:watch

# Watch specific file
npm run test:watch src/lib/priority

# Watch tests matching pattern
npm run test:watch priority
```

### Running All Tests

```bash
# Run all tests once
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e

# Run all tests (unit + integration + E2E)
npm run test:all
```

### Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

### UI Mode (Visual Test Runner)

```bash
# Open Vitest UI
npm run test:ui
```

---

## Test Commands Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Watch mode (re-run on changes) |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:e2e` | E2E tests only |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ui` | Open visual test runner |

---

## TDD Workflow Commands

### Starting a new feature

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Start watch mode
npm run test:watch

# 3. Write test (RED 🔴)
# Edit: src/lib/my-feature/__tests__/my-feature.test.ts

# 4. Watch tests fail

# 5. Write code (GREEN 🟢)
# Edit: src/lib/my-feature/my-feature.ts

# 6. Watch tests pass

# 7. Refactor (REFACTOR 🔵)
# Improve code while keeping tests green

# 8. Commit when done
git add .
git commit -m "feat: implement my feature"
```

### Before committing

```bash
# Run all tests
npm test

# Check types
npm run typecheck

# Lint code
npm run lint

# Check coverage
npm run test:coverage
```

---

## Writing Tests

### Unit Test Template

```typescript
// src/lib/feature/__tests__/feature.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { myFunction } from '../feature';

describe('myFunction', () => {
  describe('happy path', () => {
    it('should do X when given Y', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(myFunction('')).toBe('');
    });
  });

  describe('error cases', () => {
    it('should throw on invalid input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Integration Test Template

```typescript
// tests/integration/api-feature.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestContext } from '../helpers/test-db';

describe('POST /api/feature', () => {
  let ctx;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('should create resource', async () => {
    const response = await fetch('/api/feature', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();

    // Verify DB write
    const record = await ctx.prisma.feature.findUnique({
      where: { id: data.id },
    });
    expect(record).toBeTruthy();
  });
});
```

### E2E Test Template

```typescript
// tests/e2e/feature-flow.test.ts
import { test, expect } from '@playwright/test';

test('user can complete feature flow', async ({ page }) => {
  // Navigate
  await page.goto('/feature');

  // Interact
  await page.fill('[name="input"]', 'test value');
  await page.click('button[type="submit"]');

  // Assert
  await expect(page.locator('.success')).toBeVisible();
  await expect(page.locator('.result')).toContainText('expected');
});
```

---

## Mocking External Services

### Mock Twilio

```typescript
import { vi } from 'vitest';

// Mock at top of test file
vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        sid: 'test-message-sid',
        status: 'queued',
      }),
    },
  })),
}));

// Use in test
const twilio = require('twilio')();
await sendSMS('+15551234567', 'Test');
expect(twilio.messages.create).toHaveBeenCalledWith({
  to: '+15551234567',
  from: process.env.TWILIO_PHONE_NUMBER,
  body: 'Test',
});
```

### Mock Claude API

```typescript
import { vi } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            text: JSON.stringify({
              response: 'Test response',
              confidence: 0.99,
            }),
          },
        ],
      }),
    },
  })),
}));
```

### Mock Google Calendar

```typescript
import { vi } from 'vitest';

vi.mock('googleapis', () => ({
  google: {
    calendar: vi.fn(() => ({
      events: {
        insert: vi.fn().mockResolvedValue({
          data: { id: 'test-event-id', htmlLink: 'https://...' },
        }),
        delete: vi.fn().mockResolvedValue({}),
      },
    })),
    auth: {
      GoogleAuth: vi.fn(),
    },
  },
}));
```

---

## Debugging Tests

### Add logging

```typescript
it('should calculate correctly', () => {
  const result = myFunction(input);
  console.log('Result:', result); // Debug output
  expect(result).toBe(expected);
});
```

### Run single test

```bash
# Run specific test file
npm test src/lib/priority/__tests__/calculate-priority.test.ts

# Run tests matching name
npm test -t "should prioritize least recently invited"
```

### Use debugger

```typescript
it('should work', () => {
  debugger; // Pause execution
  const result = myFunction(input);
  expect(result).toBe(expected);
});
```

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/vitest run
```

---

## Common Issues

### "Cannot find module"

**Problem:** Import paths incorrect

**Fix:**
```typescript
// Use @/ alias for src
import { fn } from '@/lib/feature';

// Or relative paths
import { fn } from '../feature';
```

### "Database connection refused"

**Problem:** Test database not running or env vars missing

**Fix:**
```bash
# Check .env.local has DATABASE_URL
cat .env.local | grep DATABASE_URL

# Restart test
npm test
```

### "Tests timeout"

**Problem:** Async operation not completing

**Fix:**
```typescript
// Increase timeout for slow tests
it('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### "Mock not working"

**Problem:** Mock defined after import

**Fix:**
```typescript
// ❌ WRONG: Import before mock
import { fn } from './module';
vi.mock('./module');

// ✅ CORRECT: Mock before import
vi.mock('./module');
import { fn } from './module';
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every push
- Every pull request
- Before merging to main

### Pre-commit Hook

```bash
# .husky/pre-commit runs:
- npm run test:unit (fast)
- npm run lint
- npm run typecheck
```

### Pre-push Hook

```bash
# .husky/pre-push runs:
- npm run test:all (comprehensive)
```

---

## Best Practices

### ✅ DO

- Write tests before code (TDD)
- Keep tests simple and focused
- Use descriptive test names
- Mock external services
- Test edge cases and errors
- Run tests before committing
- Keep tests fast (<100ms for unit tests)

### ❌ DON'T

- Skip tests to go faster
- Test implementation details
- Share state between tests
- Use real API keys
- Commit failing tests
- Write slow tests unnecessarily
- Test third-party libraries

---

## Test Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Unit Tests | >80% | Check with `npm run test:coverage` |
| Integration Tests | >60% | |
| Critical Logic | >90% | Priority, invitation flow |

---

## Getting Help

**Documentation:**
- [Full Testing Strategy](./TESTING_STRATEGY.md)
- [Vitest Docs](https://vitest.dev)
- [Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev)

**Common Commands:**
```bash
# See all test scripts
npm run | grep test

# Get help on test command
npm test -- --help

# View test output in browser
npm run test:ui
```

---

*Last updated: Feb 16, 2026*
