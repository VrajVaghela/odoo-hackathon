import nodemailer from 'nodemailer';

/**
 * Creates a reusable nodemailer transporter from environment variables.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Sends a styled invitation email with a confirmation link.
 */
export async function sendInvitationEmail(
  toEmail: string,
  confirmUrl: string,
  roleName: string
): Promise<void> {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 8px 0;">🚛 TransitOps</h1>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Fleet Management Platform</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">You've been invited!</h2>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 8px 0;">
        An administrator has invited you to join <strong>TransitOps</strong> as a <strong style="color: #2563eb;">${roleName}</strong>.
      </p>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
        Click the button below to activate your account. This link expires in <strong>72 hours</strong>.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${confirmUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px;">
          Confirm &amp; Activate Account
        </a>
      </div>
      <p style="font-size: 12px; color: #9ca3af; line-height: 1.5; margin: 0;">
        If you did not expect this invitation, you can safely ignore this email. If you have questions, contact your administrator.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"TransitOps" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `You're invited to TransitOps as ${roleName}`,
    html,
  });
}
