import { verifyResetToken, parseJsonBody } from '../_lib/tokenAuth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed.' }));
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const { email, token, expires } = body;

    const result = verifyResetToken(email, token, expires);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ valid: false, reason: err.message || 'Server error verifying token' }));
  }
}
