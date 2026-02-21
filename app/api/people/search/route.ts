export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { searchPeople } from '@/lib/tmdb'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { allowed, headers } = rateLimit({
    key: `ip:${getIp(req)}:people-search`,
    limit: 30,
    windowSec: 60,
  })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 1 || trimmedQuery.length > 50) {
    return NextResponse.json({ results: [] })
  }

  try {
    const data = await searchPeople(trimmedQuery)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ results: [] })
  }
}
