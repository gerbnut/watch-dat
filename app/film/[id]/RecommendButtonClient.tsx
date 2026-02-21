'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecommendMovieModal } from '@/components/movies/RecommendMovieModal'

interface Props {
  tmdbId: number
  title: string
}

export function RecommendButtonClient({ tmdbId, title }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  if (!session?.user) return null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Send className="h-4 w-4" />
        <span className="hidden sm:inline">Recommend</span>
      </Button>
      <RecommendMovieModal
        open={open}
        onClose={() => setOpen(false)}
        movieTitle={title}
        tmdbId={tmdbId}
      />
    </>
  )
}
