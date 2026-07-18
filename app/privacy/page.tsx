const SECTIONS: [string, string[]][] = [
  ['What Carevo is (and is not)', [
    'Carevo is an informational care-navigation tool: you describe symptoms, and it suggests a level of care (911, emergency room, urgent care, primary care, telehealth, or self-care) with cost context and nearby options. Carevo is not a healthcare provider, does not give medical advice or diagnosis, and does not create a provider–patient relationship. Carevo is not currently offered as a HIPAA-covered service; do not use it to transmit another person’s medical records.',
  ]],
  ['What we collect — and what we deliberately don’t', [
    'No account is required and we do not ask for your name, email, phone number, address, or any government identifier. Please do not type identifying details into the chat — the symptom conversation works without them.',
    'Symptom conversation: the text you type is sent to our server to run the triage interview. It is processed in memory to make a routing decision.',
    'Cost & coverage tool (optional): if you use it, your ZIP code, household income, and ages are sent to our server and forwarded to the U.S. government’s HealthCare.gov Marketplace API to compute estimates. We do not store these values.',
    'Nearby facilities (optional): if you grant location access, your coordinates are sent to our server and forwarded to Google Places to find nearby care. We do not store your location.',
    'On your device only: visit summaries, recovery check-ins, and history you choose to save are stored in your browser’s local storage on your device. They never reach our servers, and you can erase them anytime by clearing site data in your browser.',
  ]],
  ['AI processing', [
    'Carevo uses a language model (via the OpenAI API) for exactly two narrow jobs: reading your words into structured symptom facts, and phrasing questions in plain language. The routing decision itself is made by Carevo’s own deterministic clinical engine — never by the AI. Conversation text is processed by OpenAI under its API data-usage policy (not used to train their models; may be retained by OpenAI for up to 30 days for abuse monitoring).',
  ]],
  ['What our servers keep', [
    'Operational records: the engine writes technical decision-audit entries (the structured facts, rules fired, and software versions behind a recommendation) and anonymous usage counters. In our current hosting these live on short-lived serverless instances and are not maintained as a durable patient record. We keep no profiles and cannot link a conversation to you.',
    'No advertising or analytics trackers: this site sets no tracking cookies and contains no Google Analytics, Meta/Facebook pixel, or any third-party advertising or analytics code.',
  ]],
  ['Security', [
    'All traffic is encrypted in transit with HTTPS/TLS. The site enforces strict browser security headers (HSTS, content-security policy, frame denial, MIME sniffing protection), server-side input validation and sanitization on every endpoint, request rate limiting, and API keys that live only on the server — never in your browser.',
  ]],
  ['Third parties we use', [
    'Vercel (hosting), OpenAI (language processing), Google Maps Platform (nearby facilities and map images), and the CMS HealthCare.gov Marketplace API (coverage estimates). Each receives only the minimum described above. We never sell or share data for advertising.',
  ]],
  ['Children', [
    'Carevo is intended for adults. A parent or guardian may describe a child’s symptoms; do not let children under 13 use the site on their own.',
  ]],
  ['Your choices & contact', [
    'You can use the core triage flow without granting location, without the coverage tool, and without saving anything. Clearing your browser’s site data removes everything stored on your device. Questions or requests: use the contact page. We will update this policy as the product evolves and change the date below when we do.',
  ]],
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-5 pt-28 pb-16 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-carevo-600">Privacy Policy</p>
        <h1 className="text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
          Plain answers about your data.
        </h1>
        <p className="mt-4 text-sm font-semibold text-slate-500">Effective: July 17, 2026</p>

        {SECTIONS.map(([title, paras]) => (
          <section key={title} className="mt-10">
            <h2 className="text-xl font-black tracking-[-0.03em] text-ink">{title}</h2>
            {paras.map((p, i) => (
              <p key={i} className="mt-3 text-[15px] leading-7 text-slate-600">{p}</p>
            ))}
          </section>
        ))}
      </section>
    </main>
  )
}
