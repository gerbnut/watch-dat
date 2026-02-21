/**
 * Web Push notification helper.
 *
 * Requires three env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — exposed to the browser for subscription
 *   VAPID_PRIVATE_KEY             — server-side only
 *   VAPID_SUBJECT                 — "mailto:you@example.com" or your site URL
 *
 * Generate VAPID keys once with:
 *   npx web-push generate-vapid-keys
 *
 * On Vercel: add all three as environment variables in the project settings.
 */

import webpush from 'web-push'
import { prisma } from '@/lib/db'

let configured = false

function configure() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

/**
 * Send a push notification to all active subscriptions for a user.
 * Silently ignores missing VAPID config or expired subscriptions.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  configure()
  if (!configured) return // VAPID not set up — skip silently

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })
  if (!subs.length) return

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    icon: payload.icon ?? '/icon-192.png',
  })

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          json
        )
      } catch (err: any) {
        // 410 Gone = subscription expired; delete it
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    })
  )
}
