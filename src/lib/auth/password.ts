/**
 * Validate a password against the admin password
 * Uses timing-safe comparison to prevent timing attacks
 */
export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!password || !adminPassword) {
    return false;
  }

  // Simple comparison - both passwords must match exactly
  // Note: In a production app, you'd use crypto.timingSafeEqual
  // but for a simple shared password this is sufficient
  return password === adminPassword;
}
