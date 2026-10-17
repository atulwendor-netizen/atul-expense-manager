import { listFolderFiles, extractCleanFolderId } from '../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'https://atul-expense-manager.vercel.app';

  const query = new URL(req.url || '/', origin).searchParams;
  const rawFolderId = query.get('folderId');

  if (!rawFolderId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'MISSING_PARAM', message: 'Missing "folderId" query parameter.' }));
    return;
  }

  // Support full folder URLs by extracting clean folder ID
  const cleanFolderId = extractCleanFolderId(rawFolderId);

  try {
    const result = await listFolderFiles(cleanFolderId, origin, req);

    if (result.updatedCookie) {
      res.setHeader('Set-Cookie', result.updatedCookie);
    }

    if (result.success) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } else {
      // Determine HTTP status based on error type
      const is403 = result.errorMessage?.includes('403') || result.errorMessage?.includes('Access Denied');
      const is404 = result.errorMessage?.includes('404') || result.errorMessage?.includes('not found');
      const is401 = result.errorMessage?.includes('401') || result.errorMessage?.includes('invalid') || result.errorMessage?.includes('NO_TOKEN');

      res.statusCode = is401 ? 401 : is403 ? 403 : is404 ? 404 : 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    }
  } catch (err: any) {
    const msg = err.message || 'Server error while accessing Google Drive.';
    const isUnauth = msg.includes('NO_TOKEN') || msg.includes('EXPIRED') || msg.includes('REVOKED');

    res.statusCode = isUnauth ? 401 : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        folderId: cleanFolderId,
        files: [],
        errorMessage: msg,
      })
    );
  }
}
