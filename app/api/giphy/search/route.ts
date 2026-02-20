export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

const GIPHY_BASE = 'https://api.giphy.com/v1/gifs'
const LIMIT = 20
const RATING = 'g'

export async function GET(req: NextRequest) {
  const apiKey = process.env.GIPHY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Giphy not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().slice(0, 100)

  const url = q
    ? `${GIPHY_BASE}/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=${LIMIT}&rating=${RATING}&lang=en`
    : `${GIPHY_BASE}/trending?api_key=${apiKey}&limit=${LIMIT}&rating=${RATING}`

  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
      return NextResponse.json({ error: 'Giphy error' }, { status: 502 })
    }
    const data = await res.json()

    const gifs = (data.data ?? []).map((g: any) => ({
      id: g.id as string,
      title: (g.title as string) || '',
      previewUrl: (g.images?.fixed_height_small?.url ?? g.images?.downsized?.url ?? '') as string,
      url: (g.images?.original?.url ?? '') as string,
    })).filter((g: { url: string }) => g.url)

    return NextResponse.json(gifs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch GIFs' }, { status: 500 })
  }
}
