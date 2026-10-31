import type { ExamId } from './exams'

// Official previous-year papers, linked (not copied) from
// https://www.upsc.gov.in/examinations/previous-question-papers — collected 31 Oct 2026.
// UPSC owns these papers; the app only links to them and gives you an OMR sheet to answer on.

export type OfficialPaper = {
  id: string
  exam: ExamId
  sitting: string
  paper: string
  url: string
  size: string
  questions: number
  marks: number
  minutes: number
}

const U = 'https://www.upsc.gov.in/sites/default/files/'

const cds = (sitting: string, files: [string, string, string], sizes: [string, string, string]): OfficialPaper[] => [
  { id: `${sitting}-eng`, exam: 'cds', sitting, paper: 'English', url: U + files[0], size: sizes[0], questions: 120, marks: 100, minutes: 120 },
  { id: `${sitting}-gk`, exam: 'cds', sitting, paper: 'General Knowledge', url: U + files[1], size: sizes[1], questions: 120, marks: 100, minutes: 120 },
  { id: `${sitting}-maths`, exam: 'cds', sitting, paper: 'Elementary Mathematics', url: U + files[2], size: sizes[2], questions: 100, marks: 100, minutes: 120 },
]

export const OFFICIAL_PAPERS: OfficialPaper[] = [
  ...cds('CDS (II) 2026', ['QP-CDSE-II-26-ENGLISH-140926.pdf', 'QP-CDSE-II-26-GENERAL-KNOWLEDGE-140926.pdf', 'QP-CDSE-II-26-ELEMENTARY-MATHEMATICS-140926.pdf'], ['24.8 MB', '45.6 MB', '26.8 MB']),
  ...cds('CDS (I) 2026', ['QP-CDS-I-26-ENGLISH-130426.pdf', 'QP-CDS-I-26-GENERAL-KNOWLEDGE-130426.pdf', 'QP-CDS-I-26-ELEMENTARY-MATHEMATICS-130426.pdf'], ['14.7 MB', '30.9 MB', '30.1 MB']),
  ...cds('CDS (II) 2025', ['QP-CDSE-II-25-ENGLISH-150925.pdf', 'QP-CDSE-II-25-GENERAL-KNOWLEDGE-150925.pdf', 'QP-CDSE-II-25-ELEMENTARY-MATHEMATICS-150925.pdf'], ['14.5 MB', '24.2 MB', '22.4 MB']),
  ...cds('CDS (I) 2025', ['QP-CDSE-I-25-ENGLISH-150425.pdf', 'QP-CDSE-I-25-GENERAL-KNOWLEDGE-150425.pdf', 'QP-CDSE-I-25-ELEMENTARY-MATHEMATICS-150425.pdf'], ['20.0 MB', '25.5 MB', '19.4 MB']),
  ...cds('CDS (II) 2024', ['QP-CDSE-II-24-ENGLISH-020924.pdf', 'QP-CDSE-II-24-GENERAL-KNOWLEDGE-020924.pdf', 'QP-CDSE-II-24-ELEMENTARY-MATHEMATICS-020924.pdf'], ['15.0 MB', '26.7 MB', '28.5 MB']),
  ...cds('CDS (I) 2024', ['QP_CDSI2024_ENGLISH_22042024.pdf', 'QP_CDSI2024_GENERAL-KNOWLEDGE_22042024.pdf', 'QP_CDSI2024_ELEMENTARY-MATHEMATICS_22042024.pdf'], ['16.3 MB', '26.6 MB', '22.5 MB']),

  { id: 'capf26-p1', exam: 'capf', sitting: 'CAPF 2026', paper: 'Paper I — General Ability & Intelligence', url: U + 'QP-CAPF-Exam-2026-GENERAL-ABILITY-AND-INTELLIGENCE-200726.pdf', size: '30.9 MB', questions: 125, marks: 250, minutes: 120 },
  { id: 'capf25-p1', exam: 'capf', sitting: 'CAPF 2025', paper: 'Paper I — General Ability & Intelligence', url: U + 'QP-CAPF-25-GENERAL-ABILITY-INTELLIGENCE-040825.pdf', size: '31.8 MB', questions: 125, marks: 250, minutes: 120 },
  { id: 'capf24-p1', exam: 'capf', sitting: 'CAPF 2024', paper: 'Paper I — General Ability & Intelligence', url: U + 'QP_CAPF_2024_GEN-ABILITY-AND-INTELLI_05082024.pdf', size: '65.8 MB', questions: 125, marks: 250, minutes: 120 },

  { id: 'csp26-gs1', exam: 'cse', sitting: 'CSE Prelims 2026', paper: 'GS Paper I', url: U + 'QP_CSP_2026_GENERAL_STUDIES_PAPER-I_25052026.pdf', size: '34.2 MB', questions: 100, marks: 200, minutes: 120 },
  { id: 'csp26-csat', exam: 'cse', sitting: 'CSE Prelims 2026', paper: 'GS Paper II (CSAT)', url: U + 'QP_CSP_2026_GENERAL_STUDIES_PAPER-II_25052026.pdf', size: '26.5 MB', questions: 80, marks: 200, minutes: 120 },
  { id: 'csp25-gs1', exam: 'cse', sitting: 'CSE Prelims 2025', paper: 'GS Paper I', url: U + 'QP-CSP-25-GENERAL-STUDIES-PAPER-I-26052025.pdf', size: '27.8 MB', questions: 100, marks: 200, minutes: 120 },
  { id: 'csp25-csat', exam: 'cse', sitting: 'CSE Prelims 2025', paper: 'GS Paper II (CSAT)', url: U + 'QP-CSP-25-GENERAL-STUDIES-PAPER-II-26052025.pdf', size: '30.6 MB', questions: 80, marks: 200, minutes: 120 },
  { id: 'csp24-gs1', exam: 'cse', sitting: 'CSE Prelims 2024', paper: 'GS Paper I', url: U + 'QP-CSP-24-GENERAL-STUDIES-PAPER-I-180624.pdf', size: '29.1 MB', questions: 100, marks: 200, minutes: 120 },
  { id: 'csp24-csat', exam: 'cse', sitting: 'CSE Prelims 2024', paper: 'GS Paper II (CSAT)', url: U + 'QP-CSP-24-GENERAL-STUDIES-PAPER-II-180624.pdf', size: '29.9 MB', questions: 80, marks: 200, minutes: 120 },
]

