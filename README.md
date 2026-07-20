# Carevo

Carevo is an AI care-navigation platform for health insurers. It helps members understand whether their next step should be emergency services, the ER, urgent care, primary care, telehealth, or home care.

Carevo is designed around one core principle: the language model does not choose the care level. The AI helps extract structured information and phrase patient-friendly questions, while the final routing comes from a deterministic rules engine with emergency-first safety floors.

## What It Does

- Screens patient messages for emergency signals before any AI call.
- Converts natural-language symptoms into structured routing features.
- Asks focused follow-up questions when the case is vague.
- Routes to a care level using deterministic clinical safety rules.
- Shows audit-friendly reasoning for insurers and care teams.
- Supports benchmark testing, safety evaluation, and recursive review workflows.

## Architecture

Carevo uses a layered architecture:

1. **Emergency Net**
   - Runs first.
   - Looks for clear emergency language.
   - Can immediately stop the flow and direct the user toward emergency help.

2. **AI Extractor**
   - Reads patient text and extracts structured features.
   - Does not decide the care level.

3. **Deterministic Routing Engine**
   - Applies clinical rules, risk modifiers, and safety floors.
   - May raise acuity, but never weakens emergency protections.

4. **Patient-Facing Phraser**
   - Turns the next question or recommendation into plain language.
   - Avoids clinical claims that were not established in the conversation.

5. **Recursive Experience Engine**
   - Reviews sessions, identifies weak cases, prepares candidate training rows, and runs safety checks before any model improvement is considered.

## How OpenAI Codex and GPT-5.6 Were Used

Carevo was built during OpenAI Build Week with OpenAI Codex as the primary engineering partner.

Codex helped:

- Implement and refactor the Next.js, TypeScript, and Tailwind codebase.
- Build and harden the deterministic triage engine.
- Create evaluation scripts for under-triage, over-triage, forbidden outputs, and safety regressions.
- Generate and review synthetic benchmark cases.
- Improve the patient interview flow so vague symptoms trigger better follow-up questions.
- Design and iterate on the public landing page, company page, contact page, and triage experience.
- Run production checks, builds, deployment smoke tests, and Vercel deployment.

GPT-5.6 was used for high-level reasoning, product iteration, clinical-safety review assistance, UX copy refinement, and planning the Recursive Experience Engine workflow. It helped turn rough feedback into concrete engineering tasks, evaluation criteria, and safer product behavior.

## Safety Notes

Carevo is not a replacement for a clinician or emergency medical services. It is a care-navigation prototype focused on routing and next-step guidance.

Important constraints:

- The system does not identify medical conditions.
- The LLM does not choose the care level.
- Emergency signals are handled before ordinary triage.
- Deterministic rules act as safety floors.
- Evaluation gates track under-triage as a release-blocking failure.

## Running Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000/landing-v2.html
```

## Checks

```bash
npx tsc --noEmit
npm run build
node node_modules/sucrase/bin/sucrase-node scripts/eval-engine.ts
```

## Live Demo

Production demo:

```text
https://carevo-silk.vercel.app/landing-v2.html
```

Key pages:

- Landing page: `https://carevo-silk.vercel.app/landing-v2.html`
- Triage flow: `https://carevo-silk.vercel.app/triage`
- Benchmarks: `https://carevo-silk.vercel.app/benchmarks`
- Company: `https://carevo-silk.vercel.app/company`
- Contact: `https://carevo-silk.vercel.app/contact`
