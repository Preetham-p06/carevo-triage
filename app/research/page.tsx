'use client'

// Admin-only analytics dashboard (METRICS_KEY-gated via the API). Not linked
// publicly. Shared conversations are consented quality-review logs — treat as
// confidential health info; transcripts stay collapsed by default.
import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

interface Entry {
  shareCode: string
  consentedAt: string
  messages: { role: string; content: string }[]
  careLevel: string | null
  factors: string[]
  engineVersion: string | null
}
interface Rev { id: string; createdAt: string; rating: number; text: string; name: string | null }
interface Metrics { activeNow: number; pageViews: number; triageSessions: number; recommendations: number; emergencyStops: number; tokensUsed: number; estCostUsd: number }

const CARD = 'rounded-2xl border border-white/[0.06] bg-[#141d33] p-5'

// ── Semicircle gauge (SVG). value is 0–100. ──
function Gauge({ value, centerLabel, color, sub }: { value: number; centerLabel: string; color: string; sub?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 200 118" className="w-full">
        <path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="#26314d" strokeWidth="15" strokeLinecap="round" pathLength={100} />
        <path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke={color} strokeWidth="15" strokeLinecap="round" pathLength={100} strokeDasharray={`${v} 100`} className="transition-all duration-700" />
        <text x="18" y="114" fill="#64748b" fontSize="10" fontWeight="700">0</text>
        <text x="182" y="114" fill="#64748b" fontSize="10" fontWeight="700" textAnchor="end">100</text>
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
        <p className="text-4xl font-black tabular-nums tracking-tight text-white">{centerLabel}</p>
        {sub && <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

function Kpi({ value, label, sub, accent = 'text-white', delta }: { value: string; label: string; sub?: string; accent?: string; delta?: ReactNode }) {
  return (
    <div className={CARD}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-2 text-[2.6rem] font-black leading-none tabular-nums tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="mt-1.5 text-xs font-semibold text-slate-400">{sub}</p>}
      {delta}
    </div>
  )
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className="font-bold tabular-nums text-white">{value.toLocaleString()}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

const LEVEL_COLOR: Record<string, string> = {
  Emergency: '#ef4444', ER: '#f43f5e', 'Urgent Care': '#f59e0b',
  'Primary Care': '#38bdf8', Telehealth: '#3b82f6', 'Home Care': '#22c55e',
}
function levelColor(k: string) { return LEVEL_COLOR[k] ?? '#64748b' }

export default function ResearchAdminPage() {
  const [key, setKey] = useState('')
  const [logs, setLogs] = useState<Entry[] | null>(null)
  const [reviews, setReviews] = useState<Rev[]>([])
  const [avg, setAvg] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const load = async () => {
    setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/research/logs', { headers: { 'x-metrics-key': key } })
      if (res.status === 401) { setErr('Wrong key.'); setLoading(false); return }
      const data = await res.json()
      setLogs(data.logs ?? [])
      setMetrics(data.metrics ?? null)
      const rr = await fetch('/api/reviews', { headers: { 'x-metrics-key': key } })
      if (rr.ok) { const rd = await rr.json(); setReviews(rd.reviews ?? []); setAvg(rd.average ?? null) }
    } catch { setErr('Failed to load.') }
    setLoading(false)
  }

  useEffect(() => {
    if (logs === null) return
    const t = setInterval(async () => {
      try { const r = await fetch('/api/research/logs', { headers: { 'x-metrics-key': key } }); if (r.ok) { const d = await r.json(); setMetrics(d.metrics ?? null) } } catch {}
    }, 20000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs === null])

  const remove = async (code: string) => {
    if (!confirm(`Delete shared conversation ${code}? This cannot be undone.`)) return
    await fetch(`/api/research/logs?code=${code}`, { method: 'DELETE', headers: { 'x-metrics-key': key } })
    setLogs(l => (l ?? []).filter(e => e.shareCode !== code))
  }

  // ── derived metrics ──
  const d = useMemo(() => {
    const m = metrics
    const sessions = m?.triageSessions ?? 0
    const recs = m?.recommendations ?? 0
    const er = m?.emergencyStops ?? 0
    const completion = sessions > 0 ? Math.round((recs / sessions) * 100) : 0
    const emergencyRate = sessions > 0 ? (er / sessions) * 100 : 0
    const recsPerSession = sessions > 0 ? (recs / sessions).toFixed(2) : '—'
    const tokPerSession = sessions > 0 && m ? Math.round(m.tokensUsed / sessions) : 0
    const costPerSession = sessions > 0 && m ? (m.estCostUsd / sessions) : 0
    const satisfaction = avg != null ? Math.round((avg / 5) * 100) : 0
    // care-route distribution from consented logs
    const dist: Record<string, number> = {}
    ;(logs ?? []).forEach(e => { const k = e.careLevel || 'Unknown'; dist[k] = (dist[k] ?? 0) + 1 })
    const distArr = Object.entries(dist).sort((a, b) => b[1] - a[1])
    const distMax = distArr.reduce((mx, [, v]) => Math.max(mx, v), 0)
    // rating distribution
    const rd = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }))
    const rdMax = rd.reduce((mx, r) => Math.max(mx, r.count), 0)
    return { sessions, recs, er, completion, emergencyRate, recsPerSession, tokPerSession, costPerSession, satisfaction, distArr, distMax, rd, rdMax }
  }, [metrics, logs, reviews, avg])

  const clock = new Date(now).toLocaleTimeString('en-US', { hour12: false })

  // ── login gate ──
  if (logs === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-5">
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#141d33] p-7 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-white/10 ring-1 ring-white/15">
              <img src="/brand/carevo-logo.png" alt="Carevo" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">Carevo Analytics</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-300">Internal · admin only</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-slate-400">Enter your admin key to load the live dashboard.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="password" value={key} onChange={e => setKey(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') load() }}
              placeholder="Admin key" aria-label="Admin key"
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
            <button onClick={load} disabled={loading} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
              {loading ? '…' : 'Load'}
            </button>
          </div>
          {err && <p className="mt-2 text-sm font-semibold text-red-400">{err}</p>}
        </div>
      </main>
    )
  }

  // ── dashboard ──
  return (
    <main className="min-h-screen bg-[#0b1220] px-4 py-4 text-slate-100 [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif] sm:px-6">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/15">
              <img src="/brand/carevo-logo.png" alt="Carevo" className="h-full w-full object-cover" />
            </span>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Live Analytics Dashboard</h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">Carevo · internal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
              Live · auto-refresh
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-sm font-bold tabular-nums text-slate-300">{clock}</span>
          </div>
        </header>

        {/* ── Top row: gauges + hero KPIs ── */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className={CARD}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Satisfaction</p>
            <div className="mt-3">
              <Gauge value={d.satisfaction} centerLabel={avg != null ? `${avg}★` : '—'} color="#22c55e" sub={`${reviews.length} reviews`} />
            </div>
          </div>
          <div className={CARD}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Completion rate</p>
            <div className="mt-3">
              <Gauge value={d.completion} centerLabel={`${d.completion}%`} color="#3b82f6" sub="recommendation reached" />
            </div>
          </div>
          <Kpi
            label="On site now" value={String(metrics?.activeNow ?? 0)} accent="text-emerald-400" sub="active in last 5 min"
            delta={<div className="mt-3 border-t border-white/[0.06] pt-3"><p className="text-2xl font-black tabular-nums text-white">{(metrics?.pageViews ?? 0).toLocaleString()}</p><p className="text-xs font-semibold text-slate-400">Page views · all time</p></div>}
          />
          <Kpi
            label="Triage sessions" value={(d.sessions).toLocaleString()} sub={`${d.recsPerSession} recommendations / session`}
            delta={<div className="mt-3 border-t border-white/[0.06] pt-3"><p className="text-2xl font-black tabular-nums text-white">{d.recs.toLocaleString()}</p><p className="text-xs font-semibold text-slate-400">Recommendations delivered</p></div>}
          />
        </section>

        {/* ── Middle row: safety + engagement + distribution ── */}
        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Emergency stops — alert card */}
          <div className={`${CARD} ${d.er > 0 ? 'ring-1 ring-red-500/30' : ''}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">911 / 988 stops</p>
            <p className="mt-2 text-[2.6rem] font-black leading-none tabular-nums text-red-400">{d.er.toLocaleString()}</p>
            <p className="mt-1.5 text-xs font-semibold text-slate-400">emergency hard-stops issued</p>
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <p className="text-xl font-black tabular-nums text-white">{d.emergencyRate.toFixed(1)}%</p>
              <p className="text-xs font-semibold text-slate-400">of triage sessions</p>
            </div>
          </div>

          {/* Tokens / cost */}
          <div className={CARD}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Model usage</p>
            <p className="mt-2 text-[2.6rem] font-black leading-none tabular-nums text-white">{((metrics?.tokensUsed ?? 0) / 1000).toFixed(0)}<span className="text-2xl text-slate-400">k</span></p>
            <p className="mt-1.5 text-xs font-semibold text-slate-400">tokens · ~${metrics?.estCostUsd ?? 0} total</p>
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <p className="text-xl font-black tabular-nums text-white">{d.tokPerSession.toLocaleString()}</p>
              <p className="text-xs font-semibold text-slate-400">tokens / session · ${d.costPerSession.toFixed(3)}</p>
            </div>
          </div>

          {/* Care-route distribution */}
          <div className={`${CARD} lg:col-span-2`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Care routes (consented sample)</p>
              <span className="text-[11px] font-semibold text-slate-500">{(logs ?? []).length} shared</span>
            </div>
            <div className="mt-4 space-y-3">
              {d.distArr.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No consented entries yet.</p>}
              {d.distArr.map(([k, v]) => <BarRow key={k} label={k} value={v} max={d.distMax} color={levelColor(k)} />)}
            </div>
          </div>
        </section>

        {/* ── Bottom row: rating distribution + feedback + entries ── */}
        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Rating distribution */}
          <div className={CARD}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Rating breakdown</p>
              {avg != null && <span className="text-sm font-black text-amber-400">★ {avg}</span>}
            </div>
            <div className="mt-4 space-y-2.5">
              {d.rd.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-bold text-slate-300">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${d.rdMax > 0 ? Math.max(count ? 4 : 0, (count / d.rdMax) * 100) : 0}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs font-bold tabular-nums text-slate-300">{count}</span>
                </div>
              ))}
              {reviews.length === 0 && <p className="pt-2 text-center text-sm text-slate-500">No reviews yet.</p>}
            </div>
          </div>

          {/* Recent feedback */}
          <div className={`${CARD} lg:col-span-2`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Recent feedback</p>
            <div className="mt-3 space-y-3">
              {reviews.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No reviews yet.</p>}
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-400">{'★'.repeat(r.rating)}<span className="text-white/15">{'★'.repeat(5 - r.rating)}</span></span>
                    <span className="text-[11px] text-slate-500">{r.name ?? 'Anonymous'} · {new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary tiles stacked */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`${CARD} flex flex-col justify-center`}>
              <p className="text-[2rem] font-black leading-none tabular-nums text-blue-300">{(logs ?? []).length}</p>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Shared symptoms</p>
            </div>
            <div className={`${CARD} flex flex-col justify-center`}>
              <p className="text-[2rem] font-black leading-none tabular-nums text-amber-400">{reviews.length}</p>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Total reviews</p>
            </div>
            <div className={`${CARD} col-span-2 flex flex-col justify-center`}>
              <p className="text-[2rem] font-black leading-none tabular-nums text-emerald-400">{d.completion}%</p>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Sessions reaching a recommendation</p>
            </div>
          </div>
        </section>

        {/* ── Consented conversation logs (confidential) ── */}
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">Consented conversations ({(logs ?? []).length})</h2>
            <span className="text-[11px] font-semibold text-slate-500">Confidential health info · transcripts collapsed</span>
          </div>
          <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-200/90">
            <strong>Handling rules:</strong> minimum access only, never copy into chat/email/docs unless required for review, remove entries immediately when a deletion code is provided, and do not use these rows for model training unless they pass clinician-approved review.
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(logs ?? []).length === 0 && <p className="text-sm text-slate-500">No consented entries yet.</p>}
            {(logs ?? []).map(e => (
              <article key={e.shareCode} className={CARD}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-slate-400">{e.shareCode} · {new Date(e.consentedAt).toLocaleString()}</span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-md px-2 py-1 text-[11px] font-bold text-white" style={{ background: levelColor(e.careLevel || '') }}>{e.careLevel ?? '—'}</span>
                    <button onClick={() => remove(e.shareCode)} className="rounded-md border border-red-500/30 px-2 py-1 text-[11px] font-bold text-red-300 transition hover:bg-red-500/10">Delete</button>
                  </span>
                </div>
                {e.factors.length > 0 && (
                  <p className="mt-2 text-[11px] text-slate-500">Factors: {e.factors.join(' · ')}{e.engineVersion ? ` · ${e.engineVersion}` : ''}</p>
                )}
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-xs font-semibold text-blue-300 transition hover:text-blue-200">View transcript ({e.messages.length} messages)</summary>
                  <div className="mt-2 space-y-1.5 border-t border-white/[0.05] pt-2">
                    {e.messages.map((m, i) => (
                      <p key={i} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-slate-200' : 'text-slate-400'}`}>
                        <strong>{m.role === 'user' ? 'Patient' : 'Carevo'}:</strong> {m.content}
                      </p>
                    ))}
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
