# Agent Development Guide

Guidelines for AI agents working on this codebase.

---

## Project Specs Manifest

| File | Purpose | Status |
|------|---------|--------|
| `SPEC.md` | Product specification - features, flows, decisions | Complete |
| `MESSAGES.md` | SMS message templates and catalog | Complete |
| `SYSTEM_PROMPT.md` | LLM prompt for SMS handling | Complete |
| `TECHNICAL_SPEC.md` | Data model, UX flows, API routes, wireframes | Complete |
| `AGENTS.md` | This file - development guidelines for AI agents | Complete |
| `DECISIONS.md` | Decision log - what we chose AND what we rejected | Create when needed |

**Rule:** Before implementing anything, check if there's a spec for it. If the spec doesn't exist or is unclear, ask before building.

---

## Core Principles

### 1. Safety First

**NEVER do these without EXPLICIT human direction:**
- Delete code files or significant code blocks
- Run `git rebase`, `git reset --hard`, or alter git history
- Force push (`git push --force`)
- Deploy to production
- Drop database tables or delete data
- Remove dependencies from package.json
- Change authentication or security mechanisms

**When in doubt, ask.** It's always better to pause and confirm than to break something.

### 2. Incremental Development

- Make small, focused commits
- Test before committing
- One logical change per commit
- If a change is large, break it into smaller PRs

### 3. Document Everything

- Update specs when implementation diverges
- Log decisions in `DECISIONS.md`
- Comment non-obvious code
- Keep this file updated as patterns emerge

---

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Framework:** Next.js 14+ (App Router)
- **Database:** Vercel Postgres (via Prisma or Drizzle)
- **SMS:** Twilio
- **LLM:** Claude API (Anthropic)
- **Calendar:** Google Calendar API
- **Hosting:** Vercel
- **Testing:** Vitest + Playwright

---

## Code Standards

### TypeScript
```typescript
// Always use strict types - no `any`
// Prefer interfaces over types for objects
// Use enums or const objects for status values
// Export types from a central types.ts file

// Good
interface Player {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

// Bad
const player: any = { ... }
```

### File Structure
```
src/
  app/                    # Next.js app router pages
    api/                  # API routes
      webhooks/           # Twilio, Google webhooks
      games/
      players/
      ...
    (admin)/              # Admin UI pages
  lib/                    # Shared utilities
    db/                   # Database client, queries
    sms/                  # Twilio integration
    llm/                  # Claude integration
    calendar/             # Google Calendar integration
  components/             # React components
  types/                  # TypeScript types
  data/                   # Static data (learned-responses.json)
```

### Naming Conventions
- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database tables: `snake_case`
- API routes: `kebab-case`

---

## Testing Requirements

### Coverage Expectations
- **Critical paths:** 100% coverage (invitation flow, SMS handling, LLM processing)
- **API routes:** 100% coverage
- **UI components:** 80%+ coverage
- **Utilities:** 90%+ coverage

### Test Types

**Unit Tests** (`*.test.ts`)
- Test individual functions in isolation
- Mock external dependencies (Twilio, Claude, DB)
- Fast, run on every commit

**Integration Tests** (`*.integration.test.ts`)
- Test API routes end-to-end
- Use test database
- Test webhook handling

**E2E Tests** (`*.e2e.test.ts`)
- Test full user flows via Playwright
- Admin creates game → invites sent → player responds
- Run before deploy

### Testing SMS/LLM

```typescript
// Mock Twilio for unit tests
vi.mock('@/lib/sms', () => ({
  sendSMS: vi.fn().mockResolvedValue({ sid: 'test-sid' }),
}));

// Mock Claude for unit tests
vi.mock('@/lib/llm', () => ({
  processMessage: vi.fn().mockResolvedValue({
    action: 'auto_respond',
    response: 'Test response',
    confidence: 0.99,
  }),
}));
```

### Run Tests Before Committing
```bash
npm run test        # Unit tests
npm run test:int    # Integration tests
npm run lint        # Linting
npm run typecheck   # TypeScript checks
```

**Do not commit if tests fail.**

---

## Git Workflow

### Commit Messages
```
<type>: <short description>

[optional body]

[optional footer]
```

Types:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code change that neither fixes nor adds
- `test:` Adding tests
- `docs:` Documentation only
- `chore:` Maintenance (deps, config)

