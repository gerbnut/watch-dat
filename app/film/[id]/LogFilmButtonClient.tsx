'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogFilmModal } from '@/components/reviews/LogFilmModal'
import { StarRating } from '@/components/movies/StarRating'
import { Plus, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface LogFilmButtonClientProps {
  tmdbId: number
  title: string
  posterPath: string | null
  releaseDate: Date | null
  existingRating: number | null
  isLogged: boolean
}

export function LogFilmButtonClient({ tmdbId, title, posterPath, releaseDate, existingRating, isLogged }: LogFilmButtonClientProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [logged, setLogged] = useState(isLogged)

  if (!session?.user) {
    return (
      <Link href="/login">
        <Button variant="cinema" size="sm">
          <Plus className="h-4 w-4" />
          Log this film
        </Button>
      </Link>
    )
  }

  const releaseStr = releaseDate ? new Date(releaseDate).toISOString().split('T')[0] : ''

  return (
    <>
      <Button
        variant={logged ? 'secondary' : 'cinema'}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {logged ? (
          <>
            <Check className="h-4 w-4" />
            Logged
            {existingRating && <StarRating value={existingRating} readOnly size="sm" className="ml-1" />}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Log this film
          </>
        )}
      </Button>

      <LogFilmModal
        open={open}
        onClose={() => setOpen(false)}
        preselectedMovie={{ id: tmdbId, title, poster_path: posterPath, release_date: releaseStr }}
        onSuccess={() => setLogged(true)}
      />
    </>
  )
}