// Descriptive papers — practise these on the Writing page.
export const DESCRIPTIVE_PAPERS = [
  { sitting: 'CAPF 2026', paper: 'Paper II — GS, Essay & Comprehension', url: U + 'QP-CAPF-Exam-2026-GENERAL-STUDIES-ESSAY-AND-COMPREHENSION-200726.pdf', size: '3.0 MB' },
  { sitting: 'CAPF 2025', paper: 'Paper II — GS, Essay & Comprehension', url: U + 'QP-CAPF-25-GENERAL-STUDIES-ESSAY-COMPREHENSION-040825.pdf', size: '2.9 MB' },
  { sitting: 'CAPF 2024', paper: 'Paper II — GS, Essay & Comprehension', url: U + 'QP_CAPF_2024_GS-ESSAY-AND-COMP_05082024.pdf', size: '4.9 MB' },
]

export type LibraryLink = { title: string; url: string; group: string; note?: string }

export const OFFICIAL_LINKS: LibraryLink[] = [
  { group: 'UPSC', title: 'Previous year question papers (all years)', url: 'https://www.upsc.gov.in/examinations/previous-question-papers' },
  { group: 'UPSC', title: 'Annual Calendar 2027', url: 'https://www.upsc.gov.in/content/annual-calendar-2027-0' },
  { group: 'UPSC', title: 'Active examinations & notifications', url: 'https://www.upsc.gov.in/examinations/active-exams' },
  { group: 'UPSC', title: 'Answer keys (archive)', url: 'https://www.upsc.gov.in/examinations/answer-key/archives', note: 'Published after the final result of each exam' },
  { group: 'UPSC', title: 'Cut-off marks', url: 'https://www.upsc.gov.in/examinations/cutoff-marks--' },
  { group: 'UPSC', title: 'Revised syllabus & scheme', url: 'https://www.upsc.gov.in/examinations/revised-syllabus-scheme' },
  { group: 'Air Force', title: 'AFCAT portal', url: 'https://afcat.cdac.in', note: 'Opens with each AFCAT notification; mock test is inside candidate login' },
  { group: 'Coast Guard', title: 'CGCAT — officer entry', url: 'https://joinindiancoastguard.cdac.in/cgcat/' },
  { group: 'Coast Guard', title: 'Officer selection procedure', url: 'https://joinindiancoastguard.cdac.in/selectionof_officer' },
  { group: 'Army', title: 'Join Indian Army — officer entries & SSB info', url: 'https://joinindianarmy.nic.in' },
  { group: 'Study', title: 'NCERT textbooks (Class I–XII)', url: 'https://ncert.nic.in/textbook.php', note: 'Free to download for personal study; NCERT forbids re-hosting or bundling them in apps' },
  { group: 'Current affairs', title: 'PIB — official press releases (filter Ministry of Defence)', url: 'https://pib.gov.in' },
]