Examples:
```
feat: add player invitation endpoint

- POST /api/players creates player
- Sends welcome SMS via Twilio
- Returns created player with ID

Implements SPEC.md section 3.2
```

### Commit Frequency
- Commit after each logical unit of work
- Commit when tests pass
- Don't batch multiple features into one commit
- Commit before switching tasks

### Branch Strategy
- `main` - production, protected
- `dev` - development, default branch
- Feature branches: `feat/add-player-api`
- Fix branches: `fix/sms-delivery-retry`

### Before Pushing
1. Run all tests
2. Run linter
3. Run typecheck
4. Review your own diff
5. Ensure commit messages are clear

---

## Decision Documentation

### DECISIONS.md Format

```markdown
# Decision Log

## YYYY-MM-DD: [Decision Title]

**Context:** Why this decision was needed

**Options Considered:**
1. Option A - [description]
2. Option B - [description]
3. Option C - [description]

**Decision:** Option B

**Rationale:** Why we chose this

**Rejected Alternatives:**
- Option A rejected because [reason]
- Option C rejected because [reason]

**Consequences:** What this means going forward
```

### When to Log Decisions
- Architectural choices (database, framework, patterns)
- Trade-offs (performance vs simplicity, etc.)
- Anything where we explicitly chose NOT to do something
- Deviations from the original spec
- Technology/library choices

### Examples of Decisions to Log
- "Why Vercel Postgres over Supabase"
- "Why we don't send SMS reminders before deadline"
- "Why learned responses are in code, not database"
- "Why we use 99% confidence threshold"

---

## Working with Specs

### Before Implementing
1. Read the relevant spec section
2. Check DECISIONS.md for context
3. If unclear, ask human before proceeding

### When Implementation Differs from Spec
1. **Stop and assess:** Is the spec wrong, or is your implementation wrong?
2. **If spec is wrong:** Update spec first, then implement
3. **If implementation is wrong:** Fix implementation to match spec
4. **If trade-off needed:** Document in DECISIONS.md, update spec

### Spec Maintenance
- Specs are living documents
- Update them as we learn
- Never let code and spec drift apart
- If you change behavior, update the spec in the same commit

---

## Error Handling

### Principles
- Fail fast, fail clearly
- Log errors with context
- Don't swallow errors silently
- User-facing errors should be friendly
- Internal errors should be detailed

### External Service Failures

**Twilio fails:**
- Log error with message details
- Mark message as failed in DB
- Alert admins (don't retry silently)

**Claude API fails:**
- Escalate message to admin automatically
- Log error
- Don't fail silently

**Google Calendar fails:**
- Log error
- Continue with SMS flow (calendar is secondary)
- Retry in background

---

## Security Checklist

Before committing, verify:
- [ ] No secrets in code (use env vars)
- [ ] No console.log of sensitive data
- [ ] Input validation on all API routes
- [ ] Auth check on admin routes
- [ ] Phone numbers normalized to E.164
- [ ] SQL injection prevented (use parameterized queries)

---

## Asking for Help

### When to Ask Human
- Unsure about a product decision
- Multiple valid technical approaches
- Changing something not in spec
- Deleting code or files
- Deploying
- Any security-related changes

### How to Ask
Be specific:
```
I need to implement X. The spec says Y, but I see two approaches:
1. Approach A: [description, pros, cons]
2. Approach B: [description, pros, cons]

Which do you prefer, or is there another approach?
```

---

## Checklist Before Submitting Work

- [ ] Tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Code matches spec (or spec updated)
- [ ] Decisions documented if applicable
- [ ] Commit messages are clear
- [ ] No debugging code left in
- [ ] No `console.log` statements (use proper logging)
- [ ] No `any` types
- [ ] No skipped tests

---

## Anti-Patterns to Avoid

### Code
- `any` types
- Commented-out code (delete it)
- Magic numbers (use constants)
- Deeply nested callbacks (use async/await)
- God functions (break them up)

### Process
- Committing without testing
- Large commits with multiple unrelated changes
- Implementing without reading spec first
- Assuming instead of asking
- "I'll fix it later" (fix it now)

### Dangerous
- `git push --force`
- `DROP TABLE`
- Deleting files without asking
- Disabling security checks
- Hardcoding secrets
- "Quick" production fixes without testing

---

*Last updated: Feb 15, 2025*
