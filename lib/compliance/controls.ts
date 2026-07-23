// AI-native compliance registry — the living replacement for the static
// PRODUCTION-COMPLIANCE.md spreadsheet. Each control declares a framework, a
// status, and HOW it's verified: 'live' controls are probed in real time from
// the dashboard (headers present right now, consent gate actually rejects,
// admin endpoints actually 401); 'attested' controls are verified by our code
// + verification gates; 'manual' controls are business/legal actions no code
// can perform (BAAs, FDA classification, attorney review).
export type Framework =
  | 'HIPAA Security' | 'HIPAA Privacy' | 'FDA / Clinical Software'
  | 'Application Security' | 'Data & Privacy' | 'Accessibility' | 'Governance'
export type CtrlStatus = 'pass' | 'action' | 'pending' | 'monitor'
export type CtrlType = 'live' | 'attested' | 'manual'
export type ProbeId = 'https' | 'headers' | 'apiCache' | 'consentGate' | 'adminAuth' | 'privacyLive' | null

export interface Control {
  id: string; framework: Framework; title: string; requirement: string
  type: CtrlType; status: CtrlStatus; evidence: string; owner: string; probe?: ProbeId
}

export const CONTROLS: Control[] = [
  // ── HIPAA Security Rule (technical safeguards) ──
  { id: 'sec.tls', framework: 'HIPAA Security', title: 'Encryption in transit', requirement: '§164.312(e) — ePHI encrypted over the wire', type: 'live', status: 'pass', evidence: 'TLS enforced + HSTS preload', owner: 'Platform', probe: 'https' },
  { id: 'sec.transmission', framework: 'HIPAA Security', title: 'Transmission security headers', requirement: '§164.312(e) — protect data in transit', type: 'live', status: 'pass', evidence: 'CSP, HSTS, XFO, XCTO, Referrer, Permissions', owner: 'Platform', probe: 'headers' },
  { id: 'sec.access', framework: 'HIPAA Security', title: 'Access control', requirement: '§164.312(a) — restrict access to authorized users', type: 'live', status: 'pass', evidence: 'Admin surfaces key-gated (return 401 without key)', owner: 'Platform', probe: 'adminAuth' },
  { id: 'sec.audit', framework: 'HIPAA Security', title: 'Audit controls', requirement: '§164.312(b) — record and examine activity', type: 'attested', status: 'pass', evidence: 'Hash-chained decision log; every routing decision replayable with versions', owner: 'Engineering' },
  { id: 'sec.integrity', framework: 'HIPAA Security', title: 'Integrity / input validation', requirement: '§164.312(c) — protect data from improper alteration', type: 'attested', status: 'pass', evidence: 'zod schemas + sanitization on every endpoint', owner: 'Engineering' },
  { id: 'sec.rest', framework: 'HIPAA Security', title: 'Encryption at rest (durable records)', requirement: '§164.312(a)(2)(iv) — AES-256 for stored ePHI', type: 'manual', status: 'pending', evidence: 'No durable identifiable records today; required before storing patient records', owner: 'Founder' },
  { id: 'sec.baa', framework: 'HIPAA Security', title: 'Business Associate Agreements', requirement: '§164.308(b) — BAAs with vendors touching PHI', type: 'manual', status: 'action', evidence: 'Vercel, OpenAI, Google BAAs required at B2B/PHI stage (all offer them)', owner: 'Founder' },

  // ── HIPAA Privacy ──
  { id: 'priv.minimum', framework: 'HIPAA Privacy', title: 'Minimum necessary / no PHI by default', requirement: 'Collect only what routing requires', type: 'attested', status: 'pass', evidence: 'No name/email/phone/ID collected; no accounts', owner: 'Product' },
  { id: 'priv.consent', framework: 'HIPAA Privacy', title: 'Consent before any storage', requirement: 'Explicit opt-in before retaining a conversation', type: 'live', status: 'pass', evidence: 'Share endpoint rejects requests without consent:true (400)', owner: 'Engineering', probe: 'consentGate' },
  { id: 'priv.notice', framework: 'HIPAA Privacy', title: 'Notice of privacy practices', requirement: 'Published, truthful privacy policy', type: 'live', status: 'pass', evidence: '/privacy live and matches actual data flows', owner: 'Founder', probe: 'privacyLive' },
  { id: 'priv.rights', framework: 'HIPAA Privacy', title: 'Individual rights / deletion', requirement: 'Users can request erasure', type: 'attested', status: 'pass', evidence: 'Per-share deletion codes; admin delete honored', owner: 'Founder' },

  // ── FDA / Clinical Software (SaMD / CDS) ──
  { id: 'fda.intent', framework: 'FDA / Clinical Software', title: 'Intended-use statement', requirement: 'Clear scope: navigation, not diagnosis', type: 'attested', status: 'pass', evidence: 'Terms + product never name conditions; routes to care level only', owner: 'Founder' },
  { id: 'fda.class', framework: 'FDA / Clinical Software', title: 'Regulatory classification', requirement: 'Determine device status / CDS exemption (21st Century Cures)', type: 'manual', status: 'action', evidence: 'Needs regulatory counsel; likely non-device CDS if clinician can review basis', owner: 'Founder' },
  { id: 'fda.validation', framework: 'FDA / Clinical Software', title: 'Clinical validation', requirement: 'Documented accuracy + safety evidence', type: 'attested', status: 'pass', evidence: 'Published benchmarks: 91.1% external, 0 under-triage, 100% safe-or-exact', owner: 'Engineering' },
  { id: 'fda.change', framework: 'FDA / Clinical Software', title: 'Change control', requirement: 'Governed, tested, reversible changes', type: 'attested', status: 'pass', evidence: '240-case gate + vague gate on every change; clinician sign-off; kill switches', owner: 'Engineering' },
  { id: 'fda.labeling', framework: 'FDA / Clinical Software', title: 'Labeling & safety instructions', requirement: 'Disclaimers + emergency guidance', type: 'attested', status: 'pass', evidence: 'Medical disclaimer, persistent 911/988 banner, estimates disclaimer', owner: 'Product' },
  { id: 'fda.pccp', framework: 'FDA / Clinical Software', title: 'Predetermined change control plan', requirement: 'Documented plan for AI model updates', type: 'manual', status: 'pending', evidence: 'REE process is the basis; formal PCCP if pursuing FDA pathway', owner: 'Founder' },

  // ── Application Security ──
  { id: 'app.headers', framework: 'Application Security', title: 'Security headers enforced', requirement: 'CSP, HSTS, frame denial, MIME protection', type: 'live', status: 'pass', evidence: 'Verified live in browser', owner: 'Platform', probe: 'headers' },
  { id: 'app.ratelimit', framework: 'Application Security', title: 'Rate limiting on all endpoints', requirement: 'Per-IP limits on every POST', type: 'attested', status: 'pass', evidence: 'triage, cost, coverage, facilities, beacon, research, reviews', owner: 'Engineering' },
  { id: 'app.secrets', framework: 'Application Security', title: 'No secrets in the browser', requirement: 'API keys server-side only', type: 'attested', status: 'pass', evidence: 'All keys server env; Maps static key referrer-restricted', owner: 'Platform' },
  { id: 'app.nocache', framework: 'Application Security', title: 'No caching of API responses', requirement: 'Health-adjacent responses never cached', type: 'live', status: 'pass', evidence: 'no-store on /api/*', owner: 'Platform', probe: 'apiCache' },
  { id: 'app.deps', framework: 'Application Security', title: 'Dependency posture', requirement: 'No known-exploitable production deps', type: 'manual', status: 'monitor', evidence: 'npm audit each round; transitive ws finding tracked (dev path)', owner: 'Engineering' },

  // ── Data & Privacy ──
  { id: 'data.trackers', framework: 'Data & Privacy', title: 'No third-party trackers', requirement: 'No ad/analytics pixels on health pages', type: 'attested', status: 'pass', evidence: 'CSP blocks third-party scripts; first-party aggregate counters only', owner: 'Product' },
  { id: 'data.cookies', framework: 'Data & Privacy', title: 'No tracking cookies', requirement: 'No cross-site or identifying cookies', type: 'attested', status: 'pass', evidence: 'No cookies set; presence beacon is a random per-tab id', owner: 'Engineering' },
  { id: 'data.retention', framework: 'Data & Privacy', title: 'Retention & minimization', requirement: 'Keep only what is needed, as long as needed', type: 'attested', status: 'pass', evidence: 'ZIP/income/coords forwarded not stored; shared convos kept for review only', owner: 'Founder' },

  // ── Accessibility (ADA / Section 1557) ──
  { id: 'a11y.eng', framework: 'Accessibility', title: 'Accessible engineering', requirement: 'Semantic HTML, alt text, keyboard, contrast', type: 'attested', status: 'pass', evidence: 'aria roles, alt on images incl. map, ≥44px targets, reduced-motion', owner: 'Engineering' },
  { id: 'a11y.audit', framework: 'Accessibility', title: 'Formal WCAG 2.1 AA audit', requirement: 'Documented axe + screen-reader pass', type: 'manual', status: 'action', evidence: 'Engineering hygiene in place; documented audit needed for 1557 diligence', owner: 'Founder' },
  { id: 'a11y.language', framework: 'Accessibility', title: 'Language access', requirement: 'Serve limited-English users', type: 'attested', status: 'pass', evidence: '6th-grade English rule; limited-English fever safety floor', owner: 'Product' },

  // ── Governance ──
  { id: 'gov.clinician', framework: 'Governance', title: 'Named clinical oversight', requirement: 'Clinician signs off on learning', type: 'attested', status: 'pass', evidence: '3 signed review batches; safety floors never trainable', owner: 'Clinical' },
  { id: 'gov.incident', framework: 'Governance', title: 'Incident response & security contact', requirement: 'Monitored channel + response plan', type: 'manual', status: 'action', evidence: 'Add security.txt + contact once inbox is monitored', owner: 'Founder' },
]

export const FRAMEWORKS: Framework[] = ['HIPAA Security', 'HIPAA Privacy', 'FDA / Clinical Software', 'Application Security', 'Data & Privacy', 'Accessibility', 'Governance']
