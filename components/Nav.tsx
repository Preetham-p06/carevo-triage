'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/triage', label: 'Triage',
    icon: (a: boolean) => (
      <svg className="w-5 h-5" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={a ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    href: '/avs', label: 'After Care',
    icon: (a: boolean) => (
      <svg className="w-5 h-5" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={a ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 002 2h2a2 2 0 002-2m-5 7h6m-6 4h4" />
      </svg>
    ),
  },
  {
    href: '/profile', label: 'Profile',
    icon: (a: boolean) => (
      <svg className="w-5 h-5" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={a ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const MARKETING_PATHS = new Set(['/triage', '/company', '/contact', '/privacy', '/terms', '/benchmarks'])

function CarevoLogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`flex items-center justify-center overflow-hidden bg-slate-950 shadow-lg shadow-carevo-500/20 ${compact ? 'h-7 w-7 rounded-[7px]' : 'h-10 w-10 rounded-xl'}`}>
      <img src="/brand/carevo-logo.png" alt="" className="h-full w-full object-cover" />
    </span>
  )
}

export default function Nav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  if (pathname === '/metrics' || pathname === '/triage-embed' || pathname === '/demo' || pathname === '/compliance') return null

  if (MARKETING_PATHS.has(pathname)) {
    return (
      <>
        <nav className="fixed left-1/2 top-[18px] z-50 flex w-[min(1180px,94vw)] -translate-x-1/2 items-center justify-between rounded-[100px] border border-black/[.08] bg-white/[.88] py-[11px] pl-[22px] pr-3 [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif] shadow-[0_18px_55px_rgba(15,23,42,.10)] backdrop-blur-[22px] backdrop-saturate-150">
          <Link href="/" className="flex shrink-0 items-center gap-[9px] text-[17px] font-bold leading-[normal] tracking-normal text-slate-950">
            <CarevoLogoMark compact />
            carevo
          </Link>
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[15px] font-extrabold leading-[normal] text-slate-500 md:flex">
            <Link href="/#products" className="inline-flex items-center rounded-full px-[15px] py-2 transition hover:bg-slate-950/[.06] hover:text-slate-950">Products</Link>
            <Link href="/triage" className="inline-flex items-center rounded-full px-[15px] py-2 transition hover:bg-slate-950/[.06] hover:text-slate-950">Triage</Link>
            <Link href="/#how-it-works" className="inline-flex items-center rounded-full px-[15px] py-2 transition hover:bg-slate-950/[.06] hover:text-slate-950">How it works</Link>
            <Link href="/benchmarks" className="inline-flex items-center rounded-full px-[15px] py-2 transition hover:bg-slate-950/[.06] hover:text-slate-950">Benchmarks</Link>
            <Link href="/company" className="inline-flex items-center rounded-full px-[15px] py-2 transition hover:bg-slate-950/[.06] hover:text-slate-950">Company</Link>
            <Link href="/contact" className="inline-flex items-center rounded-full px-[15px] py-2 transition hover:bg-slate-950/[.06] hover:text-slate-950">Contact</Link>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="ml-auto inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-[10px] text-[13px] font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            Menu
          </button>
          <Link href="/triage" className="ml-auto hidden min-w-[122px] shrink-0 items-center justify-center gap-[7px] whitespace-nowrap rounded-full bg-blue-600 px-[22px] py-[10px] text-sm font-extrabold leading-[normal] text-white shadow-[0_1px_3px_rgba(37,99,235,.35),0_8px_22px_rgba(37,99,235,.16)] transition hover:-translate-y-px hover:bg-blue-700 hover:shadow-[0_2px_5px_rgba(37,99,235,.38),0_10px_26px_rgba(37,99,235,.20)] md:inline-flex">
            Try it
            <svg viewBox="0 0 16 16" className="h-[13px] w-[13px] fill-none stroke-white" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </nav>

        <div className={`fixed inset-0 z-[70] transition md:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
          <button
            type="button"
            className={`absolute inset-0 bg-slate-950/35 backdrop-blur-sm transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className={`absolute right-3 top-3 w-[min(340px,calc(100vw-24px))] rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20 transition-transform duration-200 ${menuOpen ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'}`}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 font-display text-xl font-black tracking-tight text-slate-950">
                <CarevoLogoMark />
                carevo
              </Link>
              <button type="button" onClick={() => setMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500" aria-label="Close navigation menu">
                ×
              </button>
            </div>
            <div className="grid gap-2 text-lg font-black text-slate-900">
              <Link onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-4 hover:bg-slate-50" href="/#products">Products</Link>
              <Link onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-4 hover:bg-slate-50" href="/triage">Triage</Link>
              <Link onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-4 hover:bg-slate-50" href="/#how-it-works">How it works</Link>
              <Link onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-4 hover:bg-slate-50" href="/benchmarks">Benchmarks</Link>
              <Link onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-4 hover:bg-slate-50" href="/company">Company</Link>
              <Link onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-4 hover:bg-slate-50" href="/contact">Contact</Link>
            </div>
            <Link onClick={() => setMenuOpen(false)} href="/triage" className="mt-5 flex w-full items-center justify-center rounded-full bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25">
              Try it
            </Link>
          </aside>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop: top bar */}
      <nav className="hidden sm:flex items-center gap-1 px-6 py-3 border-b border-slate-100 bg-white/90 backdrop-blur sticky top-0 z-40">
        <Link href="/" className="mr-6 flex items-center gap-2 font-display text-xl font-bold tracking-tight text-carevo-600">
          <CarevoLogoMark />
          carevo
        </Link>
        {TABS.map(t => {
          const active = pathname === t.href || (pathname === '/' && t.href === '/triage')
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                active ? 'bg-carevo-50 text-carevo-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {t.icon(active)}
              {t.label}
            </Link>
          )
        })}
        <span className="ml-auto text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
          Guest mode — no account, nothing saved without your consent
        </span>
      </nav>

      {/* Mobile: bottom bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 flex justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map(t => {
          const active = pathname === t.href || (pathname === '/' && t.href === '/triage')
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-5 text-[11px] font-semibold transition-colors ${
                active ? 'text-carevo-600' : 'text-slate-400'
              }`}
            >
              {t.icon(active)}
              {t.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
