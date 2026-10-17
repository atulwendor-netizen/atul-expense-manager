import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import urlHandler from './api/auth/google/url';
import callbackHandler from './api/auth/google/callback';
import statusHandler from './api/auth/google/status';
import disconnectHandler from './api/auth/google/disconnect';
import filesHandler from './api/drive/files';

function googleDriveDevApiPlugin(): Plugin {
  return {
    name: 'google-drive-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const pathname = url.split('?')[0];

        try {
          if (pathname === '/api/auth/google/url') {
            await urlHandler(req, res);
            return;
          }
          if (pathname === '/api/auth/google/callback') {
            await callbackHandler(req, res);
            return;
          }
          if (pathname === '/api/auth/google/status') {
            await statusHandler(req, res);
            return;
          }
          if (pathname === '/api/auth/google/disconnect') {
            await disconnectHandler(req, res);
            return;
          }
          if (pathname === '/api/drive/files') {
            await filesHandler(req, res);
            return;
          }
        } catch (err: any) {
          console.error('[Dev API Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'SERVER_ERROR', message: err.message }));
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), googleDriveDevApiPlugin()],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
