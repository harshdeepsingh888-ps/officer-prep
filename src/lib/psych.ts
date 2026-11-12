import { wordCount } from './util'

// Checks on SSB psych-test answers, written from how assessors read them: one real person across TAT, WAT, SRT and
// SD; qualities shown through what the hero does rather than named; answers that come fresh rather than learnt.
// They are prompts to re-read your own answer, not a score: nothing here adds up to a mark.

export type Flag = { id: string; text: string }

/** What most people can handwrite in TAT's 4 minutes. */
export const TAT_WORDS = { min: 80, max: 150 }

// ── TAT and PPDT stories ──────────────────────────────────────────
const STORY_RULES: { id: string; re: RegExp; text: string }[] = [
  { id: 'award', re: /\b(medals?|awards?|awarded|prizes?|troph(y|ies)|felicitat\w*|applau\w*|ovation|commendation|honou?red)\b/i,
    text: 'Ends in an award or applause. The quiet result of the work is enough, and the hero can credit the others.' },
  { id: 'years', re: /\b(\d+|two|three|four|five|six|seven|eight|nine|ten|several|many|few)\s+years?\b|\byears? (later|after)\b/i,
    text: 'Spans years. Keep it to what the hero can do in days, weeks or a few months.' },
  { id: 'stock', re: /\b(felt content|praised (his|her|their|the) (team|men|friends|efforts)|boost(ed|ing)? (the )?morale|memorable experience|lived happily|everyone (praised|appreciated|thanked) (him|her))\b/i,
    text: 'A stock ending coaching material uses for every story. Say what actually changed instead.' },
  { id: 'moral', re: /\b(moral of the story|we should (always|never)|one should|everyone should|taught (him|her|everyone|them) a lesson)\b/i,
    text: 'Preaches a moral. Let the actions speak.' },
  { id: 'defence', re: /\b(SSB|CDS|NDA|AFCAT|joined the (army|navy|air force|coast guard)|got (his|her) commission|was commissioned)\b/i,
    text: 'A defence or SSB plot. Fine only when the picture is plainly military; otherwise give the hero a life like your own.' },
  { id: 'firstaid', re: /\bCPR\b[^.]*\b(water|lungs)\b|\bpump(ed|ing|s)? (out )?(the )?water\b|\b(spoon|cloth|stick|wallet|pen|something)\b[^.]{0,25}\b(in|into|between)\b[^.]{0,12}\b(mouth|teeth)\b|\b(held|hold|holds|holding|pinned|pinning) (him|her|them) down\b/i,
    text: 'Check the first aid: CPR does not pump water out of the lungs, and someone having a seizure is not held down or given anything to bite.' },
  { id: 'filmy', re: /\bkick(ed|s)? (the|his|her) (knife|gun|pistol|weapon)\b|\bsingle[- ]handed(ly)?\b|\boverpowered (all|the) (gang|robbers|thieves|attackers)\b/i,
    text: 'A film-style move. A sensible hero raises the alarm, gets help or calls the police first.' },
]

/** Things to re-read in one story. An empty story gets none (the review already says it was not attempted).
 *  The blank slide is your own story, so writing it as "I" is fine there. */
export function storyFlags(story: string, { blank = false } = {}): Flag[] {
  const n = wordCount(story)
  if (!n) return []
  const out: Flag[] = []
  if (n < 50) out.push({ id: 'short', text: `${n} words: too thin to show who the hero is. Aim for ${TAT_WORDS.min}–${TAT_WORDS.max}.` })
  if (n > TAT_WORDS.max + 30) out.push({ id: 'long', text: `${n} words: more than most people can write by hand in 4 minutes. Cut side plots.` })
  for (const r of STORY_RULES) if (r.re.test(story)) out.push({ id: r.id, text: r.text })
  if (!blank && (story.match(/\bI\b/g) ?? []).length >= 3) out.push({ id: 'first-person', text: 'Written as "I". A TAT story is about a hero you name and describe.' })
  return out
}

