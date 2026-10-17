import { getEnvConfig, getStoredTokens } from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'http://localhost:5173';

  const config = getEnvConfig(origin);
  const stored = getStoredTokens();

  const isConnected = Boolean(stored && stored.access_token);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      isConnected,
      connectedEmail: stored?.connected_email,
      expiresAt: stored?.expires_at,
      scope: stored?.scope,
      isConfigured: config.isConfigured,
      missingConfig: config.missingConfig,
      redirectUri: config.redirectUri,
      clientIdMasked: config.clientId ? `${config.clientId.substring(0, 12)}...` : undefined,
    })
  );
}
