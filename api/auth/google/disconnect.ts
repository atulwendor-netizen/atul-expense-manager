import { disconnectGoogle } from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  // Enforce Audit role cannot disconnect or revoke credentials
  const userRole = req.headers['x-user-role'];
  if (userRole === 'manager') {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'FORBIDDEN', message: 'Audit role is read-only. Cannot disconnect Google Drive.' }));
    return;
  }

  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'https://atul-expense-manager.vercel.app';

  try {
    const { success, clearCookie } = await disconnectGoogle(origin, req);
    res.statusCode = 200;
    res.setHeader('Set-Cookie', clearCookie);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success, message: 'Google Drive disconnected and session purged.' }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'DISCONNECT_FAILED', message: err.message }));
  }
}
