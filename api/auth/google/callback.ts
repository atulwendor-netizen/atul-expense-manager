import {
  exchangeCodeForTokens,
  getEnvConfig,
  verifyStateToken,
  encryptTokenPayload,
  serializeCookie,
} from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'https://atul-expense-manager.vercel.app';

  const config = getEnvConfig(origin);
  const query = new URL(req.url || '/', origin).searchParams;
  const code = query.get('code');
  const state = query.get('state');
  const error = query.get('error');

  // 1. Handle error or user cancellation from Google
  if (error) {
    const errorMsg =
      error === 'access_denied'
        ? 'Google Drive authorization was denied or cancelled by the user.'
        : `Google OAuth Error: ${error}`;
    res.statusCode = 302;
    res.setHeader('Location', `/payment-proofs?gdrive_auth=error&message=${encodeURIComponent(errorMsg)}`);
    res.end();
    return;
  }

  // 2. Validate CSRF state token
  const stateCheck = verifyStateToken(state, config.clientSecret);
  if (!stateCheck.valid) {
    const errorMsg = stateCheck.error || 'CSRF State validation failed.';
    res.statusCode = 302;
    res.setHeader('Location', `${stateCheck.returnTo}?gdrive_auth=error&message=${encodeURIComponent(errorMsg)}`);
    res.end();
    return;
  }

  const returnPath = stateCheck.returnTo || '/payment-proofs';

  // 3. Verify authorization code is present
  if (!code) {
    res.statusCode = 302;
    res.setHeader('Location', `${returnPath}?gdrive_auth=error&message=${encodeURIComponent('No authorization code received from Google.')}`);
    res.end();
    return;
  }

  // 4. Exchange authorization code for tokens securely on the server
  try {
    const result = await exchangeCodeForTokens(code, origin);
    const emailParam = encodeURIComponent(result.email || 'authorized-user');

    // 5. Encrypt tokens into secure HttpOnly cookie for stateless Vercel lambdas
    const isHttps = origin.startsWith('https') || process.env.NODE_ENV === 'production';
    const cookieStr = serializeCookie(
      'gdrive_session',
      encryptTokenPayload(result.tokens, config.clientSecret),
      {
        maxAge: 30 * 24 * 3600, // 30 days
        secure: isHttps,
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
      }
    );

    res.statusCode = 302;
    res.setHeader('Set-Cookie', cookieStr);
    res.setHeader('Location', `${returnPath}?gdrive_auth=success&account=${emailParam}`);
    res.end();
  } catch (err: any) {
    console.error('[GoogleCallback] Token exchange failed:', err);
    const errorMsg = encodeURIComponent(err.message || 'Token exchange failed.');
    res.statusCode = 302;
    res.setHeader('Location', `${returnPath}?gdrive_auth=error&message=${errorMsg}`);
    res.end();
  }
}
