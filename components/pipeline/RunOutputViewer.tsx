'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/primitives'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RunOutputViewerProps {
  output: Record<string, unknown>
  className?: string
}

// Renders a value recursively for the structured view
function StructuredValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>
  }

  if (typeof value === 'boolean') {
    return (
      <span className={value ? 'text-success' : 'text-destructive'}>
        {value.toString()}
      </span>
    )
  }

  if (typeof value === 'number') {
    return <span className="text-primary">{value}</span>
  }

  if (typeof value === 'string') {
    // Long strings get truncated with expand
    if (value.length > 200) {
      return <LongString value={value} />
    }
    return <span className="text-foreground break-all">{value}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">[]</span>
    }
    return (
      <div className="space-y-1 mt-1">
        {value.map((item, i) => (
          <div key={i} className={cn('flex gap-2', depth > 0 && 'pl-3 border-l border-border')}>
            <span className="text-muted-foreground text-xs shrink-0 pt-0.5">[{i}]</span>
            <StructuredValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return <span className="text-muted-foreground">{'{}'}</span>
    }
    return (
      <div className="space-y-1 mt-1">
        {entries.map(([k, v]) => (
          <div key={k} className={cn('grid grid-cols-[minmax(80px,140px)_1fr] gap-2 items-start', depth > 0 && 'pl-3 border-l border-border')}>
            <span className="text-xs text-muted-foreground font-mono truncate pt-0.5" title={k}>
              {k}
            </span>
            <StructuredValue value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  return <span>{String(value)}</span>
}

function LongString({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <span className="text-foreground break-all">
      {expanded ? value : `${value.slice(0, 200)}…`}
      <button
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-xs text-primary hover:underline"
      >
        {expanded ? 'ver menos' : 'ver más'}
      </button>
    </span>
  )
}

export function RunOutputViewer({ output, className }: RunOutputViewerProps) {
  const t = useTranslations('pipeline')
  const [copied, setCopied] = useState(false)

  const jsonString = JSON.stringify(output, null, 2)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative', className)}>
      <Tabs defaultValue="structured">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="structured">{t('structuredView')}</TabsTrigger>
            <TabsTrigger value="json">{t('jsonView')}</TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            title="Copiar JSON"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Structured view */}
        <TabsContent value="structured">
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm max-h-[500px] overflow-y-auto">
            <StructuredValue value={output} />
          </div>
        </TabsContent>

        {/* JSON view */}
        <TabsContent value="json">
          <div className="relative rounded-md border border-border bg-muted/30 max-h-[500px] overflow-y-auto">
            <pre className="p-3 text-xs font-mono text-foreground/90 whitespace-pre-wrap break-all leading-relaxed">
              {jsonString}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
