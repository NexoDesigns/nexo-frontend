import { publicFontVars } from '@/lib/fonts'
import { BackgroundVideo } from '@/components/public/BackgroundVideo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`theme-landing ${publicFontVars} relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-20 text-foreground`}
    >
      <BackgroundVideo src="/media/hero.mp4" opacity={0.35} />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  )
}
