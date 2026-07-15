import Link from 'next/link'

const teamSignals = ['The Ohio State University', 'American Regent', 'Nationwide / Memorial Health']

const principles = [
  ['01 - Safety first', 'Emergency signals get handled before anything else. Carevo is built to raise concern when the facts require it.'],
  ['02 - Clear first steps', 'Members should leave with one understandable next step, not a pile of confusing options.'],
  ['03 - Human review stays visible', 'Carevo is designed for insurer workflows where routing logic, sources, and exceptions can be reviewed.'],
  ['04 - Built for real handoffs', 'The product has to work where people actually get stuck: front desks, network options, costs, and follow-up.'],
]

const founders = [
  {
    name: 'Preetham Prabhu',
    role: 'Co-Founder',
    image: '/founders/preetham-prabhu.png',
    body: 'Preetham came through data-driven outreach work, software that helps people in daily life, and regulated software validation at American Regent. That shaped Carevo around usefulness, traceability, and product discipline.',
  },
  {
    name: 'Paul Alexander',
    role: 'Co-Founder',
    image: '/founders/paul-alexander.png',
    body: 'Paul saw the navigation problem up close while working near the front desk in urgent and emergency care settings. He watched patients lose time and money when the first facility was not equipped for what they needed.',
  },
  {
    name: 'Krish Panicker',
    role: 'Co-Founder',
    image: '/founders/krish-panicker.png',
    body: 'Krish brings the systems lens. Through autonomous robotics research with PX4, ROS 2, Gazebo simulation, and vision-based control, he has worked on software that has to behave reliably in changing environments.',
  },
]

export default function CompanyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-8%,rgba(191,219,254,0.72),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_42%,#ffffff_78%,#f7fbff_100%)] px-4 pb-16 pt-28 text-slate-950 sm:px-6 sm:pb-20 sm:pt-40">
      <section className="marketing-reveal mx-auto flex min-h-[560px] max-w-7xl flex-col items-center justify-center text-center sm:min-h-[620px]">
        <p className="mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-5 py-3 text-sm font-black text-slate-500 shadow-sm sm:mb-10">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Company
        </p>
        <h1 className="mx-auto max-w-6xl font-display text-[clamp(2.75rem,13vw,4.75rem)] font-black leading-[1.02] tracking-[-0.065em] sm:text-7xl lg:text-8xl">
          Built by engineers and researchers
          <span className="block text-blue-500">who have seen healthcare from different angles.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-4xl text-base font-semibold leading-8 text-slate-600 sm:mt-10 sm:text-xl sm:leading-9">
          Carevo exists because nobody should have to guess whether to go to the ER, urgent care, primary care, telehealth, or home care. We are building the intelligence layer that helps members take the right first step while giving insurers a safer, auditable routing workflow.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-10 sm:w-auto sm:max-w-none sm:flex-row">
          <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700">
            Book a call
          </Link>
          <Link href="/landing-v2.html#products" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-8 py-4 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950">
            Explore platform
          </Link>
        </div>
        <div className="mt-8 inline-flex rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
          Regulated software
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-16 max-w-7xl sm:mt-20">
        <p className="mb-5 text-center text-xs font-black uppercase tracking-[0.24em] text-slate-400">Built by a team from</p>
        <div className="grid gap-4 md:grid-cols-3">
          {teamSignals.map((signal) => (
            <div key={signal} className="rounded-[1.4rem] border border-slate-200 bg-white/78 px-5 py-7 text-center font-display text-xl font-black tracking-[-0.04em] text-slate-900 shadow-sm backdrop-blur sm:px-6 sm:py-8 sm:text-2xl">
              {signal}
            </div>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 grid max-w-7xl gap-10 border-t border-slate-200/80 pt-14 sm:mt-24 sm:gap-12 sm:pt-16 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <h2 className="font-display text-[clamp(2.4rem,12vw,4.25rem)] font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl">
          We came at this problem from three perspectives.
        </h2>
        <div className="space-y-5 text-base font-semibold leading-8 text-slate-600 sm:space-y-6 sm:text-lg">
          <p>
            Paul saw how hard healthcare navigation is for real patients at the front desk. Some people waited, paid, and still had to be redirected because the facility did not have the right equipment or workflow for their situation.
          </p>
          <p>
            Preetham came from data-driven outreach, practical software building, and pharmaceutical software validation. That experience made the team care about systems that are useful, careful, and easy to review.
          </p>
          <p>
            Krish brought a reliability mindset from autonomous robotics research, where sensing, control, and software behavior have to hold up under changing conditions.
          </p>
          <p className="font-black text-slate-950">
            Carevo is what we built after those viewpoints connected: a calmer way to help people choose the right first step.
          </p>
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl sm:mt-24">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-carevo-600">Principles</p>
        <div className="grid gap-5 md:grid-cols-2">
          {principles.map(([title, body]) => (
            <article key={title} className="scroll-reveal rounded-[1.4rem] border border-slate-200 bg-white/78 p-8 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
              <h2 className="font-display text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">{title}</h2>
              <p className="mt-4 text-base font-semibold leading-8 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl sm:mt-24">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-carevo-600">Founders</p>
        <div className="grid gap-6 lg:grid-cols-3">
          {founders.map((founder) => (
            <article key={founder.name} className="scroll-reveal overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm">
              <div className="h-36 bg-[#a9bec1]" />
              <div className="-mt-24 px-8 pb-8">
                <img
                  src={founder.image}
                  alt={`${founder.name} portrait`}
                  className="h-48 w-48 rounded-full border-[8px] border-white object-cover shadow-lg shadow-slate-900/10"
                />
                <h2 className="mt-6 font-display text-3xl font-black tracking-[-0.05em] text-slate-950">{founder.name}</h2>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-carevo-600">{founder.role}</p>
                <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">{founder.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-reveal mx-auto mt-20 max-w-7xl rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-900/20 sm:mt-24 sm:p-12">
        <h2 className="max-w-4xl font-display text-[clamp(2.35rem,12vw,4.3rem)] font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl">
          The right care decision should be easier to trust.
        </h2>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-300">
          We are building Carevo so members get a clear first step and insurers can see the routing trace behind it.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100">
            Book a call
          </Link>
          <a href="mailto:usecarevoai@gmail.com" className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-black text-white transition hover:bg-white/10">
            usecarevoai@gmail.com
          </a>
        </div>
      </section>
    </main>
  )
}
