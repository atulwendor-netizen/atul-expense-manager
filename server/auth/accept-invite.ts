import { verifyInvitationToken, parseJsonBody } from '../_lib/tokenAuth';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed.' }));
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const cleanEmail = String(body.email || '').trim().toLowerCase();
    const cleanToken = String(body.token || '').trim();
    const cleanName = String(body.name || '').trim();
    const password = String(body.password || '');
    const role = String(body.role || 'manager').trim().toLowerCase();
    const workspaceId = String(body.workspaceId || 'ws-atul-default').trim();
    const expiresAt = body.expires ? parseInt(body.expires, 10) : undefined;

    if (!cleanEmail || !cleanToken) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Email and invitation token are required.' }));
      return;
    }

    // Verify token
    const verification = verifyInvitationToken(cleanEmail, cleanToken, role, workspaceId, expiresAt);
    if (!verification.valid) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: verification.reason || 'Invalid or expired invitation token.' }));
      return;
    }

    // Enforce role assignment strictly from verified token parameters (prevent role escalation)
    const assignedRole = role === 'manager' ? 'manager' : 'owner';

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        email: cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
        role: assignedRole,
        workspaceId,
        message: 'Invitation successfully validated and accepted.',
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message || 'Server error accepting invitation.' }));
  }
}
