'use client'

// Carevo Partner Console — enterprise workspace demo (ServiceNow-style layout:
// left nav rail + KPI strip + master case queue + detail record with tabs).
// PUBLIC, fully SIMULATED data (labeled). Share URL directly: /demo
import { useState } from 'react'
import Link from 'next/link'

type Level = 'Emergency' | 'ER' | 'Urgent Care' | 'Primary Care' | 'Telehealth' | 'Home Care'
interface Case {
  id: string; who: string; age: string; payer: string; summary: string
  level: Level; risk: 'High' | 'Moderate' | 'Low'; status: string; sla: string
  next: string; saved: string | null
  convo: [string, string, string][]        // [speaker, text, t]
  facts: string[]; rules: string[]; conf: string
  activity: [string, string][]             // [time, event]
}

const LVL: Record<Level, string> = {
  'Emergency': 'bg-red-100 text-red-700 ring-red-200', 'ER': 'bg-red-50 text-red-600 ring-red-100',
  'Urgent Care': 'bg-amber-50 text-amber-700 ring-amber-100', 'Primary Care': 'bg-sky-50 text-sky-700 ring-sky-100',
  'Telehealth': 'bg-blue-50 text-blue-700 ring-blue-100', 'Home Care': 'bg-emerald-50 text-emerald-700 ring-emerald-100',
}
const RISKDOT: Record<string, string> = { High: 'bg-red-500', Moderate: 'bg-amber-500', Low: 'bg-emerald-500' }

