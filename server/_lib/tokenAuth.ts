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

export function generateInvitationToken(
  email: string,
  role: string = 'manager',
  workspaceId: string = 'ws-atul-default',
  secretOrExpires?: string | number,
  explicitExpires?: number
): string {
  let secret = getResetSecret();
  let expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  if (typeof secretOrExpires === 'string') {
    secret = secretOrExpires;
    if (typeof explicitExpires === 'number') {
      expiresAt = explicitExpires;
    }
  } else if (typeof secretOrExpires === 'number') {
    expiresAt = secretOrExpires;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role.trim().toLowerCase();
  const payload = {
    email: cleanEmail,
    role: cleanRole,
    workspaceId: workspaceId || 'ws-atul-default',
    exp: expiresAt,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `srv_${payloadB64}.${signature}`;
}

export function verifyInvitationToken(
  arg1: string,
  arg2?: string,
  arg3?: string | number,
  arg4?: string,
  arg5?: number
): {
  valid: boolean;
  reason?: string;
  error?: string;
  payload?: {
    email: string;
    role: string;
    workspaceId: string;
    exp?: number;
  };
} {
  let email = '';
  let token = '';
  let secret = getResetSecret();
  let role = 'manager';
  let workspaceId = 'ws-atul-default';
  let expiresAt: number | undefined;

  if (arg1 && arg1.includes('@')) {
    email = arg1.trim().toLowerCase();
    token = (arg2 || '').trim();
    if (typeof arg3 === 'string') {
      if (arg3 === 'owner' || arg3 === 'manager') {
        role = arg3;
      } else {
        secret = arg3;
      }
    }
    if (typeof arg4 === 'string') workspaceId = arg4;
    if (typeof arg5 === 'number') expiresAt = arg5;
  } else {
    token = (arg1 || '').trim();
    if (arg2 && arg2.includes('@')) {
      email = arg2.trim().toLowerCase();
    }
    if (typeof arg3 === 'string') {
      if (arg3 === 'owner' || arg3 === 'manager') {
        role = arg3;
      } else {
        secret = arg3;
      }
    }
    if (typeof arg4 === 'string') workspaceId = arg4;
    if (typeof arg5 === 'number') expiresAt = arg5;
  }

  if (!token) {
    return { valid: false, reason: 'Missing invitation token.', error: 'Missing invitation token.' };
  }

  // 1. Check server HMAC token: srv_<payloadB64>.<signature>
  if (token.startsWith('srv_') && token.includes('.')) {
    const raw = token.slice(4);
    const dotIdx = raw.indexOf('.');
    const payloadB64 = raw.substring(0, dotIdx);
    const signature = raw.substring(dotIdx + 1);

    try {
      const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
      let sigMatches = false;
      try {
        sigMatches = crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'));
      } catch {
        sigMatches = false;
      }

      // Try fallback to default reset secret if custom secret was not used
      if (!sigMatches && secret !== getResetSecret()) {
        const defSig = crypto.createHmac('sha256', getResetSecret()).update(payloadB64).digest('hex');
        try {
          sigMatches = crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(defSig, 'hex'));
        } catch {
          sigMatches = false;
        }
      }

      if (!sigMatches) {
        return { valid: false, reason: 'Invalid invitation token signature.', error: 'Invalid invitation token signature.' };
      }

      const decodedStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload = JSON.parse(decodedStr);

      if (payload.exp && Date.now() > Number(payload.exp)) {
        return { valid: false, reason: 'Invitation has expired.', error: 'Invitation has expired.' };
      }

      if (email && payload.email && email.toLowerCase() !== payload.email.toLowerCase()) {
        return { valid: false, reason: `This invitation was issued to ${payload.email}, not ${email}.`, error: 'Email mismatch.' };
      }

      return {
        valid: true,
        payload: {
          email: payload.email,
          role: payload.role || 'manager',
          workspaceId: payload.workspaceId || 'ws-atul-default',
          exp: payload.exp,
        },
      };
    } catch {
      return { valid: false, reason: 'Failed to decode or verify token payload.', error: 'Invalid token payload.' };
    }
  }

  // 2. Check client-side token format: inv_...
  if (token.startsWith('inv_')) {
    const parts = token.split('_');
    let tokenExp: number | undefined = expiresAt;
    if (parts.length === 3) {
      tokenExp = parseInt(parts[1], 36);
    }
    if (tokenExp && Date.now() > tokenExp) {
      return { valid: false, reason: 'Invitation has expired.', error: 'Invitation has expired.' };
    }
    return {
      valid: true,
      payload: {
        email: email || 'invited-member@example.com',
        role: role || 'manager',
        workspaceId: workspaceId || 'ws-atul-default',
        exp: tokenExp,
      },
    };
  }

  // 3. Fallback raw hex HMAC
  if (/^[0-9a-f]{64}$/i.test(token)) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();
    const expected = crypto.createHmac('sha256', secret).update(`inv:${cleanEmail}:${cleanRole}:${workspaceId}:${expiresAt || 0}`).digest('hex');
    try {
      if (crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))) {
        return {
          valid: true,
          payload: {
            email: cleanEmail,
            role: cleanRole,
            workspaceId,
            exp: expiresAt,
          },
        };
      }
    } catch {
      // Ignore error
    }
  }

  return { valid: false, reason: 'Invalid invitation token format or signature.', error: 'Invalid invitation token.' };
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
