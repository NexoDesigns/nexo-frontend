'use client'

import { useState, useContext, createContext, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/primitives'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RunOutputViewerProps {
  output: Record<string, unknown>
  className?: string
}

const MIN_KEY_WIDTH = 48 // ~6 monospace chars
const DEFAULT_KEY_WIDTH = 140

// Context: per-depth column widths shared across all rows at the same depth
const ColWidthContext = createContext<{
  getWidth: (depth: number) => number
  startResize: (depth: number, startX: number, startWidth: number) => void
}>({
  getWidth: () => DEFAULT_KEY_WIDTH,
  startResize: () => {},
})

function StructuredRow({ k, v, depth }: { k: string; v: unknown; depth: number }) {
  const { getWidth, startResize } = useContext(ColWidthContext)
  const [collapsed, setCollapsed] = useState(false)
  const keyWidth = getWidth(depth)

  const isCollapsible =
    v !== null &&
    typeof v === 'object' &&
    (Array.isArray(v) ? (v as unknown[]).length > 0 : Object.keys(v as object).length > 0)

  const collapsedLabel = isCollapsible
    ? Array.isArray(v)
      ? `[${(v as unknown[]).length}]`
      : `{${Object.keys(v as object).length}}`
    : null

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startResize(depth, e.clientX, keyWidth)
  }

  return (
    <div className={cn('flex items-start', depth > 0 && 'pl-3 border-l border-border')}>
      {/* Key cell */}
      <div
        className="flex items-center shrink-0 gap-0.5 pt-0.5"
        style={{ width: keyWidth }}
      >
        {isCollapsible ? (
          <button
            className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            onClick={() => setCollapsed((c) => !c)}
            tabIndex={-1}
          >
            {collapsed
              ? <ChevronRight className="h-3 w-3" />
              : <ChevronDown className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span
          className="text-xs text-muted-foreground font-mono truncate flex-1"
          title={k}
        >
          {k}
        </span>
      </div>

      {/* Resize handle — wider hit area, thin visible line */}
      <div
        className="w-3 self-stretch cursor-col-resize group flex items-stretch shrink-0"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="w-px bg-border/40 group-hover:bg-primary/60 transition-colors mx-auto" />
      </div>

      {/* Value */}
      <div className="flex-1 min-w-0 pt-0.5">
        {collapsed ? (
          <span className="text-[11px] text-muted-foreground font-mono">{collapsedLabel}</span>
        ) : (
          <StructuredValue value={v} depth={depth + 1} />
        )}
      </div>
    </div>
  )
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
          <StructuredRow key={k} k={k} v={v} depth={depth} />
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
  const [colWidths, setColWidths] = useState<Map<number, number>>(new Map())

  const jsonString = JSON.stringify(output, null, 2)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getWidth = useCallback(
    (depth: number) => colWidths.get(depth) ?? DEFAULT_KEY_WIDTH,
    [colWidths]
  )

  const startResize = useCallback((depth: number, startX: number, startWidth: number) => {
    const onMove = (ev: MouseEvent) => {
      setColWidths((prev) => {
        const next = new Map(prev)
        next.set(depth, Math.max(MIN_KEY_WIDTH, startWidth + (ev.clientX - startX)))
        return next
      })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

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
          <ColWidthContext.Provider value={{ getWidth, startResize }}>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm max-h-[500px] overflow-y-auto">
              <StructuredValue value={output} />
            </div>
          </ColWidthContext.Provider>
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
