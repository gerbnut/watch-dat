import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import Link from 'next/link'
import { SettingsFormClient } from './SettingsFormClient'
import { FavoritesEditorClient } from './FavoritesEditorClient'
import { LetterboxdSettingsClient } from './LetterboxdSettingsClient'
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
      letterboxdImportedAt: true,
      letterboxdEntryCount: true,
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
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground/70 mt-1">Manage your profile and preferences</p>
      </div>
      <SettingsFormClient
        user={{ id: user.id, username: user.username ?? '', displayName: user.displayName ?? '', bio: user.bio, avatar: user.avatar, bannerUrl: (user as any).bannerUrl ?? null }}
      />
      <FavoritesEditorClient username={user.username ?? ''} initialFavorites={favorites} />

      <LetterboxdSettingsClient
        importedAt={user.letterboxdImportedAt?.toISOString() ?? null}
        entryCount={user.letterboxdEntryCount}
      />

      <DeleteAccountClient />

      {/* TMDB attribution & legal links */}
      <div className="border-t border-white/[0.04] pt-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
            alt="TMDB"
            width={80}
            height={10}
            className="opacity-60"
          />
          <span>Film data provided by <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline">TMDB</a></span>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}
