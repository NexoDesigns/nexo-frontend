export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      {/* Radial gradient overlay to fade out the grid toward center */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  )
}
