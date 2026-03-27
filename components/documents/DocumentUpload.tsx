'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Document } from '@/types'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = '.pdf,.xlsx,.xls,.docx,.txt'
const MAX_SIZE_MB = 50

const DOCUMENT_TYPES: Document['type'][] = [
  'datasheet',
  'manufacturer_list',
  'design_note',
  'reference_schematic',
  'other',
]

interface DocumentUploadProps {
  projectId?: string
  queryKey: string[]
  onSuccess?: () => void
}

export function DocumentUpload({ projectId, queryKey, onSuccess }: DocumentUploadProps) {
  const t = useTranslations('documents')
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<Document['type']>('datasheet')
  const [sizeError, setSizeError] = useState(false)

  const mutation = useMutation({
    mutationFn: (file: File) =>
      documentsApi.upload(file, { type: docType, project_id: projectId }),
    onSuccess: () => {
      setSelectedFile(null)
      queryClient.invalidateQueries({ queryKey })
      onSuccess?.()
    },
  })

  const handleFile = (file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setSizeError(true)
      return
    }
    setSizeError(false)
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center gap-2',
          'rounded-lg border-2 border-dashed p-6 transition-colors text-center',
          dragging
            ? 'border-primary bg-primary/5'
            : selectedFile
            ? 'border-success/50 bg-success/5'
            : 'border-border hover:border-border/80 hover:bg-accent/30'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={handleInputChange}
        />
        {selectedFile ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground">
                Arrastra un archivo o <span className="text-primary">selecciona</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('uploadDescription')}</p>
            </div>
          </>
        )}
      </div>

      {sizeError && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          Archivo demasiado grande. Máximo {MAX_SIZE_MB}MB.
        </div>
      )}

      {/* Type selector + upload button */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="doc-type">{t('documentType')}</Label>
          <Select
            value={docType}
            onValueChange={(v) => setDocType(v as Document['type'])}
          >
            <SelectTrigger id="doc-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => selectedFile && mutation.mutate(selectedFile)}
          disabled={!selectedFile || mutation.isPending}
          className="gap-1.5 shrink-0"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {t('upload')}
        </Button>
      </div>

      {mutation.isSuccess && (
        <p className="text-xs text-success flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('uploadSuccess')}
        </p>
      )}
      {mutation.isError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {t('uploadError')}
        </p>
      )}
    </div>
  )
}
