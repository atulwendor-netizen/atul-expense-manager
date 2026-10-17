import {
  getEnvConfig,
  getStoredTokens,
  parseCookies,
  decryptTokenPayload,
  StoredDriveTokens,
} from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  try {
    const origin = req.headers['x-forwarded-host']
      ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
      : req.headers.host
      ? `http://${req.headers.host}`
      : 'https://atul-expense-manager.vercel.app';

    const config = getEnvConfig(origin);

    // Check for encrypted session cookie first (stateless Vercel lambda support)
    let tokens: StoredDriveTokens | null = null;
    if (req.headers?.cookie && config.clientSecret) {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.gdrive_session) {
        tokens = decryptTokenPayload(cookies.gdrive_session, config.clientSecret);
      }
    }

    // Fallback to filesystem tokens
    if (!tokens || !tokens.access_token) {
      tokens = getStoredTokens();
    }

    const isConnected = Boolean(tokens && tokens.access_token);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        isConnected,
        connectedEmail: tokens?.connected_email,
        expiresAt: tokens?.expires_at,
        scope: tokens?.scope,
        isConfigured: config.isConfigured,
        missingConfig: config.missingConfig,
        redirectUri: config.redirectUri,
        clientIdMasked: config.clientId ? `${config.clientId.substring(0, 12)}...` : undefined,
      })
    );
  } catch (err: any) {
    console.error('[API status error]:', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        isConnected: false,
        isConfigured: false,
        missingConfig: ['SERVER_EXCEPTION'],
        redirectUri: 'https://atul-expense-manager.vercel.app/api/auth/google/callback',
        error: err.message,
      })
    );
  }
}
