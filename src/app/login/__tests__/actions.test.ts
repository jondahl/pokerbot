// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock cookies
const mockSet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: () => ({
    set: mockSet,
  }),
}));

describe('Login Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_PASSWORD', 'correct-password');
  });

  it('should return success and set cookie for correct password', async () => {
    const { login } = await import('../actions');
    const result = await login('correct-password');

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      'pokerlist_session',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: expect.any(Boolean),
        sameSite: 'lax',
        maxAge: expect.any(Number),
      })
    );
  });

  it('should return error for incorrect password', async () => {
    const { login } = await import('../actions');
    const result = await login('wrong-password');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid password');
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('should return error for empty password', async () => {
    const { login } = await import('../actions');
    const result = await login('');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid password');
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('should set cookie with 7 day expiry', async () => {
    const { login } = await import('../actions');
    await login('correct-password');

    expect(mockSet).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      })
    );
  });
});