const CASES: Case[] = [
  { id: 'CAS0008821', who: 'R. Patel', age: '58', payer: 'UnitedHealth', summary: 'Chest pressure — onset 3h, radiating to left arm', level: 'Emergency', risk: 'High', status: 'ED notified', sla: '2m ago', next: 'Awaiting ER triage handoff', saved: null,
    convo: [['Patient', "chest feels really tight, started a few hours ago", 't+0s'], ['Carevo', 'That can be serious. Does it spread to your arm, jaw, or back?', 't+2s'], ['Patient', 'yeah, kind of aches into my left arm', 't+31s'], ['Carevo', '⚠ EMERGENCY — call 911 now or get to the nearest ER. Do not drive yourself.', 't+33s']],
    facts: ['SYSTEM cardiac', 'SEVERITY high', 'ONSET 3h', 'RED FLAGS chest_pressure · arm_radiation'],
    rules: ['net.emergency_tier1 — chest pressure + arm radiation trips the pre-AI emergency net (AHA)'], conf: 'deterministic hard-stop',
    activity: [['t+0s', 'Case opened — patient began intake'], ['t+2s', 'Emergency net armed (cardiac terms)'], ['t+33s', '911 hard-stop issued'], ['t+41s', 'Trace forwarded to ED partner queue']] },
  { id: 'CAS0008820', who: 'S. Torres', age: '34', payer: 'Aetna', summary: 'Persistent fever 103.1°F, 48h — screens negative', level: 'Urgent Care', risk: 'Moderate', status: 'Routed', sla: '9m ago', next: '2 in-network UCs within 3 mi', saved: '$1,850',
    convo: [['Patient', 'fever for two days, not going away', 't+0s'], ['Carevo', 'What number does your thermometer say?', 't+2s'], ['Patient', '103.1 this morning', 't+24s'], ['Carevo', 'Any stiff neck, or a rash anywhere?', 't+26s'], ['Patient', 'no rash, neck is fine', 't+40s'], ['Carevo', 'Keeping fluids down okay?', 't+42s'], ['Patient', 'yes, drinking fine', 't+55s']],
    facts: ['SYSTEM constitutional', 'FEVER 103.1°F', 'DURATION 48h', 'SCREENS stiff neck ✕ · rash ✕ · dehydration ✕'],
    rules: ['rf.high_fever_adult — sustained ≥103°F floors at urgent care (CDC)'], conf: '0.86',
    activity: [['t+0s', 'Case opened'], ['t+2s', 'Clarify-first: temperature requested'], ['t+42s', 'Meningitis + dehydration screens cleared'], ['t+56s', 'Routed · in-network UC list attached']] },
  { id: 'CAS0008819', who: 'D. Brown', age: '61', payer: 'Cigna', summary: 'Dyspnea on exertion, gradual ~2 months', level: 'Telehealth', risk: 'Moderate', status: 'Queued', sla: '14m ago', next: 'Telehealth slot queued — 20 min', saved: '$2,400',
    convo: [['Patient', 'getting winded walking up stairs lately', 't+0s'], ['Carevo', 'Are you short of breath right now, sitting still?', 't+2s'], ['Patient', 'no, only when i push myself', 't+22s'], ['Carevo', 'Any chest pain when it happens?', 't+24s'], ['Patient', 'no pain, just puffing', 't+40s'], ['Carevo', 'How long has this been building?', 't+42s'], ['Patient', 'couple months maybe', 't+58s']],
    facts: ['SYSTEM respiratory', 'SEVERITY mild', 'ONSET gradual ~2mo', 'SCREENS rest dyspnea ✕ · chest pain ✕'],
    rules: ['none fired — engine scoring routed (no floors)'], conf: '0.74',
    activity: [['t+0s', 'Case opened'], ['t+24s', 'Cardiac red-flag screen cleared'], ['t+59s', 'Scoring model routed · telehealth slot held']] },
  { id: 'CAS0008818', who: 'K. Lee', age: '22', payer: 'BCBS', summary: 'Ankle inversion injury, weight-bearing intact', level: 'Home Care', risk: 'Low', status: 'Closed', sla: '22m ago', next: 'RICE + 48h follow-up nudge', saved: '$2,900',
    convo: [['Patient', 'rolled my ankle at practice yesterday, swollen', 't+0s'], ['Carevo', 'Can you put weight on it — does it look deformed?', 't+2s'], ['Patient', 'i can walk on it, just sore. looks normal', 't+28s'], ['Carevo', 'Is the pain stopping you from sleeping or daily stuff?', 't+30s'], ['Patient', 'not really', 't+52s']],
    facts: ['SYSTEM msk', 'MECHANISM inversion, 24h', 'WEIGHT-BEARING yes', 'SCREENS deformity ✕ · non-weight-bearing ✕'],
    rules: ['none fired — Ottawa-style screens negative'], conf: '0.81',
    activity: [['t+0s', 'Case opened'], ['t+2s', 'Clarify-first: weight-bearing asked'], ['t+53s', 'Home care · 48h re-check scheduled']] },
  { id: 'CAS0008817', who: 'M. Okafor', age: '41', payer: 'Medicaid (OH)', summary: 'Limited English: "head very hot two day"', level: 'Telehealth', risk: 'Moderate', status: 'Routed', sla: '31m ago', next: 'Interpreter-flagged telehealth referral', saved: '$2,100',
    convo: [['Patient', 'head very hot two day', 't+0s'], ['Carevo', 'What number does your thermometer say, or do you feel very hot to the touch?', 't+2s'], ['Patient', 'not know, feel hot', 't+20s'], ['Carevo', 'Are you keeping water down okay?', 't+22s'], ['Patient', 'no can eat good', 't+38s']],
    facts: ['SYSTEM constitutional', 'FEVER language (unmeasured)', 'HEDGED answers ×2', 'FLOOR fever-language: never home care'],
    rules: ['floor.fever_language — fever phrasing + hedged interview ⇒ telehealth minimum'], conf: 'floor-enforced',
    activity: [['t+0s', 'Case opened · limited-English detected'], ['t+22s', 'Hedge counter tripped (×2)'], ['t+39s', 'Safety floor held · interpreter flag set']] },
  { id: 'CAS0008816', who: 'J. Nguyen', age: '8', payer: 'UnitedHealth', summary: 'Pediatric: fever + wrist/ankle rash', level: 'ER', risk: 'High', status: 'ED notified', sla: '44m ago', next: 'ER notified — pediatric fever+rash pattern', saved: null,
    convo: [['Parent', 'my 8 y/o has a fever and a rash on his wrists and ankles', 't+0s'], ['Carevo', 'With that combination, he should be seen in the ER today. A doctor needs to look at that rash.', 't+3s']],
    facts: ['SYSTEM pediatric', 'FEVER present', 'RASH wrists/ankles', 'PATTERN fever+rash+extremities'],
    rules: ['raw.pediatric_fever_rash — deterministic ER floor, LLM-independent (RMSF pattern)'], conf: 'floor-enforced',
    activity: [['t+0s', 'Case opened (guardian intake)'], ['t+3s', 'Pediatric fever+rash floor fired'], ['t+9s', 'ER partner notified with trace']] },
]

