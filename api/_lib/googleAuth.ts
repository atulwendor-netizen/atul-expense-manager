import fs from 'fs';
import path from 'path';

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

// Storage path for tokens in secure directory
const DATA_DIR = path.resolve(process.cwd(), '.data');
const TOKEN_FILE_PATH = path.join(DATA_DIR, 'google_drive_tokens.json');

/**
 * Helper to get environment variables safely
 */
export function getEnvConfig(reqOrigin?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const origin = reqOrigin || process.env.APP_ORIGIN || 'http://localhost:5173';
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

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
 * Securely load stored tokens from server filesystem
 */
export function getStoredTokens(): StoredDriveTokens | null {
  try {
    if (!fs.existsSync(TOKEN_FILE_PATH)) {
      return null;
    }
    const raw = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
    if (!raw.trim()) return null;
    return JSON.parse(raw) as StoredDriveTokens;
  } catch (err) {
    console.warn('[GoogleAuth] Failed to read stored tokens:', err);
    return null;
  }
}

/**
 * Securely save tokens to server filesystem
 */
export function saveStoredTokens(tokens: StoredDriveTokens): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });
  } catch (err) {
    console.error('[GoogleAuth] Failed to save stored tokens:', err);
  }
}

/**
 * Clear stored tokens from server filesystem
 */
export function clearStoredTokens(): void {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      fs.unlinkSync(TOKEN_FILE_PATH);
    }
  } catch (err) {
    console.warn('[GoogleAuth] Failed to delete token file:', err);
  }
}

/**
 * Generate Google OAuth 2.0 Authorization URL
 */
export function generateAuthUrl(origin: string, state = 'gdrive_auth') {
  const config = getEnvConfig(origin);
  if (!config.clientId) {
    throw new Error(
      'Missing GOOGLE_CLIENT_ID. Please configure it in your environment or .env file.'
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
      `Missing Google Cloud credentials: ${config.missingConfig.join(', ')}. Set them in .env`
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
  };
}

/**
 * Retrieve a valid Access Token, automatically refreshing if expired
 */
export async function getValidAccessToken(origin?: string): Promise<{
  accessToken: string;
  email?: string;
}> {
  const stored = getStoredTokens();
  if (!stored || !stored.access_token) {
    throw new Error('NO_TOKEN: Google Drive is not connected. Please authorize Google Drive first.');
  }

  // If token is still valid (with 60-second safety cushion), return it
  if (Date.now() < stored.expires_at - 60000) {
    return {
      accessToken: stored.access_token,
      email: stored.connected_email,
    };
  }

  // Token is expired or about to expire; refresh using refresh_token
  if (!stored.refresh_token) {
    clearStoredTokens();
    throw new Error(
      'EXPIRED_NO_REFRESH: Google Drive session expired. Please reconnect Google Drive to grant offline access.'
    );
  }

  const config = getEnvConfig(origin);
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

  return {
    accessToken: updatedTokens.access_token,
    email: updatedTokens.connected_email,
  };
}

/**
 * Disconnect and revoke Google authorization
 */
export async function disconnectGoogle(): Promise<{ success: boolean }> {
  const stored = getStoredTokens();
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
  return { success: true };
}

/**
 * Fetch files from a Google Drive folder using the authenticated token
 */
export async function listFolderFiles(
  folderId: string,
  origin?: string
): Promise<{
  success: boolean;
  folderId: string;
  files: DriveApiFile[];
  connectedEmail?: string;
  errorMessage?: string;
}> {
  const { accessToken, email } = await getValidAccessToken(origin);

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
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
      folderId,
      files,
      connectedEmail: email,
    };
  }

  // Handle errors from Google Drive API
  const errorData = await response.json().catch(() => ({}));
  const googleMsg = errorData.error?.message || response.statusText;

  if (response.status === 404) {
    return {
      success: false,
      folderId,
      files: [],
      connectedEmail: email,
      errorMessage: `Folder not found (404) or connected account "${email}" lacks access. Please verify folder ID and share Viewer access with ${email}.`,
    };
  }

  if (response.status === 403) {
    return {
      success: false,
      folderId,
      files: [],
      connectedEmail: email,
      errorMessage: `Access Denied (403): Connected account "${email}" does not have permission to view folder "${folderId}". Please share the folder with ${email} in Google Drive.`,
    };
  }

  if (response.status === 401) {
    return {
      success: false,
      folderId,
      files: [],
      connectedEmail: email,
      errorMessage: `Google Drive authorization is invalid or expired (401). Please click "Authorize Drive" to re-authenticate.`,
    };
  }

  return {
    success: false,
    folderId,
    files: [],
    connectedEmail: email,
    errorMessage: `Google Drive API error (${response.status}): ${googleMsg}`,
  };
}
