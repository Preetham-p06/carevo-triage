// Client-side helper to record anonymous usage events for the YC metrics dashboard.

export type MetricEvent =
  | 'visit'
  | 'chat_started'
  | 'triage_completed'
  | 'emergency_shown'
  | 'avs_added'
  | 'checkin_completed'
  | 'history_saved'
  | 'outcome_feedback'

export function track(event: MetricEvent, meta?: Record<string, string>) {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, meta }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

/** Track a visit once per browser session. */
export function trackVisitOnce() {
  if (typeof window === 'undefined') return
  try {
    if (!sessionStorage.getItem('carevo_visited')) {
      sessionStorage.setItem('carevo_visited', '1')
      track('visit')
    }
  } catch {}
}
