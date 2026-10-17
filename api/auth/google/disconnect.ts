import { disconnectGoogle } from '../../_lib/googleAuth';

export default async function handler(req: any, res: any) {
  try {
    const result = await disconnectGoogle();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'DISCONNECT_FAILED', message: err.message }));
  }
}
