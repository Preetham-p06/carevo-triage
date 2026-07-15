import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Carevo — Know exactly where to go when you\'re sick',
  description: 'AI-powered care navigation: the right level of care, what it costs, and what happens after your visit. Never a medical label.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-slate-900">
        <Nav />
        <div className="pb-20 sm:pb-0">{children}</div>
      </body>
    </html>
  )
}
