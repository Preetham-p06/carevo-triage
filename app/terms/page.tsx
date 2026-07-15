import Link from 'next/link'

const terms = [
  ['Care routing support', 'Carevo helps users understand where to seek care based on the information they provide. It is not a replacement for a licensed clinician, emergency services, or local care team instructions.'],
  ['Emergency use', 'If symptoms may be life-threatening, users should call 911 or local emergency services immediately. Carevo emergency safeguards are designed to escalate clear danger signals.'],
  ['Business review', 'Insurer and partner workflows should review routing outputs, sources, exceptions, and operational policies before deployment. Carevo is designed to keep that review trail visible.'],
  ['Contact', 'Questions about product terms, pilots, or partnerships can be sent to hello@carevoai.com.'],
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 pt-28 pb-16 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-carevo-600">Terms</p>
        <h1 className="max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.06em] sm:text-7xl">
          Clear boundaries for a safer care navigation product.
        </h1>
        <p className="mt-8 max-w-3xl text-xl font-semibold leading-9 text-slate-600">
          These public terms summarize the intended product boundaries for Carevo while the company prepares customer-specific agreements and deployment policies.
        </p>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-5 md:grid-cols-2">
        {terms.map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
            <h2 className="text-2xl font-black tracking-[-0.04em]">{title}</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-6xl rounded-[2rem] border border-slate-200 bg-slate-50 p-8 sm:p-12">
        <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
          Need production terms for a payer workflow?
        </h2>
        <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600">
          We can map the product boundary, data handling, and review requirements for your organization.
        </p>
        <Link href="/contact" className="mt-8 inline-flex items-center justify-center rounded-full bg-carevo-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-carevo-600/20 transition hover:bg-carevo-700">
          Contact Carevo
        </Link>
      </section>
    </main>
  )
}
