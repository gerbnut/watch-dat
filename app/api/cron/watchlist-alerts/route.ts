import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPushToUser } from '@/lib/webpush'

// Protect cron endpoint with a secret
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekFromNow = new Date(now)
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  // Find watchlist items where the movie releases within the next 7 days
  const upcomingItems = await prisma.watchlistItem.findMany({
    where: {
      movie: {
        releaseDate: {
          gte: now,
          lte: weekFromNow,
        },
      },
    },
    include: {
      movie: { select: { title: true, releaseDate: true } },
    },
  })

  // Group by user
  const byUser = new Map<string, { title: string; releaseDate: Date | null }[]>()
  for (const item of upcomingItems) {
    const existing = byUser.get(item.userId) ?? []
    existing.push({ title: item.movie.title, releaseDate: item.movie.releaseDate })
    byUser.set(item.userId, existing)
  }

  // Send push notifications
  let sent = 0
  for (const [userId, movies] of byUser) {
    const titles = movies.map((m) => m.title).slice(0, 3)
    const body = titles.length === 1
      ? `${titles[0]} releases this week!`
      : `${titles.join(', ')} release this week!`

    try {
      await sendPushToUser(userId, {
        title: 'Watchlist alert',
        body,
        url: '/watchlist',
      })
      sent++
    } catch {
      // Best effort
    }
  }

  return NextResponse.json({ checked: upcomingItems.length, notified: sent })
}
