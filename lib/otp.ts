import crypto from 'crypto'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export function generateOTP(): string {
  return String(crypto.randomInt(100000, 999999))
}

export function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function sendEmailOTP(email: string, code: string): Promise<void> {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: email,
    subject: 'Your Watch Dat verification code',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fff; margin-bottom: 8px;">Watch Dat</h2>
        <p style="color: #999; margin-bottom: 24px;">Enter this code to sign in:</p>
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #fff;">${code}</span>
        </div>
        <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  })
}
