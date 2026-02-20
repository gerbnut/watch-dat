import type { User, Movie, Review, List, Activity, DiaryEntry, Follow, WatchlistItem } from '@prisma/client'

// Extended types with relations
export type UserWithCounts = User & {
  _count: {
    reviews: number
    following: number
    followers: number
    lists: number
  }
  isFollowing?: boolean
}

export type ReviewWithRelations = Review & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>
  movie: Pick<Movie, 'id' | 'tmdbId' | 'title' | 'poster' | 'releaseDate'>
  _count: {
    likes: number
    comments: number
  }
  isLiked?: boolean
}

export type MovieWithStats = Movie & {
  _count: {
    reviews: number
    diaryEntries: number
  }
  avgRating?: number
  userReview?: Review | null
  isOnWatchlist?: boolean
}

export type ListWithItems = List & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>
  items: Array<{
    id: string
    order: number
    note: string | null
    movie: Pick<Movie, 'id' | 'tmdbId' | 'title' | 'poster' | 'releaseDate'>
  }>
  _count: { items: number }
}

export type ActivityWithRelations = Activity & {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>
  movie?: Pick<Movie, 'id' | 'tmdbId' | 'title' | 'poster'> | null
  review?: ReviewWithRelations | null
  list?: Pick<List, 'id' | 'name'> | null
}

export type DiaryEntryWithMovie = DiaryEntry & {
  movie: Pick<Movie, 'id' | 'tmdbId' | 'title' | 'poster' | 'releaseDate' | 'genres'>
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string | null
  hasMore: boolean
}

// Form types
export interface ReviewFormData {
  rating?: number
  text?: string
  liked?: boolean
  hasSpoiler?: boolean
  watchedDate?: string
  rewatch?: boolean
}

export interface ListFormData {
  name: string
  description?: string
  isPublic: boolean
}

// TMDB types
export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface TMDBDirector {
  id: number
  name: string
}

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      displayName: string
      image?: string | null
    }
  }
}
