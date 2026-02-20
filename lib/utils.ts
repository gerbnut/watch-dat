import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, fmt = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatRelativeTime(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatRuntime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatRating(rating: number) {
  return rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)
}

// Convert 1-10 rating to star display (1-5 stars with half increments)
export function ratingToStars(rating: number) {
  return rating / 2
}

export function starsToRating(stars: number) {
  return stars * 2
}

export function getRatingColor(rating: number) {
  if (rating >= 8) return 'text-emerald-400'
  if (rating >= 6) return 'text-yellow-400'
  if (rating >= 4) return 'text-orange-400'
  return 'text-red-400'
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function getYearFromDate(date: Date | string | null) {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return d.getFullYear()
}
