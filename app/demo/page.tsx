'use client'

// Carevo Partner Console — DEMO. Public, simulated data only (labeled).
// The dashboard an insurer/ED partner would use: live case queue, routing
// traces, deflection stats. Share URL directly in applications: /demo
import { useState } from 'react'
import Link from 'next/link'

interface DemoCase {
  id: string; who: string; payer: string; summary: string
  level: 'Emergency' | 'ER' | 'Urgent Care' | 'Primary Care' | 'Telehealth' | 'Home Care'
  next: string; risk: 'High' | 'Moderate' | 'Low'; time: string; saved: string | null
  convo: [string, string][]           // [speaker, text]
  facts: string[]; rules: string[]; conf: string
}

const LEVEL_STYLE: Record<string, string> = {
  'Emergency': 'bg-red-100 text-red-700', 'ER': 'bg-red-50 text-red-600',
  'Urgent Care': 'bg-amber-50 text-amber-700', 'Primary Care': 'bg-sky-50 text-sky-700',
  'Telehealth': 'bg-blue-50 text-blue-700', 'Home Care': 'bg-emerald-50 text-emerald-700',
}
const RISK_STYLE: Record<string, string> = { High: 'text-red-600', Moderate: 'text-amber-600', Low: 'text-emerald-600' }

const CASES: DemoCase[] = [
  { id: 'P8821', who: 'R. Patel', payer: 'UnitedHealth', summary: 'Chest pressure — onset 3h, radiating to left arm', level: 'Emergency', next: 'Awaiting ER triage handoff', risk: 'High', time: '2m ago', saved: null,
    convo: [['Patient', 'chest feels really tight, started a few hours ago'], ['Carevo', 'That can be serious. Does it spread to your arm, jaw, or back?'], ['Patient', 'yeah, kind of aches into my left arm'], ['Carevo', '⚠ EMERGENCY — Please call 911 now or have someone take you to the nearest ER.']],
    facts: ['SYSTEM cardiac', 'SEVERITY high', 'ONSET 3h', 'RED FLAGS chest_pressure · arm_radiation'],
    rules: ['net.emergency_tier1 — chest pressure + arm radiation trips the pre-AI emergency net (AHA)'], conf: 'deterministic hard-stop' },
  { id: 'P8820', who: 'S. Torres', payer: 'Aetna', summary: 'Persistent fever 103.1°F, 48h — screens negative', level: 'Urgent Care', next: '2 in-network UCs within 3 mi', risk: 'Moderate', time: '9m ago', saved: '$1,850',
    convo: [['Patient', 'fever for two days, not going away'], ['Carevo', 'What number does your thermometer say?'], ['Patient', '103.1 this morning'], ['Carevo', 'Any stiff neck, or a rash anywhere?'], ['Patient', 'no rash, neck is fine'], ['Carevo', 'Keeping fluids down okay?'], ['Patient', 'yes, drinking fine']],
    facts: ['SYSTEM constitutional', 'FEVER 103.1°F', 'DURATION 48h', 'SCREENS stiff neck ✕ · rash ✕ · dehydration ✕'],
    rules: ['rf.high_fever_adult — sustained ≥103°F floors at urgent care (CDC)'], conf: '0.86' },
  { id: 'P8819', who: 'D. Brown', payer: 'Cigna', summary: 'Dyspnea on exertion, gradual ~2 months', level: 'Telehealth', next: 'Telehealth slot queued — 20 min', risk: 'Moderate', time: '14m ago', saved: '$2,400',
    convo: [['Patient', 'getting winded walking up stairs lately'], ['Carevo', 'Are you short of breath right now, sitting still?'], ['Patient', 'no, only when i push myself'], ['Carevo', 'Any chest pain when it happens?'], ['Patient', 'no pain, just puffing'], ['Carevo', 'How long has this been building?'], ['Patient', 'couple months maybe']],
    facts: ['SYSTEM respiratory', 'SEVERITY mild', 'ONSET gradual ~2mo', 'SCREENS rest dyspnea ✕ · chest pain ✕'],
    rules: ['none fired — engine scoring routed (no floors)'], conf: '0.74' },
  { id: 'P8818', who: 'K. Lee', payer: 'BCBS', summary: 'Ankle inversion injury, weight-bearing intact', level: 'Home Care', next: 'RICE + 48h follow-up nudge', risk: 'Low', time: '22m ago', saved: '$2,900',
    convo: [['Patient', 'rolled my ankle at practice yesterday, swollen'], ['Carevo', 'Can you put weight on it — does it look deformed?'], ['Patient', 'i can walk on it, just sore. looks normal'], ['Carevo', 'Is the pain stopping you from sleeping or daily stuff?'], ['Patient', 'not really']],
    facts: ['SYSTEM msk', 'MECHANISM inversion, 24h', 'WEIGHT-BEARING yes', 'SCREENS deformity ✕ · non-weight-bearing ✕'],
    rules: ['none fired — Ottawa-style screens negative'], conf: '0.81' },
  { id: 'P8817', who: 'M. Okafor', payer: 'Medicaid (OH)', summary: 'Limited English: "head very hot two day"', level: 'Telehealth', next: 'Interpreter-flagged telehealth referral', risk: 'Moderate', time: '31m ago', saved: '$2,100',
    convo: [['Patient', 'head very hot two day'], ['Carevo', 'What number does your thermometer say, or do you feel very hot to the touch?'], ['Patient', 'not know, feel hot'], ['Carevo', 'Are you keeping water down okay?'], ['Patient', 'no can eat good']],
    facts: ['SYSTEM constitutional', 'FEVER language (unmeasured)', 'HEDGED answers ×2', 'FLOOR fever-language: never home care'],
    rules: ['floor.fever_language — fever phrasing + hedged interview ⇒ telehealth minimum'], conf: 'floor-enforced' },
  { id: 'P8816', who: 'J. Nguyen', payer: 'UnitedHealth', summary: 'Pediatric: 8yo fever + wrist/ankle rash', level: 'ER', next: 'ER notified — pediatric fever+rash pattern', risk: 'High', time: '44m ago', saved: null,
    convo: [['Parent', 'my 8 y/o has a fever and a rash on his wrists and ankles'], ['Carevo', 'With that combination, he should be seen in the ER today. A doctor needs to look at that rash.']],
    facts: ['SYSTEM pediatric', 'FEVER present', 'RASH wrists/ankles', 'PATTERN fever+rash+extremities'],
    rules: ['raw.pediatric_fever_rash — deterministic ER floor, LLM-independent (RMSF pattern)'], conf: 'floor-enforced' },
]

