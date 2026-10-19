import nodemailer from 'nodemailer';
import { generateResetToken, parseJsonBody } from '../_lib/tokenAuth';

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed.' }));
    return;
  }

  const origin = req.headers['x-forwarded-host']
    ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
    : req.headers.host
    ? `http://${req.headers.host}`
    : 'https://atul-expense-manager.vercel.app';

  try {
    const body = await parseJsonBody(req);
    const rawEmail = body.email || '';
    const cleanEmail = String(rawEmail).trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Please provide a valid account email address.' }));
      return;
    }

    // Generate signed HMAC token with 1 hour expiration
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const token = generateResetToken(cleanEmail, expiresAt);
    const resetUrl = `${origin}/?mode=resetPassword&email=${encodeURIComponent(cleanEmail)}&token=${token}&expires=${expiresAt}`;

    let emailDispatched = false;
    let dispatchError: string | null = null;
    let transportType: string | null = null;

    // 1. Check for Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const fromAddress = process.env.RESEND_FROM || 'Atul Expense Manager <onboarding@resend.dev>';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [cleanEmail],
            subject: 'Reset your Atul Expense Manager password',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
                <div style="margin-bottom: 24px;">
                  <span style="background-color: #2563eb; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px;">A</span>
                  <span style="margin-left: 10px; font-weight: 700; font-size: 16px; color: #ffffff;">Atul Expense Manager</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Password Reset Request</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
                  We received a request to reset the password for your account (<strong>${cleanEmail}</strong>). For your account security, passwords can only be changed by opening this verified link.
                </p>
                <div style="margin-bottom: 28px;">
                  <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 10px; display: inline-block;">
                    Set New Password
                  </a>
                </div>
                <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 16px;">
                  This link expires in 1 hour and can only be used once. If you did not request a password reset, you can safely ignore this email; your account remains fully secure.
                </p>
                <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
                <p style="font-size: 11px; color: #475569; word-break: break-all;">
                  Direct link: <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
                </p>
              </div>
            `,
          }),
        });

        if (response.ok) {
          emailDispatched = true;
          transportType = 'Resend API';
        } else {
          const errData = await response.json();
          dispatchError = errData.message || 'Resend API delivery error';
        }
      } catch (e: any) {
        dispatchError = e.message;
      }
    }

    // 2. Check for SMTP / Gmail App Password
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
          subject: 'Reset your Atul Expense Manager password',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
              <div style="margin-bottom: 24px;">
                <span style="background-color: #2563eb; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px;">A</span>
                <span style="margin-left: 10px; font-weight: 700; font-size: 16px; color: #ffffff;">Atul Expense Manager</span>
              </div>
              <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Password Reset Request</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
                We received a request to reset the password for your account (<strong>${cleanEmail}</strong>). For your account security, passwords can only be changed by opening this verified link.
              </p>
              <div style="margin-bottom: 28px;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 10px; display: inline-block;">
                  Set New Password
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 16px;">
                This link expires in 1 hour and can only be used once. If you did not request a password reset, you can safely ignore this email; your account remains fully secure.
              </p>
              <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
              <p style="font-size: 11px; color: #475569; word-break: break-all;">
                Direct link: <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
              </p>
            </div>
          `,
        });

        emailDispatched = true;
        transportType = 'Gmail/SMTP';
      } catch (e: any) {
        dispatchError = e.message;
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    if (emailDispatched) {
      res.end(
        JSON.stringify({
          success: true,
          dispatched: true,
          transportType,
          message: `Password reset link has been dispatched to ${cleanEmail}. Please check your inbox and spam folder.`,
        })
      );
    } else {
      res.end(
        JSON.stringify({
          success: true,
          dispatched: false,
          transportError: dispatchError,
          message:
            'A secure password reset link was created! To deliver emails directly to Gmail in production, configure GMAIL_APP_PASSWORD or RESEND_API_KEY in your Vercel project environment variables.',
          resetUrl,
        })
      );
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message || 'Internal server error' }));
  }
}
