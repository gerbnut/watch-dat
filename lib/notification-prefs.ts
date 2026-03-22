import { prisma } from './db'

/**
 * Check if a user has a notification type enabled.
 * Returns true (send notification) by default if no preferences are set.
 */
export async function shouldNotify(userId: string, type: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  })

  const prefs = (user?.notificationPrefs as Record<string, boolean>) ?? {}

  // If the user hasn't set any preferences, or hasn't set this type, default to enabled
  if (!(type in prefs)) return true

  return prefs[type]
}
