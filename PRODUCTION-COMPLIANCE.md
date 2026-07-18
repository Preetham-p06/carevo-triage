# Carevo Production Compliance Ledger

Last updated: 2026-07-17. Two lists, honestly separated: what is DONE in
code and verifiable, and what requires business/legal action no code can
substitute for. Review before any claim of compliance is made publicly.

## A. Implemented and verifiable in code

### Security
- **HTTPS/TLS everywhere** — Vercel-managed TLS, plus HSTS with preload
  (max-age 2 years, includeSubDomains) forcing HTTPS on every request.
- **Security headers** (next.config.mjs, every route): strict
  Content-Security-Policy (self-only scripts, no third-party JS),
  X-Frame-Options DENY (embed page excepted, frame-ancestors 'self'),
  X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin,
  Permissions-Policy (camera/payment blocked), COOP same-origin.
- **Input validation & sanitization on every endpoint**: zod schema +
  sanitization on /api/triage; typed validation with bounds on /api/cost,
  /api/coverage (5-digit ZIP, income/ages ranges), /api/facilities
  (finite lat/lng within world bounds), /api/feedback, /api/metrics (key-gated).
- **Rate limiting on every POST endpoint** (per-IP, in-memory sliding window).
- **No secrets in the browser**: all AI/Google/CMS keys are server-side env
  vars. Exception by design: Maps Static API image URLs expose the Google key
  (how the product works) — MITIGATION REQUIRED: referrer-restrict the key in
  Google Cloud to the production domains. (Owner action, 5 minutes.)
- **No cookies, no sessions, no authentication surface**: the public product
  has no accounts, so there is no password storage, session hijacking, or
  CSRF surface on state-changing patient flows. Metrics dashboard is
  key-protected. CSRF revisit needed only when accounts/portals are added.
- **No SQL**: no database in the public product (no injection surface).
  File-backed operational data only; Postgres planned — use parameterized
  queries/ORM when added.
- **Error handling**: every route catches and returns generic messages;
  details go to server logs only.
- **DDoS**: Vercel edge network fronting + per-IP rate limits. Consider
  Vercel WAF/Firewall rules as traffic grows.
- **AI safety architecture**: LLM is extractor/phraser only; routing is
  deterministic; prompt-injection resistance in system prompt; provider keys
  sanitized against paste artifacts.

### Privacy (data minimization by architecture)
- No accounts; no name/email/phone/ID collected anywhere in the product.
- No analytics, no tracking pixels, no ad tech, no third-party scripts (CSP
  enforces this — a rogue pixel cannot even load).
- User history (AVS, check-ins) lives in browser localStorage on-device only.
- ZIP/income/ages and coordinates are forwarded to CMS / Google respectively
  and not stored server-side.
- REE telemetry disabled in production (REE_TELEMETRY_ENABLED unset).
- Truthful Privacy Policy (/privacy) and Terms (/terms) describing exactly
  the above, including OpenAI API processing and its ~30-day abuse-monitoring
  retention.

### Legal & safety documentation (live on site)
- Privacy Policy — /privacy (data enumeration, third parties, children,
  choices; effective-dated).
- Terms of Use — /terms (medical disclaimer, emergency protocol, estimates
  disclaimer, acceptable use, warranty/liability limits, Ohio governing law).
- Medical disclaimer + **persistent 911/988 emergency banner** in the
  site-wide footer, plus in-product emergency hard-stops (deterministic,
  pre-AI) and the 988 self-harm flow.
- Nondiscrimination notice + language-assistance note in the footer;
  simple-English interviewing is a product rule (clinician-approved).

### Accessibility (engineering level)
- Semantic HTML with aria labels/sections in the product flow, alt text on
  images (incl. map), keyboard-reachable controls, ≥44px tap targets,
  viewport meta, no keyboard traps. High-contrast slate/teal palette.

## B. Requires business/legal action — CODE CANNOT SUBSTITUTE

1. **HIPAA posture (decide, then act)**: Today Carevo is positioned as an
   informational tool — not a covered entity, no PHI records maintained, and
   the policies say so. IF Carevo signs a health-system/insurer (B2B) or
   starts storing identifiable health records, HIPAA applies in full:
   - **BAAs required with every vendor touching PHI**: Vercel (BAA available
     on Enterprise), OpenAI (BAA available via api.openai.com enterprise
     process; request at openai.com/policies/baa), Google Cloud/Maps (BAA via
     Google Cloud), CMS API (public data, no PHI sent beyond ZIP/income).
   - Postgres with AES-256 at rest + access controls before ANY durable
     patient records exist.
   - MFA + session timeouts + role-based access for the clinician review
     portal (Paul) BEFORE it moves off local files onto a hosted dashboard.
2. **Attorney review** of /privacy and /terms before major distribution or
   fundraising diligence. Drafts are careful but are not legal advice.
3. **Formal WCAG 2.1 AA audit** (axe/Lighthouse pass + screen-reader
   walkthrough with NVDA/VoiceOver) — engineering hygiene is in place, but a
   documented audit is what ADA/Section 1557 diligence asks for.
4. **Google Maps key referrer restriction** (5-minute console task, above).
5. **Vercel payment method** — trial expiry takes the site down otherwise.
6. **Dependency policy**: `npm audit` on every Codex round (added to the
   round checklist); update Next.js promptly on security releases.
7. **Incident response basics**: decide who is notified if a vulnerability
   or data incident occurs, and add a security contact (security.txt) once
   there is a monitored inbox.

## C. Standing product safety rules (already enforced, keep enforcing)
- 911/emergency decisions never show cost figures; coverage card never
  renders on emergency screens.
- Money can never influence routing (no code path exists).
- LLM never decides routing; clinician sign-off gates all learning; kill
  switches: promoted-calibration.json delete, HOME_GUARDS=0.
