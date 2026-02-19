import * as jose from 'jose';

export const SESSION_COOKIE_NAME = 'pokerlist_session';

// Secret key for signing JWTs - must be at least 32 bytes for HS256
function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_PASSWORD || 'fallback-secret-key-minimum-32-chars';
  // Ensure the key is at least 32 bytes by padding if necessary
  const paddedSecret = secret.padEnd(32, '0');
  return new TextEncoder().encode(paddedSecret);
}

/**
 * Create a new session token (JWT)
 * Token is valid for 7 days
 */
export async function createSession(): Promise<string> {
  const secretKey = getSecretKey();
  const token = await new jose.SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return token;
}

/**
 * Verify a session token
 * Returns true if valid, false otherwise
 */
export async function verifySession(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    const secretKey = getSecretKey();
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload.authenticated === true;
  } catch {
    // Token is invalid or expired
    return false;
  }
}
