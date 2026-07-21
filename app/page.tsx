'use client'

import { redirect } from 'next/navigation'
import { useState, useRef, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import type { Message, TriageRecommendation, Facility } from '@/lib/types'
import { CARE_LEVEL_CONFIG } from '@/lib/types'
import { store, uid, type PatientHistory } from '@/lib/store'
import { track, trackVisitOnce } from '@/lib/metrics'
import { sanitize } from '@/lib/sanitize'
import {
  IconMic, IconSend, IconBack, IconArrowRight, IconAlert, IconDollar,
  IconClipboard, IconPill, IconStethoscope, IconChat, IconCheck,
  IconThumbsUp, IconThumbsDown, IconHelpCircle, IconSparkle, CareLevelIcon,
  IconShield, IconLock, IconZap, IconHome, IconVideo, IconHospital,
  IconClock, IconTrendUp, IconHeart,
} from '@/components/Icons'

type AppState = 'landing' | 'chatting' | 'thinking' | 'result' | 'emergency'
type HomePagePresentation = 'full' | 'embed' | 'inline'

const OPENING_PROMPT = 'What symptoms are you worried about, and how long have you had them?'

// ── Nearby Facilities ─────────────────────────────────────────────────────────

const FACILITY_LABELS: Partial<Record<string, string>> = {
  emergency:    'Nearest Emergency Rooms',
  er:           'Nearest Emergency Rooms',
  urgent_care:  'Nearest Urgent Care Centers',
  primary_care: 'Nearby Primary Care Clinics',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.floor(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-slate-500 ml-1 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  )
}

function NearbyFacilities({ careLevel }: { careLevel: string }) {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading]       = useState(true)
  const [denied, setDenied]         = useState(false)
  const [sample, setSample]         = useState(false)
  const [mapUrl, setMapUrl]         = useState<string | null>(null)
  const label = FACILITY_LABELS[careLevel]
  if (!label) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch('/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ careLevel, lat: coords.latitude, lng: coords.longitude }),
          })
          const data = await res.json()
          setFacilities(data.facilities ?? [])
          setSample(!!data.sample)
          setMapUrl(data.mapUrl ?? null)
        } catch { setFacilities([]) }
        finally  { setLoading(false) }
      },
      () => { setDenied(true); setLoading(false) },
      { timeout: 8000 },
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section aria-label={label} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {mapUrl && (
        // Maps Static API image — real map with numbered markers matching the
        // list below; blue dot is the user. Renders within CSP (img-src https:).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mapUrl} alt="Map of nearby care options" className="w-full h-40 sm:h-48 object-cover border-b border-slate-200" />
      )}
      {sample && !loading && (
        <p className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-[11px] font-semibold text-amber-700">
          Sample listings shown — live results need the Places API enabled for this key.
        </p>
      )}
      <div className="bg-carevo-600 px-4 py-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="font-display font-bold text-white text-sm">{label}</h2>
      </div>
      <div className="p-3 space-y-2">
        {loading && [1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        {denied && !loading && (
          <div className="text-center py-5">
            <p className="text-sm text-slate-600 font-medium">Location access needed</p>
            <p className="text-xs text-slate-400 mt-1">Settings → Privacy → Location Services → Browser</p>
          </div>
        )}
        {!loading && !denied && facilities.length === 0 && <p className="text-sm text-slate-500 text-center py-5">No facilities found nearby.</p>}
        {!loading && facilities.map((f, i) => (
          <a key={f.placeId} href={f.mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-start justify-between p-3 min-h-[56px] rounded-xl bg-slate-50 hover:bg-carevo-50 border border-transparent hover:border-carevo-100 transition-colors duration-200 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${i === 0 ? 'bg-carevo-600 text-white' : 'bg-slate-200 text-slate-600'}`} aria-hidden="true">{i + 1}</div>
              <div className="min-w-0">
                <p className="font-semibold text-ink text-sm truncate group-hover:text-carevo-700 transition-colors">{f.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{f.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  {f.openNow !== undefined && <span className={`text-xs font-semibold ${f.openNow ? 'text-accent' : 'text-red-500'}`}>{f.openNow ? '● Open' : '● Closed'}</span>}
                  {f.rating != null && <StarRating rating={f.rating} />}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 ml-2">
              {f.distance && <span className="text-xs font-bold text-carevo-700 bg-carevo-50 border border-carevo-100 px-2 py-0.5 rounded-full tabular-nums">{f.distance}</span>}
              <svg className="w-4 h-4 text-slate-300 group-hover:text-carevo-500 transition-colors mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        ))}
        {!loading && facilities.length > 0 && <p className="text-[11px] text-slate-400 text-center pt-1">Tap for directions · Call ahead for wait times</p>}
      </div>
    </section>
  )
}

// ── Coverage options card ────────────────────────────────────────────────────

type CoveragePlan = {
  name: string
  issuer: string
  metalLevel: string
  monthlyPremium: number
  deductible: number | null
}

type CoverageResponse = {
  configured: boolean
  options: {
    eligibility: {
      likelyMedicaidOrChip: boolean
      estimatedMonthlyCredit: number | null
    } | null
    samplePlans: CoveragePlan[]
    provenance: { source: string; retrievedAt: string }
  } | null
  error?: string
}

function parseAges(raw: string) {
  return raw
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isInteger(n) && n >= 0 && n <= 120)
}

function ShareConversationCard({ messages, recommendation }: { messages: Message[]; recommendation: TriageRecommendation | null }) {
  const [agreed, setAgreed]   = useState(false)   // un-checked by default — explicit opt-in
  const [state, setState]     = useState<'idle' | 'sending' | 'done' | 'hidden' | 'error'>('idle')
  const [shareCode, setShareCode] = useState('')

  if (state === 'hidden' || !recommendation) return null
  if (state === 'done') return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <p className="text-sm font-semibold text-accent-700 text-accent">Thank you — your conversation was shared.</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Your deletion code is <strong className="font-mono text-slate-700">{shareCode}</strong>. Save it: send it to us
        from the contact page any time and we will erase this conversation from our records.
      </p>
    </section>
  )

  const share = async () => {
    if (!agreed || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/research/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          messages,
          careLevel: recommendation.careLevel,
          factors: recommendation.factors ?? [],
          engineVersion: recommendation.engineVersion ?? null,
        }),
      })
      const data = await res.json()
      if (data?.ok && data?.shareCode) { setShareCode(data.shareCode); setState('done') }
      else if (data?.configured === false) setState('hidden')
      else setState('error')
    } catch { setState('error') }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm" aria-labelledby="share-consent-title">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-carevo-600">Optional after-assessment sharing</p>
      <h2 id="share-consent-title" className="mt-1 font-display font-bold text-ink">Can this conversation be shared?</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        You can say no and still use Carevo. If you say yes, we store a copy of this conversation,
        the care-level recommendation, and the routing factors so the Carevo team and clinical reviewer
        can check whether the questions and routing worked well. Do not include names, phone numbers,
        addresses, member IDs, or medical record numbers. Details in our{' '}
        <a href="/privacy" className="underline text-carevo-700">Privacy Policy</a>.
      </p>
      <ul className="mt-3 grid gap-1.5 text-[11px] font-semibold leading-relaxed text-slate-500 sm:grid-cols-3">
        <li className="rounded-xl bg-slate-50 px-3 py-2">Unchecked by default</li>
        <li className="rounded-xl bg-slate-50 px-3 py-2">Admin-key protected</li>
        <li className="rounded-xl bg-slate-50 px-3 py-2">Deletable by code</li>
      </ul>
      <label className="mt-3 flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-carevo-600 focus:ring-carevo-500"
        />
        <span className="text-xs leading-relaxed text-slate-600">
          Yes, I give Carevo permission to store this conversation and recommendation for confidential
          quality review and product improvement. I understand I will receive a deletion code and can
          request deletion later.
        </span>
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={share}
          disabled={!agreed || state === 'sending'}
          className="rounded-full bg-carevo-600 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-40 hover:bg-carevo-700"
        >
          {state === 'sending' ? 'Sharing…' : 'Share conversation'}
        </button>
        {state === 'error' && <p className="text-xs font-semibold text-red-600">Could not share right now — nothing was saved.</p>}
      </div>
    </section>
  )
}

function CoverageOptionsCard() {
  const [zipcode, setZipcode] = useState('')
  const [income, setIncome] = useState('')
  const [agesText, setAgesText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'hidden' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<CoverageResponse['options']>(null)

  const ages = parseAges(agesText)
  const zipOk = /^\d{5}$/.test(zipcode.trim())
  const incomeValue = Number(income)
  const incomeOk = Number.isFinite(incomeValue) && incomeValue >= 0 && incomeValue <= 5_000_000
  const agesOk = ages.length > 0 && ages.length <= 8

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    setResult(null)
    if (!zipOk || !incomeOk || !agesOk) {
      setStatus('error')
      setMessage('Add a 5-digit ZIP, yearly income, and 1 to 8 ages.')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipcode: zipcode.trim(), income: incomeValue, ages }),
      })
      if (res.status === 429) {
        setStatus('error')
        setMessage('Too many tries. Please try again in a minute.')
        return
      }
      const data: CoverageResponse = await res.json()
      if (!data.configured) {
        setStatus('hidden')
        return
      }
      if (!res.ok || !data.options) {
        setStatus('error')
        setMessage('We could not check coverage right now. Please try again soon.')
        return
      }
      setResult(data.options)
      setStatus('ready')
    } catch {
      setStatus('error')
      setMessage('We could not check coverage right now. Please try again soon.')
    }
  }

  if (status === 'hidden') return null

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center shrink-0" aria-hidden="true">
          <IconShield className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-carevo-700">Coverage check</p>
          <h2 className="font-display font-bold text-ink text-lg leading-tight mt-0.5">Uninsured? See what coverage could cost.</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">This is only an estimate. It never changes your care recommendation.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[0.8fr_1fr_1fr]">
        <label className="block">
          <span className="text-xs font-bold text-slate-600">ZIP code</span>
          <input
            inputMode="numeric"
            maxLength={5}
            value={zipcode}
            onChange={e => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="43054"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink outline-none transition focus:border-carevo-400 focus:ring-4 focus:ring-carevo-50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Yearly income</span>
          <input
            inputMode="numeric"
            value={income}
            onChange={e => setIncome(e.target.value.replace(/[^\d.]/g, '').slice(0, 9))}
            placeholder="32000"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink outline-none transition focus:border-carevo-400 focus:ring-4 focus:ring-carevo-50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Ages in your home</span>
          <input
            inputMode="numeric"
            value={agesText}
            onChange={e => setAgesText(e.target.value.replace(/[^\d,\s]/g, '').slice(0, 40))}
            placeholder="28, 6"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-ink outline-none transition focus:border-carevo-400 focus:ring-4 focus:ring-carevo-50"
          />
        </label>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="min-h-[44px] rounded-xl bg-carevo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-carevo-700 disabled:opacity-50 sm:col-span-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500"
        >
          {status === 'loading' ? 'Checking coverage...' : 'Check coverage'}
        </button>
      </form>

      {status === 'error' && message && (
        <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{message}</p>
      )}

      {status === 'ready' && result && (
        <div className="mt-4 space-y-3">
          {result.eligibility?.likelyMedicaidOrChip && (
            <div className="rounded-2xl border border-accent-100 bg-accent-50 p-3">
              <p className="text-sm font-bold text-accent-700">You may qualify for free or low-cost coverage.</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Medicaid or CHIP may be an option based on what you entered.</p>
            </div>
          )}
          {result.eligibility?.estimatedMonthlyCredit != null && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-carevo-100 bg-carevo-50 px-3 py-2">
              <span className="text-xs font-bold text-carevo-800">Estimated help paying</span>
              <span className="text-sm font-black tabular-nums text-carevo-700">
                ${Math.round(result.eligibility.estimatedMonthlyCredit).toLocaleString()}/month
              </span>
            </div>
          )}
          {result.samplePlans?.length > 0 && (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
              {result.samplePlans.slice(0, 3).map(plan => (
                <div key={`${plan.issuer}-${plan.name}`} className="bg-slate-50 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan.issuer}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                      {plan.metalLevel || 'Plan'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span><strong className="text-ink tabular-nums">${Math.round(plan.monthlyPremium).toLocaleString()}</strong>/mo</span>
                    <span>Deductible: <strong className="text-ink tabular-nums">{plan.deductible == null ? 'varies' : `$${Math.round(plan.deductible).toLocaleString()}`}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-slate-400">
            Live data from HealthCare.gov · estimates only, not an enrollment decision ·{' '}
            <a href="https://www.healthcare.gov/" target="_blank" rel="noopener noreferrer" className="font-bold text-carevo-700 hover:text-carevo-800">
              healthcare.gov
            </a>
          </p>
        </div>
      )}
    </section>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function HomePage({
  embedded = false,
  presentation,
}: {
  embedded?: boolean
  presentation?: HomePagePresentation
} = {}) {
  const mode: HomePagePresentation = presentation ?? (embedded ? 'embed' : 'full')
  const isInline = mode === 'inline'
  const isEmbed = mode === 'embed'
  const [appState, setAppState]             = useState<AppState>('landing')
  const [messages, setMessages]             = useState<Message[]>([])
  const [currentInput, setCurrentInput]     = useState('')
  const [questionNumber, setQuestionNumber] = useState(0)
  const [recommendation, setRecommendation] = useState<TriageRecommendation | null>(null)
  const [resultOverlayOpen, setResultOverlayOpen] = useState(false)
  const [emergencyMsg, setEmergencyMsg]     = useState('')
  const [listening, setListening]           = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [outcome, setOutcome]               = useState<string | null>(null)
  const [history, setHistory]               = useState<PatientHistory | null>(null)

  const chatBottomRef   = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLTextAreaElement>(null)
  const resultModalRef  = useRef<HTMLDivElement>(null)
  const recogRef        = useRef<any>(null)
  const chatIdRef       = useRef<string>('')
  const askedTargetsRef = useRef<string[]>([])

  useEffect(() => {
    trackVisitOnce()
    setHistory(store.getHistory())
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  useEffect(() => {
    if (isInline) return
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, appState, isInline])

  useEffect(() => {
    if (!isInline || appState !== 'result' || !resultOverlayOpen) return
    const previousOverflow = document.body.style.overflow
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    const focusFirst = () => {
      const focusable = resultModalRef.current?.querySelectorAll<HTMLElement>(focusableSelector)
      focusable?.[0]?.focus()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeResultOverlay()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(resultModalRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(focusFirst, 0)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  // closeResultOverlay is stable enough for this modal lifecycle; the branch is
  // intentionally scoped to inline mode only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInline, appState, resultOverlayOpen])

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (listening) { recogRef.current?.stop(); setListening(false); return }
    const recog = new SR()
    recog.lang = 'en-US'; recog.interimResults = true; recog.continuous = false
    recog.onresult = (e: any) => setCurrentInput(Array.from(e.results).map((r: any) => r[0].transcript).join(''))
    recog.onend = () => setListening(false)
    recog.onerror = () => setListening(false)
    recogRef.current = recog; recog.start(); setListening(true)
  }

  async function callTriage(msgs: Message[]) {
    setAppState('thinking')
    try {
      const h = history ?? store.getHistory()
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, history: h, askedTargets: askedTargetsRef.current }),
      })
      const data = await res.json()
      if (data.type === 'emergency') {
        setEmergencyMsg(data.message); setAppState('emergency')
        track('emergency_shown'); saveChat(msgs, 'emergency', data.message); return
      }
      if (data.type === 'question') {
        if (data.askedFor && !askedTargetsRef.current.includes(data.askedFor))
          askedTargetsRef.current = [...askedTargetsRef.current, data.askedFor].slice(-20)
        setQuestionNumber(data.questionNumber ?? 0)
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
        setAppState('chatting'); return
      }
      if (data.type === 'recommendation') {
        setRecommendation(data); setResultOverlayOpen(true); setAppState('result')
        track('triage_completed', { careLevel: data.careLevel })
        saveChat(msgs, data.careLevel, data.reasoning); return
      }
      throw new Error('bad response')
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      setAppState('chatting')
    }
  }

  function saveChat(msgs: Message[], careLevel: string, reasoning: string) {
    store.saveChat({ id: chatIdRef.current || uid(), startedAt: Date.now(), messages: msgs, careLevel: careLevel as any, reasoning })
  }

  function sendMessage(e?: FormEvent) {
    e?.preventDefault()
    const rawInput = currentInput || inputRef.current?.value || ''
    if (!rawInput.trim() || appState === 'thinking') return
    if (listening) { recogRef.current?.stop(); setListening(false) }
    const cleanInput = sanitize(rawInput).slice(0, 1200)
    if (!cleanInput) return
    const userMsg: Message = { role: 'user', content: cleanInput }
    if (appState === 'landing' || appState === 'result') {
      chatIdRef.current = uid(); track('chat_started')
      askedTargetsRef.current = []
      setQuestionNumber(0); setRecommendation(null); setResultOverlayOpen(false); setOutcome(null)
      const msgs: Message[] = [{ role: 'assistant', content: OPENING_PROMPT }, userMsg]
      setMessages(msgs); setCurrentInput(''); callTriage(msgs); return
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages); setCurrentInput(''); callTriage(newMessages)
  }

  function reset() {
    askedTargetsRef.current = []
    setAppState('landing'); setMessages([]); setCurrentInput('')
    setQuestionNumber(0); setRecommendation(null); setEmergencyMsg('')
    setResultOverlayOpen(false); setOutcome(null); chatIdRef.current = ''
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function closeResultOverlay() {
    setResultOverlayOpen(false)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function sendOutcome(value: string) {
    setOutcome(value); track('outcome_feedback', { outcome: value })
    if (recommendation?.featureKeys?.length) {
      fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKeys: recommendation.featureKeys, careLevel: recommendation.careLevel, outcome: value }),
      }).catch(() => {})
    }
  }

  // ── Input bar (shared across landing + chat) ──────────────────────────────
  const inputBar = (
    <form onSubmit={sendMessage} className="flex items-end gap-2 w-full">
      <div className="flex-1 relative">
        <label htmlFor="symptom-input" className="sr-only">Describe your symptoms</label>
        <textarea
          id="symptom-input" ref={inputRef} value={currentInput}
          onChange={e => setCurrentInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          enterKeyHint="send"
          placeholder={listening ? 'Listening…' : 'Describe your symptoms or ask a question…'}
          rows={2} disabled={appState === 'thinking'}
          className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 pr-14 text-base leading-relaxed resize-none outline-none transition-colors duration-200 placeholder:text-slate-400 disabled:opacity-50 sm:min-h-[72px] ${
            listening ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-200 focus:border-carevo-400 focus:ring-4 focus:ring-carevo-50'
          }`}
        />
        {voiceSupported && (
          <button type="button" onClick={toggleVoice} aria-label={listening ? 'Stop voice' : 'Start voice'}
            className={`absolute right-2.5 bottom-2.5 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500 focus-visible:ring-offset-1 ${
              listening ? 'bg-red-500 text-white' : 'bg-white text-slate-500 hover:bg-carevo-50 hover:text-carevo-700 border border-slate-200'
            }`}>
            <IconMic className="w-5 h-5" />
          </button>
        )}
      </div>
      <button type="submit" disabled={!currentInput.trim() || appState === 'thinking'} aria-label="Send"
        className={`bg-carevo-600 text-white w-14 h-14 rounded-2xl hover:bg-carevo-700 cursor-pointer transition-colors duration-150 flex items-center justify-center shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500 sm:h-12 sm:w-12 [touch-action:manipulation] disabled:opacity-30 disabled:cursor-not-allowed`}>
        <IconSend className="w-5 h-5" />
      </button>
    </form>
  )

  // ── EMERGENCY ─────────────────────────────────────────────────────────────
  if (appState === 'emergency') {
    return (
      <div className={`${isEmbed ? 'min-h-[620px] rounded-[1rem]' : isInline ? 'fixed inset-0 z-[90] min-h-screen triage-emergency-enter' : 'min-h-[calc(100dvh-3.5rem)]'} bg-red-600 flex flex-col items-center justify-center p-6 text-white`}>
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500 border-4 border-red-400 flex items-center justify-center" aria-hidden="true">
            <IconAlert className="w-10 h-10" />
          </div>
          <h1 className="font-display text-3xl font-bold">Emergency Detected</h1>
          <p className="text-lg text-red-100 leading-relaxed">{emergencyMsg}</p>
          <a href="tel:911" className="block w-full bg-white text-red-600 font-display font-bold text-2xl py-5 rounded-2xl hover:bg-red-50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white">Call 911 Now</a>
          <button onClick={reset} className="text-red-200 text-sm underline hover:text-white cursor-pointer min-h-[44px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Start over</button>
          <p className="text-red-200 text-xs">Carevo is not a substitute for emergency services.</p>
        </div>
      </div>
    )
  }

  if (isInline) {
    const canShowResults = appState === 'result' && recommendation
    const cfg = recommendation ? CARE_LEVEL_CONFIG[recommendation.careLevel] : null
    const hasFacilitySection = !!(recommendation && FACILITY_LABELS[recommendation.careLevel])

    return (
      <div className="relative">
        <div className="space-y-4" aria-live="polite" aria-label="Carevo intake conversation">
          {messages.length > 0 && (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`triage-message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animationDelay: `${Math.min(i, 5) * 45}ms` }}
                >
                  {msg.role === 'assistant' && (
                    <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carevo-600 text-white shadow-sm" aria-hidden="true">
                      <IconSparkle className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm sm:max-w-[78%] ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-carevo-600 text-white'
                      : 'rounded-bl-sm border border-slate-200 bg-white/90 text-ink backdrop-blur'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {appState === 'thinking' && (
                <div className="triage-message-enter flex justify-start">
                  <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carevo-600 text-white shadow-sm" aria-hidden="true">
                    <IconSparkle className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-200 bg-white/90 px-4 py-3.5 shadow-sm backdrop-blur" role="status" aria-label="Carevo is thinking">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}

          <div className="rounded-[1.35rem] bg-white/70 p-2 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/80 backdrop-blur transition focus-within:ring-carevo-300 sm:rounded-[1.6rem] sm:p-3">
            {inputBar}
          </div>
          <p className="text-sm font-semibold text-slate-400">
            Not a medical label. Emergency? <a href="tel:911" className="font-bold text-red-600 hover:text-red-700">Call 911</a>.
          </p>

          {canShowResults && !resultOverlayOpen && (
            <div className="triage-message-enter flex flex-wrap items-center gap-3 rounded-2xl border border-carevo-100 bg-carevo-50/80 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-carevo-900">Your recommendation is ready.</p>
              <button
                type="button"
                onClick={() => setResultOverlayOpen(true)}
                className="rounded-full bg-carevo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-carevo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500"
              >
                See results again
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-carevo-200 hover:text-carevo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500"
              >
                Start over
              </button>
            </div>
          )}
        </div>

        {canShowResults && cfg && resultOverlayOpen && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <button
              type="button"
              aria-label="Close results"
              onClick={closeResultOverlay}
              className="triage-result-backdrop absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <section
              ref={resultModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="triage-results-title"
              className="triage-result-panel relative z-10 max-h-[94dvh] w-full overflow-y-auto rounded-t-[2rem] bg-slate-50 p-4 shadow-2xl shadow-slate-950/30 outline-none sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-[2rem] sm:p-5"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Your recommendation</p>
                <button
                  type="button"
                  onClick={closeResultOverlay}
                  aria-label="Close results"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold leading-none text-slate-500 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <article className={`triage-stagger rounded-2xl border-2 ${cfg.borderColor} bg-white shadow-sm`} style={{ animationDelay: '0ms' }}>
                  <div className={`${cfg.bgColor} rounded-t-[0.85rem] px-5 py-4`}>
                    <div className="flex items-center gap-3">
                      <span className={cfg.color} aria-hidden="true"><CareLevelIcon level={recommendation.careLevel} className="h-8 w-8" /></span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{cfg.sublabel}</p>
                        <h1 id="triage-results-title" className={`mt-0.5 font-display text-2xl font-bold leading-tight ${cfg.color}`}>{cfg.label}</h1>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="text-sm leading-relaxed text-slate-700">{recommendation.reasoning}</p>
                  </div>
                  {(recommendation.costEstimate || cfg.cost) && (
                    <div className="px-5 pb-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <IconDollar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Est. cost</span>
                        {recommendation.costEstimate ? (
                          <>
                            <span className={`text-sm font-bold ${cfg.color} tabular-nums`}>
                              ${recommendation.costEstimate.insured.low.toLocaleString()}–${recommendation.costEstimate.insured.high.toLocaleString()}
                              <span className="font-medium text-slate-400"> with insurance</span>
                            </span>
                            <span className="text-xs text-slate-400 tabular-nums">
                              ${recommendation.costEstimate.cash.low.toLocaleString()}–${recommendation.costEstimate.cash.high.toLocaleString()} without
                            </span>
                          </>
                        ) : (
                          <span className={`text-sm font-bold ${cfg.color} tabular-nums`}>${cfg.cost!.min}–${cfg.cost!.max}</span>
                        )}
                      </div>
                      {recommendation.costEstimate?.safetyNote && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">{recommendation.costEstimate.safetyNote}</p>
                      )}
                      {recommendation.costEstimate && (
                        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{recommendation.costEstimate.disclaimer}</p>
                      )}
                    </div>
                  )}
                </article>

                {recommendation.factors && recommendation.factors.length > 0 && (
                  <section className="triage-stagger rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={{ animationDelay: '60ms' }}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="font-display font-bold text-ink">Why this</h2>
                      <span className="shrink-0 rounded-full border border-carevo-100 bg-carevo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-carevo-700">{recommendation.engineVersion ?? 'Carevo Engine'}</span>
                    </div>
                    <ul className="space-y-2" aria-label="Decision factors">
                      {recommendation.factors.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${f.startsWith('Red flag') ? 'bg-red-500' : 'bg-carevo-400'}`} aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">Routing decisions are made by Carevo&apos;s clinical engine — the AI only gathers symptoms. It never names conditions.</p>
                  </section>
                )}

                {hasFacilitySection && (
                  <section className="triage-stagger rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={{ animationDelay: '120ms' }}>
                    <div className="mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-carevo-700">Care near you</p>
                      <h2 className="font-display text-lg font-bold leading-tight text-ink">Nearby places for this next step</h2>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">Allow location access to see real places and a map, sorted by distance.</p>
                    </div>
                    <NearbyFacilities careLevel={recommendation.careLevel} />
                  </section>
                )}

                <div className="triage-stagger" style={{ animationDelay: '180ms' }}>
                  <CoverageOptionsCard />
                </div>

                {(recommendation.whatToExpect || recommendation.selfCare || recommendation.careLevel === 'telehealth') && (
                  <section className="triage-stagger grid gap-3 sm:grid-cols-2" style={{ animationDelay: '240ms' }}>
                    {recommendation.whatToExpect && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="mb-2 font-display font-bold text-ink">What to expect</h2>
                        <p className="text-sm leading-relaxed text-slate-600">{recommendation.whatToExpect}</p>
                      </div>
                    )}
                    {recommendation.selfCare && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="mb-2 font-display font-bold text-ink">In the meantime</h2>
                        <p className="text-sm leading-relaxed text-slate-600">{recommendation.selfCare}</p>
                      </div>
                    )}
                    {recommendation.careLevel === 'telehealth' && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
                        <h2 className="mb-3 font-display font-bold text-ink">Virtual visit options</h2>
                        <ul className="space-y-2">
                          {[
                            { name: 'Teladoc', price: '$75', url: 'https://www.teladoc.com' },
                            { name: 'MDLive', price: '$82', url: 'https://www.mdlive.com' },
                            { name: 'Amazon Clinic', price: '$35', url: 'https://clinic.amazon.com' },
                          ].map(opt => (
                            <li key={opt.name}>
                              <a href={opt.url} target="_blank" rel="noopener noreferrer"
                                className="group flex min-h-[48px] items-center justify-between rounded-xl border border-transparent bg-slate-50 p-3 transition-colors hover:border-carevo-100 hover:bg-carevo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
                                <span className="font-semibold text-ink transition-colors group-hover:text-carevo-700">{opt.name}</span>
                                <span className="font-bold tabular-nums text-accent">{opt.price}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                )}

                <div className="triage-stagger" style={{ animationDelay: '300ms' }}>
                  <ShareConversationCard messages={messages} recommendation={recommendation} />
                </div>

                <section className="triage-stagger rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={{ animationDelay: '360ms' }}>
                  <h2 className="mb-1 font-display font-bold text-ink">Help Carevo improve</h2>
                  <p className="mb-3 text-sm text-slate-500">After your visit, tell us how it went.</p>
                  {outcome ? (
                    <p className="flex items-center gap-2 text-sm font-semibold text-accent"><IconCheck className="h-4 w-4" aria-hidden="true" />Thanks — this helps future recommendations.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'right_place', Icon: IconThumbsUp,  label: 'Right place' },
                        { value: 'wrong_place', Icon: IconThumbsDown, label: 'Wrong place' },
                        { value: 'did_not_go',  Icon: IconHelpCircle, label: "Didn't go" },
                      ].map(({ value, Icon, label }) => (
                        <button key={value} onClick={() => sendOutcome(value)}
                          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-carevo-200 hover:bg-carevo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
                          <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <div className="triage-stagger flex flex-wrap gap-3 pb-2" style={{ animationDelay: '420ms' }}>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full bg-carevo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-carevo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500"
                  >
                    Start over
                  </button>
                  <button
                    type="button"
                    onClick={closeResultOverlay}
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-carevo-200 hover:text-carevo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500"
                  >
                    Return to conversation
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    )
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (appState === 'result' && recommendation) {
    const cfg = CARE_LEVEL_CONFIG[recommendation.careLevel]
    const hasFacilitySection = !!FACILITY_LABELS[recommendation.careLevel]
    return (
      <div className={isEmbed ? 'min-h-[620px] bg-slate-50' : 'min-h-screen bg-slate-50'}>
        <div className={`${isEmbed ? 'max-w-2xl' : 'max-w-lg'} mx-auto p-4 space-y-4 pb-16`}>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={reset} aria-label="Back" className="text-slate-400 hover:text-slate-600 cursor-pointer w-11 h-11 -ml-2 flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
              <IconBack className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Your recommendation</p>
          </div>

          <article className={`rounded-2xl border-2 ${cfg.borderColor} bg-white overflow-hidden shadow-sm`}>
            <div className={`${cfg.bgColor} px-5 py-4`}>
              <div className="flex items-center gap-3">
                <span className={cfg.color} aria-hidden="true"><CareLevelIcon level={recommendation.careLevel} className="w-8 h-8" /></span>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{cfg.sublabel}</p>
                  <h1 className={`font-display text-2xl font-bold ${cfg.color} mt-0.5 leading-tight`}>{cfg.label}</h1>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100">
              <p className="text-slate-700 leading-relaxed text-sm">{recommendation.reasoning}</p>
            </div>
            {/* Cost: prefer the deterministic engine estimate (versioned rates
                table with sources); fall back to the static config range. */}
            {(recommendation.costEstimate || cfg.cost) && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <IconDollar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. cost</span>
                  {recommendation.costEstimate ? (
                    <>
                      <span className={`text-sm font-bold ${cfg.color} tabular-nums`}>
                        ${recommendation.costEstimate.insured.low.toLocaleString()}–${recommendation.costEstimate.insured.high.toLocaleString()}
                        <span className="font-medium text-slate-400"> with insurance</span>
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        ${recommendation.costEstimate.cash.low.toLocaleString()}–${recommendation.costEstimate.cash.high.toLocaleString()} without
                      </span>
                    </>
                  ) : (
                    <span className={`text-sm font-bold ${cfg.color} tabular-nums`}>${cfg.cost!.min}–${cfg.cost!.max}</span>
                  )}
                </div>
                {recommendation.costEstimate?.safetyNote && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{recommendation.costEstimate.safetyNote}</p>
                )}
                {recommendation.costEstimate && (
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{recommendation.costEstimate.disclaimer}</p>
                )}
              </div>
            )}
          </article>

          {recommendation.careLevel === 'urgent_care' && (
            <div className="bg-accent-50 border border-accent-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <IconTrendUp className="w-5 h-5 text-accent-700 shrink-0" aria-hidden="true" />
              <p className="text-accent-700 text-sm font-medium">Choosing urgent care over the ER could save you <strong className="tabular-nums">$1,600–$2,900</strong>.</p>
            </div>
          )}

          <CoverageOptionsCard />

          <ShareConversationCard messages={messages} recommendation={recommendation} />

          {hasFacilitySection && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-carevo-700">Care near you</p>
                  <h2 className="font-display text-lg font-bold leading-tight text-ink">Nearby places for this next step</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Allow location access to see real places and a map, sorted by distance.</p>
                </div>
              </div>
              <NearbyFacilities careLevel={recommendation.careLevel} />
            </section>
          )}

          {recommendation.factors && recommendation.factors.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="font-display font-bold text-ink">Why this recommendation</h2>
                <span className="text-[10px] font-bold text-carevo-700 bg-carevo-50 border border-carevo-100 px-2 py-1 rounded-full uppercase tracking-wide shrink-0">{recommendation.engineVersion ?? 'Carevo Engine'}</span>
              </div>
              <ul className="space-y-2" aria-label="Decision factors">
                {recommendation.factors.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${f.startsWith('Red flag') ? 'bg-red-500' : 'bg-carevo-400'}`} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100 leading-relaxed">Routing decisions are made by Carevo&apos;s clinical engine — the AI only gathers symptoms. It never names conditions.</p>
            </section>
          )}

          {recommendation.whatToExpect && (
            <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h2 className="font-display font-bold text-ink mb-2">What to expect</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{recommendation.whatToExpect}</p>
            </section>
          )}

          {recommendation.selfCare && (
            <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h2 className="font-display font-bold text-ink mb-2">In the meantime</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{recommendation.selfCare}</p>
            </section>
          )}

          {recommendation.careLevel === 'telehealth' && (
            <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h2 className="font-display font-bold text-ink mb-3">Virtual visit options</h2>
              <ul className="space-y-2">
                {[
                  { name: 'Teladoc', price: '$75', url: 'https://www.teladoc.com' },
                  { name: 'MDLive', price: '$82', url: 'https://www.mdlive.com' },
                  { name: 'Amazon Clinic', price: '$35', url: 'https://clinic.amazon.com' },
                ].map(opt => (
                  <li key={opt.name}>
                    <a href={opt.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 min-h-[48px] bg-slate-50 hover:bg-carevo-50 rounded-xl border border-transparent hover:border-carevo-100 cursor-pointer transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
                      <span className="font-semibold text-ink group-hover:text-carevo-700 transition-colors">{opt.name}</span>
                      <span className="text-accent font-bold tabular-nums">{opt.price}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h2 className="font-display font-bold text-ink mb-1">Help Carevo improve</h2>
            <p className="text-sm text-slate-500 mb-3">After your visit, tell us how it went.</p>
            {outcome ? (
              <p className="text-accent font-semibold text-sm flex items-center gap-2"><IconCheck className="w-4 h-4" aria-hidden="true" />Thanks — this helps future recommendations.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'right_place', Icon: IconThumbsUp,  label: 'Right place' },
                  { value: 'wrong_place', Icon: IconThumbsDown, label: 'Wrong place' },
                  { value: 'did_not_go',  Icon: IconHelpCircle, label: "Didn't go" },
                ].map(({ value, Icon, label }) => (
                  <button key={value} onClick={() => sendOutcome(value)}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-carevo-50 border border-slate-200 hover:border-carevo-200 text-slate-700 text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-xl cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
                    <Icon className="w-4 h-4" aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>
            )}
          </section>

          <Link href="/avs" className="block bg-carevo-600 hover:bg-carevo-700 text-white rounded-2xl p-4 cursor-pointer transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold">After your visit</p>
                <p className="text-carevo-100 text-sm mt-0.5">Add your after-visit summary and Carevo will follow up.</p>
              </div>
              <IconArrowRight className="w-6 h-6 shrink-0" aria-hidden="true" />
            </div>
          </Link>

          <button onClick={reset} className="w-full text-slate-500 text-sm py-3 min-h-[44px] hover:text-carevo-600 cursor-pointer transition-colors font-medium rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
            Start a new assessment
          </button>
          <p className="text-xs text-slate-400 text-center leading-relaxed px-4">Carevo helps you decide where to go — it never names conditions. Always consult a healthcare provider.</p>
        </div>
      </div>
    )
  }

  // ── CHAT ─────────────────────────────────────────────────────────────────
  if (appState === 'chatting' || appState === 'thinking') {
    return (
      <div className={`${isEmbed ? 'h-[min(760px,76dvh)] min-h-[620px]' : 'h-[calc(100dvh-3.5rem)]'} bg-slate-50 flex flex-col`}>
        <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center gap-2 shrink-0" role="banner">
          <button onClick={reset} aria-label="Back" className="text-slate-400 hover:text-slate-600 w-11 h-11 flex items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
            <IconBack className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-full bg-carevo-600 flex items-center justify-center shrink-0" aria-hidden="true">
            <IconSparkle className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-ink">Care check</span>
          {questionNumber > 0 && (
            <div className="ml-auto flex items-center gap-1.5" role="progressbar" aria-valuenow={questionNumber} aria-valuemin={0} aria-valuemax={4} aria-label={`Question ${questionNumber} of 4`}>
              {[1,2,3,4].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= questionNumber ? 'w-6 bg-carevo-600' : 'w-3 bg-slate-200'}`} />)}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-label="Conversation">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-carevo-600 flex items-center justify-center text-white shrink-0 mr-2 mt-1" aria-hidden="true">
                  <IconSparkle className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-carevo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-ink rounded-bl-sm shadow-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {appState === 'thinking' && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-carevo-600 flex items-center justify-center text-white shrink-0 mr-2 mt-1" aria-hidden="true"><IconSparkle className="w-3.5 h-3.5" /></div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm flex gap-1.5 items-center" role="status" aria-label="Carevo is thinking">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <div className="bg-white border-t border-slate-100 p-3 shrink-0">
          {inputBar}
          <p className="text-xs text-center text-slate-400 mt-2">Emergency? <a href="tel:911" className="text-red-600 font-bold hover:text-red-700">Call 911</a></p>
        </div>
      </div>
    )
  }

  // ── LANDING ───────────────────────────────────────────────────────────────
  const quickActions = [
    { href: '/avs',             Icon: IconClipboard,  title: 'Add visit summary', desc: 'Log your AVS for follow-up' },
    { href: '/avs#checkin',     Icon: IconPill,        title: 'Recovery check-in', desc: 'Meds, symptoms, how you feel' },
    { href: '/profile#history', Icon: IconHeart,       title: 'Health history',    desc: 'Better answers, fewer questions' },
    { href: '/profile',         Icon: IconChat,        title: 'Recent chats',      desc: 'Past checks and results' },
  ]

  if (isEmbed) {
    return (
      <div className="min-h-[620px] bg-white">
        <div className="relative overflow-hidden border-b border-slate-100 bg-white">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 opacity-[0.05]" aria-hidden="true"
            style={{ background: 'radial-gradient(circle at top right, #0891b2, transparent 70%)' }} />

          <div className="mx-auto max-w-2xl px-5 py-6 sm:px-7 sm:py-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-carevo-600" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-carevo-700">
                  Care routing · Free · No account needed
                </span>
              </div>
              <span className="hidden rounded-full bg-carevo-50 px-3 py-1 text-[10px] font-black text-carevo-700 sm:inline-flex">
                Private by design
              </span>
            </div>

            <h2 className="font-display text-[clamp(2.25rem,6vw,3.7rem)] font-black leading-[0.95] tracking-[-0.06em] text-ink">
              Stop guessing.<br />
              Know where to go.
            </h2>
            <p className="mt-4 max-w-md text-sm font-semibold leading-7 text-slate-500 sm:text-base">
              Answer a few focused questions. Carevo gives one clear care level, cost context, and nearby options.
            </p>

            <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-md transition-all duration-200 focus-within:border-carevo-500 focus-within:shadow-carevo-100">
              {inputBar}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Not a medical label. Emergency? <a href="tel:911" className="font-bold text-red-600 hover:text-red-700">Call 911</a>.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-5 py-5 sm:px-7">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-100" aria-hidden="true" />
            <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">What you get</p>
            <div className="h-px flex-1 bg-slate-100" aria-hidden="true" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100">
                <IconZap className="h-4.5 w-4.5 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Your recommendation</p>
                <p className="font-display text-lg font-bold leading-tight text-amber-700">Urgent Care</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Est. cost</p>
                <p className="font-bold tabular-nums text-amber-700">$150-$300</p>
              </div>
            </div>
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-600">
                Based on the information you provided, your symptoms suggest a same-day evaluation — not an emergency.
              </p>
            </div>
            <div className="grid gap-2 px-4 py-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-carevo-700">Care near you</p>
                <p className="mt-1 text-xs font-semibold text-ink">Nearby facilities after your result.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Coverage</p>
                <p className="mt-1 text-xs font-semibold text-ink">Uninsured users can check plan estimates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        {/* Subtle geometric accent — top-right corner only, no neon */}
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-[0.04]" aria-hidden="true"
          style={{ background: 'radial-gradient(circle at top right, #0891b2, transparent 70%)' }} />

        <div className="max-w-xl mx-auto px-5 pt-8 pb-7">

          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-carevo-600" aria-hidden="true" />
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-carevo-700">
              Care routing · Free · No account needed
            </span>
          </div>

          {/* Headline — large, editorial, dark */}
          <h1 className="font-display font-bold leading-[1.06] text-ink mb-4" style={{ fontSize: 'clamp(2rem, 8vw, 2.6rem)', letterSpacing: '-0.03em' }}>
            Stop guessing.<br />
            Know exactly where<br />
            to go when you&apos;re sick.
          </h1>

          <p className="text-slate-500 text-[15px] leading-relaxed mb-6 max-w-[300px]">
            Answer 3–4 questions. Get the right care level, nearby clinics, and real cost estimates in under a minute.
          </p>

          {/* Input */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-md focus-within:border-carevo-500 focus-within:shadow-carevo-100 transition-all duration-200">
            <div className="p-3">{inputBar}</div>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Not a medical label. Emergency? <a href="tel:911" className="text-red-600 font-bold hover:text-red-700 cursor-pointer">Call 911</a>.
          </p>
        </div>

        {/* ── Result preview — looks like actual product UI ── */}
        <div className="max-w-xl mx-auto px-5 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-slate-100" aria-hidden="true" />
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2">What you get</p>
            <div className="flex-1 h-px bg-slate-100" aria-hidden="true" />
          </div>

          {/* Mimics actual result screen */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            {/* Result header strip — amber for urgent care */}
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <IconZap className="w-4.5 h-4.5 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-amber-600">Your recommendation</p>
                <p className="font-display font-bold text-amber-700 text-lg leading-tight">Urgent Care</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Est. cost</p>
                <p className="font-bold text-amber-700 tabular-nums">$150–$300</p>
              </div>
            </div>

            {/* Reasoning line */}
            <div className="px-4 py-2.5 border-b border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed">
                Based on the information you provided, your symptoms suggest a same-day evaluation — not an emergency.
              </p>
            </div>

            {/* Nearest facility row */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-carevo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">CityMD Urgent Care — 5th Ave</p>
                <p className="text-xs text-slate-400">Open now · ★ 4.3</p>
              </div>
              <span className="text-xs font-bold text-carevo-700 bg-carevo-50 border border-carevo-100 px-2 py-0.5 rounded-full tabular-nums shrink-0">0.6 mi</span>
            </div>

            {/* Savings line */}
            <div className="px-4 py-2.5 flex items-center gap-2">
              <IconTrendUp className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              <p className="text-xs font-semibold text-accent">Saves ~$2,100 vs. the emergency room</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── EDITORIAL STATS ──────────────────────────────────────────────────── */}
      <div className="bg-ink text-white">
        <div className="max-w-xl mx-auto px-5 py-6 grid grid-cols-3 divide-x divide-carevo-800">
          {[
            { n: '3–4',    label: 'questions asked' },
            { n: '6',      label: 'care levels mapped' },
            { n: '$2,900', label: 'avg. savings possible' },
          ].map(({ n, label }) => (
            <div key={label} className="text-center px-3">
              <p className="font-display font-bold text-carevo-300 tabular-nums leading-none" style={{ fontSize: '1.5rem' }}>{n}</p>
              <p className="text-[10px] text-carevo-500 mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main className="flex-1 bg-slate-50">
        <div className="max-w-xl mx-auto px-4 pb-12">

          {/* ── HOW IT WORKS ── */}
          <section aria-label="How it works" className="pt-8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-6">How it works</p>
            <div className="flex flex-col">
              {[
                {
                  n: '01', Icon: IconChat,
                  title: 'Describe what you\'re feeling',
                  desc: 'Plain language — "my stomach has been hurting since this morning." No medical terms needed.',
                  last: false,
                },
                {
                  n: '02', Icon: IconSparkle,
                  title: 'Answer 3–4 targeted questions',
                  desc: 'Severity, how long, any red-flag symptoms. Carevo only asks what changes the routing — nothing extra.',
                  last: false,
                },
                {
                  n: '03', Icon: IconZap,
                  title: 'Get one clear answer',
                  desc: 'Where to go, estimated cost, and the nearest open clinic with one-tap directions.',
                  last: true,
                },
              ].map(({ n, Icon, title, desc, last }) => (
                <div key={n} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-carevo-600" aria-hidden="true" />
                    </div>
                    {!last && <div className="w-px flex-1 bg-slate-200 my-1.5" style={{ minHeight: '24px' }} aria-hidden="true" />}
                  </div>
                  <div className="pb-6 pt-1.5">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-carevo-600 mb-0.5">{n}</p>
                    <p className="font-display font-bold text-ink text-[15px] leading-snug mb-1">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FEATURE CARDS ── */}
          <section aria-label="Key features" className="mt-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4">What makes Carevo different</p>
            <div className="flex flex-col gap-3">

              {/* Maps finder */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 pt-4 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-carevo-50 border border-carevo-100 flex items-center justify-center mb-3">
                    <svg className="w-4.5 h-4.5 text-carevo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="font-display font-bold text-ink text-[15px] mb-1">5 nearest facilities, sorted by distance</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">Open status, star ratings, and one-tap directions — pulled live from Google Maps after every recommendation.</p>
                </div>
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {[
                    { n: 1, name: 'CityMD Urgent Care', dist: '0.6 mi', open: true },
                    { n: 2, name: 'NextCare Urgent Care', dist: '1.1 mi', open: true },
                    { n: 3, name: 'AFC Urgent Care',  dist: '1.8 mi', open: false },
                  ].map(f => (
                    <div key={f.n} className="flex items-center gap-2.5 px-4 py-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${f.n === 1 ? 'bg-carevo-600 text-white' : 'bg-slate-100 text-slate-500'}`} aria-hidden="true">{f.n}</div>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.open ? 'bg-green-500' : 'bg-red-400'}`} aria-label={f.open ? 'Open' : 'Closed'} />
                      <p className="text-xs font-medium text-slate-700 flex-1 truncate">{f.name}</p>
                      <span className="text-[11px] font-bold text-carevo-700 tabular-nums">{f.dist}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost estimates */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 pt-4 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-3">
                    <IconDollar className="w-4.5 h-4.5 text-accent" aria-hidden="true" />
                  </div>
                  <h2 className="font-display font-bold text-ink text-[15px] mb-1">Real cost estimates before you go</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">No bill shock. See typical out-of-pocket costs for each care level so you choose wisely.</p>
                </div>
                <div className="border-t border-slate-100 px-4 py-3 flex flex-col gap-3">
                  {[
                    { label: 'Home care',     price: '$0–$30',        pct: '4%',   tw: 'bg-green-400' },
                    { label: 'Urgent care',   price: '$150–$300',     pct: '14%',  tw: 'bg-amber-400' },
                    { label: 'ER visit',      price: '$1,800–$3,200', pct: '100%', tw: 'bg-red-500'   },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-slate-600">{row.label}</p>
                        <p className="text-xs font-bold text-slate-700 tabular-nums">{row.price}</p>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${row.tw}`} style={{ width: row.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CARE LEVEL SPECTRUM ── */}
          <section aria-label="Care routing spectrum" className="mt-8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-5">Care routing spectrum</p>
            <div className="h-1.5 rounded-full mb-6" style={{ background: 'linear-gradient(to right, #22c55e, #a855f7, #3b82f6, #f59e0b, #f97316, #ef4444)' }} aria-hidden="true" />
            <div className="grid grid-cols-3 gap-2">
              {[
                { Icon: IconHome,        label: 'Rest at Home',    sub: 'Self-care',        cls: 'text-green-700  bg-green-50  border-green-100'  },
                { Icon: IconVideo,       label: 'Virtual Visit',   sub: 'Online today',     cls: 'text-purple-700 bg-purple-50 border-purple-100' },
                { Icon: IconStethoscope, label: 'See Your Doctor', sub: '1–3 days',         cls: 'text-blue-700   bg-blue-50   border-blue-100'   },
                { Icon: IconZap,         label: 'Urgent Care',     sub: '2–4 hours',        cls: 'text-amber-700  bg-amber-50  border-amber-100'  },
                { Icon: IconHospital,    label: 'Go to the ER',    sub: 'Go now',           cls: 'text-orange-700 bg-orange-50 border-orange-100' },
                { Icon: IconAlert,       label: 'Call 911',        sub: 'Life-threatening', cls: 'text-red-700    bg-red-50    border-red-100'    },
              ].map(({ Icon, label, sub, cls }) => (
                <div key={label} className={`rounded-xl border p-2.5 flex flex-col gap-1.5 ${cls}`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <p className="text-xs font-bold leading-tight">{label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CLINICAL TRUST CALLOUT ── */}
          <div className="mt-6 rounded-2xl border border-carevo-100 bg-carevo-50 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-carevo-200 flex items-center justify-center shrink-0">
              <IconShield className="w-5 h-5 text-carevo-700" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display font-bold text-ink text-sm mb-1">Clinically reviewed — never AI-guessing</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                24 peer-reviewed clinical rules determine your care level. The AI only gathers your symptoms — it never picks a care level or makes medical claims. Every decision is deterministic.
              </p>
            </div>
          </div>

          {/* ── TRUST STRIP ── */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { Icon: IconLock,   text: 'Private by design', sub: 'Share only if you opt in' },
              { Icon: IconHeart,  text: 'Always free',        sub: 'No account required' },
            ].map(({ Icon, text, sub }) => (
              <div key={text} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-2.5">
                <Icon className="w-4 h-4 text-carevo-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-ink">{text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── QUICK ACTIONS ── */}
          <section aria-label="Quick actions" className="mt-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">More tools</p>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map(({ href, Icon, title, desc }) => (
                <Link key={title} href={href}
                  className="group bg-white hover:bg-carevo-50 border border-slate-200 hover:border-carevo-200 rounded-2xl p-4 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carevo-500">
                  <Icon className="w-5 h-5 text-carevo-600" aria-hidden="true" />
                  <p className="text-sm font-display font-bold text-ink mt-2.5 group-hover:text-carevo-700 transition-colors leading-tight">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>

      <footer className="text-center py-5 px-6 bg-white border-t border-slate-100">
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Carevo helps you decide where to go — it never names conditions. Always consult a healthcare provider. In emergencies, call 911.
        </p>
      </footer>
    </div>
  )
}

// Root / redirects to the landing page; triage lives at /triage
export default function RootPage() {
  redirect('/landing-v2.html')
}
