import { NextRequest, NextResponse } from 'next/server'

function extractFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ name: null }, { status: 400 })

  const fileId = extractFileId(url)
  if (!fileId) return NextResponse.json({ name: null }, { status: 400 })

  // Try Google Sheets URL first, then generic Drive URL
  const candidates = url.includes('spreadsheets')
    ? [
        `https://docs.google.com/spreadsheets/d/${fileId}/edit`,
        `https://drive.google.com/file/d/${fileId}/view`,
      ]
    : [
        `https://drive.google.com/file/d/${fileId}/view`,
        `https://docs.google.com/spreadsheets/d/${fileId}/edit`,
      ]

  for (const fetchUrl of candidates) {
    try {
      const res = await fetch(fetchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow',
      })
      if (!res.ok) continue

      const html = await res.text()
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (!match) continue

      // Google appends " - Google Sheets", " - Google Drive", etc.
      const name = match[1]
        .replace(/ - Google Sheets$/i, '')
        .replace(/ - Google Drive$/i, '')
        .replace(/ - Google Docs$/i, '')
        .trim()

      if (name && name !== 'Google Drive' && name !== 'Google Sheets') {
        return NextResponse.json({ name })
      }
    } catch {
      // try next candidate
    }
  }

  return NextResponse.json({ name: null })
}
