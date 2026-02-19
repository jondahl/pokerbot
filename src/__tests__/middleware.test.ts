// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the session verification
vi.mock('@/lib/auth/session', () => ({
  verifySession: vi.fn(),
  SESSION_COOKIE_NAME: 'pokerlist_session',
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow access to login page without authentication', async () => {
    const { middleware } = await import('../middleware');
    const { verifySession } = await import('@/lib/auth/session');
    vi.mocked(verifySession).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/login');
    const response = await middleware(request);

    // Should allow access (not redirect)
    expect(response?.status).toBe(200);
  });

  it('should redirect unauthenticated users to login', async () => {
    const { middleware } = await import('../middleware');
    const { verifySession } = await import('@/lib/auth/session');
    vi.mocked(verifySession).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);

    expect(response).toBeDefined();
    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('should allow authenticated users to access protected routes', async () => {
    const { middleware } = await import('../middleware');
    const { verifySession } = await import('@/lib/auth/session');
    vi.mocked(verifySession).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/', {
      headers: {
        cookie: 'pokerlist_session=valid-token',
      },
    });
    const response = await middleware(request);

    // Should allow access (return undefined or NextResponse.next())
    expect(response?.status).not.toBe(307);
  });

  it('should redirect authenticated users from login to home', async () => {
    const { middleware } = await import('../middleware');
    const { verifySession } = await import('@/lib/auth/session');
    vi.mocked(verifySession).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: 'pokerlist_session=valid-token',
      },
    });
    const response = await middleware(request);

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/');
  });
});
