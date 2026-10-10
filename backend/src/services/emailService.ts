import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env';

let activeTransporter: Transporter | null = null;
let etherealInitAttempted = false;

// If real SMTP is configured in .env, use it
if (ENV.SMTP.HOST && ENV.SMTP.USER && ENV.SMTP.PASS) {
  activeTransporter = nodemailer.createTransport({
    host: ENV.SMTP.HOST,
    port: ENV.SMTP.PORT,
    secure: ENV.SMTP.PORT === 465,
    auth: {
      user: ENV.SMTP.USER,
      pass: ENV.SMTP.PASS,
    },
  });
  console.log(`[EmailService] Configured with production SMTP host: ${ENV.SMTP.HOST}`);
}

async function getTransporter(): Promise<Transporter | null> {
  if (activeTransporter) return activeTransporter;

  // In development, if no SMTP is provided, spin up an Ethereal test account automatically
  if (!etherealInitAttempted && !ENV.IS_PRODUCTION) {
    etherealInitAttempted = true;
    try {
      const testAccount = await nodemailer.createTestAccount();
      activeTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Generated live Ethereal test email account: ${testAccount.user}`);
    } catch (e) {
      console.warn('[EmailService] Could not initialize Ethereal account, using console logging.');
    }
  }

  return activeTransporter;
}

function getSafeRouteEmailHtml(title: string, message: string, code: string): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f8fc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e4eaf2; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #087f8c; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">SafeRoute</h1>
          <p style="color: #b9e4e8; margin: 6px 0 0; font-size: 13px; letter-spacing: 1px;">SMARTER JOURNEYS. SAFER CHOICES.</p>
        </div>
        <div style="padding: 32px 28px; color: #15243a;">
          <h2 style="margin-top: 0; color: #087f8c; font-size: 20px;">${title}</h2>
          <p style="color: #556987; line-height: 1.6; font-size: 15px;">${message}</p>
          <div style="background-color: #f0f7f8; border: 1px dashed #087f8c; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #087f8c; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #7d8ea5; font-size: 13px; line-height: 1.5;">This verification code is valid for <strong>10 minutes</strong>. Never share this code with anyone. SafeRoute staff will never ask for your verification code.</p>
        </div>
        <div style="background-color: #fafbfc; border-top: 1px solid #e4eaf2; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
          &copy; ${new Date().getFullYear()} SafeRoute. All rights reserved.
        </div>
      </div>
    </body>
  </html>
  `;
}

export interface SendEmailResult {
  success: boolean;
  previewUrl?: string;
  otp: string;
}

export async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
): Promise<SendEmailResult> {
  const isReset = purpose === 'PASSWORD_RESET';
  const title = isReset ? 'Reset Your SafeRoute Password' : 'Verify Your SafeRoute Account';
  const message = isReset
    ? 'We received a request to reset your SafeRoute password. Use the verification code below to authorize the password reset:'
    : 'Welcome to SafeRoute! Please use the 6-digit verification code below to confirm your email and complete your registration:';

  console.log('=========================================================');
  console.log(`[SafeRoute Verification Dispatch]`);
  console.log(`To: ${email}`);
  console.log(`Purpose: ${purpose}`);
  console.log(`Code: >>> ${otp} <<<`);
  console.log('=========================================================');

  let previewUrl: string | undefined;

  try {
    const transporter = await getTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: ENV.SMTP.FROM,
        to: email,
        subject: title,
        html: getSafeRouteEmailHtml(title, message, otp),
      });

      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        previewUrl = testUrl.toString();
        console.log(`[EmailService] Live Web Email Inbox Preview: ${previewUrl}`);
      } else {
        console.log(`[EmailService] Real email successfully delivered to ${email}`);
      }
    }
  } catch (error) {
    console.error('[EmailService] SMTP send error:', error);
  }

  return {
    success: true,
    previewUrl,
    otp,
  };
}
