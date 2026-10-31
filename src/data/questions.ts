import type { ExamId } from './exams'

// Starter question bank — original questions written for this app.
// Add your own on the Practice page (form or JSON/CSV import).

export type Question = {
  id: string
  exams: ExamId[]
  subject: 'English' | 'General Knowledge' | 'Mathematics' | 'Reasoning'
  topic: string
  text: string
  options: string[]
  answer: number
  explanation?: string
}

const ALL: ExamId[] = ['cds', 'afcat', 'capf', 'icg', 'cse']
const ENG: ExamId[] = ['cds', 'afcat', 'icg', 'capf']
const MATHS: ExamId[] = ['cds', 'afcat', 'icg', 'capf', 'cse']
const REASON: ExamId[] = ['afcat', 'capf', 'icg', 'cse']

let n = 0
const q = (exams: ExamId[], subject: Question['subject'], topic: string, text: string, options: string[], answer: number, explanation?: string): Question =>
  ({ id: `b${++n}`, exams, subject, topic, text, options, answer, explanation })

export const BUILTIN_QUESTIONS: Question[] = [
  // English
  q(ENG, 'English', 'Synonyms', 'Choose the word closest in meaning to EPHEMERAL.', ['Lasting', 'Short-lived', 'Ancient', 'Enormous'], 1),
  q(ENG, 'English', 'Antonyms', 'Choose the word opposite in meaning to CANDID.', ['Frank', 'Secretive', 'Honest', 'Blunt'], 1),
  q(ENG, 'English', 'Fill in the blanks', 'Neither the officer nor his men ___ aware of the change in plan.', ['was', 'were', 'is', 'has been'], 1, 'With "neither…nor", the verb agrees with the nearer subject — "men" (plural).'),
  q(ENG, 'English', 'Spotting errors', 'Find the part with an error: "He is senior than me / in service / by two years."', ['He is senior than me', 'in service', 'by two years', 'No error'], 0, '"Senior" takes "to", not "than": senior to me.'),
  q(ENG, 'English', 'Idioms & phrases', 'To "bite the bullet" means to —', ['eat in a hurry', 'face a painful situation bravely', 'start a quarrel', 'get injured'], 1),
  q(ENG, 'English', 'Vocabulary', 'One word for "a person who is present everywhere":', ['Omnipotent', 'Omniscient', 'Omnipresent', 'Omnivorous'], 2),
  q(ENG, 'English', 'Sentence improvement', 'Improve: "If I would have known, I would have helped."', ['If I had known', 'If I knew', 'Had I would know', 'No improvement'], 0, 'Third conditional: if + past perfect, would have + past participle.'),
  q(ENG, 'English', 'Synonyms', 'Choose the word closest in meaning to TENACIOUS.', ['Weak', 'Persistent', 'Careless', 'Timid'], 1),
  q(ENG, 'English', 'Antonyms', 'Choose the word opposite in meaning to LETHARGIC.', ['Sluggish', 'Energetic', 'Idle', 'Dull'], 1),
  q(ENG, 'English', 'Spelling', 'Choose the correctly spelt word.', ['Accomodation', 'Acommodation', 'Accommodation', 'Acomodation'], 2),

  // General Knowledge
  q(ALL, 'General Knowledge', 'Polity', 'Fundamental Duties are listed in which Article of the Constitution?', ['Article 21A', 'Article 51A', 'Article 32', 'Article 368'], 1),
  q(ALL, 'General Knowledge', 'Polity', 'The words "Socialist" and "Secular" were added to the Preamble by the —', ['24th Amendment', '42nd Amendment', '44th Amendment', '73rd Amendment'], 1),
  q(ALL, 'General Knowledge', 'Defence', 'HQ of the Indian Army\'s Northern Command is at —', ['Udhampur', 'Chandimandir', 'Lucknow', 'Pune'], 0, 'Western Command — Chandimandir; Central — Lucknow; Southern — Pune.'),
  q(ALL, 'General Knowledge', 'Defence', 'The Param Vir Chakra is awarded for gallantry —', ['in peacetime', 'in the face of the enemy', 'to civilians only', 'in sports'], 1),
  q(ALL, 'General Knowledge', 'Defence', 'BrahMos is a joint venture between India and —', ['France', 'Israel', 'Russia', 'USA'], 2),
  q(ALL, 'General Knowledge', 'Defence', 'Who was India\'s first Chief of Defence Staff?', ['Gen Bipin Rawat', 'Gen M M Naravane', 'Gen Anil Chauhan', 'Field Marshal S H F J Manekshaw'], 0),
  q(ALL, 'General Knowledge', 'Defence', 'An Army Colonel is equivalent in rank to a Navy —', ['Commander', 'Captain', 'Commodore', 'Lieutenant Commander'], 1, 'Lt Col = Commander; Colonel = Captain; Brigadier = Commodore.'),
  q(ALL, 'General Knowledge', 'Defence', 'Indian Air Force Day is observed on —', ['15 January', '8 October', '4 December', '26 January'], 1, 'Army Day 15 Jan; Navy Day 4 Dec.'),
  q(ALL, 'General Knowledge', 'Modern History', 'The Battle of Plassey was fought in —', ['1757', '1764', '1857', '1799'], 0),
  q(ALL, 'General Knowledge', 'Indian Geography', 'The Tropic of Cancer does NOT pass through —', ['Gujarat', 'Rajasthan', 'Odisha', 'Madhya Pradesh'], 2),
  q(ALL, 'General Knowledge', 'Indian Geography', 'The longest river of peninsular India is the —', ['Krishna', 'Godavari', 'Narmada', 'Kaveri'], 1),
  q(ALL, 'General Knowledge', 'Physics', 'The SI unit of force is the —', ['Joule', 'Pascal', 'Newton', 'Watt'], 2),
  q(ALL, 'General Knowledge', 'Chemistry', 'The most abundant gas in Earth\'s atmosphere is —', ['Oxygen', 'Nitrogen', 'Argon', 'Carbon dioxide'], 1),
  q(ALL, 'General Knowledge', 'Biology', 'Scurvy is caused by deficiency of —', ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], 2),

  // Mathematics
  q(MATHS, 'Mathematics', 'Percentage', 'If 20% of a number is 45, the number is —', ['180', '225', '250', '90'], 1),
  q(MATHS, 'Mathematics', 'HCF & LCM', 'LCM of 12, 18 and 30 is —', ['90', '120', '180', '360'], 2),
  q(MATHS, 'Mathematics', 'Time, speed & distance', 'A 150 m train passes a pole in 15 s. Its speed is —', ['10 km/h', '36 km/h', '54 km/h', '40 km/h'], 1, '150/15 = 10 m/s = 36 km/h.'),
  q(MATHS, 'Mathematics', 'Profit & loss', 'Bought for ₹400, sold for ₹460. Profit % = ', ['12%', '13.5%', '15%', '60%'], 2),
  q(MATHS, 'Mathematics', 'Trigonometry', 'If sin θ = 3/5 and θ is acute, tan θ = ', ['3/4', '4/3', '4/5', '5/3'], 0),
  q(MATHS, 'Mathematics', 'Simple & compound interest', 'Simple interest on ₹5,000 at 8% p.a. for 3 years is —', ['₹1,000', '₹1,200', '₹1,250', '₹400'], 1),
  q(MATHS, 'Mathematics', 'Simple & compound interest', 'Compound interest on ₹10,000 at 10% p.a. for 2 years (annual) is —', ['₹2,000', '₹2,100', '₹2,200', '₹1,100'], 1),
  q(MATHS, 'Mathematics', 'Time & work', 'A finishes a job in 10 days, B in 15. Together they take —', ['5 days', '6 days', '7.5 days', '12.5 days'], 1),
  q(MATHS, 'Mathematics', 'Mensuration', 'Area of a circle of radius 7 cm (π = 22/7) is —', ['44 cm²', '154 cm²', '148 cm²', '308 cm²'], 1),
  q(MATHS, 'Mathematics', 'Ratio & proportion', 'Two numbers are in ratio 3 : 5 and add up to 64. The larger is —', ['24', '36', '40', '45'], 2),
  q(MATHS, 'Mathematics', 'Geometry', 'Sum of interior angles of a hexagon is —', ['540°', '620°', '720°', '1080°'], 2),
  q(MATHS, 'Mathematics', 'Statistics', 'Average of the first 10 natural numbers is —', ['5', '5.5', '6', '10'], 1),

  // Reasoning
  q(REASON, 'Reasoning', 'Series', 'Next term: 2, 6, 12, 20, 30, ?', ['36', '40', '42', '44'], 2, 'n(n+1).'),
  q(REASON, 'Reasoning', 'Series', 'Next term: 3, 9, 27, 81, ?', ['162', '243', '324', '108'], 1),
  q(REASON, 'Reasoning', 'Coding-decoding', 'If CAT is coded DBU, DOG is coded —', ['EPH', 'FQI', 'CNF', 'EPG'], 0, 'Each letter +1.'),
  q(REASON, 'Reasoning', 'Coding-decoding', 'If ARMY = 1-18-13-25, then NAVY = ', ['14-1-22-25', '13-1-21-25', '14-2-22-24', '15-1-22-25'], 0),
  q(REASON, 'Reasoning', 'Classification', 'Odd one out:', ['Rifle', 'Pistol', 'Carbine', 'Grenade'], 3, 'The others are firearms.'),
  q(REASON, 'Reasoning', 'Direction sense', 'Walk 5 km north, turn right and walk 3 km, turn right and walk 5 km. You are now —', ['3 km East of start', '3 km West of start', '5 km North of start', '8 km East of start'], 0),
  q(REASON, 'Reasoning', 'Blood relations', 'Pointing to a man, Ravi says, "He is the son of my father\'s only son." The man is Ravi\'s —', ['Brother', 'Nephew', 'Son', 'Cousin'], 2),
  q(REASON, 'Reasoning', 'Analogy', 'Army : General :: Navy : ?', ['Captain', 'Commodore', 'Admiral', 'Marshal'], 2),
  q(REASON, 'Reasoning', 'Clock', 'Angle between the hands of a clock at 3:00 is —', ['60°', '90°', '120°', '180°'], 1),
]

