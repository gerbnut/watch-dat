'use client'

import { useEditList } from './EditListClient'
import { EditableFilmWrapper } from '@/components/movies/EditableFilmWrapper'

interface ListFilmRowProps {
  itemId: string
  movieTitle: string
  children: React.ReactNode
}

export function ListFilmRow({ itemId, movieTitle, children }: ListFilmRowProps) {
  const { isEditing, handleRemove } = useEditList()

  return (
    <EditableFilmWrapper
      id={itemId}
      label={movieTitle}
      isEditing={isEditing}
      onRemove={handleRemove}
    >
      {children}
    </EditableFilmWrapper>
  )
}
