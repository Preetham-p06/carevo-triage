'use client'

import { useState, useEffect, FormEvent } from 'react'
import { store, EMPTY_HISTORY, type PatientHistory, type ChatRecord } from '@/lib/store'
import { CARE_LEVEL_CONFIG } from '@/lib/types'
import { track } from '@/lib/metrics'
import { historySchema, getFieldErrors } from '@/lib/validation'
import { sanitizeObject } from '@/lib/sanitize'
import { IconUser, IconLock, IconShield, IconClock, IconFileText, IconCheck, CareLevelIcon } from '@/components/Icons'

export default function ProfilePage() {
  const [history, setHistory] = useState<PatientHistory>(EMPTY_HISTORY)
  const [chats, setChats]     = useState<ChatRecord[]>([])
  const [saved, setSaved]     = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setHistory(store.getHistory())
    setChats(store.getChats())
  }, [])

  function set<K extends keyof PatientHistory>(field: K, value: PatientHistory[K]) {
    setHistory(h => ({ ...h, [field]: value }))
  }

  function saveHistory(e: FormEvent) {
    e.preventDefault()
    // Validate with zod, then sanitize before storing
    const result = historySchema.safeParse(history)
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error))
      return
    }
    setFieldErrors({})
    const clean = sanitizeObject(history)
    setHistory(clean)
    store.saveHistory(clean)
    track('history_saved')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function clearAll() {
    if (!confirm('Clear all guest data on this device? This cannot be undone.')) return
    store.clearAll()
    setHistory(EMPTY_HISTORY)
    setChats([])
  }

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 min-h-[44px] text-base sm:text-sm outline-none focus:border-carevo-400 focus:ring-2 focus:ring-carevo-50 focus:bg-white transition-colors duration-200 placeholder:text-slate-400'
  const label = 'block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5'
  const select = input + ' appearance-none cursor-pointer'

  const securityFeatures = [
    { icon: IconLock, name: 'Face ID / biometric sign-in' },
    { icon: IconShield, name: 'Two-factor authentication (Duo)' },
    { icon: IconClock, name: 'Automatic session timeouts' },
    { icon: IconFileText, name: 'Full audit logging' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto p-4 space-y-4 pb-16">
        {/* Guest header */}
        <div className="pt-2 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-carevo-100 flex items-center justify-center text-carevo-700" aria-hidden="true">
            <IconUser className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink tracking-tight">Guest</h1>
            <p className="text-xs text-slate-500">All data stays on this device · nothing is uploaded</p>
          </div>
          <button onClick={clearAll} className="ml-auto text-xs text-slate-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200 min-h-[44px] px-2">
            Clear data
          </button>
        </div>

        {/* Recent chats */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="font-display font-bold text-ink mb-3">Recent chats</h2>
          {chats.length === 0 ? (
            <p className="text-sm text-slate-500">No care checks yet — start one from Home.</p>
          ) : (
            <div className="space-y-2">
              {chats.slice(0, 8).map(chat => {
                const cfg = chat.careLevel && chat.careLevel !== 'emergency' ? CARE_LEVEL_CONFIG[chat.careLevel] : null
                const firstUserMsg = chat.messages.find(m => m.role === 'user')?.content ?? ''
                const open = expanded === chat.id
                return (
                  <button key={chat.id} onClick={() => setExpanded(open ? null : chat.id)} aria-expanded={open}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-xl px-3.5 py-3 min-h-[44px] cursor-pointer transition-colors duration-200">
                    <div className="flex items-center gap-2.5">
                      <span className={`shrink-0 ${cfg?.color ?? 'text-red-600'}`}>
                        <CareLevelIcon level={chat.careLevel ?? 'emergency'} className="w-5 h-5" />
                      </span>
                      <p className="text-sm text-slate-700 truncate flex-1">{firstUserMsg}</p>
                      <span className="text-[11px] text-slate-500 shrink-0 tabular-nums">{new Date(chat.startedAt).toLocaleDateString()}</span>
                    </div>
                    {cfg && <p className={`text-xs font-bold mt-1 ${cfg.color}`}>{cfg.label}</p>}
                    {open && chat.reasoning && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{chat.reasoning}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Patient history */}
        <form id="history" onSubmit={saveHistory} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <div>
            <h2 className="font-display font-bold text-ink">Health history</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Carevo remembers this so it can personalize questions and skip what it already knows.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="h-age" className={label}>Age</label>
              <input id="h-age" value={history.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 34" inputMode="numeric"
                aria-invalid={!!fieldErrors.age} className={input + (fieldErrors.age ? ' border-red-400' : '')} />
              {fieldErrors.age && <p role="alert" className="text-red-600 text-xs mt-1">{fieldErrors.age}</p>}
            </div>
            <div>
              <label htmlFor="h-sex" className={label}>Sex</label>
              <select id="h-sex" value={history.sex} onChange={e => set('sex', e.target.value as PatientHistory['sex'])} className={select}>
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="intersex">Intersex</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="h-conditions" className={label}>Medical history</label>
            <textarea id="h-conditions" value={history.conditions} onChange={e => set('conditions', e.target.value)} rows={2}
              placeholder="e.g. asthma, type 2 diabetes, prior surgeries" className={input} />
          </div>

          <div>
            <label htmlFor="h-family" className={label}>Family history</label>
            <textarea id="h-family" value={history.familyHistory} onChange={e => set('familyHistory', e.target.value)} rows={2}
              placeholder="e.g. heart disease (father), breast cancer (aunt)" className={input} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="h-meds" className={label}>Current medications</label>
              <input id="h-meds" value={history.medications} onChange={e => set('medications', e.target.value)} placeholder="e.g. metformin" className={input} />
            </div>
            <div>
              <label htmlFor="h-allergies" className={label}>Allergies</label>
              <input id="h-allergies" value={history.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. penicillin" className={input} />
            </div>
          </div>

          <div>
            <label htmlFor="h-insurance" className={label}>Insurance</label>
            <input id="h-insurance" value={history.insurance} onChange={e => set('insurance', e.target.value)} placeholder="e.g. Aetna PPO, Medicaid, uninsured" className={input} />
          </div>

          {history.sex === 'female' && (
            <div>
              <label htmlFor="h-period" className={label}>Period history</label>
              <input id="h-period" value={history.periodHistory} onChange={e => set('periodHistory', e.target.value)}
                placeholder="e.g. regular, last period 2 weeks ago, pregnant" className={input} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="h-smoking" className={label}>Smoking</label>
              <select id="h-smoking" value={history.smoking} onChange={e => set('smoking', e.target.value as PatientHistory['smoking'])} className={select}>
                <option value="">Select…</option>
                <option value="never">Never</option>
                <option value="former">Former</option>
                <option value="current">Current</option>
              </select>
            </div>
            <div>
              <label htmlFor="h-vaping" className={label}>Vaping</label>
              <select id="h-vaping" value={history.vaping} onChange={e => set('vaping', e.target.value as PatientHistory['vaping'])} className={select}>
                <option value="">Select…</option>
                <option value="never">Never</option>
                <option value="former">Former</option>
                <option value="current">Current</option>
              </select>
            </div>
            <div>
              <label htmlFor="h-alcohol" className={label}>Alcohol</label>
              <select id="h-alcohol" value={history.alcohol} onChange={e => set('alcohol', e.target.value as PatientHistory['alcohol'])} className={select}>
                <option value="">Select…</option>
                <option value="none">None</option>
                <option value="occasional">Occasional</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div>
              <label htmlFor="h-drugs" className={label}>Other substance use</label>
              <input id="h-drugs" value={history.drugUse} onChange={e => set('drugUse', e.target.value)} placeholder="Optional" className={input} />
            </div>
          </div>

          <button type="submit" className="w-full bg-carevo-600 hover:bg-carevo-700 text-white font-display font-bold py-3 min-h-[48px] rounded-xl cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2">
            {saved ? (<><IconCheck className="w-4 h-4" /> Saved</>) : 'Save health history'}
          </button>
        </form>

        {/* Security — full app features */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="font-display font-bold text-ink mb-1">Security</h2>
          <p className="text-xs text-slate-500 mb-3">Guest demo runs without an account. The full app includes:</p>
          <div className="space-y-2">
            {securityFeatures.map(f => (
              <div key={f.name} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5 min-h-[44px]">
                <f.icon className="w-4 h-4 text-carevo-600 shrink-0" />
                <span className="text-sm text-slate-600 flex-1">{f.name}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Full app</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
