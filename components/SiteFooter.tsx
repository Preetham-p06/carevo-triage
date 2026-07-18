import Link from 'next/link'

/** Site-wide footer: persistent emergency protocol, medical disclaimer,
 *  legal links, nondiscrimination + language assistance notices. */
export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      {/* Persistent emergency escape — always visible, plain language */}
      <div className="bg-red-600 px-4 py-2.5 text-center">
        <p className="text-sm font-bold text-white">
          Emergency? Do not use this website — call <a href="tel:911" className="underline underline-offset-2">911</a> or
          go to the nearest emergency room now. Thoughts of self-harm? Call or text <a href="tel:988" className="underline underline-offset-2">988</a>.
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-xs leading-relaxed text-slate-500">
          <strong className="text-slate-600">Medical disclaimer:</strong> Carevo helps you decide where to seek care.
          It is for informational purposes only and does not provide medical advice, diagnosis, or treatment, and does
          not create a provider–patient relationship. Cost and coverage figures are estimates, not quotes or enrollment
          decisions. Always seek the advice of a qualified clinician with any questions about a medical condition.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          <strong className="text-slate-600">Nondiscrimination:</strong> Carevo is available to everyone and does not
          discriminate on the basis of race, color, national origin, age, disability, or sex.
          <span className="ml-1">
            <strong className="text-slate-600">Language help:</strong> If English is not your first language, you can
            answer in simple words — Carevo is built to understand. For free language assistance in a care setting, ask
            the facility you visit; U.S. providers must offer it.
          </span>
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
          <Link href="/benchmarks" className="hover:text-carevo-700">Benchmarks</Link>
          <Link href="/privacy" className="hover:text-carevo-700">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-carevo-700">Terms of Use</Link>
          <Link href="/contact" className="hover:text-carevo-700">Contact</Link>
          <span className="text-slate-400">© {new Date().getFullYear()} Carevo</span>
        </div>
      </div>
    </footer>
  )
}
