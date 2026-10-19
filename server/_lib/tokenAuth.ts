import crypto from 'crypto';

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

export function getResetSecret(): string {
  return (
    process.env.RESET_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'atul-expense-manager-secure-reset-secret-2026'
  );
}

export function generateResetToken(email: string, expiresAt: number): string {
  const secret = getResetSecret();
  const cleanEmail = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', secret)
    .update(`${cleanEmail}:${expiresAt}`)
    .digest('hex');
}

export function verifyResetToken(email: string, token: string, expiresAt: number): { valid: boolean; reason?: string } {
  if (!email || !token || !expiresAt) {
    return { valid: false, reason: 'Missing token parameters.' };
  }
  if (Date.now() > Number(expiresAt)) {
    return { valid: false, reason: 'Password reset link has expired. Please request a new reset link.' };
  }

  // Check client format
  if (token.startsWith('rst_')) {
    const clientExpected = createClientResetToken(email, expiresAt);
    if (token === clientExpected) {
      return { valid: true };
    }
    return { valid: false, reason: 'Invalid or forged reset token.' };
  }

  // Check server HMAC format
  const expected = generateResetToken(email, expiresAt);
  try {
    const isValid = crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
    if (!isValid) {
      return { valid: false, reason: 'Invalid or tampered reset token signature.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Token verification failed.' };
  }
}

export async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}
