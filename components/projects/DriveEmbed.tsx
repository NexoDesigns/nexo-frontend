'use client'

import { useTranslations } from 'next-intl'
import { FileSpreadsheet } from 'lucide-react'

interface DriveEmbedProps {
  driveUrl: string | null
  emptyTitle: string
  emptyHint: string
}

function extractDriveFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export function DriveEmbed({ driveUrl, emptyTitle, emptyHint }: DriveEmbedProps) {
  const tErrors = useTranslations('errors')

  if (!driveUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
        <FileSpreadsheet className="h-12 w-12 opacity-20" />
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-xs text-center max-w-xs">{emptyHint}</p>
      </div>
    )
  }

  const fileId = extractDriveFileId(driveUrl)
  if (!fileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
        <FileSpreadsheet className="h-12 w-12 opacity-20" />
        <p className="text-sm font-medium text-destructive">{tErrors('invalidDriveUrl')}</p>
      </div>
    )
  }

  const embedUrl = `https://docs.google.com/spreadsheets/d/${fileId}/edit?rm=minimal`

  return (
    <iframe
      src={embedUrl}
      className="w-full h-full border-0"
      title="Google Sheets"
      allow="clipboard-read; clipboard-write"
    />
  )
}
