'use client'

import { useEffect, useRef } from 'react'

export function BackgroundVideo({
  src,
  className = '',
  opacity = 0.55,
}: {
  src: string
  className?: string
  opacity?: number
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const tryPlay = () => {
      el.play().catch(() => undefined)
    }
    tryPlay()
    el.addEventListener('canplay', tryPlay)
    window.addEventListener('pointerdown', tryPlay)
    window.addEventListener('scroll', tryPlay, { passive: true })
    return () => {
      el.removeEventListener('canplay', tryPlay)
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('scroll', tryPlay)
    }
  }, [])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 70% 20%, color-mix(in oklab, var(--glow-c) 18%, transparent) 0%, transparent 60%), radial-gradient(90% 70% at 10% 90%, color-mix(in oklab, var(--glow-c) 10%, transparent) 0%, transparent 65%)',
        }}
      />
      <video
        ref={ref}
        className="h-full w-full object-cover"
        style={{ opacity }}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="video-veil absolute inset-0" />
      <div className="grid-lines absolute inset-0 opacity-40" />
    </div>
  )
}