function Trace({ c }: { c: DemoCase }) {
  return (
    <div className="grid gap-5 border-t border-slate-100 bg-slate-50/60 px-5 py-5 md:grid-cols-3">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Conversation</p>
        <div className="space-y-1.5">
          {c.convo.map(([sp, tx], i) => (
            <p key={i} className={`text-xs leading-relaxed ${sp === 'Carevo' ? 'text-sky-800' : 'text-slate-700'}`}>
              <strong className="font-bold">{sp}:</strong> {tx}
            </p>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Engine extraction</p>
        <div className="flex flex-wrap gap-1.5">
          {c.facts.map(f => <span key={f} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold text-slate-600">{f}</span>)}
        </div>
        <p className="mb-1.5 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rules fired</p>
        {c.rules.map(r => <p key={r} className="font-mono text-[11px] leading-relaxed text-slate-600">{r}</p>)}
      </div>
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Decision & provenance</p>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${LEVEL_STYLE[c.level]}`}>{c.level}</span>
        <p className="mt-2 text-xs font-semibold text-slate-600">Confidence: {c.conf}</p>
        <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 font-mono text-[10px] leading-relaxed text-slate-500">
          engine carevo-engine-1.1<br />rules carevo-rules-2026.07.0<br />kb carevo-kb-2026.07.0+r1<br />audit #a3f2…{c.id.slice(-2)}b · chain-verified ✓
        </p>
        <p className="mt-2 text-xs font-bold text-slate-700">Next: {c.next}</p>
      </div>
    </div>
  )
}

export default function PartnerDemoPage() {
  const [open, setOpen] = useState<string | null>('P8821')
  const [filter, setFilter] = useState<string>('All')
  const levels = ['All', 'Emergency', 'ER', 'Urgent Care', 'Telehealth', 'Home Care']
  const rows = CASES.filter(c => filter === 'All' || c.level === filter)

  return (
    <main className="min-h-screen bg-slate-100 px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-carevo-600">Carevo Partner Console</p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-slate-950">Pre-arrival triage queue</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Every case arrives with its full routing trace — before the patient does.</p>
          </div>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">Simulated data — pilot preview</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['24', 'Cases today'], ['9', 'ER visits deflected'], ['$21,400', 'Est. avoided cost'], ['0', 'Under-triage — ever']].map(([v, l]) => (
            <div key={l} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-black tabular-nums tracking-tight text-slate-950">{v}</p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {levels.map(l => (
            <button key={l} onClick={() => setFilter(l)}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${filter === l ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_140px_130px_90px_80px] gap-3 border-b border-slate-100 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid">
            <span>Case</span><span>Member · Payer</span><span>Routing</span><span>Risk</span><span>Time</span>
          </div>
          {rows.map(c => (
            <div key={c.id} className="border-b border-slate-100 last:border-0">
              <button onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}
                className="grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[1fr_140px_130px_90px_80px] md:items-center md:gap-3">
                <span>
                  <span className="text-sm font-bold text-slate-900">{c.summary}</span>
                  <span className="ml-2 font-mono text-[10px] font-bold text-sky-600">#{c.id}</span>
                  {c.saved && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">saved {c.saved}</span>}
                </span>
                <span className="text-xs font-semibold text-slate-500">{c.who} · {c.payer}</span>
                <span><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${LEVEL_STYLE[c.level]}`}>{c.level}</span></span>
                <span className={`text-xs font-black ${RISK_STYLE[c.risk]}`}>{c.risk}</span>
                <span className="text-xs font-semibold text-slate-400">{c.time}</span>
              </button>
              {open === c.id && <Trace c={c} />}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs font-semibold text-slate-400">
          All patients and payers on this page are fictional. Accuracy claims are real:{' '}
          <Link href="/benchmarks" className="font-black text-carevo-700 underline">see the published benchmarks</Link> ·{' '}
          <Link href="/contact" className="font-black text-carevo-700 underline">request a pilot</Link>
        </p>
      </div>
    </main>
  )
}
