import nodemailer from 'nodemailer';
import { generateInvitationToken, getResetSecret, parseJsonBody } from '../_lib/tokenAuth';

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed.' }));
    return;
  }

  // Derive canonical public application URL - never use localhost in production invitations
  const forwardedHost = req.headers['x-forwarded-host'];
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  let origin = 'https://atul-expense-manager.vercel.app';

  if (process.env.APP_ORIGIN && (!isProd || !process.env.APP_ORIGIN.includes('localhost'))) {
    origin = process.env.APP_ORIGIN.replace(/\/$/, '');
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL && (!isProd || !process.env.NEXT_PUBLIC_APP_URL.includes('localhost'))) {
    origin = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  } else if (forwardedHost && (!isProd || !forwardedHost.includes('localhost'))) {
    origin = `${forwardedProto}://${forwardedHost}`;
  } else if (req.headers.host && !isProd && req.headers.host.includes('localhost')) {
    origin = `http://${req.headers.host}`;
  }

  try {
    const body = await parseJsonBody(req);
    const rawEmail = body.email || '';
    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const cleanRole = String(body.role || 'manager').toLowerCase() === 'owner' ? 'owner' : 'manager';
    const workspaceId = String(body.workspaceId || 'ws-atul-2026').trim();
    const inviterName = String(body.inviterName || 'Atul').trim();
    const inviterEmail = String(body.inviterEmail || 'Atul.wendor@gmail.com').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Please provide a valid account email address.' }));
      return;
    }

    // Generate signed HMAC token with 7-day expiration
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = generateInvitationToken(cleanEmail, cleanRole, workspaceId, getResetSecret(), expiresAt);
    const inviteUrl = `${origin}/?mode=invite&email=${encodeURIComponent(cleanEmail)}&role=${cleanRole}&token=${encodeURIComponent(token)}&expires=${expiresAt}`;

    // Optional Supabase server-side admin invitation integration (service-role kept strictly on server)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceRole) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(supabaseUrl, supabaseServiceRole, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1. Record invitation in workspace_invitations table
        await adminClient.from('workspace_invitations').upsert(
          {
            workspace_id: workspaceId,
            email: cleanEmail,
            role: cleanRole,
            token,
            status: 'pending',
            expires_at: new Date(expiresAt).toISOString(),
          },
          { onConflict: 'token' }
        );

        // 2. Optionally trigger Supabase Auth invitation
        await adminClient.auth.admin.inviteUserByEmail(cleanEmail, {
          data: { role: cleanRole, workspace_id: workspaceId },
          redirectTo: `${origin}/?mode=invite&email=${encodeURIComponent(cleanEmail)}&role=${cleanRole}`,
        }).catch(() => {
          // Fall through - direct email will deliver the verified link regardless
        });
      } catch (sbErr) {
        console.warn('[Supabase Admin Invite Notice]:', sbErr);
      }
    }

    let emailDispatched = false;
    let dispatchError: string | null = null;
    let transportType: string | null = null;

    // Google Sheets–style HTML invitation template
    const emailSubject = `${inviterName} invited you to collaborate on Atul Expense Manager`;
    const roleDisplay = cleanRole === 'owner' ? 'Owner' : 'Manager / Auditor (Read-Only Audit Mode)';
    const roleDescription = cleanRole === 'owner'
      ? 'Full workspace administration, financial management, member invitations, and audit reporting.'
      : 'Review expenses, verify digital receipt uploads, inspect trip claims, and audit financial calculations. Financial totals and delete actions remain protected.';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Google Sans', Roboto, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
        <div style="max-width: 600px; margin: 32px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner (Google Docs/Sheets Style) -->
          <div style="background-color: #0f9d58; padding: 24px 32px; color: #ffffff;">
            <div style="display: flex; align-items: center;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 14px;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background-color: rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; text-align: center; line-height: 40px; font-size: 22px; font-weight: 800; color: #ffffff;">
                      📊
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.2px;">Atul Expense Manager</h1>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.85);">Enterprise Financial Tracking & Audit Collaboration</p>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Main Content -->
          <div style="padding: 32px;">
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0; margin-bottom: 20px;">
              <strong>${inviterName}</strong> (<span style="color: #64748b;">${inviterEmail}</span>) has invited you to collaborate on the <strong>Atul Expense Manager</strong> application.
            </p>

            <!-- Collaboration Card (Google Sheets Style) -->
            <div style="background-color: #f1f5f9; border-radius: 12px; border: 1px solid #cbd5e1; padding: 20px; margin-bottom: 28px;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="vertical-align: top; width: 44px; padding-right: 14px;">
                    <div style="width: 42px; height: 42px; border-radius: 8px; background-color: #0f9d58; text-align: center; line-height: 42px; font-size: 20px; color: #ffffff;">
                      📑
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                      Atul Enterprise Expense Account
                    </div>
                    <div style="margin-bottom: 8px;">
                      <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Assigned Role: ${roleDisplay}
                      </span>
                    </div>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #475569;">
                      ${roleDescription}
                    </p>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Big Prominent CTA Button (Mobile-Friendly) -->
            <div style="text-align: center; margin: 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; width: 100%; max-width: 320px;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #0f9d58; box-shadow: 0 4px 6px -1px rgba(15, 157, 88, 0.25);">
                    <a href="${inviteUrl}" target="_blank" style="display: block; width: 100%; padding: 16px 28px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; box-sizing: border-box; text-align: center; letter-spacing: 0.2px;">
                      Open Expense Manager
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #64748b; margin-top: 10px; margin-bottom: 0;">
                Click above to accept this invitation on your mobile or desktop device
              </p>
            </div>

            <!-- Simple Steps -->
            <div style="background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 24px;">
              <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                Getting Started:
              </div>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #475569;">
                <li><strong>New user?</strong> Click <em>Open Expense Manager</em> to set your password and access the workspace immediately.</li>
                <li><strong>Already registered?</strong> Sign in with your existing password to accept the invitation and link your account.</li>
                <li>Your invitation is reserved exclusively for <strong style="color: #0f172a;">${cleanEmail}</strong>.</li>
              </ul>
            </div>

            <!-- Expiry & Direct Link -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">
                This invitation link expires in 7 days. If you did not expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; word-break: break-all;">
                Button not working? Paste this URL into your browser: <br />
                <a href="${inviteUrl}" style="color: #0f9d58; text-decoration: underline;">${inviteUrl}</a>
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 11px; color: #64748b; text-align: center;">
            © 2026 Atul Enterprise Expense Manager • Multi-User Workspace with Secure Role-Based Access Control
          </div>

        </div>
      </body>
      </html>
    `;

    // 1. Dispatch via Resend API if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const fromAddress = process.env.RESEND_FROM || 'Atul Expense Manager <invitations@resend.dev>';
        console.log(`[Resend] Dispatching invitation email to: ${cleanEmail} from: ${fromAddress}`);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [cleanEmail],
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          console.log('[Resend] Invitation delivery id:', resData.id);
          emailDispatched = true;
          transportType = 'Resend API';
        } else {
          const errData = await response.json().catch(() => ({}));
          dispatchError = errData.message || `Resend HTTP error ${response.status}`;
          console.error('[Resend Error]:', response.status, dispatchError);
        }
      } catch (e: any) {
        dispatchError = e.message;
        console.error('[Resend Exception]:', e);
      }
    }

    // 2. Dispatch via SMTP / Gmail App Password if configured and not yet sent
    const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (!emailDispatched && smtpUser && smtpPass) {
      try {
        const isGmail = Boolean(process.env.GMAIL_USER) || smtpUser.includes('@gmail.com');
        const transporter = nodemailer.createTransport(
          isGmail
            ? {
                service: 'gmail',
                auth: { user: smtpUser, pass: smtpPass },
              }
            : {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: Number(process.env.SMTP_PORT) || 465,
                secure: true,
                auth: { user: smtpUser, pass: smtpPass },
              }
        );

        await transporter.sendMail({
          from: `"Atul Expense Manager" <${smtpUser}>`,
          to: cleanEmail,
          subject: emailSubject,
          html: emailHtml,
        });

        emailDispatched = true;
        transportType = 'Gmail/SMTP';
      } catch (e: any) {
        dispatchError = e.message;
        console.error('[SMTP Exception]:', e);
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    if (emailDispatched) {
      res.end(
        JSON.stringify({
          success: true,
          email: cleanEmail,
          role: cleanRole,
          dispatched: true,
          transportType,
          inviteUrl,
          token,
          message: `Google Sheets–style invitation has been dispatched to ${cleanEmail}. The recipient can click 'Open Expense Manager' to access the workspace.`,
        })
      );
    } else {
      res.end(
        JSON.stringify({
          success: true,
          email: cleanEmail,
          role: cleanRole,
          dispatched: false,
          transportError: dispatchError,
          inviteUrl,
          token,
          message: dispatchError
            ? `Invitation link generated! Email delivery note: ${dispatchError}`
            : `Invitation link generated successfully! You can share the link directly or configure GMAIL_APP_PASSWORD / RESEND_API_KEY in Vercel to send automatic emails.`,
        })
      );
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message || 'Internal server error processing invitation' }));
  }
}
