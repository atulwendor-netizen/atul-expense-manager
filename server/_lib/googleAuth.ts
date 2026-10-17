import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredDriveTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope?: string;
  token_type?: string;
  connected_email?: string;
  updated_at: string;
}

export interface DriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  virtualFolder?: string;
}

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Storage paths: try .data first (local), fall back to /tmp (Vercel serverless)
const LOCAL_DATA_DIR = path.resolve(process.cwd(), '.data');
const TMP_DATA_DIR = '/tmp';
const TOKEN_FILE_NAME = 'google_drive_tokens.json';

/**
 * Cleanly extract Google Drive folder ID from full URL, query string, or direct ID.
 */
export function extractCleanFolderId(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  // 1. /folders/{id} format (handles trailing slashes and query strings)
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // 2. /file/d/{id} format
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // 3. ?id={id} or &id={id} query param
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // 4. Strip trailing query params or hash if raw ID with garbage
  const clean = trimmed.split(/[?#]/)[0].replace(/\/+$/, '');
  const lastPart = clean.split('/').pop() || '';
  if (/^[a-zA-Z0-9_-]{10,}$/.test(lastPart)) {
    return lastPart;
  }

  return trimmed;
}

/**
 * Helper to get environment variables safely and calculate the exact redirect URI
 */
export function getEnvConfig(reqOrigin?: string) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

  // Determine redirect URI:
  // 1. Explicit GOOGLE_REDIRECT_URI environment variable has top priority
  let redirectUri = (process.env.GOOGLE_REDIRECT_URI || '').trim();

  // 2. If not explicitly provided, calculate from request origin or production URL
  if (!redirectUri) {
    const origin = reqOrigin || process.env.APP_ORIGIN || 'https://atul-expense-manager.vercel.app';
    redirectUri = `${origin}/api/auth/google/callback`;
  }

  // 3. If testing locally on localhost/127.0.0.1, check for local override
  if (reqOrigin && (reqOrigin.includes('localhost') || reqOrigin.includes('127.0.0.1'))) {
    if (process.env.GOOGLE_REDIRECT_URI_LOCAL) {
      redirectUri = process.env.GOOGLE_REDIRECT_URI_LOCAL.trim();
    }
  }

  const missing: string[] = [];
  if (!clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: missing.length === 0,
    missingConfig: missing,
  };
}

/**
 * Cookie parsing helper
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      try {
        list[name] = decodeURIComponent(val);
      } catch {
        list[name] = val;
      }
    }
  });
  return list;
}

/**
 * Cookie serialization helper
 */
export function serializeCookie(
  name: string,
  val: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    path?: string;
    sameSite?: 'Lax' | 'Strict' | 'None';
  } = {}
): string {
  const opt = {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax' as const,
    secure: process.env.NODE_ENV === 'production',
    ...options,
  };
  let str = `${name}=${encodeURIComponent(val)}; Path=${opt.path}`;
  if (opt.maxAge !== undefined) {
    str += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.httpOnly) str += '; HttpOnly';
  if (opt.secure) str += '; Secure';
  if (opt.sameSite) str += `; SameSite=${opt.sameSite}`;
  return str;
}

/**
 * AES-256-GCM encryption for secure session cookie
 */
