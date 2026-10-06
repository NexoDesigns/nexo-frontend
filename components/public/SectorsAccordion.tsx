'use client'

import { useState } from 'react'

type Sector = { name: string; body: string }

export function SectorsAccordion({ sectors }: { sectors: Sector[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <ul className="border-t border-border">
      {sectors.map((s, i) => {
        const isOpen = open === i
        const panelId = `sector-panel-${i}`
        return (
          <li key={s.name} className="border-b border-border">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : i)}
              className="group flex w-full items-center justify-between gap-6 py-6 text-left lg:py-7"
            >
              <span
                className={`font-display text-2xl tracking-tight transition-colors sm:text-3xl lg:text-4xl ${
                  isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {s.name}
              </span>
              <span
                aria-hidden
                className={`font-mono text-2xl leading-none transition-transform duration-300 ${
                  isOpen ? 'rotate-45 text-primary' : 'text-muted-foreground'
                }`}
              >
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-8 text-base leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
