import { ArrowUpRightIcon, CheckCircleIcon, CheckIcon, CloudArrowUpIcon, LockSimpleIcon, PlusIcon, TagIcon, WifiSlashIcon, XCircleIcon } from '@phosphor-icons/react'
import { ASSURANCES, BENEFITS, EXAMS, FAQ, PROBLEMS, PROOF_LINE, SOLUTION, SOURCES, STEPS, TAGLINE } from './content'
import { Footer, Laptop, Logo, Nav, Phone, PrimaryCta, Reveal, TaglineReveal } from './parts'

// The landing page, built in the skill's order: hero, problem, benefits, tagline, how it works, proof, FAQ, risk
// reversal, final call to action. Dark and light sections alternate; one action throughout: start preparing, free.

export default function Landing() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Problem />
        <Benefits />
        <Tagline />
        <HowItWorks />
        <Proof />
        <Faq />
        <Assurances />
        <FinalCta />
      </main>
      <Footer />
      <FaqSchema />
    </>
  )
}

function ProofLine({ dark = true }: { dark?: boolean }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 caption-1 ${dark ? 'text-mist' : 'text-ink-2'}`} aria-label="What is inside">
      {PROOF_LINE.map(p => (
        <li key={p} className="flex items-center gap-2">
          <span aria-hidden className="size-1 rounded-full bg-saffron" />
          {p}
        </li>
      ))}
    </ul>
  )
}

/** A playful sticker beside the product shots. */
function Sticker({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`absolute z-10 rounded-full border border-ink/10 bg-paper px-3 py-2 caption-3 text-ink ${className}`}>{children}</span>
}

function Hero() {
  return (
    <section id="top" className="overflow-hidden bg-night px-4 pb-24 pt-24 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-16 pt-8 lg:grid-cols-[minmax(0,680px)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          <h1 className="max-w-[680px] heading-3 hero-text sm:heading-2 xl:heading-1">
            <span className="block">Prepare for CDS,</span>
            <span className="block">AFCAT and CAPF</span>
            <span className="block">without coaching fees</span>
          </h1>
          <p className="mt-6 max-w-[680px] body-3 text-mist">
            Mock tests with real negative marking, official UPSC papers on an OMR sheet, a study path for every topic and SSB practice that reads your answers like an assessor. Free, no sign up, works offline.
          </p>
          <PrimaryCta className="mt-8" />
          <div className="mt-6"><ProofLine /></div>
        </div>

        {/* The product: a laptop and a phone running the app, set at playful angles. */}
        <div className="relative mx-auto w-full max-w-xl">
          <Laptop src="landing/desktop.jpg" alt="Officer Prep on a laptop: today's countdown, tasks and study streak" eager className="w-[88%] -rotate-2" />
          <Phone src="landing/quiz.jpg" alt="A timed CDS practice question in Officer Prep" eager className="absolute -bottom-12 right-0 w-[38%] rotate-6" />
          <Sticker className="-top-4 right-[18%] rotate-6">Real negative marking</Sticker>
          <Sticker className="-bottom-6 left-[4%] -rotate-3">Works offline</Sticker>
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section className="bg-night-1 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl heading-4 text-white sm:heading-3">Your preparation is scattered. It does not have to be.</h2>
        </Reveal>
        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <ul className="flex flex-col gap-4" aria-label="What prep looks like today">
              {PROBLEMS.map((p, i) => (
                <li key={p} className={`flex max-w-md items-center gap-3 rounded-2xl bg-paper-2 px-4 py-4 body-5 text-ink ${['-rotate-2', 'rotate-1 sm:ml-12', '-rotate-1 sm:ml-6'][i]}`}>
                  <XCircleIcon weight="fill" className="size-6 shrink-0 text-bad" aria-hidden />
                  <span><span className="sr-only">Problem: </span>{p}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-3xl border border-white/10 bg-night-3 p-8">
              <div className="flex items-center gap-2 title-4 text-saffron"><Logo className="size-5" />With Officer Prep</div>
              <p className="mt-4 heading-6 text-white">{SOLUTION}</p>
              <ul className="mt-6 flex flex-col gap-3 body-6 text-mist">
                {['A study path through every topic', 'Mocks scored the way the exam scores them', 'A notebook that brings mistakes back'].map(t => (
                  <li key={t} className="flex items-center gap-2"><CheckCircleIcon weight="fill" className="size-5 shrink-0 text-good" aria-hidden />{t}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/** An OMR sheet fragment: bubbles A to D, one filled per row, each row marked right or wrong in words too. */
function OmrSheet() {
  const rows: [number, number, boolean][] = [[1, 2, true], [2, 0, true], [3, 3, false], [4, 1, true]] // CDS Maths: +1 right, −0.33 wrong
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-4" aria-hidden>
      <div className="flex items-center justify-between caption-4 text-ink-3"><span>OMR sheet · CDS Maths</span><span>Q 1 to 4</span></div>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map(([q, filled, ok]) => (
          <li key={q} className="flex items-center gap-3">
            <span className="w-4 caption-3 text-ink-2">{q}</span>
            <span className="flex gap-2">
              {'ABCD'.split('').map((l, j) => (
                <span key={l} className={`grid size-6 place-items-center rounded-full border caption-5 ${j === filled ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink-3'}`}>{l}</span>
              ))}
            </span>
            <span className={`ml-auto caption-3 ${ok ? 'text-good' : 'text-bad'}`}>{ok ? '+1' : '−0.33'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The spaced revision rhythm. */
function RevisionTimeline() {
  return (
    <ol className="relative flex flex-col gap-3 rounded-2xl border border-ink/10 bg-paper p-4" aria-hidden>
      <span className="absolute bottom-8 left-7 top-8 w-0.5 -translate-x-1/2 rounded-full bg-ink/15" />
      {[['Day 1', '1st review'], ['Day 3', '2nd review'], ['Week 1', '3rd review'], ['Month 1', 'Learnt']].map(([d, note], i) => (
        <li key={d} className="relative flex items-center gap-3">
          <span className={`grid size-6 place-items-center rounded-full border-2 ${i === 3 ? 'border-saffron bg-saffron' : 'border-ink/20 bg-paper'}`}>
            {i === 3 && <CheckIcon weight="bold" className="size-3 text-ink" />}
          </span>
          <span className="caption-3 text-ink">{d}</span>
          <span className="ml-auto caption-5 text-ink-3">{note}</span>
        </li>
      ))}
    </ol>
  )
}

/** A phone peeking into a tile from the right, cut off by the tile's edge. On phones it sits under the text. */
function PeekPhone({ src, alt, tilt }: { src: string; alt: string; tilt: string }) {
  return (
    <div className="mt-8 h-64 sm:absolute sm:right-8 sm:top-8 sm:mt-0 sm:h-auto sm:w-56">
      <Phone src={src} alt={alt} className={`mx-auto w-56 ${tilt}`} />
    </div>
  )
}

function Benefits() {
  const b = Object.fromEntries(BENEFITS.map(x => [x.id, x]))
  const tile = 'rounded-3xl bg-paper-2 p-6 sm:p-8'
  const peek = 'relative overflow-hidden sm:min-h-80'
  const Text = ({ id }: { id: string }) => (
    <>
      <h3 className="heading-6 text-ink">{b[id].title}</h3>
      <p className="mt-2 max-w-md body-6 text-ink-2">{b[id].text}</p>
    </>
  )
  return (
    <section id="features" className="bg-paper px-4 py-24 text-ink sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl heading-4 sm:heading-3">Everything between today and exam day, in one app</h2>
          <p className="mt-4 max-w-2xl body-3 text-ink-2">Five things that decide your score, each built the way the real exam and the real board work.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          <Reveal className={`${tile} ${peek} lg:col-span-4`}>
            <div className="sm:max-w-[55%]"><Text id="mocks" /></div>
            <PeekPhone src="landing/result.jpg" alt="A Quick 10 result: score, accuracy and the questions to learn from" tilt="rotate-3" />
          </Reveal>
          <Reveal className={`${tile} flex flex-col gap-6 lg:col-span-2`} delay={80}>
            <div><Text id="papers" /></div>
            <OmrSheet />
          </Reveal>
          <Reveal className={`${tile} flex flex-col gap-6 lg:col-span-2`}>
            <div><Text id="mistakes" /></div>
            <RevisionTimeline />
          </Reveal>
          <Reveal className={`${tile} ${peek} lg:col-span-4`} delay={80}>
            <div className="sm:max-w-[55%]"><Text id="ssb" /></div>
            <PeekPhone src="landing/ssb.jpg" alt="An SSB TAT story review in Officer Prep, with the checks it raised" tilt="-rotate-3" />
          </Reveal>
          <Reveal className={`${tile} ${peek} lg:col-span-6`}>
            <div className="sm:max-w-[55%]">
              <Text id="path" />
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Exams covered">
                {EXAMS.map(e => <li key={e} className="rounded-full border border-ink/10 bg-paper px-3 py-2 caption-3 text-ink">{e}</li>)}
              </ul>
            </div>
            <PeekPhone src="landing/today.jpg" alt="Officer Prep's Today page with the exam countdown" tilt="rotate-2" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Tagline() {
  return (
    <section className="bg-night px-4 py-24 sm:px-6" aria-label="Why it works">
      <div className="mx-auto max-w-6xl">
        <TaglineReveal lines={TAGLINE} className="max-w-[680px] heading-4 text-white sm:heading-3" />
      </div>
    </section>
  )
}

/** Small product illustrations for the three steps. */
function StepArt({ i }: { i: number }) {
  if (i === 0) return (
    <div className="flex flex-wrap gap-2" aria-hidden>
      {EXAMS.map((e, k) => <span key={e} className={`rounded-full border px-3 py-2 caption-3 ${k === 0 ? 'border-saffron bg-saffron text-ink' : 'border-ink/10 bg-paper text-ink'}`}>{e}</span>)}
    </div>
  )
  if (i === 1) return (
    <ul className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-paper p-4" aria-hidden>
      {[['Revise 18 cards due', true], ['Practise Profit and loss', false], ['Study the Number system guide', false]].map(([t, done]) => (
        <li key={t as string} className="flex items-center gap-2 body-6 text-ink">
          <span className={`grid size-5 place-items-center rounded-full border ${done ? 'border-good bg-good text-paper' : 'border-ink/20'}`}>{done && <CheckCircleIcon weight="bold" className="size-3" />}</span>
          <span className={done ? 'text-ink-3 line-through' : ''}>{t}</span>
        </li>
      ))}
    </ul>
  )
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-4" aria-hidden>
      <div className="flex items-baseline justify-between"><span className="caption-4 text-ink-3">Readiness for CDS</span><span className="title-2 text-ink">41%</span></div>
      <div className="mt-3 h-2 rounded-full bg-paper-2"><div className="h-2 w-[41%] rounded-full bg-saffron" /></div>
      <div className="mt-3 caption-5 text-ink-3">Up from 33% four weeks ago</div>
    </div>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="bg-paper-2 px-4 py-24 text-ink sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal><h2 className="max-w-2xl heading-4 sm:heading-3">Three steps, every day until the exam</h2></Reveal>
        <ol className="mt-12 flex flex-col gap-12">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div>
                  <span className="heading-3 text-saffron-ink">0{i + 1}</span>
                  <h3 className="mt-2 heading-5">{s.title}</h3>
                  <p className="mt-2 max-w-md body-3 text-ink-2">{s.text}</p>
                </div>
                <div className={`max-w-sm ${i % 2 ? '' : 'md:justify-self-end'}`}><StepArt i={i} /></div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Proof() {
  return (
    <section className="bg-night-1 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl heading-4 text-white sm:heading-3">Official sources, not guesswork</h2>
          <p className="mt-4 max-w-2xl body-3 text-mist">Papers and answer keys come from the official sites. The app links to them and never copies them.</p>
        </Reveal>
        <Reveal className="mt-12">
          <ul className="grid gap-4 md:grid-cols-3">
            {SOURCES.map(s => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer"
                  className="group flex h-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-night-3 p-6 transition-[background-color,transform] duration-300 ease-soft hover:bg-night-4 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-night-1">
                  <span><span className="block title-3 text-white">{s.name}</span><span className="mt-1 block caption-2 text-mist">{s.host}</span></span>
                  <ArrowUpRightIcon className="size-5 shrink-0 text-mist transition-transform duration-300 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
        {/* Testimonials: real quotes only. These stay marked until you supply them. */}
        <Reveal className="mt-12">
          <h3 className="title-2 text-white">What aspirants say</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[0, 1].map(k => (
              <figure key={k} className="rounded-2xl border border-dashed border-white/20 p-6">
                <blockquote className="body-3 text-white">{'{{testimonial}}'}</blockquote>
                <figcaption className="mt-4 caption-2 text-mist">{'{{name}}'}, {'{{exam and year}}'}</figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className="bg-paper px-4 py-24 text-ink sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Reveal>
          <h2 className="heading-4 sm:heading-3">Questions aspirants ask</h2>
          <p className="mt-4 max-w-sm body-3 text-ink-2">Anything else, open the app and look around. It costs nothing to try.</p>
        </Reveal>
        <Reveal>
          <ul className="flex flex-col gap-3">
            {FAQ.map(f => (
              <li key={f.q}>
                <details className="group rounded-2xl border border-ink/10 bg-paper-2 open:bg-paper">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-4 title-3 text-ink transition-colors duration-300 ease-soft hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <PlusIcon weight="bold" className="size-4 shrink-0 text-ink-2 transition-transform duration-500 ease-soft group-open:rotate-45" aria-hidden />
                  </summary>
                  <p className="faq-answer px-4 pb-4 body-6 text-ink-2">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

const ASSURANCE_ICON = { free: TagIcon, offline: WifiSlashIcon, private: LockSimpleIcon, backup: CloudArrowUpIcon } as const

function Assurances() {
  return (
    <section className="bg-night px-4 pt-24 sm:px-6" aria-label="No risk">
      <ul className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {ASSURANCES.map((a, i) => {
          const Icon = ASSURANCE_ICON[a.id as keyof typeof ASSURANCE_ICON]
          return (
            <li key={a.id}>
              <Reveal delay={i * 60}>
                <Icon weight="duotone" className="size-8 text-saffron" aria-hidden />
                <h3 className="mt-4 title-2 text-white">{a.title}</h3>
                <p className="mt-2 body-6 text-mist">{a.text}</p>
              </Reveal>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="bg-night px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-night-2 px-6 py-16 sm:px-12">
        <h2 className="max-w-[680px] heading-4 text-white sm:heading-2"><span className="block">Your exam date is fixed.</span><span className="block">Your preparation starts today.</span></h2>
        <PrimaryCta className="mt-8" />
        <div className="mt-6"><ProofLine /></div>
      </Reveal>
    </section>
  )
}

/** The FAQ as structured data, for search engines and answer engines. */
function FaqSchema() {
  const data = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
