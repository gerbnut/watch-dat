'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export function ServiceWorkerRegistration() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      // Only subscribe if user is logged in and VAPID is configured
      if (!session?.user || !VAPID_PUBLIC_KEY) return

      try {
        // Check if already subscribed
        const existing = await registration.pushManager.getSubscription()
        if (existing) return // already subscribed — nothing to do

        // Request permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // Subscribe
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        const json = subscription.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          }),
        })
      } catch {
        // Push subscription failure is non-critical — silently ignore
      }
    }).catch(() => {})
  }, [session?.user])

  return null
}
