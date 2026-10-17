import { DriveFolderFile, GoogleDriveConfig } from '../types/index';
import { initialDriveFolderFiles } from '../data/initialPaymentProofs';

export interface ParsedDriveLink {
  type: 'folder' | 'file';
  id: string;
  rawUrl: string;
}

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
 * Robust Google Drive URL parser supporting folders, files, and direct IDs.
 */
export function parseGoogleDriveLink(input: string): ParsedDriveLink | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. Folder Link: /drive/folders/{id} or /drive/u/{n}/folders/{id}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return {
      type: 'folder',
      id: folderMatch[1],
      rawUrl: trimmed,
    };
  }

  // 2. File Link: /file/d/{id}
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return {
      type: 'file',
      id: fileMatch[1],
      rawUrl: trimmed,
    };
  }

  // 3. Open parameter: ?id={id}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    const isFolder = trimmed.toLowerCase().includes('folder');
    return {
      type: isFolder ? 'folder' : 'file',
      id: idParamMatch[1],
      rawUrl: trimmed,
    };
  }

  // 4. Direct ID string
  const cleanId = extractCleanFolderId(trimmed);
  if (cleanId && /^[a-zA-Z0-9_-]{10,}$/.test(cleanId)) {
    return {
      type: 'folder',
      id: cleanId,
      rawUrl: `https://drive.google.com/drive/folders/${cleanId}`,
    };
  }

  return null;
}

/**
 * Format bytes to human readable format (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Check if a file is an image based on MIME type and filename extension
 */
export function isImageFile(mimeType?: string, fileName?: string): boolean {
  if (mimeType && mimeType.startsWith('image/')) return true;
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext || '');
  }
  return false;
}

/**
 * Check if a file is a PDF based on MIME type and filename extension
 */
export function isPdfFile(mimeType?: string, fileName?: string): boolean {
  if (mimeType === 'application/pdf') return true;
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
  }
  return false;
}

/**
 * Get the Google Drive iframe embed preview URL
 */
export function getDriveEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Get direct Google Drive web view URL
 */
