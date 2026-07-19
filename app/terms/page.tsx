const SECTIONS: [string, string[]][] = [
  ['Agreement', [
    'By using Carevo you agree to these terms. If you do not agree, do not use the site. Carevo is operated in the United States; these terms are governed by the laws of the State of Ohio.',
  ]],
  ['Medical disclaimer — read this first', [
    'Carevo is an informational tool that helps you decide where to seek care. It does not provide medical advice, treatment, or condition identification; it never names conditions; and using it does not create a provider–patient relationship. Its suggestions are navigation guidance, not a clinical determination. Always consult a qualified clinician about a medical condition, and never delay or disregard professional care because of something on this site.',
  ]],
  ['Emergencies', [
    'If you are experiencing a medical emergency — or think you might be — do not use this website. Call 911 or go to the nearest emergency room immediately. If you are having thoughts of self-harm, call or text 988 (Suicide & Crisis Lifeline). Carevo screens for emergency signals and will tell you to call 911 when it detects them, but no automated screen is a substitute for your own judgment.',
  ]],
  ['Estimates are estimates', [
    'Cost figures are ranges built from published sources and your inputs; actual charges vary by facility, plan, and the care you receive. Coverage figures come from the government’s HealthCare.gov Marketplace API and are eligibility estimates, not an application, enrollment decision, or guarantee. You may request a Good Faith Estimate from any provider before non-emergency care.',
  ]],
  ['Acceptable use', [
    'Use Carevo only for yourself or someone in your care. Do not submit another person’s health information without their permission, probe or overload the service, attempt to extract its models or data, or use it to build a competing automated triage service. We may rate-limit or block abusive traffic.',
  ]],
  ['No warranty; limitation of liability', [
    'Carevo is provided “as is” and “as available,” without warranties of any kind, express or implied, including fitness for a particular purpose. To the maximum extent permitted by law, Carevo and its operators are not liable for any indirect, incidental, special, consequential, or exemplary damages, or for decisions made or not made in reliance on the site. Where liability cannot be excluded, it is limited to the amount you paid to use the site (currently zero).',
  ]],
  ['Nondiscrimination', [
    'Carevo is available to everyone and does not discriminate on the basis of race, color, national origin, age, disability, or sex. The interview is written in simple English on purpose; answer in the words you have.',
  ]],
  ['Changes & contact', [
    'We may update these terms as the product evolves; the date below reflects the latest version. Continued use after changes means you accept them. Questions: use the contact page.',
  ]],
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-5 pt-28 pb-16 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-carevo-600">Terms of Use</p>
        <h1 className="text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
          The rules, in plain language.
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
