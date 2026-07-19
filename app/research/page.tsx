'use client'

// Admin-only viewer for consent-shared conversations (METRICS_KEY-gated via
// the API; this page just collects the key and renders). Not linked anywhere
// public. Deletion by share code handles user erasure requests.
import { useState } from 'react'

interface Entry {
  shareCode: string
  consentedAt: string
  messages: { role: string; content: string }[]
  careLevel: string | null
  factors: string[]
  engineVersion: string | null
}

export default function ResearchAdminPage() {
  const [key, setKey] = useState('')
  const [logs, setLogs] = useState<Entry[] | null>(null)
  const [err, setErr] = useState('')

  const load = async () => {
    setErr('')
    try {
      const res = await fetch('/api/research/logs', { headers: { 'x-metrics-key': key } })
      if (res.status === 401) { setErr('Wrong key.'); return }
      const data = await res.json()
      setLogs(data.logs ?? [])
    } catch { setErr('Failed to load.') }
  }

  const remove = async (code: string) => {
    if (!confirm(`Delete shared conversation ${code}? This cannot be undone.`)) return
    await fetch(`/api/research/logs?code=${code}`, { method: 'DELETE', headers: { 'x-metrics-key': key } })
    setLogs(l => (l ?? []).filter(e => e.shareCode !== code))
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 pt-28 pb-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Shared conversations (admin)</h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          User-consented quality-review logs. Treat as confidential health information, never export casually,
          and honor deletion codes promptly.
        </p>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          <strong>Admin handling rules:</strong> minimum access only, do not copy into chat/email/docs unless required
          for review, remove entries immediately when a deletion code is provided, and do not use these rows for model
          training unless they pass the clinician-approved review process.
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="password" value={key} onChange={e => setKey(e.target.value)}
            placeholder="Admin key" aria-label="Admin key"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
          />
          <button onClick={load} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white">Load</button>
        </div>
        {err && <p className="mt-2 text-sm font-semibold text-red-600">{err}</p>}
        {logs !== null && (
          <p className="mt-4 text-sm font-semibold text-slate-600">{logs.length} shared conversation{logs.length === 1 ? '' : 's'}</p>
        )}
        <div className="mt-3 space-y-4">
          {(logs ?? []).map(e => (
            <article key={e.shareCode} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono">{e.shareCode} · {new Date(e.consentedAt).toLocaleString()}</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-carevo-50 px-2 py-1 font-bold text-carevo-700">{e.careLevel ?? '—'}</span>
                  <button onClick={() => remove(e.shareCode)} className="rounded-full border border-red-200 px-2 py-1 font-bold text-red-600 hover:bg-red-50">Delete</button>
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                {e.messages.map((m, i) => (
                  <p key={i} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-slate-800' : 'text-slate-400'}`}>
                    <strong>{m.role === 'user' ? 'Patient' : 'Carevo'}:</strong> {m.content}
                  </p>
                ))}
              </div>
              {e.factors.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-400">Factors: {e.factors.join(' · ')} {e.engineVersion ? `· ${e.engineVersion}` : ''}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
