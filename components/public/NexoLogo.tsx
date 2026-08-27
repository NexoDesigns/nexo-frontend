/* eslint-disable @next/next/no-img-element */

const LOGO_SRC = '/media/nexo-logo.png'

export function NexoLogo({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Nexo Design"
      className={`${className} shrink-0 object-contain`}
    />
  )
}