/** Parse a JSON array or CSV (text,optA,optB,optC,optD,answerLetter,subject,topic,explanation). */
export function parseQuestionImport(raw: string): Omit<Question, 'id'>[] {
  const text = raw.trim()
  if (!text) return []
  if (text.startsWith('[')) {
    const arr = JSON.parse(text) as Partial<Question>[]
    return arr.map(x => ({
      exams: x.exams?.length ? x.exams : ALL,
      subject: x.subject ?? 'General Knowledge',
      topic: x.topic ?? 'General',
      text: String(x.text),
      options: (x.options ?? []).map(String),
      answer: typeof x.answer === 'number' ? x.answer : 'ABCD'.indexOf(String(x.answer).toUpperCase()),
      explanation: x.explanation,
    })).filter(x => x.text && x.options.length >= 2 && x.answer >= 0)
  }
  return text.split(/\r?\n/).map(splitCsv).filter(c => c.length >= 6 && !/^text$/i.test(c[0])).map(c => ({
    exams: ALL,
    text: c[0],
    options: c.slice(1, 5).filter(Boolean),
    answer: 'ABCD'.indexOf(c[5].trim().toUpperCase()),
    subject: (c[6] as Question['subject']) || 'General Knowledge',
    topic: c[7] || 'General',
    explanation: c[8] || undefined,
  })).filter(x => x.answer >= 0)
}

function splitCsv(line: string): string[] {
  const out: string[] = []
  let cur = '', quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  out.push(cur.trim())
  return out
}
