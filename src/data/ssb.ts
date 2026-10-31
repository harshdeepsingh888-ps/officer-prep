// SSB / FSB / interview practice material — written for this app.

export const OLQ_FACTORS: { factor: string; olqs: string[] }[] = [
  { factor: 'Planning & organising', olqs: ['Effective Intelligence', 'Reasoning Ability', 'Organising Ability', 'Power of Expression'] },
  { factor: 'Social adjustment', olqs: ['Social Adaptability', 'Cooperation', 'Sense of Responsibility'] },
  { factor: 'Social effectiveness', olqs: ['Initiative', 'Self Confidence', 'Speed of Decision', 'Ability to Influence the Group', 'Liveliness'] },
  { factor: 'Dynamic', olqs: ['Determination', 'Courage', 'Stamina'] },
]
export const OLQS = OLQ_FACTORS.flatMap(f => f.olqs)

export const WAT_WORDS = [
  'Army', 'Brave', 'Fail', 'Fear', 'Mother', 'Leader', 'Team', 'Win', 'Death', 'Friend', 'Duty', 'Discipline', 'Help', 'Risk',
  'Society', 'Trust', 'Alone', 'Attack', 'Blood', 'Challenge', 'Country', 'Courage', 'Cooperate', 'Decision', 'Defeat', 'Enemy',
  'Effort', 'Failure', 'Family', 'Fight', 'Goal', 'Honest', 'Hope', 'Hurdle', 'Initiative', 'Jealous', 'Lazy', 'Lie', 'Love',
  'Mistake', 'Nation', 'Obey', 'Order', 'Pain', 'Patience', 'Peace', 'Plan', 'Problem', 'Progress', 'Punish', 'Quarrel',
  'Responsibility', 'Respect', 'Sacrifice', 'Sad', 'Serve', 'Sick', 'Smile', 'Sports', 'Struggle', 'Success', 'Teacher', 'Time',
  'Tired', 'Unity', 'Victory', 'War', 'Weak', 'Work', 'Worry', 'Youth', 'Village', 'Doctor', 'River', 'Night', 'Dark', 'Book',
  'Money', 'Rain', 'Crowd', 'Snake', 'Accident', 'Hostel', 'Exam', 'Senior', 'Junior', 'Rules', 'Uniform', 'Flag', 'Border',
  'Mountain', 'Sea', 'Sky', 'Helpless', 'Confidence', 'Wish', 'Dream', 'Guide', 'Lead', 'Danger',
]