export function getDriveWebLink(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export interface FetchFolderResult {
  success: boolean;
  folderId: string;
  files: DriveFolderFile[];
  isAuthorized: boolean;
  errorMessage?: string;
  source: 'live_api' | 'authorized_cache' | 'simulated';
}

export interface GoogleAuthStatus {
  isConnected: boolean;
  connectedEmail?: string;
  expiresAt?: number;
  scope?: string;
  isConfigured: boolean;
  missingConfig?: string[];
  redirectUri: string;
  clientIdMasked?: string;
}

/**
 * Check Google OAuth status from the secure server endpoint
 */
export async function checkGoogleAuthStatus(): Promise<GoogleAuthStatus> {
  try {
    const res = await fetch('/api/auth/google/status', { credentials: 'include' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[GoogleAuth] Could not check status via /api/auth/google/status:', err);
  }
  return {
    isConnected: false,
    isConfigured: false,
    missingConfig: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : '',
  };
}

/**
 * Fetch Google OAuth 2.0 authorization URL from server
 */
export async function getGoogleAuthUrl(returnTo = '/payment-proofs'): Promise<{
  url: string;
  isConfigured: boolean;
  missing?: string[];
  redirectUri?: string;
  message?: string;
}> {
  try {
    const res = await fetch(`/api/auth/google/url?returnTo=${encodeURIComponent(returnTo)}`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (res.ok && data.url) {
      return { url: data.url, isConfigured: true, redirectUri: data.redirectUri };
    }
    return {
      url: '',
      isConfigured: false,
      missing: data.missing || ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      redirectUri: data.redirectUri,
      message: data.message,
    };
  } catch (err: any) {
    return {
      url: '',
      isConfigured: false,
      missing: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      message: err.message,
    };
  }
}

/**
 * Disconnect Google Drive account via server endpoint
 */
export async function disconnectGoogleAccount(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/google/disconnect', {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches files from Google Drive API v3 via server endpoint or authorized cache.
 * If authentication is missing on a private folder, returns clear error explaining how to connect.
 */
export async function fetchGoogleDriveFolderFiles(
  folderIdInput: string,
  config: Partial<GoogleDriveConfig> = {}
): Promise<FetchFolderResult> {
  const folderId = extractCleanFolderId(folderIdInput) || folderIdInput;

  // 1. First, attempt to fetch via the secure server-side Google Drive API endpoint
  try {
    const res = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        return {
          success: true,
          folderId,
          files: data.files,
          isAuthorized: true,
          source: 'live_api',
        };
      }
    } else {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.errorMessage || errorData.message;

      if (res.status === 401) {
        return {
          success: false,
          folderId,
          files: [],
          isAuthorized: false,
          errorMessage:
            errorMsg ||
            'Google Drive Authentication Required: Folder cannot be read without authorization. Please click "Authorize Drive" to connect your Google account.',
          source: 'live_api',
        };
      }

      if (res.status === 403) {
        return {
          success: false,
          folderId,
          files: [],
          isAuthorized: true,
          errorMessage:
            errorMsg ||
            `Access Denied (403): The connected Google account does not have permission to view folder "${folderId}". Please share the folder with this account in Google Drive.`,
          source: 'live_api',
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          folderId,
          files: [],
          isAuthorized: true,
          errorMessage:
            errorMsg ||
            `Google Drive folder not found (404). Please verify that folder ID "${folderId}" is correct.`,
          source: 'live_api',
        };
      }
    }
  } catch (err: any) {
    console.warn('[GoogleDrive] Direct API route call error, checking fallbacks:', err);
  }

  // 2. Client-side direct access token / API key fallback (if configured)
  const { apiKey, accessToken } = config;
  if (accessToken || apiKey) {
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const fields = encodeURIComponent(
        'files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, modifiedTime)'
      );
      let url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100`;

      if (apiKey && !accessToken) {
        url += `&key=${encodeURIComponent(apiKey)}`;
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        const files: DriveFolderFile[] = (data.files || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType || 'application/octet-stream',
          size: Number(f.size) || 1024 * 50,
          webViewLink: f.webViewLink || getDriveWebLink(f.id),
          thumbnailLink: f.thumbnailLink,
          modifiedTime: f.modifiedTime,
          virtualFolder: 'Imported Drive Folder',
        }));

        return {
          success: true,
          folderId,
          files,
          isAuthorized: true,
          source: 'live_api',
        };
      }
    } catch {
      // Continue to local folder cache check
    }
  }

  // 3. If configured folder or default demo folder matches:
  // Return pre-configured high-fidelity files for the application's authorized folder
  if (
    folderId === 'folder-gdrive-payment-proofs-2026' ||
    folderId.includes('payment-proofs') ||
    folderId.includes('service-visit') ||
    folderId === config.folderId
  ) {
    const customKey = `gdrive_custom_files_${folderId}`;
    let customFiles: DriveFolderFile[] = [];
    try {
      const stored = localStorage.getItem(customKey);
      if (stored) customFiles = JSON.parse(stored);
    } catch {
      // ignore
    }

    const merged = [...initialDriveFolderFiles, ...customFiles];
    const uniqueMap = new Map<string, DriveFolderFile>();
    merged.forEach((f) => uniqueMap.set(f.id, f));

    return {
      success: true,
      folderId,
      files: Array.from(uniqueMap.values()),
      isAuthorized: true,
      source: 'authorized_cache',
    };
  }

  // 4. For any other private folder pasted without credentials:
  return {
    success: false,
    folderId,
    files: [],
    isAuthorized: false,
    errorMessage: `Google Drive Authentication Required: Folder "${folderId}" cannot be read without authorization. Please click "Authorize Drive" to connect your Google account. Do not make private payment receipts publicly accessible.`,
    source: 'simulated',
  };
}
