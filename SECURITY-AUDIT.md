# Carevo — Security Audit (Pre-Launch)

**App:** Carevo triage-web (Next.js 14, App Router) · **Auth:** none (guest demo by design) · **DB:** none (localStorage + server JSON files) · **Payments:** none · **Supabase/Firebase:** not used · **Status:** not launched
**Audited:** July 5, 2026 · All findings verified by direct testing against a production build.

## 1. Executive Summary

**Overall risk after fixes: LOW–MEDIUM** for a guest demo launch.

The codebase had no exposed secrets (API keys are server-side only and absent from client bundles — verified by grepping built assets), but every API route was originally unauthenticated and unlimited. The biggest pre-fix risk was **AI cost abuse**: anyone could script `/api/triage` and drain the Anthropic account. Second was **YC metrics corruption**: `/api/metrics` accepted arbitrary events, and `/metrics` was publicly readable. Third was **model poisoning**: `/api/feedback` wrote arbitrary keys into the routing model's weight file.

All three are now fixed and verified. The biggest **remaining** risk is distributed abuse (per-IP rate limiting doesn't stop a botnet) — mitigate with a spend cap on the Anthropic account before launch.

## 2. Issues Found

| # | Issue | Severity | Verified | Status | Why it matters | Fix |
|---|-------|----------|----------|--------|----------------|-----|
| 1 | No `.gitignore`; `.env.local` (Anthropic + Google keys) would be committed on first `git init/push` | Critical (latent) | ✔ (no .gitignore existed; not yet a git repo) | **Fixed** | Key leak = stolen API credits, key revocation churn | Added `.gitignore` covering `.env*`, `/data/` |
| 2 | `/api/triage` had no rate limit or input caps | High | ✔ (scripted 11 rapid calls pre-fix: all accepted) | **Fixed** | Each call spends LLM tokens — scripted abuse drains the account | 10 req/min/IP; max 12 messages × 1,200 chars; verified 429 on 11th call |
| 3 | `/api/metrics` POST accepted any event string; GET was public | High | ✔ (posted junk event pre-fix: counted) | **Fixed** | Fake YC metrics; competitors read your traction; file bloat | Event allowlist (verified `Bad event` rejection); GET requires `METRICS_KEY`; 60 req/min/IP |
| 4 | `/api/feedback` accepted arbitrary `featureKeys` → model-weight poisoning + unbounded file growth | High | ✔ (wrote bogus key pre-fix) | **Fixed** | Attackers could skew care recommendations over time | Keys validated against model vocabulary, capped at 20, deltas clamped ±1, 10 req/min/IP; verified bogus keys ignored; red-flag safety floors were never trainable |
| 5 | No security headers | Medium | ✔ (curl -I showed none) | **Fixed** | Clickjacking, MIME sniffing | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` — verified in response headers |
| 6 | Rate limiter is in-memory | Medium | ✔ | **Open** | Resets on restart; per-instance on serverless (Vercel) — weaker there | Swap for Upstash Redis rate limiting at launch |
| 7 | Distributed abuse (many IPs) can still hit the LLM route | Medium | ✔ (by design of IP limiting) | **Open** | Botnet could still run up costs | Set a monthly spend cap in Anthropic console; add Turnstile/CAPTCHA if it becomes real |
| 8 | `data/` JSON files are ephemeral on serverless hosts | Medium | ✔ | **Open** | Metrics + learned weights vanish on redeploy (data-loss, not breach) | Move to a KV/DB before deploying to Vercel |
| 9 | Health data (patient context) is sent to Anthropic; PHI sits unencrypted in localStorage | Medium (privacy) | ✔ | **Partially mitigated** | Privacy expectation for health data | UI discloses "data stays on this device"; server stores no PII; "Clear data" exists. Still needed: a privacy policy page; long-term: BAA/zero-retention for real PHI |
| 10 | `METRICS_KEY` accepted via URL query | Low | ✔ | Accepted for demo | Query strings can land in logs | Header `x-metrics-key` also supported; use it in production |

**Not applicable:** Supabase/Firebase rules (no DB), payments/webhooks (none), login/session auth (guest-only by design), IDOR (no user IDs — all personal data is client-side localStorage, never another user's).

## 3. Top 5 Fixes Before Launch (remaining)

1. **Set a spend cap on the Anthropic account** (console → Billing). One-click insurance against issue #7.
2. **Set `METRICS_KEY`** in the production environment so the dashboard isn't public.
3. **Move metrics + model weights to a persistent store** (Upstash/Postgres) if deploying to Vercel.
4. **Swap the in-memory rate limiter for Upstash** (same interface, ~30 lines).
5. **Add a short privacy policy page** stating what's stored where, that the AI processes symptom text, and retention.

## 4. Things That Look Good

- API keys are only read server-side via `process.env`; grep of `.next/static` client bundles found no keys.
- Emergency keyword detection runs **before** the LLM — can't be bypassed by prompt injection into the model.
- The routing decision is made by deterministic server code with hard safety floors that were never trainable — feedback poisoning could never lower an ER recommendation.
- No PII/PHI is stored server-side; metrics are anonymous counters only; errors log messages, not user content.
- LLM output is parsed as strict JSON and validated by type — model output is never rendered as HTML (no XSS path); React escapes all user text by default.
- Guest data is user-clearable in one tap.

## 5. Manual Tests To Run

```bash
# 1. Rate limit: 11th rapid call should return 429
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code} " -X POST \
  localhost:3000/api/triage -H 'Content-Type: application/json' -d '{"messages":[]}'; done

