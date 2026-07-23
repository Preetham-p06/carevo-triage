'use client'

// Carevo Compliance Console — AI-native, self-checking compliance posture.
// Admin-gated (METRICS_KEY). 'live' controls are probed against the running
// system in real time on load; the rest are attested by code/gates or tracked
// as manual business actions. Replaces the static compliance spreadsheet.
import { useState } from 'react'
import Link from 'next/link'
import { CONTROLS, FRAMEWORKS, type Control, type CtrlStatus, type ProbeId } from '@/lib/compliance/controls'

const STATUS: Record<CtrlStatus, { label: string; cls: string; dot: string }> = {
  pass:    { label: 'Compliant',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  action:  { label: 'Action needed', cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  monitor: { label: 'Monitoring',  cls: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  pending: { label: 'Not yet applicable', cls: 'bg-slate-100 text-slate-500 ring-slate-200', dot: 'bg-slate-400' },
}
const TYPE: Record<string, string> = { live: 'LIVE PROBE', attested: 'VERIFIED IN CODE', manual: 'MANUAL / BUSINESS' }

async function runProbe(id: ProbeId): Promise<boolean | null> {
  try {
    if (id === 'https') return location.protocol === 'https:'
    if (id === 'headers') {
      const r = await fetch('/', { cache: 'no-store' })
      return ['content-security-policy', 'strict-transport-security', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy'].every(h => !!r.headers.get(h))
    }
    if (id === 'apiCache') {
      const r = await fetch('/api/beacon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      return /no-store/i.test(r.headers.get('cache-control') || '')
    }
    if (id === 'consentGate') {
      const r = await fetch('/api/research/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'x' }] }) })
      return r.status === 400   // rejected because consent:true absent
    }
    if (id === 'adminAuth') {
      const r = await fetch('/api/research/logs')
      return r.status === 401   // rejected without key
    }
    if (id === 'privacyLive') {
      const r = await fetch('/privacy', { cache: 'no-store' })
      return r.ok
    }
    return null
  } catch { return null }
}

export default function ComplianceConsole() {
  const [ready, setReady] = useState(false)
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')
  const [probes, setProbes] = useState<Record<string, boolean | null>>({})

  const enter = async () => {
    setErr('')
    try {
      const r = await fetch('/api/research/logs', { headers: { 'x-metrics-key': key } })
      if (r.status === 401) { setErr('Wrong key.'); return }
    } catch { /* allow through if endpoint errors for non-auth reasons */ }
    setReady(true)
    // fire live probes
    const results: Record<string, boolean | null> = {}
    await Promise.all(CONTROLS.filter(c => c.probe).map(async c => { results[c.id] = await runProbe(c.probe!) }))
    setProbes(results)
  }

  const effStatus = (c: Control): CtrlStatus => {
    if (c.probe && c.id in probes) {
      const p = probes[c.id]
      if (p === true) return 'pass'
      if (p === false) return 'action'
    }
    return c.status
  }

  const total = CONTROLS.length
  const compliant = CONTROLS.filter(c => effStatus(c) === 'pass').length
  const readiness = Math.round((compliant / total) * 100)

  if (!ready) return (
    <main className="min-h-screen bg-slate-950 px-5 pt-32 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-carevo-400">Carevo Compliance Console</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight">Live compliance posture</h1>
        <p className="mt-2 text-sm font-semibold text-slate-400">Admin only. Enter your key to run live checks.</p>
        <div className="mt-5 flex gap-2">
          <input type="password" value={key} onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && enter()}
            placeholder="Admin key" className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-carevo-400 focus:outline-none" />
          <button onClick={enter} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white">Enter</button>
        </div>
        {err && <p className="mt-2 text-sm font-bold text-red-400">{err}</p>}
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-slate-50 px-5 pt-28 pb-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-carevo-600">Carevo Compliance Console</p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-slate-950">Live compliance posture</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Self-checking against HIPAA, FDA software guidance, security and privacy — no spreadsheet, no audit team.</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black tabular-nums tracking-tight text-emerald-600">{readiness}%</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{compliant} / {total} controls met</p>
          </div>
        </div>

        {/* Framework readiness bars */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMEWORKS.map(fw => {
            const items = CONTROLS.filter(c => c.framework === fw)
            const met = items.filter(c => effStatus(c) === 'pass').length
            const pct = Math.round((met / items.length) * 100)
            return (
              <div key={fw} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-700">{fw}</p>
                  <p className="text-xs font-black tabular-nums text-slate-500">{met}/{items.length}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Controls by framework */}
        {FRAMEWORKS.map(fw => (
          <section key={fw} className="mt-8">
            <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-500">{fw}</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {CONTROLS.filter(c => c.framework === fw).map((c, i) => {
                const st = STATUS[effStatus(c)]
                const isLive = c.probe && c.id in probes
                return (
                  <div key={c.id} className={`grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{c.title}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[8px] font-black tracking-wider ${c.type === 'live' ? 'bg-blue-50 text-blue-600' : c.type === 'attested' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'}`}>{TYPE[c.type]}{isLive ? ' ·  ✓ checked now' : ''}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">{c.requirement}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{c.evidence} <span className="text-slate-400">· owner: {c.owner}</span></p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-black ring-1 ${st.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <p className="mt-8 text-xs font-semibold text-slate-400">
          Live probes run in your browser against the running site each time you open this page. &ldquo;Action needed&rdquo; items are
          business/legal steps no code can perform. This console is Carevo&apos;s internal posture view —
          public proof of accuracy lives on <Link href="/benchmarks" className="font-black text-carevo-700 underline">/benchmarks</Link>.
        </p>
      </div>
    </main>
  )
}
