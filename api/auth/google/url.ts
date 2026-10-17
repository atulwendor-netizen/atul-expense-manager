import { generateAuthUrl, getEnvConfig, generateStateToken } from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  // Enforce Audit role cannot initiate OAuth mutations
  const userRole = req.headers['x-user-role'];
  if (userRole === 'manager') {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'FORBIDDEN', message: 'Audit role is read-only. Cannot modify Google Drive authorization.' }));
    return;
  }

  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'https://atul-expense-manager.vercel.app';

  const config = getEnvConfig(origin);

  if (!config.isConfigured) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'CONFIG_MISSING',
        message: `Missing Google Cloud OAuth credentials: ${config.missingConfig.join(', ')}. Please configure them in server environment variables.`,
        missing: config.missingConfig,
        redirectUri: config.redirectUri,
      })
    );
    return;
  }

  try {
    const query = new URL(req.url || '/', origin).searchParams;
    const returnTo = query.get('returnTo') || '/payment-proofs';

    // Generate cryptographically signed CSRF state parameter
    const { state } = generateStateToken(config.clientSecret, returnTo);
    const url = generateAuthUrl(origin, state);

    if (query.get('redirect') === 'true') {
      res.statusCode = 302;
      res.setHeader('Location', url);
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url, redirectUri: config.redirectUri, isConfigured: true }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'SERVER_ERROR', message: err.message }));
  }
}
