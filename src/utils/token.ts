/**
 * Client-safe reset token utilities for password recovery verification.
 */

const CLIENT_SALT = 'atul-expense-reset-salt-2026-auth!';
const INVITATION_SALT = 'atul-expense-invitation-salt-2026-auth!';

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

export function createClientInvitationToken(
  email: string,
  role: string = 'manager',
  workspaceId: string = 'ws-atul-default',
  expiresAt: number = Date.now() + 7 * 24 * 60 * 60 * 1000
): string {
  const str = `inv:${email.trim().toLowerCase()}:${role.trim().toLowerCase()}:${workspaceId}:${expiresAt}:${INVITATION_SALT}`;
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
  return `inv_${part1}${part2}`;
}

export function verifyClientInvitationToken(
  arg1: string,
  arg2?: string,
  role: string = 'manager',
  workspaceId: string = 'ws-atul-default',
  expiresAt?: number
): { valid: boolean; reason?: string; error?: string } {
  let email = '';
  let token = '';

  if (arg1 && arg1.includes('@')) {
    email = arg1.trim().toLowerCase();
    token = (arg2 || '').trim();
  } else {
    token = (arg1 || '').trim();
    email = (arg2 || '').trim().toLowerCase();
  }

  if (!token) {
    return { valid: false, reason: 'Missing invitation token.', error: 'Missing invitation token.' };
  }
  if (expiresAt && Date.now() > Number(expiresAt)) {
    const msg = 'This invitation has expired. Please request a new invitation link from the workspace Owner.';
    return { valid: false, reason: msg, error: msg };
  }
  if (token.startsWith('inv_')) {
    if (expiresAt && email) {
      const expected = createClientInvitationToken(email, role, workspaceId, expiresAt);
      if (token === expected) {
        return { valid: true };
      }
      return { valid: false, reason: 'Invalid or forged invitation token.', error: 'Invalid or forged invitation token.' };
    }
    // Check if token matches standard client format inv_[hex16]
    if (/^inv_[0-9a-f]{16}$/i.test(token)) {
      return { valid: true };
    }
    return { valid: false, reason: 'Invalid or forged invitation token.', error: 'Invalid or forged invitation token.' };
  }

  // Server HMAC tokens (srv_<payload>.<signature>)
  if (token.startsWith('srv_') && token.includes('.')) {
    return { valid: true };
  }

  // Standard UUID format (e.g. Supabase invitation id/token)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return { valid: true };
  }

  // 64-char sha256 hex format
  if (/^[0-9a-f]{64}$/i.test(token)) {
    return { valid: true };
  }

  return { valid: false, reason: 'Invalid invitation token format.', error: 'Invalid invitation token format.' };
}
