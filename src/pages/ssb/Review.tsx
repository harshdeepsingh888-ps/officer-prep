import { EMPTY_PROFILE, type InterviewProfile } from '../../data/ssb'
import { useSetting } from '../../lib/db'
import { TAT_CHECKS, TAT_PROBLEM, blankSlideIdeas, storyFlags, type BoxChar, type Flag } from '../../lib/psych'
import { Button, inputBase } from '../../components/ui'
import { FlagList } from './common'

// The review side of the psych tests: what an assessor would look at in each answer and across a set.

/** One TAT story: what the checks noticed, then your own check of it against the picture. */
export function TatStoryReview({ story, blank, review, onChange }: {
  story: string; blank: boolean; review: Record<string, string>; onChange: (r: Record<string, string>) => void
}) {
  if (!story.trim()) return null
  const problem = TAT_PROBLEM.find(p => p.id === review.problem)
  return (
    <div className="mt-2 space-y-2">
      <FlagList flags={storyFlags(story, { blank })} />
      {!blank && (
        <fieldset className="min-w-0 rounded-2xl bg-surface-2 px-3 py-2">{/* fieldsets default to their content's width */}
          <legend className="sr-only">Check this story against the picture</legend>
          <div className="space-y-1">
            {TAT_CHECKS.map(c => (
              <label key={c.id} className="flex items-start gap-2 caption-5 text-ink-300 pointer-coarse:py-1">
                <input type="checkbox" className="mt-0.5 accent-accent-500" checked={review[c.id] === 'yes'} onChange={e => onChange({ ...review, [c.id]: e.target.checked ? 'yes' : '' })} />
                {c.text}
              </label>
            ))}
          </div>
          <label className="mt-2 flex flex-wrap items-center gap-2 caption-5 text-ink-400">
            The picture's problem
            <select className={`${inputBase} min-w-0 max-w-full px-3 py-1 caption-5`} value={review.problem ?? ''} onChange={e => onChange({ ...review, problem: e.target.value })}>
              <option value="">Choose…</option>
              {TAT_PROBLEM.map(p => <option key={p.id} value={p.id}>{p.text}</option>)}
            </select>
          </label>
          {problem && !problem.ok && (
            <p className="mt-1 caption-5 text-saffron-400">
              ⚑ {problem.id === 'invented' ? 'A crisis the picture does not show reads as a story you brought with you.' : 'Explaining a problem away skips what the picture is testing: how the hero copes.'}
            </p>
          )}
        </fieldset>
      )}
    </div>
  )
}

/** Patterns across a whole set (the same hero, ending or opening; many blanks), or a line saying there are none. */
export function SetPatterns({ flags, clear }: { flags: Flag[]; clear?: string }) {
  if (!flags.length) return clear ? <p className="mt-4 caption-5 text-ink-500">{clear}</p> : null
  return (
    <div className="mt-4 rounded-2xl bg-saffron-950/60 px-3 py-2">
      <div className="mb-1 caption-4 text-saffron-400">Across the set</div>
      <FlagList flags={flags} />
    </div>
  )
}

/** The blank TAT slide: write about your own life. Ideas come from your PIQ, so the story and the interview agree. */
export function BlankSlideIdeas() {
  const [profile] = useSetting<InterviewProfile>('profile', EMPTY_PROFILE)
  const ideas = blankSlideIdeas(profile)
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-3 body-6 text-ink-300">
      <div className="mb-1 caption-4 text-accent-400">Blank slide: your own story</div>
      Write about something you have really done; the assessors read it against your PIQ.
      {ideas.length
        ? <> From your PIQ: <span className="text-ink-100">{ideas.join(' · ')}</span></>
        : <span className="text-ink-500"> Fill in hobbies, sports and achievements under SSB → Interview to see ideas here.</span>}
    </div>
  )
}

