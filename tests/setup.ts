import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests (DATABASE_URL is loaded from vitest.config.ts)
vi.stubEnv('ADMIN_PASSWORD', 'test-password');
vi.stubEnv('TWILIO_ACCOUNT_SID', 'test-sid');
vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
vi.stubEnv('TWILIO_PHONE_NUMBER', '+15551234567');
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_FILE', 'test-service-account.json');
vi.stubEnv('GOOGLE_CALENDAR_ID', 'primary');
