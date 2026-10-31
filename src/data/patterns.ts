import type { ExamId } from './exams'
import type { Question } from './questions'

// Paper patterns for mock and sectional tests. Section sizes follow the usual split of recent papers;
// the exam notification is the final word. Time and total marks come from the exam catalogue (exams.ts).

export type Section = { name: string; subject: Question['subject']; questions: number }
export type MockPaper = { id: string; exam: ExamId; paper: string; sections: Section[] }

export const MOCKS: MockPaper[] = [
  { id: 'cds-eng', exam: 'cds', paper: 'English', sections: [{ name: 'English', subject: 'English', questions: 120 }] },
  { id: 'cds-gk', exam: 'cds', paper: 'General Knowledge', sections: [{ name: 'General Knowledge', subject: 'General Knowledge', questions: 120 }] },
  { id: 'cds-maths', exam: 'cds', paper: 'Elementary Mathematics', sections: [{ name: 'Elementary Mathematics', subject: 'Mathematics', questions: 100 }] },
  {
    id: 'afcat', exam: 'afcat', paper: 'AFCAT', sections: [
      { name: 'General Awareness', subject: 'General Knowledge', questions: 25 },
      { name: 'Verbal Ability', subject: 'English', questions: 25 },
      { name: 'Numerical Ability', subject: 'Mathematics', questions: 20 },
      { name: 'Reasoning & Military Aptitude', subject: 'Reasoning', questions: 30 },
    ],
  },
  {
    id: 'capf-1', exam: 'capf', paper: 'Paper I — General Ability & Intelligence', sections: [
      { name: 'General Studies', subject: 'General Knowledge', questions: 75 },
      { name: 'Mental Ability', subject: 'Reasoning', questions: 25 },
      { name: 'Quantitative Aptitude', subject: 'Mathematics', questions: 25 },
    ],
  },
  {
    id: 'icg', exam: 'icg', paper: 'CGCAT', sections: [
      { name: 'English', subject: 'English', questions: 25 },
      { name: 'Reasoning', subject: 'Reasoning', questions: 15 },
      { name: 'Numerical Ability & Maths', subject: 'Mathematics', questions: 25 },
      { name: 'General Knowledge & Science', subject: 'General Knowledge', questions: 35 },
    ],
  },
  { id: 'cse-gs1', exam: 'cse', paper: 'Prelims GS Paper I', sections: [{ name: 'General Studies', subject: 'General Knowledge', questions: 100 }] },
  {
    id: 'cse-csat', exam: 'cse', paper: 'Prelims GS Paper II (CSAT)', sections: [
      { name: 'Comprehension', subject: 'English', questions: 30 },
      { name: 'Reasoning & Mental Ability', subject: 'Reasoning', questions: 25 },
      { name: 'Basic Numeracy', subject: 'Mathematics', questions: 25 },
    ],
  },
]

export const mockById = (id: string) => MOCKS.find(m => m.id === id)
export const mocksFor = (exam: ExamId) => MOCKS.filter(m => m.exam === exam)
