'use server';

import { cookies } from 'next/headers';
import { validatePassword } from '@/lib/auth/password';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export type LoginResult = {
  success: boolean;
  error?: string;
};

export async function login(password: string): Promise<LoginResult> {
  if (!validatePassword(password)) {
    return { success: false, error: 'Invalid password' };
  }

  const token = await createSession();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return { success: true };
}
