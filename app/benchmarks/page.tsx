import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carevo — Published triage benchmarks',
  description:
    'Carevo publishes its triage accuracy: 90.2% mean on the MedAsk/Semigran Triage Bench (above the published MedAsk result of 87.6%) with 100% safety of advice, 96.7% on a 240-case clinical gate, 100% safe-or-exact. Full methodology included.',
}

const headline = [
  ['0', 'dangerous under-triage results across every verification gate ever run'],
  ['90.2%', 'mean accuracy across 5 runs of the published Semigran Triage Bench — above MedAsk\u2019s published 87.6%'],
  ['96.7%', 'exact on Carevo’s 240-case multi-turn clinical gate'],
  ['100%', 'safe-or-exact on both — every miss routed to a safer level, never a riskier one'],
] as const

const h2hRows = [
  ['Carevo', '90.2 (1.1)', '100 (0)', '86.7 (0)', '84 (3.3)', '100 (0)', '100 (0)', true],
  ['MedAsk', '87.6 (3.7)', '92 (5.6)', '82.7 (3.7)', '88 (5.6)', '92.9 (1.9)', '41.7 (11.8)', false],
  ['OpenAI o3', '75.6 (3.5)', '90.7 (6)', '82.7 (3.7)', '53.3 (12.5)', '93.3 (1.6)', '72.1 (8)', false],
  ['OpenAI o4-mini', '80.4 (2.9)', '89.3 (6)', '81.3 (3)', '70.7 (8.9)', '92.4 (2.5)', '61.3 (11.9)', false],
  ['GPT-4.5', '68.9 (3.1)', '93.3 (0)', '82.7 (3.7)', '30.7 (6)', '97.3 (1)', '91.5 (2.8)', false],
] as const

