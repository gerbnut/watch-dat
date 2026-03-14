export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rateLimit'
import { searchMovies, getOrCacheMovie } from '@/lib/tmdb'
import Papa from 'papaparse'

const IMPORT_SOURCE = 'letterboxd'

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
    const watchlistFile = formData.get('watchlist') as File | null

    if (!diaryFile) {
      return NextResponse.json({ error: 'diary.csv is required' }, { status: 400 })
    }

    const diaryText = await diaryFile.text()
    const diaryRows = parseCSV<DiaryRow>(diaryText)

    let watchlistRows: WatchlistRow[] = []
    if (watchlistFile) {
      const watchlistText = await watchlistFile.text()
      watchlistRows = parseCSV<WatchlistRow>(watchlistText)
    }

    const totalItems = diaryRows.length + watchlistRows.length
    let matched = 0
    let skipped = 0
    let failed = 0

    // Process diary entries
    for (const row of diaryRows) {
      const name = row.Name?.trim()
      const year = row.Year?.trim()
      if (!name) {
        skipped++
        continue
      }

      try {
        const query = year ? `${name} ${year}` : name
        const searchResult = await searchMovies(query)
        const match = searchResult.results?.[0]

        if (!match) {
          failed++
          await sleep(50)
          continue
        }

        const movie = await getOrCacheMovie(match.id)
        const rating = letterboxdToAppRating(row.Rating || '')
        const watchedDateStr = row['Watched Date']?.trim() || row.Date?.trim()
        const watchedDate = watchedDateStr ? new Date(watchedDateStr) : new Date()
        const isRewatch = row.Rewatch?.trim().toLowerCase() === 'yes'

        // Skip if diary entry already exists for this user+movie+date
        const existingDiary = await prisma.diaryEntry.findFirst({
          where: {
            userId: session.user.id,
            movieId: movie.id,
            watchedDate,
          },
        })
        if (existingDiary) {
          skipped++
          await sleep(50)
          continue
        }

        // Create diary entry
        await prisma.diaryEntry.create({
          data: {
            userId: session.user.id,
            movieId: movie.id,
            watchedDate,
            rating,
            rewatch: isRewatch,
            importSource: IMPORT_SOURCE,
          },
        })

        // Upsert review (one per user+movie)
        const existingReview = await prisma.review.findUnique({
          where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
        })
        if (!existingReview && rating !== null) {
          await prisma.review.create({
            data: {
              userId: session.user.id,
              movieId: movie.id,
              rating,
              watchedDate,
              rewatch: isRewatch,
              importSource: IMPORT_SOURCE,
            },
          })
        }

        matched++
      } catch (err) {
        console.error(`Failed to import diary entry "${name}":`, err)
        failed++
      }

      await sleep(50)
    }

    // Process watchlist entries
    for (const row of watchlistRows) {
      const name = row.Name?.trim()
      const year = row.Year?.trim()
      if (!name) {
        skipped++
        continue
      }

      try {
        const query = year ? `${name} ${year}` : name
        const searchResult = await searchMovies(query)
        const match = searchResult.results?.[0]

        if (!match) {
          failed++
          await sleep(50)
          continue
        }

        const movie = await getOrCacheMovie(match.id)

        // Skip if already on watchlist
        const existingWatchlist = await prisma.watchlistItem.findUnique({
          where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
        })
        if (existingWatchlist) {
          skipped++
          await sleep(50)
          continue
        }

        await prisma.watchlistItem.create({
          data: {
            userId: session.user.id,
            movieId: movie.id,
            importSource: IMPORT_SOURCE,
          },
        })

        matched++
      } catch (err) {
        console.error(`Failed to import watchlist entry "${name}":`, err)
        failed++
      }

      await sleep(50)
    }

    // Record the import
    await prisma.letterboxdImport.create({
      data: {
        userId: session.user.id,
        totalItems,
        matched,
        skipped,
        failed,
      },
    })

    // Update user import metadata
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        letterboxdImportedAt: new Date(),
        letterboxdEntryCount: totalItems,
      },
    })

    return NextResponse.json({
      success: true,
      totalItems,
      matched,
      skipped,
      failed,
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
