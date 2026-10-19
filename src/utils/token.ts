/**
 * Client-safe reset token utilities for password recovery verification.
 */

const CLIENT_SALT = 'atul-expense-reset-salt-2026-auth!';

export function createClientResetToken(email: string, expiresAt: number): string {
  const str = `${email.trim().toLowerCase()}:${expiresAt}:${CLIENT_SALT}`;
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `rst_${part1}${part2}`;
}

export function verifyClientResetToken(email: string, token: string, expiresAt: number): { valid: boolean; reason?: string } {
  if (!email || !token || !expiresAt) {
    return { valid: false, reason: 'Missing reset token or email parameters.' };
  }
  if (Date.now() > Number(expiresAt)) {
    return { valid: false, reason: 'Password reset link has expired. Please request a new link.' };
  }
  const expected = createClientResetToken(email, expiresAt);
  if (token === expected) {
    return { valid: true };
  }
  return { valid: false, reason: 'Invalid or forged password reset token.' };
}