export const SRT_SITUATIONS = [
  'He is travelling by train at night and notices smoke coming from the next coach. He…',
  'While returning from college he sees an accident on a lonely road; the injured man is bleeding heavily. He…',
  'He is made captain of the college team a week before the final, and two senior players are unhappy. He…',
  'His exam is tomorrow and his mother falls ill at night; no one else is at home. He…',
  'He finds a wallet with cash and an ID card on the bus. He…',
  'During a trek, a group member twists his ankle and darkness is approaching. He…',
  'His friend asks him to help copy in the exam. He…',
  'He reaches the station to find his train has left, and he has an interview in another city the next morning. He…',
  'Villagers in his area are fighting over water from a common well. He…',
  'He is given a project with a tight deadline and two team members stop responding. He…',
  'While swimming in a river, he sees a child being swept away by the current. He…',
  'His senior at work asks him to sign a document he believes is incorrect. He…',
  'He notices a fire in a neighbour\'s kitchen while the neighbours are away. He…',
  'He loses his purse and phone in an unknown city. He…',
  'During a group discussion, one member keeps interrupting everyone. He…',
  'He is asked to organise the college annual function with a very small budget. He…',
  'His younger brother has started skipping school and staying out late. He…',
  'A stranger on the train offers him food and insists he eat it. He…',
  'He sees a group of boys teasing a girl at the bus stop. He…',
  'His bicycle gets a puncture on the way to an important exam with 30 minutes left. He…',
  'He is selected for a job abroad, but his father wants him to stay and run the family business. He…',
  'During floods, his village is cut off and food is running short. He…',
  'On night duty as security in-charge, he hears noises from the store room. He…',
  'His team loses the match because of his mistake. He…',
  'A snake enters the classroom during a lecture. He…',
  'He learns that a close friend has been spreading rumours about him. He…',
  'He is new in the hostel and the seniors start ragging him. He…',
  'He must deliver an urgent message to a camp across a river, and the bridge is broken. He…',
  'A colleague takes credit for work he did. He…',
  'While driving, he is stopped by a policeman who asks for a bribe. He…',
  'He is asked to speak at short notice on a topic he knows little about. He…',
  'His village has no school beyond class 5. He…',
  'He is lost in a forest with a compass and a small bottle of water. He…',
  'The cashier has given him ₹500 extra by mistake. He…',
  'His friends plan a trip on the same day as his NCC camp. He…',
  'A riot breaks out in his locality while his family is at home. He…',
  'He fails in his first attempt at the exam he prepared hard for. He…',
  'The leader of his group falls sick on the day of a competition. He…',
  'He sees an elderly man struggling to cross a busy road. He…',
  'He is posted to a remote area where locals are hostile to outsiders. He…',
  'His parents oppose his decision to join the armed forces. He…',
  'The boat he is in starts leaking in the middle of a lake. He…',
  'During a debate, the audience starts booing his point of view. He…',
  'He finds out that his roommate is taking drugs. He…',
  'At a wedding, a short circuit puts the lights out and people start to panic. He…',
  'His sports final and his sister\'s engagement fall on the same day. He…',
  'He notices an unattended bag lying on the railway platform. He…',
  'His team members are demotivated after repeated failures. He…',
  'He has to lead new students on a cleanliness drive, and many are reluctant. He…',
  'In an uphill cycle race he gets a severe cramp with 2 km to go. He…',
  'He discovers a serious mistake in a report he has already submitted to his boss. He…',
  'A cyclone warning is announced for his coastal town. He…',
  'His friend is hurt in a fight and wants to take revenge. He…',
  'He is stuck in a lift with three others and one of them panics. He…',
  'At the exam centre he realises he has left his admit card at home. He…',
  'The village panchayat ignores his suggestion to build a drainage system. He…',
  'During a camp, the food arrangement fails and 40 cadets are hungry. He…',
  'He notices a stranger photographing a military installation. He…',
  'His teacher punishes him for a fault that was not his. He…',
  'He is made leader of a team in which several members are older than him. He…',
]

// Used for TAT/PPDT when you have not added your own pictures yet.
export const TAT_SCENES = [
  'A young man stands at the edge of a damaged bridge, looking at the river below; a few villagers stand behind him.',
  'Two people bend over a map spread on the bonnet of a jeep in the evening light.',
  'A woman speaks to a group of children sitting under a large tree.',
  'A man holding a file waits in a hospital corridor while a doctor walks towards him.',
  'Smoke is rising from a building and a young person is running towards it.',
  'Students in a laboratory; one holds a test tube up to the light.',
  'A boy sits alone on a staircase with an opened letter in his hand.',
  'A boat is near the shore in rough weather while people watch from the bank.',
  'An old man and a young man walk together through a field of crops.',
  'A person on a mountain slope with a rope and backpack looks upward.',
  'A crowded meeting hall; one person is standing and speaking.',
]

export const LECTURETTE_TOPICS = [
  'Agniveer scheme', 'Women in combat roles', 'Theatre commands', 'Indigenisation of defence production', 'India–China border',
  'Cyber warfare', 'Drones in modern warfare', 'Space as a military domain', 'Blue economy', 'Indian Ocean security',
  'Disaster management in India', 'Climate change and national security', 'Digital India', 'Startups in India', 'Make in India',
  'Electric vehicles', 'Artificial intelligence', 'Social media and youth', 'Fake news', 'Brain drain',
  'Sports culture in India', 'Olympics and India', 'Water scarcity', 'Urbanisation', 'Population: asset or liability',
  'Education reforms', 'Women empowerment', 'Corruption', 'Terrorism', 'Naxalism',
  'G20 and India', 'India–US relations', 'Neighbourhood first policy', 'Renewable energy', 'Organic farming',
  'Mental health', 'Road safety', 'Plastic pollution', 'Role of NCC', 'Leadership',
]

export const GD_TOPICS = [
  'Should military training be compulsory for all youth?', 'Is social media doing more harm than good?', 'Can India become a $10 trillion economy by 2035?',
  'Privatisation of defence production', 'Reservation in promotions', 'Online education vs classroom learning',
  'Should India sign more free trade agreements?', 'Is democracy slowing development?', 'Electric vehicles — hype or future?', 'Role of youth in nation building',
]

