import { exchangeCodeForTokens } from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'http://localhost:5173';

  const query = new URL(req.url || '/', origin).searchParams;
  const code = query.get('code');
  const error = query.get('error');

  if (error) {
    const errorMsg = encodeURIComponent(`Google OAuth Error: ${error}`);
    res.statusCode = 302;
    res.setHeader('Location', `/payment-proofs?gdrive_auth=error&message=${errorMsg}`);
    res.end();
    return;
  }

  if (!code) {
    res.statusCode = 302;
    res.setHeader('Location', `/payment-proofs?gdrive_auth=error&message=${encodeURIComponent('No authorization code received from Google.')}`);
    res.end();
    return;
  }

  try {
    const result = await exchangeCodeForTokens(code, origin);
    const emailParam = encodeURIComponent(result.email || 'authorized-user');
    res.statusCode = 302;
    res.setHeader('Location', `/payment-proofs?gdrive_auth=success&account=${emailParam}`);
    res.end();
  } catch (err: any) {
    console.error('[GoogleCallback] Exchange failed:', err);
    const errorMsg = encodeURIComponent(err.message || 'Token exchange failed.');
    res.statusCode = 302;
    res.setHeader('Location', `/payment-proofs?gdrive_auth=error&message=${errorMsg}`);
    res.end();
  }
}
