export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rateLimit'
import { searchMovies, getOrCacheMovie } from '@/lib/tmdb'
import Papa from 'papaparse'

const IMPORT_SOURCE = 'letterboxd'
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 250 // pause between batches to avoid TMDB rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface DiaryRow {
  Date: string
  Name: string
  Year: string
  'Letterboxd URI': string
  Rating: string
  Rewatch: string
  Tags: string
  'Watched Date': string
}

interface WatchedRow {
  Date: string
  Name: string
  Year: string
  'Letterboxd URI': string
}

interface WatchlistRow {
  Date: string
  Name: string
  Year: string
  'Letterboxd URI': string
}

function parseCSV<T>(text: string): T[] {
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  return result.data
}

function letterboxdToAppRating(lbRating: string): number | null {
  const val = parseFloat(lbRating)
  if (isNaN(val) || val <= 0) return null
  return Math.round(val * 2 * 2) / 2 // convert 0.5-5 to 1-10, snap to 0.5 increments
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed, headers } = rateLimit({
    key: `letterboxd-import:${session.user.id}`,
    limit: 3,
    windowSec: 3600,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers }
    )
  }

  try {
    const formData = await req.formData()
    const diaryFile = formData.get('diary') as File | null
    const watchedFile = formData.get('watched') as File | null
    const watchlistFile = formData.get('watchlist') as File | null

    if (!diaryFile && !watchedFile) {
      return NextResponse.json({ error: 'diary.csv or watched.csv is required' }, { status: 400 })
    }

    let diaryRows: DiaryRow[] = []
    if (diaryFile) {
      const diaryText = await diaryFile.text()
      diaryRows = parseCSV<DiaryRow>(diaryText)
    }

    let watchedRows: WatchedRow[] = []
    if (watchedFile) {
      const watchedText = await watchedFile.text()
      watchedRows = parseCSV<WatchedRow>(watchedText)
    }

    let watchlistRows: WatchlistRow[] = []
    if (watchlistFile) {
      const watchlistText = await watchlistFile.text()
      watchlistRows = parseCSV<WatchlistRow>(watchlistText)
    }

    const totalItems = diaryRows.length + watchedRows.length + watchlistRows.length
    const userId = session.user.id

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let matched = 0
        let skipped = 0
        let failed = 0
        const failedEntries: { name: string; reason: string }[] = []

        function sendProgress() {
          const event = JSON.stringify({ type: 'progress', matched, failed, skipped, total: totalItems })
          controller.enqueue(encoder.encode(event + '\n'))
        }

        // Process diary entries in batches
        const diaryBatches = chunk(diaryRows, BATCH_SIZE)
        for (const batch of diaryBatches) {
          const results = await Promise.allSettled(
            batch.map(async (row) => {
              const name = row.Name?.trim()
              const year = row.Year?.trim()
              if (!name) {
                return { status: 'skipped' as const }
              }

              try {
                const searchResult = await searchMovies(name, 1, year || undefined)
                let match = searchResult?.results?.[0]

                // Retry without year filter if no results
                if (!match && year) {
                  const retryResult = await searchMovies(name)
                  match = retryResult?.results?.[0]
                }

                if (!match) {
                  return { status: 'failed' as const, name, reason: `not found on TMDB` }
                }

                const movie = await getOrCacheMovie(match.id)
                const rating = letterboxdToAppRating(row.Rating || '')
                const watchedDateStr = row['Watched Date']?.trim() || row.Date?.trim()
                const watchedDate = watchedDateStr ? new Date(watchedDateStr) : new Date()
                const isRewatch = row.Rewatch?.trim().toLowerCase() === 'yes'

                // Skip if diary entry already exists for this user+movie+date
                const existingDiary = await prisma.diaryEntry.findFirst({
                  where: {
                    userId,
                    movieId: movie.id,
                    watchedDate,
                  },
                })
                if (existingDiary) {
                  return { status: 'skipped' as const }
                }

                // Create diary entry
                await prisma.diaryEntry.create({
                  data: {
                    userId,
                    movieId: movie.id,
                    watchedDate,
                    rating,
                    rewatch: isRewatch,
                    importSource: IMPORT_SOURCE,
                  },
                })

                // Upsert review (one per user+movie)
                const existingReview = await prisma.review.findUnique({
                  where: { userId_movieId: { userId, movieId: movie.id } },
                })
                let reviewId: string | null = existingReview?.id ?? null
                if (!existingReview && rating !== null) {
                  const newReview = await prisma.review.create({
                    data: {
                      userId,
                      movieId: movie.id,
                      rating,
                      watchedDate,
                      rewatch: isRewatch,
                      importSource: IMPORT_SOURCE,
                    },
                  })
                  reviewId = newReview.id
                }

                return { status: 'matched' as const }
              } catch (err) {
                console.error(`Failed to import diary entry "${name}":`, err)
                return { status: 'failed' as const, name, reason: (err as Error).message }
              }
            })
          )

          for (const r of results) {
            const res = r.status === 'fulfilled' ? r.value : { status: 'failed' as const, name: 'unknown' }
            if (res.status === 'matched') matched++
            else if (res.status === 'skipped') skipped++
            else {
              failed++
              if ('name' in res && res.name) failedEntries.push({ name: res.name, reason: ('reason' in res ? res.reason : '') || 'unknown' })
            }
          }

          sendProgress()
          await sleep(BATCH_DELAY_MS)
        }

        // Process watched entries as diary entries (skips films already imported from diary.csv)
        const watchedBatches = chunk(watchedRows, BATCH_SIZE)
        for (const batch of watchedBatches) {
          const results = await Promise.allSettled(
            batch.map(async (row) => {
              const name = row.Name?.trim()
              const year = row.Year?.trim()
              if (!name) {
                return { status: 'skipped' as const }
              }

              try {
                const searchResult = await searchMovies(name, 1, year || undefined)
                let match = searchResult?.results?.[0]

                // Retry without year filter if no results
                if (!match && year) {
                  const retryResult = await searchMovies(name)
                  match = retryResult?.results?.[0]
                }

                if (!match) {
                  return { status: 'failed' as const, name, reason: `not found on TMDB` }
                }

                const movie = await getOrCacheMovie(match.id)
                const watchedDate = row.Date?.trim() ? new Date(row.Date.trim()) : new Date()

                // Skip if any diary entry already exists for this user+movie
                const existingDiary = await prisma.diaryEntry.findFirst({
                  where: {
                    userId,
                    movieId: movie.id,
                  },
                })
                if (existingDiary) {
                  return { status: 'skipped' as const }
                }

                // Create diary entry (no rating from watched.csv)
                await prisma.diaryEntry.create({
                  data: {
                    userId,
                    movieId: movie.id,
                    watchedDate,
                    importSource: IMPORT_SOURCE,
                  },
                })

                return { status: 'matched' as const }
              } catch (err) {
                console.error(`Failed to import watched entry "${name}":`, err)
                return { status: 'failed' as const, name, reason: (err as Error).message }
              }
            })
          )

          for (const r of results) {
            const res = r.status === 'fulfilled' ? r.value : { status: 'failed' as const, name: 'unknown' }
            if (res.status === 'matched') matched++
            else if (res.status === 'skipped') skipped++
            else {
              failed++
              if ('name' in res && res.name) failedEntries.push({ name: res.name, reason: ('reason' in res ? res.reason : '') || 'unknown' })
            }
          }

          sendProgress()
          await sleep(BATCH_DELAY_MS)
        }

        // Process watchlist entries in batches
        const watchlistBatches = chunk(watchlistRows, BATCH_SIZE)
        for (const batch of watchlistBatches) {
          const results = await Promise.allSettled(
            batch.map(async (row) => {
              const name = row.Name?.trim()
              const year = row.Year?.trim()
              if (!name) {
                return { status: 'skipped' as const }
              }

              try {
                const searchResult = await searchMovies(name, 1, year || undefined)
                let match = searchResult?.results?.[0]

                // Retry without year filter if no results
                if (!match && year) {
                  const retryResult = await searchMovies(name)
                  match = retryResult?.results?.[0]
                }

                if (!match) {
                  return { status: 'failed' as const, name, reason: `not found on TMDB` }
                }

                const movie = await getOrCacheMovie(match.id)

                // Skip if already on watchlist
                const existingWatchlist = await prisma.watchlistItem.findUnique({
                  where: { userId_movieId: { userId, movieId: movie.id } },
                })
                if (existingWatchlist) {
                  return { status: 'skipped' as const }
                }

                await prisma.watchlistItem.create({
                  data: {
                    userId,
                    movieId: movie.id,
                    importSource: IMPORT_SOURCE,
                  },
                })

                return { status: 'matched' as const }
              } catch (err) {
                console.error(`Failed to import watchlist entry "${name}":`, err)
                return { status: 'failed' as const, name, reason: (err as Error).message }
              }
            })
          )

          for (const r of results) {
            const res = r.status === 'fulfilled' ? r.value : { status: 'failed' as const, name: 'unknown' }
            if (res.status === 'matched') matched++
            else if (res.status === 'skipped') skipped++
            else {
              failed++
              if ('name' in res && res.name) failedEntries.push({ name: res.name, reason: ('reason' in res ? res.reason : '') || 'unknown' })
            }
          }

          sendProgress()
          await sleep(BATCH_DELAY_MS)
        }

        // Record the import
        await prisma.letterboxdImport.create({
          data: {
            userId,
            totalItems,
            matched,
            skipped,
            failed,
          },
        })

        // Update user import metadata
        await prisma.user.update({
          where: { id: userId },
          data: {
            letterboxdImportedAt: new Date(),
            letterboxdEntryCount: totalItems,
          },
        })

        const complete = JSON.stringify({ type: 'complete', matched, failed, skipped, total: totalItems, failedEntries: failedEntries.slice(0, 50) })
        controller.enqueue(encoder.encode(complete + '\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('Letterboxd import error:', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Clean up any activity records from previous imports
    const importedReviews = await prisma.review.findMany({
      where: { userId: session.user.id, importSource: IMPORT_SOURCE },
      select: { id: true },
    })
    const importedDiary = await prisma.diaryEntry.findMany({
      where: { userId: session.user.id, importSource: IMPORT_SOURCE },
      select: { movieId: true },
    })
    const reviewIds = importedReviews.map((r) => r.id)
    const movieIds = [...new Set(importedDiary.map((d) => d.movieId))]

    await Promise.all([
      reviewIds.length > 0
        ? prisma.activity.deleteMany({
            where: { userId: session.user.id, reviewId: { in: reviewIds } },
          })
        : Promise.resolve(),
      movieIds.length > 0
        ? prisma.activity.deleteMany({
            where: { userId: session.user.id, type: 'WATCHED', movieId: { in: movieIds } },
          })
        : Promise.resolve(),
    ])

    // Delete all entries with letterboxd import source
    const [diaryDeleted, reviewsDeleted, watchlistDeleted] = await Promise.all([
      prisma.diaryEntry.deleteMany({
        where: { userId: session.user.id, importSource: IMPORT_SOURCE },
      }),
      prisma.review.deleteMany({
        where: { userId: session.user.id, importSource: IMPORT_SOURCE },
      }),
      prisma.watchlistItem.deleteMany({
        where: { userId: session.user.id, importSource: IMPORT_SOURCE },
      }),
    ])

    // Reset user import metadata
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        letterboxdImportedAt: null,
        letterboxdEntryCount: null,
      },
    })

    return NextResponse.json({
      success: true,
      removed: {
        diaryEntries: diaryDeleted.count,
        reviews: reviewsDeleted.count,
        watchlistItems: watchlistDeleted.count,
      },
    })
  } catch (err) {
    console.error('Letterboxd remove error:', err)
    return NextResponse.json({ error: 'Failed to remove import' }, { status: 500 })
  }
}