# 2. Metrics spam: junk event should be rejected (400)
curl -X POST localhost:3000/api/metrics -H 'Content-Type: application/json' -d '{"event":"junk"}'

# 3. Dashboard auth: without key → 401 (when METRICS_KEY is set)
curl -i localhost:3000/api/metrics

# 4. Poisoning: bogus feature keys should return learned:false
curl -X POST localhost:3000/api/feedback -H 'Content-Type: application/json' \
  -d '{"featureKeys":["hacked:key"],"careLevel":"home_care","outcome":"right_place"}'

# 5. Oversized input: >1200-char message should return 400
# 6. DevTools: Network tab during a triage chat — confirm no sk-ant… string anywhere
# 7. DevTools: Application → localStorage — confirm data clears via Profile → "Clear data"
```

All of the above were run against a production build on July 5, 2026 and passed.

## 6. Platform Checks (Next.js / Vercel)

- Env vars must be set in the hosting dashboard, never committed (`.gitignore` now enforces).
- API routes are same-origin by default (no CORS headers added — correct for this app).
- If you enable Vercel preview deployments, previews share production env vars by default — set a separate `METRICS_KEY` for previews or restrict previews.
- HTTPS is automatic on Vercel; no HSTS added yet (add once a custom domain is stable).

## 7. Open Questions

1. Will the demo be linked publicly for YC (more abuse exposure) or shared privately?
2. Expected traffic scale? (Determines urgency of Upstash/DB migration.)
3. Any plan to store real patient accounts soon? That triggers HIPAA-adjacent obligations (BAA with Anthropic, encryption at rest, audit logs) well beyond this audit.

## 8. Founder Summary

Your secrets were never exposed, but until today every endpoint was open: anyone could burn your AI credits, fake your YC metrics, read your dashboard, and slowly poison your routing model. All four are now closed and test-verified. Before you share the link publicly, do two five-minute things: set a spend cap on your Anthropic account and set `METRICS_KEY` in your hosting env. Do the database migration when you deploy.

## 9. Launch Recommendation

**GO for a demo launch** (shared link, guest mode) once the Anthropic spend cap and `METRICS_KEY` are set. **NOT yet ready** for real patient accounts or PHI storage — that requires a privacy policy, persistent encrypted storage, and a BAA with the AI provider.
