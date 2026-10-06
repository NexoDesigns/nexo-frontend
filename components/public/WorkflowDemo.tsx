// Framed product demo. Until a recording exists, `src` is null and the frame
// shows a "coming soon" placeholder — drop the file in /public/media and pass it.
export function WorkflowDemo({
  src,
  label,
  soon,
  caption,
}: {
  src: string | null
  label: string
  soon: string
  caption: string
}) {
  return (
    <figure>
      <div className="overflow-hidden border border-border bg-background/85 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="relative aspect-video">
          {src ? (
            <video
              className="h-full w-full object-cover"
              src={src}
              controls
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="grid-lines absolute inset-0 flex flex-col items-center justify-center gap-6">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/60 text-primary">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {soon}
              </span>
            </div>
          )}
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  )
}
