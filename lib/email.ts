import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@watchdat.xyz',
    to: email,
    subject: 'Reset your Watch Dat password',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a;">
        <h2 style="color: #fff; margin-bottom: 8px;">Watch Dat</h2>
        <p style="color: #999; margin-bottom: 24px;">You requested a password reset. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetUrl}" style="display: inline-block; background: #22c55e; color: #fff; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
