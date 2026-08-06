/* eslint-disable @next/next/no-img-element */

// Placeholder wordmark until the real nexo-logo.png is added to /public/media.
// When it lands, just change LOGO_SRC to '/media/nexo-logo.png'.
const LOGO_SRC = '/media/nexo-logo.svg'

export function NexoLogo({ className = 'h-8 w-auto' }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Nexo Design"
      className={`${className} shrink-0 object-contain`}
    />
  )
}