const NAV = [
  ['Pre-arrival Queue', 'M4 6h16M4 12h16M4 18h10', true],
  ['All Cases', 'M4 6h16M4 12h16M4 18h16', false],
  ['Deflection Impact', 'M3 17l6-6 4 4 8-8', false],
  ['Audit Log', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2', false],
  ['Analytics', 'M4 20V10M10 20V4M16 20v-8M22 20h-20', false],
  ['Payers', 'M3 7h18v10H3zM3 11h18', false],
]
const KPIS = [
  ['24', 'Cases today', ''], ['9', 'ER visits deflected', 'text-emerald-600'],
  ['$21,400', 'Avoided cost', 'text-emerald-600'], ['1m 40s', 'Avg handoff time', ''],
  ['0', 'Under-triage · all-time', 'text-slate-900'],
]

export default function PartnerConsole() {
  const [sel, setSel] = useState(CASES[0].id)
  const [tab, setTab] = useState<'overview' | 'trace' | 'activity'>('overview')
  const [q, setQ] = useState('')
  const c = CASES.find(x => x.id === sel)!
  const rows = CASES.filter(x => (x.summary + x.who + x.payer + x.id).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="fixed inset-0 flex bg-slate-100 text-slate-900 [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]">
      {/* Left nav rail */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
        <Link href="/" className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-white/10"><img src="/brand/carevo-logo.png" alt="" className="h-full w-full object-cover" /></span>
          <span className="text-[15px] font-black tracking-tight text-white">carevo</span>
          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-300">Partner</span>
        </Link>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map(([label, path, active]) => (
            <div key={label as string} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-bold ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path as string} /></svg>
              {label}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3 text-[10px] font-semibold leading-relaxed text-slate-500">
          Simulated environment.<br />No real patient data.
        </div>
      </aside>

      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <p className="text-sm font-semibold text-slate-400">Carevo <span className="text-slate-300">›</span> <span className="font-black text-slate-800">Pre-arrival Queue</span></p>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search cases…" className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-semibold placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none" />
            </div>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">Simulated data</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">P</span>
          </div>
        </header>

        {/* KPI strip */}
        <div className="grid shrink-0 grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-5">
          {KPIS.map(([v, l, a]) => (
            <div key={l as string} className="bg-white px-5 py-3">
              <p className={`text-xl font-black tabular-nums tracking-tight ${a || 'text-slate-900'}`}>{v}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l}</p>
            </div>
          ))}
        </div>

        {/* Master + detail */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Case list */}
          <div className="w-full shrink-0 overflow-y-auto border-b border-slate-200 lg:w-[380px] lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-[16px_1fr_auto] items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span></span><span>Case</span><span>Level</span>
            </div>
            {rows.map(x => (
              <button key={x.id} onClick={() => { setSel(x.id); setTab('overview') }}
                className={`grid w-full grid-cols-[16px_1fr_auto] items-center gap-2 border-b border-slate-100 px-4 py-3 text-left transition ${sel === x.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${RISKDOT[x.risk]}`} title={`${x.risk} risk`} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">{x.summary}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">{x.who}, {x.age} · {x.payer} · <span className="font-mono">{x.id}</span></span>
                </span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black ring-1 ${LVL[x.level]}`}>{x.level}</span>
              </button>
            ))}
          </div>

          {/* Detail record */}
          <div className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${LVL[c.level]}`}>{c.level}</span>
                <h1 className="text-lg font-black tracking-tight text-slate-900">{c.summary}</h1>
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-slate-500"><span className={`h-2 w-2 rounded-full ${RISKDOT[c.risk]}`} />{c.risk} risk</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-semibold text-slate-500">
                <span>Case <span className="font-mono text-slate-700">{c.id}</span></span>
                <span>Member <span className="text-slate-700">{c.who}, {c.age}</span></span>
                <span>Payer <span className="text-slate-700">{c.payer}</span></span>
                <span>Status <span className="text-slate-700">{c.status}</span></span>
                <span>Updated <span className="text-slate-700">{c.sla}</span></span>
                {c.saved && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-black text-emerald-700">saved {c.saved}</span>}
              </div>
              <div className="mt-4 flex gap-1 border-b border-slate-100">
                {([['overview', 'Overview'], ['trace', 'Routing trace'], ['activity', 'Activity']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold transition ${tab === k ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {tab === 'overview' && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Recommended next step</p>
                    <p className="text-sm font-bold text-slate-900">{c.next}</p>
                    <p className="mt-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Engine confidence</p>
                    <p className="text-sm font-semibold text-slate-700">{c.conf}</p>
                    {c.saved && <><p className="mt-4 mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated cost avoided</p><p className="text-2xl font-black tracking-tight text-emerald-600">{c.saved}</p></>}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Extracted clinical facts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.facts.map(f => <span key={f} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-600">{f}</span>)}
                    </div>
                  </div>
                </div>
              )}
              {tab === 'trace' && (
                <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient conversation</p>
                    <div className="space-y-2.5">
                      {c.convo.map(([sp, tx, t], i) => (
                        <div key={i} className={`flex flex-col ${sp === 'Carevo' ? 'items-start' : 'items-end'}`}>
                          <div className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs font-semibold leading-relaxed ${sp === 'Carevo' ? 'bg-sky-50 text-sky-900' : 'bg-slate-900 text-slate-50'}`}>{tx}</div>
                          <span className="mt-0.5 font-mono text-[9px] text-slate-400">{sp} · {t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical rules fired</p>
                      {c.rules.map(r => <p key={r} className="font-mono text-[11px] leading-relaxed text-slate-600">{r}</p>)}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Provenance · replayable</p>
                      <p className="font-mono text-[10px] leading-relaxed text-slate-300">
                        engine&nbsp;carevo-engine-1.1<br />rules&nbsp;carevo-rules-2026.07.0<br />kb&nbsp;carevo-kb-2026.07.0+r1<br />audit&nbsp;#a3f2…{c.id.slice(-2)}b<br /><span className="text-emerald-400">chain-verified ✓</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'activity' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <ol className="relative ml-2 border-l border-slate-200">
                    {c.activity.map(([t, e], i) => (
                      <li key={i} className="mb-5 ml-5 last:mb-0">
                        <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                        <p className="font-mono text-[10px] font-bold text-slate-400">{t}</p>
                        <p className="text-sm font-semibold text-slate-700">{e}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <p className="px-6 pb-8 text-center text-xs font-semibold text-slate-400">
              All patients and payers are fictional. Accuracy claims are real —{' '}
              <Link href="/benchmarks" className="font-black text-blue-600 underline">published benchmarks</Link> ·{' '}
              <Link href="/contact" className="font-black text-blue-600 underline">request a pilot</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