export const ESSAY_TOPICS = [
  'Internal security challenges in India\'s border states', 'Human rights and the role of security forces', 'Left-wing extremism: causes and solutions',
  'Women in uniform', 'Technology as a force multiplier for policing', 'Coastal security after 26/11',
  'The freedom struggle and its lessons for today', 'Federalism and national security', 'Disaster management: a security issue',
  'Drug trafficking and youth', 'Cyber crime in a digital India', 'Climate change as a threat multiplier',
  'Smart borders: technology and management', 'Police reforms in India', 'Neighbourhood first: promise and practice',
  'The role of CAPFs in nation building', 'Ethics in public service', 'Inclusive growth', 'Education is the best defence of a nation', 'Courage is not the absence of fear',
]

export type InterviewProfile = {
  name: string; hometown: string; state: string; degree: string; college: string;
  hobbies: string; sports: string; achievements: string; ncc: string; fatherJob: string;
  attempts: string; entry: string
}

export const EMPTY_PROFILE: InterviewProfile = {
  name: '', hometown: '', state: '', degree: '', college: '', hobbies: '', sports: '', achievements: '', ncc: '', fatherJob: '', attempts: '', entry: '',
}

/** Likely interview questions built from your PIQ / DAF details. */
export function interviewQuestions(p: InterviewProfile): { area: string; q: string }[] {
  const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
  const out: { area: string; q: string }[] = [
    { area: 'Opening', q: 'Tell me about yourself.' },
    { area: 'Opening', q: 'How did you prepare for today?' },
  ]
  if (p.hometown) out.push(
    { area: 'Hometown', q: `What is ${p.hometown} known for?` },
    { area: 'Hometown', q: `What are the biggest problems in ${p.hometown}, and what would you do about them?` },
    { area: 'Hometown', q: `Name the MP, MLA and District Collector of ${p.hometown}.` },
  )
  if (p.state) out.push(
    { area: 'State', q: `What are the major issues facing ${p.state} today?` },
    { area: 'State', q: `Who is the Chief Minister and Governor of ${p.state}?` },
    { area: 'State', q: `Name two war heroes or gallantry awardees from ${p.state}.` },
  )
  if (p.degree) out.push(
    { area: 'Education', q: `Why did you choose ${p.degree}?` },
    { area: 'Education', q: `How will ${p.degree} help you as an officer?` },
    { area: 'Education', q: `What was your favourite and least favourite subject in ${p.degree}? Why?` },
  )
  if (p.college) out.push({ area: 'Education', q: `What did you contribute to ${p.college} apart from academics?` })
  for (const h of list(p.hobbies)) out.push({ area: 'Hobbies', q: `You wrote "${h}" as a hobby — when did you last do it, and what have you learnt from it?` })
  for (const s of list(p.sports)) out.push({ area: 'Sports', q: `Explain the rules of ${s}. What position do you play and what is your best performance?` })
  for (const a of list(p.achievements)) out.push({ area: 'Achievements', q: `Tell me about "${a}". What was your exact role?` })
  if (p.ncc) out.push({ area: 'NCC', q: `What did you learn in NCC (${p.ncc})? Describe one camp.` })
  if (p.fatherJob) out.push({ area: 'Family', q: `What does your father's work as ${p.fatherJob} involve? What have you learnt from him?` })
  if (p.attempts) out.push(
    { area: 'Previous attempts', q: `You have had ${p.attempts} previous attempt(s). What went wrong and what have you changed?` },
  )
  out.push(
    { area: 'Motivation', q: p.entry ? `Why ${p.entry}? What will you do if you are not selected?` : 'Why do you want to join this service?' },
    { area: 'Self-awareness', q: 'What are your three strengths and three weaknesses? How are you working on the weaknesses?' },
    { area: 'Self-awareness', q: 'What would your friends say about you? What would your parents say?' },
    { area: 'Current affairs', q: 'What are the top three national news stories this week?' },
    { area: 'Current affairs', q: 'What is the latest development in India\'s defence or internal security?' },
    { area: 'Situational', q: 'Tell me about a time you led a group. What went wrong and how did you handle it?' },
  )
  return out
}

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
