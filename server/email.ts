import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getUncachableResendClient() {
  const { apiKey } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

const FROM_EMAIL = 'noreply@drgladysz.com';
const APP_NAME = 'ReconLog';

function getAppDomain(): string {
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0].trim()}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return 'https://drgladysz.com';
}

export async function sendPasswordResetEmail(
  email: string, 
  token: string, 
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client } = await getUncachableResendClient();
    const resetUrl = `${getAppDomain()}/reset-password?token=${token}`;
    
    const greeting = userName ? `Hi ${userName}` : 'Hi';
    
    const { data, error } = await client.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Reset Your Password - ReconLog',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
          <div style="max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #007AFF 0%, #0056D2 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                ${greeting},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #007AFF; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent by ${APP_NAME}<br>
                Privacy-first surgical logbook
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${greeting},

We received a request to reset your password for ${APP_NAME}.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

- The ${APP_NAME} Team`
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Password reset email sent successfully:', data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client } = await getUncachableResendClient();
    
    const { data, error } = await client.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Welcome to ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
          <div style="max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #007AFF 0%, #0056D2 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hi ${userName},
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Welcome to ${APP_NAME}! Your account has been created successfully.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                ${APP_NAME} is your privacy-first surgical logbook designed for microsurgery and reconstruction procedures. All your patient data stays on your device.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                If you have any questions, feel free to reach out to us.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent by ${APP_NAME}<br>
                Privacy-first surgical logbook
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},

Welcome to ${APP_NAME}! Your account has been created successfully.

${APP_NAME} is your privacy-first surgical logbook designed for microsurgery and reconstruction procedures. All your patient data stays on your device.

If you have any questions, feel free to reach out to us.

- The ${APP_NAME} Team`
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent successfully:', data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}
