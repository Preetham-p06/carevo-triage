'use client'

import { useState, useEffect } from 'react'

interface MetricsData {
  totals: Record<string, number>
  daily: Record<string, Record<string, number>>
  careLevels: Record<string, number>
  outcomes: Record<string, number>
}

const EVENT_LABELS: Record<string, string> = {
  visit: 'Visits',
  chat_started: 'Chats started',
  triage_completed: 'Triages completed',
  emergency_shown: 'Emergencies flagged',
  avs_added: 'AVS entries added',
  checkin_completed: 'Recovery check-ins',
  history_saved: 'Health histories saved',
  outcome_feedback: 'Outcome feedback',
}

const CARE_LABELS: Record<string, string> = {
  emergency: 'Emergency', er: 'ER', urgent_care: 'Urgent care',
  primary_care: 'Primary care', telehealth: 'Telehealth', home_care: 'Home care',
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('key')
    fetch('/api/metrics' + (key ? `?key=${encodeURIComponent(key)}` : ''))
      .then(r => {
        if (r.status === 401) { setDenied(true); return null }
        return r.json()
      })
      .then(d => d && setData(d))
      .catch(() => {})
  }, [])

  if (denied) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm px-6 text-center">
        This dashboard is protected. Append ?key=YOUR_METRICS_KEY to the URL.
      </div>
    )
  }

  if (!data) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-sm">Loading metrics…</div>
  }

  const t = data.totals
  const visits = t.visit ?? 0
  const started = t.chat_started ?? 0
  const completed = t.triage_completed ?? 0
  const activation = visits ? Math.round((started / visits) * 100) : 0
  const completion = started ? Math.round((completed / started) * 100) : 0
  const rightPlace = data.outcomes.right_place ?? 0
  const wrongPlace = data.outcomes.wrong_place ?? 0
  const accuracy = rightPlace + wrongPlace ? Math.round((rightPlace / (rightPlace + wrongPlace)) * 100) : null

  const days = Object.keys(data.daily).sort().reverse().slice(0, 14)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">carevo <span className="text-carevo-400">metrics</span></h1>
          <p className="text-slate-500 text-sm mt-1">Internal dashboard — anonymous usage counts only.</p>
        </div>

        {/* Funnel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Visits', value: visits },
            { label: 'Chats started', value: started, sub: `${activation}% of visits` },
            { label: 'Triages completed', value: completed, sub: `${completion}% of chats` },
            { label: 'Reported right place', value: accuracy !== null ? `${accuracy}%` : '—', sub: `${rightPlace + wrongPlace} responses` },
          ].map(c => (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-3xl font-black text-carevo-400">{c.value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{c.label}</p>
              {c.sub && <p className="text-[11px] text-slate-600 mt-0.5">{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* All events */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wide">All events</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(EVENT_LABELS).map(([key, lbl]) => (
              <div key={key}>
                <p className="text-xl font-black">{t[key] ?? 0}</p>
                <p className="text-xs text-slate-500">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Care level distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wide">Recommendation mix</h2>
          {completed === 0 ? (
            <p className="text-slate-600 text-sm">No completed triages yet.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(CARE_LABELS).map(([key, lbl]) => {
                const count = data.careLevels[key] ?? 0
                const pct = completed ? Math.round((count / completed) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-32 shrink-0">{lbl}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-carevo-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-14 text-right shrink-0">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Daily */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
          <h2 className="font-bold text-sm text-slate-300 mb-4 uppercase tracking-wide">Last 14 days</h2>
          {days.length === 0 ? (
            <p className="text-slate-600 text-sm">No activity yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs">
                  <th className="text-left py-2 font-semibold">Date</th>
                  <th className="text-right py-2 font-semibold">Visits</th>
                  <th className="text-right py-2 font-semibold">Chats</th>
                  <th className="text-right py-2 font-semibold">Triages</th>
                  <th className="text-right py-2 font-semibold">AVS</th>
                  <th className="text-right py-2 font-semibold">Check-ins</th>
                </tr>
              </thead>
              <tbody>
                {days.map(day => {
                  const d = data.daily[day]
                  return (
                    <tr key={day} className="border-t border-slate-800">
                      <td className="py-2 text-slate-300">{day}</td>
                      <td className="py-2 text-right text-slate-400">{d.visit ?? 0}</td>
                      <td className="py-2 text-right text-slate-400">{d.chat_started ?? 0}</td>
                      <td className="py-2 text-right text-slate-400">{d.triage_completed ?? 0}</td>
                      <td className="py-2 text-right text-slate-400">{d.avs_added ?? 0}</td>
                      <td className="py-2 text-right text-slate-400">{d.checkin_completed ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
