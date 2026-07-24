# Carevo Security and Compliance One-Pager

**Prepared:** July 24, 2026  
**Product:** Carevo AI care navigation and Carevo AuditOS  
**Contact:** usecarevoai@gmail.com

## What Carevo Is

Carevo helps insurers and healthcare facilities route members to the right level of care: emergency services, ER, urgent care, primary care, telehealth, or home care. The product combines a patient-facing intake flow with Carevo AuditOS, an operations layer for monitoring route safety, consent, decision traces, and audit readiness.

## Core Safety Architecture

- Emergency and self-harm screens run before ordinary AI processing.
- The language model extracts structured facts and phrases questions only.
- The language model does not choose the care level.
- Routing is handled by a deterministic rules engine with safety floors.
- Every route can include provenance: extracted facts, matched rule, engine version, ruleset version, and knowledge-base version.
- Under-triage and forbidden outputs are treated as release-blocking eval failures.

## Security Controls in Place

- HTTPS/TLS and HSTS.
- Strict Content Security Policy and browser security headers.
- Server-side AI/provider keys only.
- No direct AI calls from browser code.
- Input validation and sanitization on API endpoints.
- Per-IP rate limits on POST endpoints.
- Admin pages key-gated and fail closed when no key is configured.
- API responses marked no-store/no-cache.
- No required public demo accounts, names, phone numbers, member IDs, or medical record numbers.
- Optional research sharing only after user consent, with deletion code.

## Compliance Status

Carevo is **HIPAA-aware**, not yet claiming HIPAA compliance. For production PHI deployments, Carevo needs BAAs, encrypted durable storage, access controls, audit procedures, retention rules, incident-response process, vendor review, and a documented HIPAA Security Rule risk analysis.

Carevo is **not yet SOC 2 or ISO 27001 certified**. The recommended path is lightweight SOC 2 readiness during pilots, SOC 2 Type I when enterprise buyers require it, and SOC 2 Type II after controls operate consistently over time.

## Recommended Next Steps Before Enterprise PHI Use

1. Confirm BAA path for hosting, AI provider, database, and facility/location vendors.
2. Move durable PHI storage to encrypted PostgreSQL or equivalent.
3. Add authenticated admin roles, MFA, least-privilege access, and access reviews.
4. Complete HIPAA risk analysis and written security policies.
5. Run a formal penetration test before production deployment.

## Plain-English Buyer Answer

Carevo is designed for auditable healthcare navigation, but we are not overstating certification status. For pilots, we can run with limited or no real PHI while showing the safety architecture, route trace, and operations workflow. For production PHI use, we will complete BAAs, risk analysis, access controls, durable encrypted storage, and evidence collection before launch.

## References

- HHS HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/index.html
- HHS Business Associate Contracts: https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html
- NIST Cybersecurity Framework 2.0: https://www.nist.gov/cyberframework
- AICPA & CIMA SOC Suite of Services: https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services

This document is not legal advice and is not a certification report.