export function encryptTokenPayload(payload: StoredDriveTokens, clientSecret: string): string {
  const key = crypto.createHash('sha256').update(clientSecret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${Buffer.from(encrypted, 'base64').toString('base64url')}`;
}

/**
 * AES-256-GCM decryption for secure session cookie
 */
export function decryptTokenPayload(tokenStr?: string, clientSecret?: string): StoredDriveTokens | null {
  if (!tokenStr || !clientSecret) return null;
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, authTagB64, dataB64] = parts;
    const key = crypto.createHash('sha256').update(clientSecret).digest();
    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(authTagB64, 'base64url');
    const encrypted = Buffer.from(dataB64, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted) as StoredDriveTokens;
  } catch {
    return null;
  }
}

/**
 * Generate cryptographically signed state token with CSRF nonce and returnTo path
 */
export function generateStateToken(clientSecret: string, returnTo = '/payment-proofs') {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ nonce, returnTo: returnTo || '/payment-proofs', t: Date.now() });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', clientSecret).update(payloadB64).digest('base64url');
  return {
    state: `${payloadB64}.${sig}`,
    nonce,
  };
}

/**
 * Verify state parameter signature, timestamp expiry (15 mins), and CSRF protection
 */
export function verifyStateToken(state?: string | null, clientSecret?: string): {
  valid: boolean;
  returnTo: string;
  error?: string;
} {
  if (!state || typeof state !== 'string') {
    return { valid: false, returnTo: '/payment-proofs', error: 'Missing OAuth state parameter.' };
  }
  if (!clientSecret) {
    return { valid: false, returnTo: '/payment-proofs', error: 'Server missing GOOGLE_CLIENT_SECRET.' };
  }

  const parts = state.split('.');
  if (parts.length !== 2) {
    return { valid: false, returnTo: '/payment-proofs', error: 'Malformed OAuth state parameter.' };
  }

  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', clientSecret).update(payloadB64).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, returnTo: '/payment-proofs', error: 'CSRF token mismatch / invalid state signature.' };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    // State valid for 15 minutes (900 seconds)
    if (Date.now() - payload.t > 15 * 60 * 1000) {
      return { valid: false, returnTo: payload.returnTo || '/payment-proofs', error: 'OAuth state parameter has expired.' };
    }
    return { valid: true, returnTo: payload.returnTo || '/payment-proofs' };
  } catch {
    return { valid: false, returnTo: '/payment-proofs', error: 'Invalid state payload encoding.' };
  }
}

/**
 * Safely read tokens from server filesystem (local or /tmp)
 */
export function getStoredTokens(): StoredDriveTokens | null {
  const tryPaths = [
    path.join(LOCAL_DATA_DIR, TOKEN_FILE_NAME),
    path.join(TMP_DATA_DIR, TOKEN_FILE_NAME),
  ];

  for (const p of tryPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        if (raw.trim()) {
          return JSON.parse(raw) as StoredDriveTokens;
        }
      }
    } catch {
      // Continue to next path
    }
  }
  return null;
}

/**
 * Safely save tokens to filesystem, resilient to Vercel read-only cwd
 */
export function saveStoredTokens(tokens: StoredDriveTokens): void {
  // First attempt local data dir
  let saved = false;
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(path.join(LOCAL_DATA_DIR, TOKEN_FILE_NAME), JSON.stringify(tokens, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });
    saved = true;
  } catch {
    // Expected on Vercel where process.cwd() is read-only
  }

  // Fallback to /tmp which is always writable on AWS Lambda / Vercel
  if (!saved) {
    try {
      fs.writeFileSync(path.join(TMP_DATA_DIR, TOKEN_FILE_NAME), JSON.stringify(tokens, null, 2), {
        encoding: 'utf-8',
        mode: 0o600,
      });
    } catch (err) {
      console.warn('[GoogleAuth] Failed to write token file to /tmp:', err);
    }
  }
}

/**
 * Clear stored tokens from all filesystem locations
 */
export function clearStoredTokens(): void {
  const paths = [
    path.join(LOCAL_DATA_DIR, TOKEN_FILE_NAME),
    path.join(TMP_DATA_DIR, TOKEN_FILE_NAME),
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {
      // Ignore unlink errors
    }
  }
}

/**
 * Generate Google OAuth 2.0 Authorization URL with CSRF protection and exact redirect URI
 */
export function generateAuthUrl(origin: string, state: string) {
  const config = getEnvConfig(origin);
  if (!config.clientId) {
    throw new Error(
      'Missing GOOGLE_CLIENT_ID. Please configure it in your environment or Vercel Environment Variables.'
    );
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline', // Mandatory to receive refresh_token
    prompt: 'consent',     // Guarantees refresh_token on re-authorization
    include_granted_scopes: 'true',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange OAuth authorization code for Access & Refresh tokens
 */
export async function exchangeCodeForTokens(code: string, origin: string) {
  const config = getEnvConfig(origin);
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      `Missing Google Cloud credentials: ${config.missingConfig.join(', ')}. Set them in server environment.`
    );
  }

  const bodyParams = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorDesc = data.error_description || data.error || 'Failed to exchange authorization code.';
    throw new Error(`Google OAuth Token Exchange Failed: ${errorDesc}`);
  }

  const expiresInSec = Number(data.expires_in) || 3600;
  const expiresAt = Date.now() + expiresInSec * 1000;

  // Retrieve authorized user email from Google UserInfo endpoint
  let connectedEmail = 'authorized-user@gmail.com';
  try {
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (userinfoRes.ok) {
      const userInfo = await userinfoRes.json();
      if (userInfo.email) {
        connectedEmail = userInfo.email;
      }
    }
  } catch (err) {
    console.warn('[GoogleAuth] Failed to fetch userinfo email:', err);
  }

  const storedTokens: StoredDriveTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    scope: data.scope,
    token_type: data.token_type || 'Bearer',
    connected_email: connectedEmail,
    updated_at: new Date().toISOString(),
  };

  saveStoredTokens(storedTokens);

  return {
    success: true,
    email: connectedEmail,
    expiresAt,
    tokens: storedTokens,
  };
}

/**
 * Retrieve a valid Access Token, checking encrypted cookie first, then filesystem,
 * automatically refreshing using refresh_token if expired.
 */
export async function getValidAccessToken(
  origin?: string,
  req?: any
): Promise<{
  accessToken: string;
  email?: string;
  updatedCookie?: string;
}> {
  const config = getEnvConfig(origin);
  let stored: StoredDriveTokens | null = null;

  // 1. Try decrypting from request cookie (stateless cross-lambda support on Vercel)
  if (req?.headers?.cookie && config.clientSecret) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.gdrive_session) {
      stored = decryptTokenPayload(cookies.gdrive_session, config.clientSecret);
    }
  }

  // 2. Fall back to filesystem storage
  if (!stored || !stored.access_token) {
    stored = getStoredTokens();
  }

  if (!stored || !stored.access_token) {
    throw new Error('NO_TOKEN: Google Drive is not connected. Please authorize Google Drive first.');
  }

  // 3. If token is still valid (with 60-second cushion), return it
  if (Date.now() < stored.expires_at - 60000) {
    return {
      accessToken: stored.access_token,
      email: stored.connected_email,
    };
  }

  // 4. Token is expired or about to expire; refresh using refresh_token
  if (!stored.refresh_token) {
    clearStoredTokens();
    throw new Error(
      'EXPIRED_NO_REFRESH: Google Drive session expired. Please click "Authorize Drive" to reconnect.'
    );
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      `Cannot refresh Google Drive token: Missing ${config.missingConfig.join(', ')} in server environment.`
    );
  }

  const bodyParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: stored.refresh_token,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.error === 'invalid_grant') {
      clearStoredTokens();
      throw new Error(
        'REVOKED: Google Drive authorization was revoked or expired. Please authorize Google Drive again.'
      );
    }
    throw new Error(`Token Refresh Failed: ${data.error_description || data.error}`);
  }

  const expiresInSec = Number(data.expires_in) || 3600;
  const updatedTokens: StoredDriveTokens = {
    ...stored,
    access_token: data.access_token,
    refresh_token: data.refresh_token || stored.refresh_token,
    expires_at: Date.now() + expiresInSec * 1000,
    updated_at: new Date().toISOString(),
  };

  saveStoredTokens(updatedTokens);

  // Generate updated encrypted session cookie for response header
  let updatedCookie: string | undefined;
  if (config.clientSecret) {
    const isHttps = origin ? origin.startsWith('https') : process.env.NODE_ENV === 'production';
    updatedCookie = serializeCookie(
      'gdrive_session',
      encryptTokenPayload(updatedTokens, config.clientSecret),
      {
        maxAge: 30 * 24 * 3600,
        secure: isHttps,
      }
    );
  }

  return {
    accessToken: updatedTokens.access_token,
    email: updatedTokens.connected_email,
    updatedCookie,
  };
}

/**
 * Disconnect and revoke Google authorization
 */
export async function disconnectGoogle(
  origin?: string,
  req?: any
): Promise<{ success: boolean; clearCookie: string }> {
  const config = getEnvConfig(origin);
  let stored: StoredDriveTokens | null = null;

  if (req?.headers?.cookie && config.clientSecret) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.gdrive_session) {
      stored = decryptTokenPayload(cookies.gdrive_session, config.clientSecret);
    }
  }

  if (!stored) {
    stored = getStoredTokens();
  }

  if (stored?.access_token) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(stored.access_token)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    } catch {
      // Ignore network errors on revocation
    }
  }

  clearStoredTokens();

  const clearCookie = serializeCookie('gdrive_session', '', { maxAge: 0 });
  return { success: true, clearCookie };
}

/**
 * Fetch files from a Google Drive folder using the authenticated token
 */
export async function listFolderFiles(
  folderIdInput: string,
  origin?: string,
  req?: any
): Promise<{
  success: boolean;
  folderId: string;
  files: DriveApiFile[];
  connectedEmail?: string;
  errorMessage?: string;
  updatedCookie?: string;
}> {
  const cleanFolderId = extractCleanFolderId(folderIdInput);
  if (!cleanFolderId) {
    return {
      success: false,
      folderId: '',
      files: [],
      errorMessage: 'Invalid Google Drive folder ID format.',
    };
  }

  const { accessToken, email, updatedCookie } = await getValidAccessToken(origin, req);

  const query = encodeURIComponent(`'${cleanFolderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(
    'files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime)'
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (response.ok) {
    const data = await response.json();
    const files: DriveApiFile[] = (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType || 'application/octet-stream',
      size: Number(f.size) || 0,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      thumbnailLink: f.thumbnailLink,
      modifiedTime: f.modifiedTime,
      virtualFolder: 'Imported Drive Folder',
    }));

    return {
      success: true,
      folderId: cleanFolderId,
      files,
      connectedEmail: email,
      updatedCookie,
    };
  }

  // Handle errors from Google Drive API
  const errorData = await response.json().catch(() => ({}));
  const googleMsg = errorData.error?.message || response.statusText;

  if (response.status === 404) {
    return {
      success: false,
      folderId: cleanFolderId,
      files: [],
      connectedEmail: email,
      updatedCookie,
      errorMessage: `Folder not found (404) or connected account "${email}" lacks access. Please verify folder ID and share Viewer access with ${email}.`,
    };
  }

  if (response.status === 403) {
    return {
      success: false,
      folderId: cleanFolderId,
      files: [],
      connectedEmail: email,
      updatedCookie,
      errorMessage: `Access Denied (403): Connected account "${email}" does not have permission to view folder "${cleanFolderId}". Please share the folder with ${email} in Google Drive.`,
    };
  }

  if (response.status === 401) {
    return {
      success: false,
      folderId: cleanFolderId,
      files: [],
      connectedEmail: email,
      updatedCookie,
      errorMessage: `Google Drive authorization is invalid or expired (401). Please click "Authorize Drive" to re-authenticate.`,
    };
  }

  return {
    success: false,
    folderId: cleanFolderId,
    files: [],
    connectedEmail: email,
    updatedCookie,
    errorMessage: `Google Drive API error (${response.status}): ${googleMsg}`,
  };
}
