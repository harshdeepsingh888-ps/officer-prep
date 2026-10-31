// Exam catalog. Dates marked "official" come from the UPSC Annual Calendar 2027
// (upsc.gov.in, released May 2026). Everything else is "tentative" — always
// confirm against the exam notification, which can change dates and patterns.

import { todayISO } from '../lib/util'

export type ExamId = 'cds' | 'afcat' | 'capf' | 'icg' | 'cse'

export type Paper = {
  name: string
  questions?: number
  marks: number
  minutes: number
  type: 'objective' | 'descriptive'
  note?: string
}

export type ExamDate = {
  label: string
  date: string | null // ISO yyyy-mm-dd, null when not yet announced
  status: 'official' | 'tentative'
  note?: string
}

export type Exam = {
  id: ExamId
  short: string
  name: string
  body: string
  officialUrl: string
  frequency: string
  age: string
  education: string
  marking: { correct: number; wrong: number; label: string }
  papers: Paper[]
  selection: string[]
  personality: 'ssb' | 'interview'
  dates: ExamDate[]
  syllabus: { subject: string; topics: string[] }[]
}

export const EXAMS: Exam[] = [
  {
    id: 'cds',
    short: 'CDS',
    name: 'Combined Defence Services Examination',
    body: 'UPSC',
    officialUrl: 'https://www.upsc.gov.in',
    frequency: 'Twice a year (CDS I — April, CDS II — September)',
    age: 'IMA / INA: 19–24 · AFA: 20–24 · OTA: 19–25 (unmarried; check notification)',
    education: 'Graduate (INA: B.E./B.Tech; AFA: graduate with Physics & Maths at 10+2, or B.E.). Final-year students may apply.',
    marking: { correct: 1, wrong: 1 / 3, label: '−⅓ of the marks for that question' },
    papers: [
      { name: 'English', questions: 120, marks: 100, minutes: 120, type: 'objective' },
      { name: 'General Knowledge', questions: 120, marks: 100, minutes: 120, type: 'objective' },
      { name: 'Elementary Mathematics', questions: 100, marks: 100, minutes: 120, type: 'objective', note: 'Not for OTA' },
    ],
    selection: ['Written (300 marks; OTA 200)', 'SSB Interview — 5 days (300; OTA 200)', 'Medical'],
    personality: 'ssb',
    dates: [
      { label: 'CDS (I) 2027', date: '2027-04-11', status: 'official', note: 'Notification 2 Dec 2026' },
      { label: 'CDS (II) 2027', date: '2027-09-19', status: 'official', note: 'Notification 12 May 2027' },
    ],
    syllabus: [
      {
        subject: 'English',
        topics: ['Reading comprehension', 'Spotting errors', 'Sentence improvement', 'Synonyms', 'Antonyms', 'Fill in the blanks', 'Ordering of words', 'Ordering of sentences', 'Cloze test', 'Idioms & phrases'],
      },
      {
        subject: 'General Knowledge',
        topics: ['Ancient & Medieval History', 'Modern History & Freedom Struggle', 'Physical Geography', 'Indian Geography', 'World Geography', 'Polity & Constitution', 'Economy', 'Physics', 'Chemistry', 'Biology', 'Environment & Ecology', 'Defence & military affairs', 'Current affairs', 'Sports, awards & books'],
      },
      {
        subject: 'Elementary Mathematics',
        topics: ['Number system', 'HCF & LCM', 'Percentage', 'Ratio & proportion', 'Profit & loss', 'Simple & compound interest', 'Time & work', 'Time, speed & distance', 'Algebra', 'Logarithms', 'Trigonometry', 'Heights & distances', 'Geometry', 'Mensuration', 'Statistics'],
      },
    ],
  },
  {
    id: 'afcat',
    short: 'AFCAT',
    name: 'Air Force Common Admission Test',
    body: 'Indian Air Force',
    officialUrl: 'https://afcat.cdac.in',
    frequency: 'Twice a year (AFCAT 01 — Jan/Feb, AFCAT 02 — Aug)',
    age: 'Flying: 20–24 · Ground Duty (Tech & Non-Tech): 20–26',
    education: 'Graduate with minimum percentage per branch; Flying needs Physics & Maths at 10+2.',
    marking: { correct: 3, wrong: 1, label: '+3 correct, −1 wrong' },
    papers: [
      { name: 'AFCAT', questions: 100, marks: 300, minutes: 120, type: 'objective' },
      { name: 'EKT (technical branches)', questions: 50, marks: 150, minutes: 45, type: 'objective', note: 'Ground Duty Technical only' },
    ],
    selection: ['AFCAT online test', 'AFSB — 5 days (+ CPSS for Flying)', 'Medical'],
    personality: 'ssb',
    dates: [
      { label: 'AFCAT 01/2027', date: '2027-01-30', status: 'tentative', note: 'Expected late Jan 2027; notification expected Nov 2026' },
      { label: 'AFCAT 02/2027', date: '2027-08-28', status: 'tentative', note: 'Expected Aug 2027' },
    ],
    syllabus: [
      { subject: 'General Awareness', topics: ['History', 'Geography', 'Polity', 'Economy', 'Basic science', 'Defence', 'Art & culture', 'Sports', 'Current affairs'] },
      { subject: 'Verbal Ability', topics: ['Comprehension', 'Error detection', 'Sentence completion', 'Synonyms', 'Antonyms', 'Idioms & phrases', 'Vocabulary'] },
      { subject: 'Numerical Ability', topics: ['Decimals & fractions', 'Average', 'Percentage', 'Ratio & proportion', 'Profit & loss', 'Simple interest', 'Time & work', 'Time & distance'] },
      { subject: 'Reasoning & Military Aptitude', topics: ['Verbal reasoning', 'Analogy & classification', 'Series', 'Spatial ability', 'Hidden & embedded figures', 'Dot situation', 'Pattern completion', 'Mirror & water images'] },
    ],
  },
  {
    id: 'capf',
    short: 'CAPF AC',
    name: 'Central Armed Police Forces (Assistant Commandants)',
    body: 'UPSC',
    officialUrl: 'https://www.upsc.gov.in',
    frequency: 'Once a year',
    age: '20–25 (relaxations per notification)',
    education: 'Graduate',
    marking: { correct: 1, wrong: 1 / 3, label: '−⅓ of the marks for that question (Paper I)' },
    papers: [
      { name: 'Paper I — General Ability & Intelligence', questions: 125, marks: 250, minutes: 120, type: 'objective' },
      { name: 'Paper II — General Studies, Essay & Comprehension', marks: 200, minutes: 180, type: 'descriptive' },
    ],
    selection: ['Written (Paper I + II)', 'Physical Standards / PET + Medical', 'Interview / Personality Test (150)'],
    personality: 'interview',
    dates: [{ label: 'CAPF (ACs) 2027', date: '2027-07-04', status: 'official', note: 'Notification 17 Feb 2027' }],
    syllabus: [
      { subject: 'Paper I', topics: ['General mental ability', 'Quantitative aptitude', 'Data interpretation', 'General science', 'Current events', 'Indian polity', 'Indian economy', 'History & freedom movement', 'Indian & world geography'] },
      { subject: 'Paper II', topics: ['Essay — freedom struggle', 'Essay — geography, polity & economy', 'Essay — security & human rights', 'Comprehension', 'Précis writing', 'Counter-arguments', 'Report writing', 'Grammar & usage'] },
    ],
  },
  {
    id: 'icg',
    short: 'ICG AC',
    name: 'Coast Guard Assistant Commandant (CGCAT)',
    body: 'Indian Coast Guard',
    officialUrl: 'https://joinindiancoastguard.cdac.in/cgcat/',
    frequency: 'Per notification (usually twice a year)',
    age: '21–25 (check notification per branch)',
    education: 'Graduate (GD: Maths & Physics at 10+2; Technical: relevant B.E.; Law: LLB)',
    marking: { correct: 4, wrong: 1, label: '+4 correct, −1 wrong (verify with notification)' },
    papers: [{ name: 'CGCAT', questions: 100, marks: 400, minutes: 120, type: 'objective', note: 'English, Reasoning & Numerical Ability, General Science & Maths, GK' }],
    selection: ['CGCAT online test', 'PSB — cognitive test + PP&DT', 'FSB — psych tests, group tasks, interview', 'Medical'],
    personality: 'ssb',
    dates: [{ label: 'Next CGCAT', date: null, status: 'tentative', note: 'Watch joinindiancoastguard.cdac.in for the notification' }],
    syllabus: [
      { subject: 'English', topics: ['Comprehension', 'Grammar & usage', 'Vocabulary', 'Sentence correction'] },
      { subject: 'Reasoning & Numerical Ability', topics: ['Verbal reasoning', 'Non-verbal reasoning', 'Arithmetic', 'Data interpretation'] },
      { subject: 'General Science & Maths', topics: ['Physics', 'Chemistry', 'Biology', 'Algebra', 'Trigonometry', 'Mensuration'] },
      { subject: 'General Knowledge', topics: ['History', 'Geography', 'Polity', 'Maritime & defence affairs', 'Current affairs'] },
    ],
  },
  {
    id: 'cse',
    short: 'CSE',
    name: 'Civil Services Examination (IAS / IPS / IFS)',
    body: 'UPSC',
    officialUrl: 'https://www.upsc.gov.in',
    frequency: 'Once a year',
    age: '21–32 for General category (relaxations per notification); 6 attempts',
    education: 'Graduate (final-year students may apply)',
    marking: { correct: 1, wrong: 1 / 3, label: '−⅓ of the marks for that question (Prelims)' },
    papers: [
      { name: 'Prelims GS Paper I', questions: 100, marks: 200, minutes: 120, type: 'objective' },
      { name: 'Prelims GS Paper II (CSAT)', questions: 80, marks: 200, minutes: 120, type: 'objective', note: 'Qualifying — 33%' },
      { name: 'Mains — Essay, GS I–IV, Optional I–II', marks: 1750, minutes: 180, type: 'descriptive', note: '250 marks each, 3 hrs each' },
    ],
    selection: ['Prelims (screening)', 'Mains (1750)', 'Personality Test (275)'],
    personality: 'interview',
    dates: [
      { label: 'CSE Prelims 2027', date: '2027-05-23', status: 'official', note: 'Notification 13 Jan 2027 · last date 2 Feb 2027' },
      { label: 'CSE Mains 2027', date: '2027-08-20', status: 'official' },
    ],
    syllabus: [
      { subject: 'Prelims GS', topics: ['Current events', 'History of India & national movement', 'Indian & world geography', 'Polity & governance', 'Economic & social development', 'Environment & ecology', 'General science', 'Art & culture'] },
      { subject: 'CSAT', topics: ['Comprehension', 'Interpersonal & communication skills', 'Logical reasoning', 'Decision making', 'General mental ability', 'Basic numeracy', 'Data interpretation'] },
      { subject: 'Mains GS', topics: ['GS I — heritage, history, society, geography', 'GS II — polity, governance, social justice, IR', 'GS III — economy, environment, S&T, security, disaster management', 'GS IV — ethics, integrity & aptitude', 'Essay'] },
    ],
  },
]

export const examById = (id: string) => EXAMS.find(e => e.id === id)

/**
 * The syllabus subject a paper belongs to, from its name ("CDS (II) 2026 — General Knowledge" → General Knowledge).
 * The longest subject named in the title wins, so "Paper II" beats "Paper I"; otherwise the exam's first subject.
 */
export function subjectForPaper(examId: string, title: string): string | undefined {
  const subjects = examById(examId)?.syllabus.map(s => s.subject) ?? []
  const t = title.toLowerCase()
  return subjects.filter(s => t.includes(s.toLowerCase())).sort((a, b) => b.length - a.length)[0] ?? subjects[0]
}

/** Next upcoming date for an exam, honouring a user override. */
export function nextDate(exam: Exam, overrides: Record<string, string>): ExamDate | null {
  if (overrides[exam.id]) return { label: exam.short, date: overrides[exam.id], status: 'official', note: 'Your date' }
  const today = todayISO()
  return exam.dates.find(d => d.date && d.date >= today) ?? exam.dates.find(d => !d.date) ?? null
}
