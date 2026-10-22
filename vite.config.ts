import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import urlHandler from './api/auth/google/url';
import callbackHandler from './api/auth/google/callback';
import statusHandler from './api/auth/google/status';
import disconnectHandler from './api/auth/google/disconnect';
import filesHandler from './api/drive/files';
import sendResetLinkHandler from './api/auth/send-reset-link';
import verifyResetTokenHandler from './api/auth/verify-reset-token';
import sendInviteHandler from './api/auth/send-invite';
import validateInviteHandler from './api/auth/validate-invite';
import acceptInviteHandler from './api/auth/accept-invite';

function googleDriveDevApiPlugin(): Plugin {
  return {
    name: 'google-drive-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const pathname = url.split('?')[0];

        try {
          if (pathname === '/api/auth/send-invite') {
            await sendInviteHandler(req, res);
            return;
          }
          if (pathname === '/api/auth/validate-invite') {
            await validateInviteHandler(req, res);
            return;
          }
          if (pathname === '/api/auth/accept-invite') {
            await acceptInviteHandler(req, res);
            return;
          }
          if (pathname === '/api/auth/send-reset-link') {
            await sendResetLinkHandler(req, res);
            return;
          }
          if (pathname === '/api/auth/verify-reset-token') {
            await verifyResetTokenHandler(req, res);
            return;
          }
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GOOGLE_CLIENT_ID) process.env.GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
  if (env.GOOGLE_CLIENT_SECRET) process.env.GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
  if (env.GOOGLE_REDIRECT_URI) process.env.GOOGLE_REDIRECT_URI = env.GOOGLE_REDIRECT_URI;
  if (env.GOOGLE_REDIRECT_URI_LOCAL) process.env.GOOGLE_REDIRECT_URI_LOCAL = env.GOOGLE_REDIRECT_URI_LOCAL;
  if (env.RESEND_API_KEY) process.env.RESEND_API_KEY = env.RESEND_API_KEY;
  if (env.GMAIL_USER) process.env.GMAIL_USER = env.GMAIL_USER;
  if (env.GMAIL_APP_PASSWORD) process.env.GMAIL_APP_PASSWORD = env.GMAIL_APP_PASSWORD;
  if (env.SMTP_USER) process.env.SMTP_USER = env.SMTP_USER;
  if (env.SMTP_PASS) process.env.SMTP_PASS = env.SMTP_PASS;
  if (env.RESET_SECRET) process.env.RESET_SECRET = env.RESET_SECRET;

  return {
    plugins: [react(), googleDriveDevApiPlugin()],
    server: {
      port: 5173,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});
