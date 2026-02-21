import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import Link from 'next/link'
import { SettingsFormClient } from './SettingsFormClient'
import { FavoritesEditorClient } from './FavoritesEditorClient'
import { DeleteAccountClient } from './DeleteAccountClient'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatar: true,
      bannerUrl: true,
      favoriteMovies: {
        include: { movie: { select: { tmdbId: true, title: true, poster: true } } },
        orderBy: { order: 'asc' },
        take: 5,
      },
    },
  })

  if (!user) redirect('/login')

  const favorites = user.favoriteMovies.map((f) => ({
    tmdbId: f.movie.tmdbId,
    title: f.movie.title,
    poster: f.movie.poster,
  }))

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>
      <SettingsFormClient
        user={{ id: user.id, username: user.username, displayName: user.displayName, bio: user.bio, avatar: user.avatar, bannerUrl: (user as any).bannerUrl ?? null }}
      />
      <FavoritesEditorClient username={user.username} initialFavorites={favorites} />

      <DeleteAccountClient />

      {/* Legal links */}
      <div className="border-t pt-4 flex gap-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
      </div>
    </div>
  )
}