export default function BenchmarksPage() {
  return (
    <main className="min-h-screen bg-white px-5 pt-28 pb-16 text-slate-950">
      {/* Hero */}
      <section className="mx-auto max-w-4xl">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-carevo-600">Benchmarks</p>
        <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">
          We publish our numbers. Ask our competitors for theirs.
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
          Every figure on this page comes from versioned benchmark files, a scripted test harness, and
          verbatim transcripts committed to our repository. Any result can be re-run and reproduced.
          Last verification run: July 18, 2026.
        </p>
      </section>

      {/* Headline stats */}
      <section className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2">
        {headline.map(([stat, label]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-4xl font-black tabular-nums tracking-[-0.04em] text-carevo-700">{stat}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{label}</p>
          </article>
        ))}
      </section>

      {/* Why under-triage is the metric */}
      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-ink">The metric that matters is the one that can hurt someone.</h2>
        <p className="mt-4 text-[15px] leading-7 text-slate-600">
          A triage system can miss in two directions. Send someone to urgent care who could have stayed
          home, and you cost them an afternoon and a copay. Send someone home who needed the emergency
          room, and you can cost them their life. We call the second kind <strong>under-triage</strong>, we count it as an
          absolute failure with zero tolerance, and every gate below reports it separately. Carevo has
          recorded zero under-triage results across every verification gate in its history — while keeping
          exact accuracy high enough that the system remains useful rather than reflexively over-cautious.
        </p>
      </section>

      {/* Head-to-head */}
      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-ink">Head-to-head: a competitor&rsquo;s own published benchmark</h2>
        <p className="mt-4 text-[15px] leading-7 text-slate-600">
          In July 2025, MedAsk published Triage Bench — 45 standardized clinical vignettes (Semigran et
          al., 15 emergency &middot; 15 non-emergency &middot; 15 self-care) — and used it to report that their system
          beats OpenAI&rsquo;s o3 and GPT-4.5 at triage. We ran the identical canonical vignettes from their
          public repository through Carevo&rsquo;s full multi-turn interview, five times, against the same
          production code serving this website, scored with their metric definitions. Their rows below are
          their published results; ours were produced July 2026.
        </p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="px-3 py-3 font-black">System</th>
                <th className="px-3 py-3 font-black">Accuracy</th>
                <th className="px-3 py-3 font-black">Emergency</th>
                <th className="px-3 py-3 font-black">Non-emerg.</th>
                <th className="px-3 py-3 font-black">Self-care</th>
                <th className="px-3 py-3 font-black">Safety of advice</th>
                <th className="px-3 py-3 font-black">Overtriage*</th>
              </tr>
            </thead>
            <tbody>
              {h2hRows.map(([name, acc, em, ne, sc, safety, over, isUs], i) => (
                <tr key={name as string} className={isUs ? 'bg-carevo-50' : i % 2 ? 'bg-slate-50' : 'bg-white'}>
                  <td className={`px-3 py-3 ${isUs ? 'font-black text-carevo-800' : 'font-semibold text-slate-700'}`}>{name}</td>
                  {[acc, em, ne, sc, safety, over].map((v, j) => (
                    <td key={j} className={`px-3 py-3 tabular-nums ${isUs ? 'font-black text-carevo-800' : 'font-semibold text-slate-500'}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Values are mean (standard deviation) across runs; Carevo n=5 runs, 225 scored trials. *Overtriage
          counts, among a system&rsquo;s INCORRECT answers only, the share that routed too high — Carevo&rsquo;s reads
          100% because every one of its misses was over-cautious; the others&rsquo; misses include routing BELOW
          the correct urgency. Safety of advice is the share of all answers at or above correct urgency:
          Carevo was the only system with no below-urgency advice. Being honest about the rest: MedAsk
          scores higher on self-care precision (88 vs 84), and at 45 vignettes the overall accuracy gap
          (90.2 vs 87.6) is within statistical noise on a paired test — the safety record is the robust
          difference. Sources: MedAsk&rsquo;s public benchmark repository (github.com/medaks/medask-benchmarks)
          and their July 2025 results; Carevo runs are reproducible from our committed harness and outputs.
        </p>
      </section>

      {/* Internal gates */}
      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-ink">Internal gates: harder than the benchmark</h2>
        <p className="mt-4 text-[15px] leading-7 text-slate-600">
          Before any change ships, Carevo must pass a 240-case multi-turn clinical gate — synthetic
          vignettes spanning all six care levels, with labels reviewed and where necessary corrected under
          a named clinician’s signature. Current result: <strong>232 of 240 exact (96.7%)</strong>, 8 safe
          over-routes, 0 under-triage, 0 errors. Separately, a vague-patient gate tests what benchmarks
          usually ignore: terse answers (&ldquo;kinda bad i guess&rdquo;), hedging, deny-everything patients,
          and limited-English phrasings like &ldquo;head very hot two day.&rdquo; Current result: <strong>24 of 24</strong> correct
          or acceptable, 0 under-triage. A change that fails either gate does not deploy — the release
          process enforces this mechanically, not as a policy document.
        </p>
      </section>

      {/* Methodology */}
      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-ink">How the numbers are produced</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
          <p>
            <strong>Deterministic routing.</strong> A language model translates patient words into structured
            clinical facts and phrases questions — it never chooses the care level. Routing comes from
            Carevo’s own engine: versioned clinical rules citing AHA, CDC, AAP, and ACOG guidance that can
            only raise urgency; raw-text safety nets that run before and independently of the AI; and a
            transparent scoring model with a proven monotonicity guarantee (a sicker presentation can never
            receive a lower recommendation).
          </p>
          <p>
            <strong>Scripted, reproducible runs.</strong> An autonomous test harness plays each case as a
            multi-turn conversation against the production API and records verbatim transcripts. Benchmark
            files, harness code, rubric, and results are versioned together, and every recommendation
            carries the exact engine, ruleset, and knowledge-base versions that produced it in a
            hash-chained audit log.
          </p>
          <p>
            <strong>Clinician-governed learning.</strong> The system’s only mechanism for becoming less
            cautious is a calibration layer in which every pattern traces to case rows approved by a named
            clinical reviewer — who has rejected proposals, and whose rejections became permanent
            guardrails. Emergency (911) routing is untouchable by learning, by configuration, and by
            design. Kill switches can revert any learned behavior instantly.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="mx-auto mt-16 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-black tracking-[-0.03em] text-amber-900">What these numbers do not claim</h2>
        <p className="mt-3 text-sm leading-6 text-amber-900/80">
          These are vignette benchmarks, not clinical outcomes: they measure agreement with expert-labeled
          cases, not downstream patient results, and the external set is modest (n=45). Carevo’s misses
          skew deliberately toward over-caution, which costs convenience — we consider that the correct
          failure direction and report it rather than hide it. Carevo is an informational navigation tool,
          not medical advice, and no benchmark replaces clinical judgment. In an emergency, call 911.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-4xl rounded-[2rem] bg-slate-950 p-8 text-white sm:p-10">
        <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
          Want the raw transcripts, the rubric, or a live re-run?
        </h2>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
          We share the full methodology — benchmark files, scoring code, per-case transcripts, and the
          clinician review records — with health systems, payers, and researchers under NDA. Or just try
          the product the benchmarks describe.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
            Request the methodology
          </Link>
          <Link href="/triage" className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10">
            Try Carevo live
          </Link>
        </div>
      </section>
    </main>
  )
}
