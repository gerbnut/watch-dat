import { getPersonDetails, TMDB_IMAGE } from '@/lib/tmdb'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Metadata } from 'next'
import { MovieCard } from '@/components/movies/MovieCard'
import { BackButton } from '@/components/ui/BackButton'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tmdbId = Number(params.id)
  if (isNaN(tmdbId)) return { title: 'Person Not Found' }
  try {
    const person = await getPersonDetails(tmdbId)
    return { title: person.name, description: person.biography?.slice(0, 160) }
  } catch {
    return { title: 'Person' }
  }
}

export default async function PersonPage({ params }: { params: { id: string } }) {
  const tmdbId = Number(params.id)
  if (isNaN(tmdbId)) notFound()

  let person: Awaited<ReturnType<typeof getPersonDetails>>
  try {
    person = await getPersonDetails(tmdbId)
  } catch {
    notFound()
  }

  const profileUrl = TMDB_IMAGE.profile(person.profile_path, 'w185')

  // Build directed films (crew with Director job)
  const directedFilms = (person.movie_credits?.crew ?? [])
    .filter((c) => c.job === 'Director')
    .sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))

  // Build acted films (cast credits), sorted by newest first
  const actedFilms = (person.movie_credits?.cast ?? [])
    .filter((c) => c.release_date)
    .sort((a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''))

  // Deduplicate acted films by movie id (can appear multiple times for anthology roles etc.)
  const seenIds = new Set<number>()
  const uniqueActedFilms = actedFilms.filter((c) => {
    if (seenIds.has(c.id)) return false
    seenIds.add(c.id)
    return true
  })

  const isDirector = person.known_for_department === 'Directing' || directedFilms.length > 0

  return (
    <div className="space-y-8">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
        <div className="relative w-28 sm:w-36 shrink-0 mx-auto sm:mx-0">
          <div className="relative overflow-hidden rounded-lg shadow-xl aspect-[2/3] bg-muted">
            {profileUrl ? (
              <Image src={profileUrl} alt={person.name} fill className="object-cover" priority sizes="(max-width: 640px) 112px, 144px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-4xl font-bold">
                {person.name[0]}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="text-xl sm:text-3xl font-bold leading-tight">{person.name}</h1>
          {person.known_for_department && (
            <p className="text-sm text-muted-foreground">{person.known_for_department}</p>
          )}
          {person.birthday && (
            <p className="text-sm text-muted-foreground">
              Born {new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {person.place_of_birth && ` · ${person.place_of_birth}`}
            </p>
          )}
          {person.biography && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 sm:line-clamp-none">
              {person.biography}
            </p>
          )}
        </div>
      </div>

      {/* Directed films */}
      {directedFilms.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Directed ({directedFilms.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {directedFilms.map((film) => (
              <MovieCard
                key={film.id}
                tmdbId={film.id}
                title={film.title}
                poster={film.poster_path}
                releaseDate={film.release_date}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Acting roles */}
      {uniqueActedFilms.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {isDirector ? 'Acting' : 'Films'} ({uniqueActedFilms.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {uniqueActedFilms.map((film) => (
              <MovieCard
                key={film.id}
                tmdbId={film.id}
                title={film.title}
                poster={film.poster_path}
                releaseDate={film.release_date}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