/** A small segmented choice, e.g. M / F / P. */
function Seg<T extends string>({ label, options, value, onChange, show = o => o }: {
  label: string; options: T[]; value: T | ''; onChange: (v: T) => void; show?: (o: T) => string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-full bg-fg/[0.06]">
      {options.map(o => (
        <button key={o} type="button" role="radio" aria-checked={value === o} aria-label={o === '-' ? 'negative' : o === '+' ? 'positive' : o === '0' ? 'neutral' : o}
          onClick={() => onChange(o)}
          className={`min-w-7 px-1 py-1 caption-5 tabular-nums pointer-coarse:min-h-9 ${value === o ? 'bg-accent-500 text-on-accent' : 'text-ink-300 hover:text-fg'}`}>
          {show(o)}
        </button>
      ))}
    </div>
  )
}

/** PPDT's character box: tap where each person stood, then give each a sex, an exact age and a mood, and circle your hero. */
export function CharacterBox({ chars, hero, onChange, onHero }: {
  chars: BoxChar[]; hero: number | null; onChange: (c: BoxChar[]) => void; onHero: (i: number | null) => void
}) {
  const add = (x: number, y: number) => onChange([...chars, { x, y, sex: '', age: '', mood: '' }])
  const set = (i: number, patch: Partial<BoxChar>) => onChange(chars.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const remove = (i: number) => {
    onChange(chars.filter((_, j) => j !== i))
    if (hero === i) onHero(null)
    else if (hero !== null && hero > i) onHero(hero - 1)
  }
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        {/* The box stands in for the picture: each mark goes where that person was. */}
        <div role="presentation" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); add((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height) }}
          className="relative aspect-[4/3] w-full cursor-crosshair rounded-2xl bg-surface-2 ring-1 ring-fg/15">
          {!chars.length && <span className="pointer-events-none absolute inset-0 grid place-items-center px-4 text-center caption-5 text-ink-500">Tap where each person was in the picture</span>}
          {chars.map((c, i) => (
            <button key={i} type="button" onClick={e => { e.stopPropagation(); onHero(hero === i ? null : i) }}
              style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }} aria-label={`Character ${i + 1}${hero === i ? ', your hero' : ''}`}
              className={`absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full caption-4 ${hero === i ? 'bg-accent-500 text-on-accent ring-2 ring-accent-300 ring-offset-2 ring-offset-canvas' : 'bg-ink-700 text-ink-100'}`}>
              {c.sex || i + 1}
            </button>
          ))}
        </div>
        <Button variant="subtle" size="sm" className="mt-2" onClick={() => add(0.15 + 0.17 * (chars.length % 5), 0.5)}>Add a character</Button>
        <p className="mt-1 caption-5 text-ink-500">Tap a mark to circle your hero.</p>
      </div>
      <ol className="min-w-0 space-y-2" aria-label="Characters">
        {chars.map((c, i) => (
          <li key={i} className="flex flex-wrap items-center gap-1 body-6">
            <span className="w-4 tabular-nums text-ink-500">{i + 1}</span>
            <Seg label={`Character ${i + 1} sex`} options={['M', 'F', 'P'] as const} value={c.sex} onChange={sex => set(i, { sex })} />
            <input aria-label={`Character ${i + 1} age`} inputMode="numeric" placeholder="Age" value={c.age} onChange={e => set(i, { age: e.target.value })}
              className={`${inputBase} w-14 px-2 py-1 body-6 tabular-nums`} />
            <Seg label={`Character ${i + 1} mood`} options={['+', '0', '-'] as const} value={c.mood} onChange={mood => set(i, { mood })} show={o => (o === '-' ? '−' : o)} />
            <label className="flex items-center gap-1 caption-5 text-ink-400 pointer-coarse:py-1">
              <input type="radio" name="ppdt-hero" className="accent-accent-500" checked={hero === i} onChange={() => onHero(i)} />Hero
            </label>
            <button type="button" aria-label={`Remove character ${i + 1}`} onClick={() => remove(i)} className="px-1 text-ink-500 hover:text-ember-300">×</button>
          </li>
        ))}
      </ol>
    </div>
  )
}
