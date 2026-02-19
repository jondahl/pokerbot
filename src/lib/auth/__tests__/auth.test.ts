// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, verifySession, SESSION_COOKIE_NAME } from '../session';

describe('Session Management', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PASSWORD', 'test-password-123');
  });

  describe('createSession', () => {
    it('should create a valid session token', async () => {
      const token = await createSession();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should create tokens that can be verified', async () => {
      const token1 = await createSession();
      const token2 = await createSession();
      // Both tokens should be valid
      expect(await verifySession(token1)).toBe(true);
      expect(await verifySession(token2)).toBe(true);
    });
  });

  describe('verifySession', () => {
    it('should return true for a valid session token', async () => {
      const token = await createSession();
      const isValid = await verifySession(token);
      expect(isValid).toBe(true);
    });

    it('should return false for an invalid token', async () => {
      const isValid = await verifySession('invalid-token');
      expect(isValid).toBe(false);
    });

    it('should return false for an empty token', async () => {
      const isValid = await verifySession('');
      expect(isValid).toBe(false);
    });

    it('should return false for null/undefined', async () => {
      const isValid1 = await verifySession(null as unknown as string);
      const isValid2 = await verifySession(undefined as unknown as string);
      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });

  describe('SESSION_COOKIE_NAME', () => {
    it('should be defined', () => {
      expect(SESSION_COOKIE_NAME).toBeDefined();
      expect(typeof SESSION_COOKIE_NAME).toBe('string');
    });
  });
});

describe('Password Validation', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PASSWORD', 'correct-password');
  });

  it('should validate correct password', async () => {
    const { validatePassword } = await import('../password');
    const isValid = validatePassword('correct-password');
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const { validatePassword } = await import('../password');
    const isValid = validatePassword('wrong-password');
    expect(isValid).toBe(false);
  });

  it('should reject empty password', async () => {
    const { validatePassword } = await import('../password');
    const isValid = validatePassword('');
    expect(isValid).toBe(false);
  });
});
