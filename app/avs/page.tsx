'use client'

import { useState, useEffect, FormEvent } from 'react'
import { store, uid, type AvsEntry, type CheckIn } from '@/lib/store'
import { track } from '@/lib/metrics'
import { avsEntrySchema, checkInSchema, getFieldErrors } from '@/lib/validation'
import { sanitizeObject } from '@/lib/sanitize'
import { IconClipboard, IconPill, IconCalendar, IconBell, IconCheck } from '@/components/Icons'

const EMPTY_FORM = { visitDate: '', facility: '', visitSummary: '', medications: '', followUps: '', notes: '' }

export default function AvsPage() {
  const [entries, setEntries]   = useState<AvsEntry[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [form, setForm]         = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saved, setSaved]       = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Check-in state
  const [checkinFor, setCheckinFor]   = useState<string | null>(null)
  const [takingMeds, setTakingMeds]   = useState<CheckIn['takingMeds'] | ''>('')
  const [feeling, setFeeling]         = useState<CheckIn['feelingBetter'] | ''>('')
  const [newSymptoms, setNewSymptoms] = useState('')
  const [checkinDone, setCheckinDone] = useState(false)

  useEffect(() => {
    setEntries(store.getAvs())
    setCheckins(store.getCheckIns())
    if (window.location.hash === '#checkin' && store.getAvs().length > 0) {
      setCheckinFor(store.getAvs()[0].id)
    }
  }, [])

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function saveEntry(e: FormEvent) {
    e.preventDefault()
    // Validate with zod, then sanitize before storing
    const result = avsEntrySchema.safeParse(form)
    if (!result.success) {
      setFormErrors(getFieldErrors(result.error))
      return
    }
    setFormErrors({})
    const clean = sanitizeObject(form)
    const entry: AvsEntry = { id: uid(), addedAt: Date.now(), ...clean }
    store.saveAvs(entry)
    setEntries(store.getAvs())
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaved(true)
    track('avs_added')
    setTimeout(() => setSaved(false), 3000)
  }

  function submitCheckIn(e: FormEvent) {
    e.preventDefault()
    if (!checkinFor) return
    const result = checkInSchema.safeParse({ takingMeds, feelingBetter: feeling, newSymptoms })
    if (!result.success) return
    const clean = sanitizeObject({ newSymptoms: newSymptoms.trim() })
    const c: CheckIn = {
      id: uid(), avsId: checkinFor, date: Date.now(),
      takingMeds: takingMeds as CheckIn['takingMeds'], feelingBetter: feeling as CheckIn['feelingBetter'],
      newSymptoms: clean.newSymptoms,
    }
    store.saveCheckIn(c)
    setCheckins(store.getCheckIns())
    track('checkin_completed', { feeling })
    setCheckinDone(true)
    setCheckinFor(null)
    setTakingMeds(''); setFeeling(''); setNewSymptoms('')
    setTimeout(() => setCheckinDone(false), 4000)
  }

  const lastCheckinFor = (avsId: string) =>
    checkins.filter(c => c.avsId === avsId).sort((a, b) => b.date - a.date)[0]

  const input = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 min-h-[44px] text-base sm:text-sm outline-none focus:border-carevo-400 focus:ring-2 focus:ring-carevo-50 focus:bg-white transition-colors duration-200 placeholder:text-slate-400'
  const label = 'block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5'
  const pill = (active: boolean) =>
    `text-sm font-medium px-3.5 py-2.5 min-h-[44px] rounded-xl border cursor-pointer transition-colors duration-200 ${
      active ? 'bg-carevo-600 text-white border-carevo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-carevo-300'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto p-4 space-y-4 pb-16">
        <div className="pt-2">
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">After Care</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add your after-visit summary and Carevo will track your recovery — meds, follow-ups, and check-ins.
          </p>
        </div>

        {saved && (
          <div role="status" className="bg-accent-50 border border-accent-100 rounded-xl px-4 py-3 text-accent-700 text-sm font-medium flex items-center gap-2">
            <IconCheck className="w-4 h-4 shrink-0" /> Visit summary saved. Carevo will use this to check in on your recovery.
          </div>
        )}
        {checkinDone && (
          <div role="status" className="bg-accent-50 border border-accent-100 rounded-xl px-4 py-3 text-accent-700 text-sm font-medium flex items-center gap-2">
            <IconCheck className="w-4 h-4 shrink-0" /> Check-in recorded. If anything gets worse, start a new care check from Home.
          </div>
        )}

        {/* Add AVS */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="w-full bg-carevo-600 hover:bg-carevo-700 text-white font-display font-bold py-3.5 min-h-[48px] rounded-2xl cursor-pointer transition-colors duration-200">
            + Add after-visit summary
          </button>
        ) : (
          <form onSubmit={saveEntry} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
            <h2 className="font-display font-bold text-ink">New visit summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="avs-date" className={label}>Visit date</label>
                <input id="avs-date" type="date" value={form.visitDate} onChange={e => set('visitDate', e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="avs-facility" className={label}>Facility / doctor</label>
                <input id="avs-facility" value={form.facility} onChange={e => set('facility', e.target.value)} placeholder="e.g. CityMD Urgent Care" className={input} />
              </div>
            </div>
            <div>
              <label htmlFor="avs-visit-summary" className={label}>Visit summary from provider</label>
              <input id="avs-visit-summary" value={form.visitSummary} onChange={e => set('visitSummary', e.target.value)} placeholder="What the provider told you"
                aria-invalid={!!formErrors.visitSummary} className={input + (formErrors.visitSummary ? ' border-red-400' : '')} />
              {formErrors.visitSummary && <p role="alert" className="text-red-600 text-xs mt-1">{formErrors.visitSummary}</p>}
            </div>
            <div>
              <label htmlFor="avs-meds" className={label}>Medications prescribed</label>
              <input id="avs-meds" value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="e.g. Amoxicillin 500mg, 3x daily for 10 days" className={input} />
            </div>
            <div>
              <label htmlFor="avs-followups" className={label}>Follow-up instructions</label>
              <input id="avs-followups" value={form.followUps} onChange={e => set('followUps', e.target.value)} placeholder="e.g. See PCP in 2 weeks" className={input} />
            </div>
            <div>
              <label htmlFor="avs-notes" className={label}>Notes</label>
              <textarea id="avs-notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Anything else from the visit"
                aria-invalid={!!formErrors.notes} className={input + (formErrors.notes ? ' border-red-400' : '')} />
              {formErrors.notes && <p role="alert" className="text-red-600 text-xs mt-1">{formErrors.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-carevo-600 hover:bg-carevo-700 text-white font-display font-bold py-3 min-h-[48px] rounded-xl cursor-pointer transition-colors duration-200">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 min-h-[44px] text-slate-500 text-sm font-medium hover:text-slate-700 cursor-pointer transition-colors duration-200">Cancel</button>
            </div>
          </form>
        )}

        {/* Entries + check-ins */}
        <div id="checkin" className="space-y-3">
          {entries.length === 0 && !showForm && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <IconClipboard className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 mt-3">No visit summaries yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                After a doctor&apos;s visit, add your summary here. Carevo will remind you about meds and check how you&apos;re recovering.
              </p>
            </div>
          )}

          {entries.map(entry => {
            const last = lastCheckinFor(entry.id)
            const isCheckingIn = checkinFor === entry.id
            return (
              <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold text-ink text-sm">{entry.visitSummary || 'Visit summary'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {entry.facility && `${entry.facility} · `}{entry.visitDate || new Date(entry.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {last && (
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      last.feelingBetter === 'better' ? 'bg-accent-50 text-accent-700'
                      : last.feelingBetter === 'same' ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {last.feelingBetter === 'better' ? 'Improving' : last.feelingBetter === 'same' ? 'No change' : 'Worse'}
                    </span>
                  )}
                </div>

                {entry.medications && (
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                    <IconPill className="w-4 h-4 text-carevo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Medications</p>
                      <p className="text-sm text-slate-700">{entry.medications}</p>
                    </div>
                  </div>
                )}
                {entry.followUps && (
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                    <IconCalendar className="w-4 h-4 text-carevo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Follow-up</p>
                      <p className="text-sm text-slate-700">{entry.followUps}</p>
                    </div>
                  </div>
                )}

                {isCheckingIn ? (
                  <form onSubmit={submitCheckIn} className="border-t border-slate-100 pt-3 space-y-3">
                    <p className="text-sm font-display font-bold text-ink">How&apos;s your recovery going?</p>
                    <fieldset>
                      <legend className={label}>Taking meds as prescribed?</legend>
                      <div className="flex gap-2 flex-wrap">
                        {([['yes', 'Yes'], ['partially', 'Partially'], ['no', 'No'], ['na', 'No meds']] as const).map(([v, l]) => (
                          <button key={v} type="button" onClick={() => setTakingMeds(v)} aria-pressed={takingMeds === v} className={pill(takingMeds === v)}>{l}</button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className={label}>Feeling better?</legend>
                      <div className="flex gap-2 flex-wrap">
                        {([['better', 'Better'], ['same', 'The same'], ['worse', 'Worse']] as const).map(([v, l]) => (
                          <button key={v} type="button" onClick={() => setFeeling(v)} aria-pressed={feeling === v} className={pill(feeling === v)}>{l}</button>
                        ))}
                      </div>
                    </fieldset>
                    <div>
                      <label htmlFor="checkin-symptoms" className={label}>New symptoms or side effects?</label>
                      <input id="checkin-symptoms" value={newSymptoms} onChange={e => setNewSymptoms(e.target.value)} placeholder="Leave blank if none" className={input} />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={!takingMeds || !feeling}
                        className="flex-1 bg-carevo-600 hover:bg-carevo-700 disabled:opacity-30 text-white font-display font-bold py-2.5 min-h-[44px] rounded-xl cursor-pointer transition-colors duration-200">
                        Submit check-in
                      </button>
                      <button type="button" onClick={() => setCheckinFor(null)} className="px-4 min-h-[44px] text-slate-500 text-sm font-medium cursor-pointer">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setCheckinFor(entry.id)}
                    className="w-full bg-carevo-50 hover:bg-carevo-100 text-carevo-700 font-display font-bold text-sm py-2.5 min-h-[44px] rounded-xl cursor-pointer transition-colors duration-200">
                    Check in on this visit
                  </button>
                )}

                {last && (
                  <p className="text-[11px] text-slate-500">
                    Last check-in {new Date(last.date).toLocaleDateString()}
                    {last.newSymptoms && ` · reported: ${last.newSymptoms}`}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Reminders note */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
          <IconBell className="w-5 h-5 text-carevo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-display font-bold text-ink">Automatic reminders</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              In the full app, Carevo sends medication reminders and periodic check-in notifications based on your visit summary. In this demo, check in manually anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