// Capitalised words that start sentences or name places and times, not people.
const NOT_NAMES = new Set(('The A An It On In One After When While This That There These Those He She His Her They Their We Our My I ' +
  'Two Three Four Some During As At Last Today Yesterday Tomorrow Once Every Since Being Then So But And Also However Soon Next ' +
  'Mr Mrs Ms Dr Captain Major Colonel Lieutenant Sir Madam Professor Inspector Sub Constable Officer Uncle Aunt ' +
  'Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December ' +
  'India Indian Delhi Mumbai Diwali Holi NCC').split(' '))

/** The hero's name: the first capitalised word in the opening lines that reads like a person, if any. */
export function heroName(story: string): string | null {
  const opening = story.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')
  const words = [...opening.matchAll(/\b([A-Z][a-z]{2,})\b('s)?(?=\s*(,|\bwas\b|\bis\b|\bhad\b|\bhas\b|\bsaw\b|\band\b|\bdecided\b|\bnoticed\b|\bwent\b|\bwho\b|\ba\b|\ban\b)?)/g)]
    .filter(m => !NOT_NAMES.has(m[1]))
  const person = words.find(m => m[3] !== undefined || m[2])
  return (person ?? words[0])?.[1] ?? null
}

const FEELING = /\b(worried|worry|nervous|anxious|scared|afraid|upset|sad|tense|concerned|relieved|disappointed|frustrated|hesitant|unsure|angry|shocked|confused|happy|glad|excited|proud|calm|thought|wondered|realised|realized|felt)\b/i
const WINS = /\b(won|wins|first prize|first place|came first|stood first|topped|was selected|got selected)\b/i

/** Patterns across a whole TAT set: the same hero, the same ending, a hero who always wins or never feels. */
export function setFlags(stories: string[]): Flag[] {
  const written = stories.filter(s => wordCount(s) > 0)
  if (written.length < 3) return []
  const out: Flag[] = []

  const names = new Map<string, number>()
  for (const s of written) { const n = heroName(s); if (n) names.set(n, (names.get(n) ?? 0) + 1) }
  for (const [name, n] of names) if (n >= 3) out.push({ id: 'same-hero', text: `${name} is the hero of ${n} stories. Different pictures call for different people: vary the hero where the picture allows.` })

  const wins = written.filter(s => WINS.test(s)).length
  if (wins >= 3 && wins * 2 >= written.length) out.push({ id: 'always-wins', text: `The hero wins in ${wins} stories. Effort sometimes ends in partial success, and how the hero copes then says more.` })

  const stock = written.filter(s => STORY_RULES.find(r => r.id === 'stock')!.re.test(s)).length
  if (stock >= 2) out.push({ id: 'same-ending', text: `${stock} stories end on a stock line. Read together, they look learnt.` })

  const openings = new Map<string, number>()
  for (const s of written) {
    const key = s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 4).join(' ')
    if (key.split(' ').length === 4) openings.set(key, (openings.get(key) ?? 0) + 1)
  }
  for (const [key, n] of openings) if (n >= 2) out.push({ id: 'same-opening', text: `${n} stories open the same way ("${key}…").` })

  const feel = written.filter(s => FEELING.test(s)).length
  if (written.length >= 4 && feel <= 1) out.push({ id: 'no-feelings', text: 'Hardly any story says what the hero thought or felt. A hero who worries and still acts is more believable than one who feels nothing.' })
  return out
}

/** Questions to answer about each TAT story once the set is done. */
export const TAT_CHECKS = [
  { id: 'moment', text: 'The scene in the picture comes in the first two or three lines' },
  { id: 'figures', text: 'Every person and key object in the picture has a part' },
  { id: 'feelings', text: 'The hero thinks and feels, then acts' },
  { id: 'others', text: 'Others take part; the hero does not do everything alone' },
  { id: 'realistic', text: 'The ending is realistic and reached within weeks or months' },
] as const

/** How the story treats the picture's problem. The last two are the ones assessors mark down. */
export const TAT_PROBLEM = [
  { id: 'faced', text: 'Faced the problem the picture shows', ok: true },
  { id: 'purpose', text: 'No problem shown: gave the hero a purpose', ok: true },
  { id: 'invented', text: 'Added a problem the picture does not show', ok: false },
  { id: 'dodged', text: 'Explained away a problem the picture shows', ok: false },
] as const

/** Blank-slide ideas from your PIQ details: something you have really done, which the interview can then confirm. */
export function blankSlideIdeas(p: { hobbies: string; sports: string; achievements: string; ncc: string }) {
  const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
  return [...list(p.hobbies), ...list(p.sports), ...list(p.achievements), ...(p.ncc.trim() ? [`NCC (${p.ncc.trim()})`] : [])]
}

// ── PPDT character box ─────────────────────────────────────────────
export type BoxChar = { x: number; y: number; sex: 'M' | 'F' | 'P' | ''; age: string; mood: '+' | '0' | '-' | '' }

const PARENT = /\b(father|mother|dad|mom|mum|parents?|grandfather|grandmother|grandparents?)\b/i
const CHILD = /\b(son|daughter|child|children|kid|kids|grandson|granddaughter)\b/i

/** Gaps in the box and places where it and the story disagree. */
export function boxFlags(chars: BoxChar[], hero: number | null, story: string): Flag[] {
  if (!chars.length) return [{ id: 'none', text: 'No characters marked. Count every person you saw, faint ones included.' }]
  const out: Flag[] = []
  const incomplete = chars.filter(c => !c.sex || !c.age.trim() || !c.mood).length
  if (incomplete) out.push({ id: 'incomplete', text: `${incomplete} of ${chars.length} characters lack a sex, age or mood. Give each all three.` })
  if (chars.some(c => c.age.trim() && !/^\d{1,2}$/.test(c.age.trim()))) out.push({ id: 'age-range', text: 'Give one exact age (21), not a range (20–25).' })
  if (hero === null || !chars[hero]) out.push({ id: 'no-hero', text: 'Circle your hero: the character the story is about.' })
  else {
    const h = chars[hero]
    if (h.mood === '-') out.push({ id: 'hero-mood', text: 'Your hero\'s mood is negative. That works if the story shows how they cope; check they are the main figure.' })
    const he = (story.match(/\b(he|him|his)\b/gi) ?? []).length, she = (story.match(/\b(she|her|hers)\b/gi) ?? []).length
    if (h.sex === 'M' && she >= 3 && she > he) out.push({ id: 'hero-sex', text: 'Your hero is marked male, but the story is mostly about a "she".' })
    if (h.sex === 'F' && he >= 3 && he > she) out.push({ id: 'hero-sex', text: 'Your hero is marked female, but the story is mostly about a "he".' })
  }
  const ages = chars.map(c => Number(c.age)).filter(a => Number.isFinite(a) && a > 0)
  if (ages.length >= 2 && PARENT.test(story) && CHILD.test(story)) {
    const gap = Math.max(...ages) - Math.min(...ages)
    if (gap < 18) out.push({ id: 'family-gap', text: `The story has a parent and child, but your oldest and youngest characters are only ${gap} years apart.` })
  }
  return out
}

/** The box read out in the order the group is asked for: how many, sex, age, mood, then the action. */
export function narrationOrder(chars: BoxChar[], hero: number | null, action: string) {
  const join = (k: 'sex' | 'age' | 'mood') => chars.map(c => c[k] || '?').join(', ')
  return [
    `${chars.length} character${chars.length === 1 ? '' : 's'}`,
    `Sex: ${join('sex')}`,
    `Age: ${join('age')}`,
    `Mood: ${join('mood')}`,
    ...(hero !== null && chars[hero] ? [`Hero: character ${hero + 1}`] : []),
    `Action: ${action.trim() || '?'}`,
    'Then the story, in brief',
  ]
}

// ── WAT ───────────────────────────────────────────────────────────
const SAYINGS = ['apple a day', 'every cloud', 'practice makes perfect', 'where there is a will', "where there's a will", 'no pain no gain', 'no pain, no gain',
  'honesty is the best policy', 'early to bed', 'slow and steady', 'united we stand', 'knowledge is power', 'time and tide', 'actions speak louder',
  'all that glitters', 'better late than never', 'a friend in need', 'health is wealth', 'hard work is the key to success', 'unity is strength',
  'failures are the pillars of success', 'failure is the stepping stone']

const OPPOSITES: Record<string, string[]> = {
  fail: ['success', 'succeed'], failure: ['success', 'succeed'], fear: ['courage', 'brave', 'fearless'], defeat: ['victory', 'win'],
  weak: ['strong', 'strength'], lazy: ['active', 'hardworking', 'energetic'], sad: ['happy', 'happiness'], dark: ['light', 'bright'],
  alone: ['together'], lie: ['truth', 'honest'], war: ['peace'], enemy: ['friend'], death: ['life', 'alive'], tired: ['fresh', 'energetic'],
  worry: ['calm', 'relaxed'], quarrel: ['friendship'], punish: ['reward'], sick: ['healthy', 'health'], weakness: ['strength'], helpless: ['helpful'],
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()

/** Things to re-read in one WAT sentence. `before` holds what you wrote for this word in earlier sets. */
export function watFlags(word: string, sentence: string, before: string[] = []): Flag[] {
  const s = sentence.trim()
  if (!s) return []
  const out: Flag[] = []
  const lower = s.toLowerCase()
  if (wordCount(s) < 3) out.push({ id: 'fragment', text: 'Not a sentence yet: say something complete about the word.' })
  const advice = /\b(should|must|ought to)\b/i.test(s) || /^(always|never|don'?t|do not|be|let us|let's)\b/i.test(s)
  if (advice) out.push({ id: 'advice', text: 'Advice to others. Write what you think or what people do, not what one should do.' })
  if (SAYINGS.some(x => lower.includes(x))) out.push({ id: 'saying', text: 'A saying, not your own thought.' })
  if (/\b(is|are|was) the (largest|biggest|smallest|highest|longest|tallest|oldest|capital|national|first)\b/i.test(s)) out.push({ id: 'fact', text: 'A fact, not a thought. Once or twice in a set is fine.' })
  if (!advice && /\b(always|never|everyone|nobody|everybody)\b/i.test(s)) out.push({ id: 'absolute', text: 'Words like always and never make it sound like a slogan.' })
  const w = word.toLowerCase(), stem = w.slice(0, Math.max(4, w.length - 2))
  if (!lower.includes(stem) && (OPPOSITES[w] ?? []).some(o => new RegExp(`\\b${o}`, 'i').test(s))) out.push({ id: 'opposite', text: `Written about the opposite of "${word}", not the word itself.` })
  if (before.some(b => norm(b) === norm(s))) out.push({ id: 'repeat', text: 'Word for word what you wrote for this word before. A remembered sentence reads as learnt; write what comes to you now.' })
  return out
}

/** Patterns across a WAT set. */
export function watSetFlags(sentences: string[]): Flag[] {
  const written = sentences.map(s => s.trim()).filter(Boolean)
  const out: Flag[] = []
  const blanks = sentences.length - written.length
  if (blanks > 2) out.push({ id: 'blanks', text: `${blanks} words left blank. One or two is normal; more looks like avoiding words.` })
  const mine = written.filter(s => /\b(I|me|my)\b/.test(s)).length
  if (written.length >= 5 && mine * 10 >= written.length * 4) out.push({ id: 'i-heavy', text: `${mine} of ${written.length} sentences are about "I". Fine now and then; mostly write how things are or what people do.` })
  return out
}
