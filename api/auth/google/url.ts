import type { IncomingMessage, ServerResponse } from 'http';
import { generateAuthUrl, getEnvConfig } from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'http://localhost:5173';

  const config = getEnvConfig(origin);

  if (!config.isConfigured) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'CONFIG_MISSING',
        message: `Missing Google Cloud OAuth credentials: ${config.missingConfig.join(', ')}. Please configure them in .env (local) or Vercel Environment Variables.`,
        missing: config.missingConfig,
        redirectUri: config.redirectUri,
      })
    );
    return;
  }

  try {
    const url = generateAuthUrl(origin);
    const query = new URL(req.url || '/', origin).searchParams;

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
