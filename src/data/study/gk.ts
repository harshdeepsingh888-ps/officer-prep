import type { ExamId } from '../exams'
import { AFCAT_MOCK, NCERT, PIB, PYQ, guide, k, type ReadItem } from './types'

// Reading lists for GK and Reasoning. Notes and question sets for these arrive in batch 2 / 3.

const GK: ExamId[] = ['cds', 'afcat', 'icg', 'capf', 'cse']
const NC = (detail: string): ReadItem => ({ ...NCERT, detail: `${detail} — free at ncert.nic.in. New editions are being introduced, so check which book covers this.` })
const LUCENT: ReadItem = { title: 'Lucent\'s General Knowledge', detail: 'Compact one-volume GK for quick revision of facts' }
const ATLAS: ReadItem = { title: 'Oxford School Atlas (or any good school atlas)', detail: 'Keep it open while you read geography; locate every place you read about' }
const NEWS: ReadItem = { title: 'One national newspaper daily (The Hindu / Indian Express)', detail: 'National, international, economy and defence pages; 30–40 minutes', free: true }
const RSA_REASON: ReadItem = { title: 'R. S. Aggarwal — A Modern Approach to Verbal & Non-Verbal Reasoning', detail: 'Standard practice book for every reasoning question type' }

export const GK_GUIDES = [
  guide({
    id: 'gk-polity', track: 'GK', subject: 'General Knowledge', topic: 'Polity', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Polity & Constitution'), k('afcat', 'General Awareness', 'Polity'), k('icg', 'General Knowledge', 'Polity'), k('capf', 'Paper I', 'Indian polity'), k('cse', 'Prelims GS', 'Polity & governance')],
    summary: 'The Constitution (Preamble, Fundamental Rights and Duties, DPSPs), Parliament, the President, the judiciary, federalism, elections and amendments.',
    read: [NC('Class 11 Political Science: Indian Constitution at Work'), { title: 'M. Laxmikanth — Indian Polity', detail: 'The standard reference; read the chapters on the Preamble, Fundamental Rights, Parliament, President and judiciary first' }, { title: 'Revise → Flashcards → Polity deck', url: '#/revise/cards' }, PYQ],
  }),
  guide({
    id: 'gk-modern', track: 'GK', subject: 'General Knowledge', topic: 'Modern History', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Modern History & Freedom Struggle'), k('afcat', 'General Awareness', 'History'), k('icg', 'General Knowledge', 'History'), k('capf', 'Paper I', 'History & freedom movement'), k('cse', 'Prelims GS', 'History of India & national movement')],
    summary: 'The arrival of Europeans, British expansion, the 1857 revolt, reform movements and the freedom struggle up to 1947.',
    read: [NC('Class 8 history (Our Pasts III in the older edition) and Class 12 Themes in Indian History, Part III'), { title: 'Rajiv Ahir — A Brief History of Modern India (Spectrum)', detail: 'The most-used single book for modern history' }, PYQ],
  }),
  guide({
    id: 'gk-ancient', track: 'GK', subject: 'General Knowledge', topic: 'Ancient & Medieval History', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Ancient & Medieval History'), k('afcat', 'General Awareness', 'History'), k('icg', 'General Knowledge', 'History')],
    summary: 'The Harappan civilisation, Vedic age, Mauryas, Guptas, the Delhi Sultanate, the Mughals and regional kingdoms.',
    read: [NC('Class 6–7 history and Class 12 Themes in Indian History, Parts I and II'), LUCENT, PYQ],
  }),
  guide({
    id: 'gk-physical-geo', track: 'GK', subject: 'General Knowledge', topic: 'Physical Geography', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Physical Geography'), k('afcat', 'General Awareness', 'Geography'), k('icg', 'General Knowledge', 'Geography'), k('capf', 'Paper I', 'Indian & world geography'), k('cse', 'Prelims GS', 'Indian & world geography')],
    summary: 'The Earth\'s interior, rocks, landforms, the atmosphere, winds, clouds and rainfall, ocean currents and climate types.',
    read: [NC('Class 11 Geography: Fundamentals of Physical Geography'), { title: 'G. C. Leong — Certificate Physical and Human Geography', detail: 'Clear explanations with diagrams' }, ATLAS],
  }),
  guide({
    id: 'gk-indian-geo', track: 'GK', subject: 'General Knowledge', topic: 'Indian Geography', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Indian Geography'), k('afcat', 'General Awareness', 'Geography'), k('icg', 'General Knowledge', 'Geography')],
    summary: 'India\'s physiography, rivers, climate and monsoon, soils, vegetation, minerals, agriculture and transport.',
    read: [NC('Class 11 Geography: India — Physical Environment; Class 12 India — People and Economy'), ATLAS, PYQ],
  }),
  guide({
    id: 'gk-world-geo', track: 'GK', subject: 'General Knowledge', topic: 'World Geography', exams: ['cds', 'capf', 'cse'],
    syllabus: [k('cds', 'General Knowledge', 'World Geography')],
    summary: 'Continents, major rivers, mountains, deserts, straits, countries and capitals, and world resources.',
    read: [NC('Class 12 Geography: Fundamentals of Human Geography'), ATLAS, LUCENT],
  }),
  guide({
    id: 'gk-economy', track: 'GK', subject: 'General Knowledge', topic: 'Economy', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Economy'), k('afcat', 'General Awareness', 'Economy'), k('capf', 'Paper I', 'Indian economy'), k('cse', 'Prelims GS', 'Economic & social development')],
    summary: 'Basic concepts (GDP, inflation, money and banking, budget, taxes), planning, and the structure of the Indian economy.',
    read: [NC('Class 11 Economics: Indian Economic Development; Class 12 Macroeconomics'), { title: 'Economic Survey (latest)', detail: 'Read the chapter summaries; official, free', url: 'https://www.indiabudget.gov.in/economicsurvey/', free: true }, NEWS],
  }),
  guide({
    id: 'gk-physics', track: 'GK', subject: 'General Knowledge', topic: 'Physics', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Physics'), k('afcat', 'General Awareness', 'Basic science'), k('icg', 'General Science & Maths', 'Physics'), k('capf', 'Paper I', 'General science'), k('cse', 'Prelims GS', 'General science')],
    summary: 'Units, motion, force, work and energy, gravitation, heat, sound, light, electricity and magnetism — at concept level.',
    read: [NC('Class 9 and 10 Science (physics chapters)'), { title: 'Lucent\'s General Science', detail: 'Quick revision of concepts and everyday applications' }, PYQ],
  }),
  guide({
    id: 'gk-chemistry', track: 'GK', subject: 'General Knowledge', topic: 'Chemistry', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Chemistry'), k('afcat', 'General Awareness', 'Basic science'), k('icg', 'General Science & Maths', 'Chemistry'), k('capf', 'Paper I', 'General science')],
    summary: 'Matter, atoms and molecules, acids, bases and salts, metals and non-metals, carbon compounds and everyday chemistry.',
    read: [NC('Class 9 and 10 Science (chemistry chapters)'), { title: 'Lucent\'s General Science' }, PYQ],
  }),
  guide({
    id: 'gk-biology', track: 'GK', subject: 'General Knowledge', topic: 'Biology', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Biology'), k('afcat', 'General Awareness', 'Basic science'), k('icg', 'General Science & Maths', 'Biology'), k('capf', 'Paper I', 'General science')],
    summary: 'Cells, human body systems, nutrition and vitamins, diseases, genetics basics, plants and microorganisms.',
    read: [NC('Class 9 and 10 Science (biology chapters)'), { title: 'Lucent\'s General Science' }, PYQ],
  }),
  guide({
    id: 'gk-environment', track: 'GK', subject: 'General Knowledge', topic: 'Environment & Ecology', exams: ['cds', 'cse', 'capf'],
    syllabus: [k('cds', 'General Knowledge', 'Environment & Ecology'), k('cse', 'Prelims GS', 'Environment & ecology')],
    summary: 'Ecosystems, food chains, biodiversity, protected areas, pollution, climate change and environmental agreements.',
    read: [NC('Class 12 Biology (ecology chapters) and Class 11 Geography'), { title: 'Shankar IAS — Environment', detail: 'Widely used for CSE; use the chapters on ecology, biodiversity and climate' }, NEWS],
  }),
  guide({
    id: 'gk-defence', track: 'GK', subject: 'General Knowledge', topic: 'Defence', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Defence & military affairs'), k('afcat', 'General Awareness', 'Defence'), k('icg', 'General Knowledge', 'Maritime & defence affairs')],
    summary: 'Ranks and organisation of the three services, commands, exercises, weapons and missiles, awards, and recent defence news.',
    read: [
      { title: 'Revise → Flashcards: Ranks & formations, Military exercises, Missiles', detail: 'Built into the app', url: '#/revise/cards', free: true },
      { ...PIB, title: 'PIB — Ministry of Defence releases', detail: 'Inductions, exercises, appointments and agreements' },
      { title: 'Official service websites', detail: 'indianarmy.nic.in · indiannavy.gov.in · indianairforce.nic.in', free: true },
    ],
  }),
  guide({
    id: 'gk-current', track: 'GK', subject: 'General Knowledge', topic: 'Current affairs', exams: GK,
    syllabus: [k('cds', 'General Knowledge', 'Current affairs'), k('afcat', 'General Awareness', 'Current affairs'), k('icg', 'General Knowledge', 'Current affairs'), k('capf', 'Paper I', 'Current events'), k('cse', 'Prelims GS', 'Current events')],
    summary: 'National and international events of the last 6–12 months: government schemes, summits, appointments, reports and defence news.',
    read: [NEWS, PIB, { title: 'Your own quiz bank', detail: 'Paste quiz posts from channels you follow (Practice → My questions → Paste) and revise them like everything else', url: '#/practice/mine', free: true }],
  }),
  guide({
    id: 'gk-sports', track: 'GK', subject: 'General Knowledge', topic: 'Sports, awards & books', exams: ['cds', 'afcat'],
    syllabus: [k('cds', 'General Knowledge', 'Sports, awards & books'), k('afcat', 'General Awareness', 'Sports')],
    summary: 'Major tournaments and winners, national sports awards, gallantry and civilian awards, and notable books and authors.',
    read: [NEWS, LUCENT, PIB],
  }),
  guide({
    id: 'gk-art', track: 'GK', subject: 'General Knowledge', topic: 'Art & culture', exams: ['afcat', 'cse'],
    syllabus: [k('afcat', 'General Awareness', 'Art & culture'), k('cse', 'Prelims GS', 'Art & culture')],
    summary: 'Classical dances, music, painting schools, architecture, festivals and UNESCO heritage sites of India.',
    read: [NC('Class 11 Fine Arts: An Introduction to Indian Art'), LUCENT],
  }),

  // ── Reasoning (AFCAT) ──
  guide({
    id: 'rsn-verbal', track: 'Reasoning', subject: 'Reasoning', topic: 'Verbal reasoning', exams: ['afcat', 'icg', 'capf', 'cse'],
    syllabus: [k('afcat', 'Reasoning & Military Aptitude', 'Verbal reasoning'), k('icg', 'Reasoning & Numerical Ability', 'Verbal reasoning'), k('capf', 'Paper I', 'General mental ability'), k('cse', 'CSAT', 'Logical reasoning')],
    summary: 'Coding-decoding, blood relations, direction sense, ranking and order, syllogisms and statement–conclusion questions.',
    read: [RSA_REASON, AFCAT_MOCK],
  }),
  guide({
    id: 'rsn-series', track: 'Reasoning', subject: 'Reasoning', topic: 'Analogy, classification & series', exams: ['afcat', 'icg', 'capf'],
    syllabus: [k('afcat', 'Reasoning & Military Aptitude', 'Analogy & classification'), k('afcat', 'Reasoning & Military Aptitude', 'Series')],
    summary: 'Find the relationship (analogy), the odd one out (classification) and the next term (number, letter and figure series).',
    read: [RSA_REASON, AFCAT_MOCK],
  }),
  guide({
    id: 'rsn-spatial', track: 'Reasoning', subject: 'Reasoning', topic: 'Spatial & figure reasoning', exams: ['afcat', 'icg'],
    syllabus: [k('afcat', 'Reasoning & Military Aptitude', 'Spatial ability'), k('afcat', 'Reasoning & Military Aptitude', 'Hidden & embedded figures'), k('afcat', 'Reasoning & Military Aptitude', 'Dot situation'), k('afcat', 'Reasoning & Military Aptitude', 'Pattern completion'), k('afcat', 'Reasoning & Military Aptitude', 'Mirror & water images'), k('icg', 'Reasoning & Numerical Ability', 'Non-verbal reasoning')],
    summary: 'The "Military Aptitude" figure questions: rotations, mirror and water images, hidden figures, dot situations and pattern completion.',
    read: [{ ...RSA_REASON, detail: 'Non-verbal section: mirror and water images, embedded figures, dot situation, pattern completion' }, AFCAT_MOCK],
  }),
]
