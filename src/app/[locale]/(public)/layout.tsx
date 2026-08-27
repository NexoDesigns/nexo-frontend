import { publicFontVars } from '@/lib/fonts'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`theme-landing ${publicFontVars} min-h-screen bg-background text-foreground`}>
      {children}
    </div>
  )
}
