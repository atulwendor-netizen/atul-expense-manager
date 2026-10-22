import { verifyInvitationToken, parseJsonBody } from '../_lib/tokenAuth';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only GET or POST allowed.' }));
    return;
  }

  try {
    let email = '';
    let token = '';
    let role = 'manager';
    let workspaceId = 'ws-atul-default';
    let expiresAt: number | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      email = url.searchParams.get('email') || '';
      token = url.searchParams.get('token') || '';
      role = url.searchParams.get('role') || 'manager';
      workspaceId = url.searchParams.get('workspaceId') || 'ws-atul-default';
      const exp = url.searchParams.get('expires');
      if (exp) expiresAt = parseInt(exp, 10);
    } else {
      const body = await parseJsonBody(req);
      email = body.email || '';
      token = body.token || '';
      role = body.role || 'manager';
      workspaceId = body.workspaceId || 'ws-atul-default';
      if (body.expires) expiresAt = parseInt(body.expires, 10);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanToken = String(token).trim();

    if (!cleanEmail || !cleanToken) {
      res.statusCode = 400;
      res.end(JSON.stringify({ valid: false, reason: 'Email and invitation token are required.' }));
      return;
    }

    const verification = verifyInvitationToken(cleanEmail, cleanToken, role, workspaceId, expiresAt);
    if (!verification.valid) {
      res.statusCode = 400;
      res.end(JSON.stringify({ valid: false, reason: verification.reason || 'Invalid or expired invitation token.' }));
      return;
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        valid: true,
        email: cleanEmail,
        role,
        workspaceId,
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ valid: false, reason: err.message || 'Server error during invitation validation.' }));
  }
}
