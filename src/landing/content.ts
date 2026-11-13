// Everything the landing page says, in one place. Copy rules from the design skill: no hyphens, sentence case, no
// exclamation marks, no invented facts. The numbers below are checked against the app's data by content.test.ts.

export const SITE_URL = 'https://harshdeepsingh888-ps.github.io/officer-prep/'

/** Real counts from the app's content (see content.test.ts). */
export const FACTS = {
  questions: 511, // built in practice questions
  papers: 27, // official UPSC objective papers, linked from upsc.gov.in
  guides: 42, // study guides on the study path
  exams: 5,
  ssbTests: 6, // PPDT, TAT, WAT, SRT, SD, lecturette
  decks: 6, // starter flashcard decks
} as const

export const EXAMS = ['CDS', 'AFCAT', 'CAPF AC', 'ICG AC', 'CSE'] as const

export const CTA = 'Start preparing free'
export const APP_HREF = 'app/'

export const PROOF_LINE = [`${FACTS.questions} practice questions`, `${FACTS.papers} official UPSC papers`, `${FACTS.guides} study guides`]

export type Benefit = { id: string; title: string; text: string }
export const BENEFITS: Benefit[] = [
  { id: 'mocks', title: 'Know your score before exam day', text: 'Full mocks in each exam’s pattern, timed, with its negative marking. You see the score the examiner would give you.' },
  { id: 'papers', title: 'Practise on the papers that count', text: `${FACTS.papers} official UPSC papers on a timed OMR sheet, scored with the official key. Linked from upsc.gov.in, never copied.` },
  { id: 'mistakes', title: 'Stop repeating the same mistakes', text: 'Every wrong answer comes back after 1 day, 3 days, a week and a month, until you get it right.' },
  { id: 'ssb', title: 'Walk into SSB knowing how assessors read you', text: 'PPDT, TAT, WAT, SRT, SD and lecturette on real timings, with checks that flag learnt stories and preachy sentences.' },
  { id: 'path', title: 'Always know what to study today', text: `${FACTS.guides} guides with notes and questions, a daily mission and a countdown to your exam.` },
]

export const STEPS = [
  { title: 'Pick your exam and its date', text: 'CDS, AFCAT, CAPF AC, ICG AC or CSE. The countdown and the study path follow from there.' },
  { title: 'Do today’s mission', text: 'Revise what is due, practise your weakest topic, then study the next guide. About an hour a day.' },
  { title: 'Take a full mock every week', text: 'Score it the way the exam does, see which subjects cost you marks, and watch your readiness climb.' },
]

export const TAGLINE = [
  'Every wrong answer comes back',
  'until you get it right,',
  'and every day you prepare',
  'brings the uniform closer.',
]

export const PROBLEMS = [
  'PDFs saved from Telegram that you never open',
  'Mock tests locked behind a paid plan',
  'Notes in five apps and mistakes in none',
]
export const SOLUTION = 'One app with every topic in order, every mock in the real pattern and every mistake remembered.'

export const ASSURANCES = [
  { id: 'free', title: 'Free, no sign up', text: 'No subscription, no ads, no account to create.' },
  { id: 'offline', title: 'Works offline', text: 'After your first visit it opens without internet, like an installed app.' },
  { id: 'private', title: 'Your data stays yours', text: 'Progress is saved in your browser on your device. Nothing is sent to a server.' },
  { id: 'backup', title: 'Back up anytime', text: 'Export a backup file or connect Google Drive, and restore it on a new phone.' },
]

/** Official sources the app links to (never copies). */
export const SOURCES = [
  { name: 'UPSC previous question papers', host: 'upsc.gov.in', href: 'https://upsc.gov.in/examinations/previous-question-papers' },
  { name: 'UPSC answer keys', host: 'upsc.gov.in', href: 'https://upsc.gov.in/examinations/answer-key/archives' },
  { name: 'NCERT textbooks', host: 'ncert.nic.in', href: 'https://ncert.nic.in/textbook.php' },
]

export type QA = { q: string; a: string }
export const FAQ: QA[] = [
  { q: 'Is Officer Prep really free?', a: 'Yes. There is no subscription, no ads and no sign up.' },
  { q: 'Do I need an account?', a: 'No. Your progress is saved in your browser, on your device. Nothing goes to a server unless you connect your own Google Drive for backups.' },
  { q: 'Does it work offline?', a: 'Yes, after your first visit. Add it to your home screen and it opens like an app, with or without internet.' },
  { q: 'Which exams does it cover?', a: 'CDS, AFCAT, CAPF Assistant Commandant, Coast Guard Assistant Commandant and the UPSC Civil Services exam.' },
  { q: 'Where do the questions come from?', a: `${FACTS.questions} questions are written for the app, and generators make endless new Maths and Reasoning questions. Official UPSC papers are linked from upsc.gov.in and answered on the app’s OMR sheet.` },
  { q: 'What happens to my progress if I change phones?', a: 'Export a backup file from the Library page, or connect Google Drive, then restore it on the new device.' },
  { q: 'Does it help with the SSB interview?', a: 'Yes. PPDT, TAT, WAT, SRT, SD and the lecturette run on real timings, with checks on your answers, and interview questions are built from your PIQ details.' },
  { q: 'Can I use it on a laptop?', a: 'Yes. It runs in any modern browser, and Chrome or Edge can install it as an app.' },
  { q: 'Is it official?', a: 'No. Officer Prep is an independent app. It is not affiliated with UPSC, the Indian Armed Forces, the Coast Guard or any government body.' },
]

export const DISCLAIMER = 'Officer Prep is an independent app. It is not affiliated with UPSC, the Indian Armed Forces, the Indian Coast Guard or any government body. Always confirm exam dates and rules on the official websites.'
