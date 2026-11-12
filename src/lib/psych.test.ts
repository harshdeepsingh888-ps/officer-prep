import { describe, expect, it } from 'vitest'
import { blankSlideIdeas, boxFlags, heroName, narrationOrder, setFlags, storyFlags, watFlags, watSetFlags, type BoxChar } from './psych'

const ids = (fs: { id: string }[]) => fs.map(f => f.id)
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')
// A plain, picture-led story of about 100 words that should raise nothing.
const GOOD = 'Meera, a civil engineering student, was walking home when she saw the old footbridge over the canal had cracked. ' +
  'Children used it to reach school. She was worried someone would fall, so she taped off both ends with her dupatta and a rope from a shop, ' +
  'and asked two boys to warn others. She photographed the crack and called the ward office, who promised a team the next morning. ' +
  'That evening she and her neighbours walked the children round by the main road. The team shored the bridge within a week, and the ward ' +
  'later rebuilt it. Meera kept an eye on the work on her way to college.'

describe('storyFlags', () => {
  it('raises nothing for a plain, picture-led story, and nothing for an empty one', () => {
    expect(storyFlags(GOOD)).toEqual([])
    expect(storyFlags('   ')).toEqual([])
  })

  it('flags stories too thin or too long to write in 4 minutes', () => {
    expect(ids(storyFlags(words(30)))).toContain('short')
    expect(ids(storyFlags(words(200)))).toContain('long')
    expect(ids(storyFlags(words(120)))).toEqual([])
  })

  it('flags awards, years-long arcs, stock endings, morals, defence plots and film-style moves', () => {
    expect(ids(storyFlags(`${GOOD} The mayor gave her an award.`))).toContain('award')
    expect(ids(storyFlags(`${GOOD} Five years later she was the city engineer.`))).toContain('years')
    expect(ids(storyFlags(`${GOOD} She praised her team and felt content.`))).toContain('stock')
    expect(ids(storyFlags(`${GOOD} The moral of the story is to act.`))).toContain('moral')
    expect(ids(storyFlags(`${GOOD} Later she cleared the SSB.`))).toContain('defence')
    expect(ids(storyFlags(`${GOOD} He kicked the knife away.`))).toContain('filmy')
  })

  it('flags unsafe first aid', () => {
    expect(ids(storyFlags(`${GOOD} He gave CPR to pump the water out of his lungs.`))).toContain('firstaid')
    expect(ids(storyFlags(`${GOOD} She put a spoon between her teeth and held her down.`))).toContain('firstaid')
    expect(ids(storyFlags(`${GOOD} He checked her breathing and called an ambulance.`))).not.toContain('firstaid')
  })

  it('flags a story written as "I"', () => {
    expect(ids(storyFlags(`I saw the bridge. I called the office. I waited. ${words(80)}`))).toContain('first-person')
    expect(ids(storyFlags(`I saw the bridge. I called the office. I waited. ${words(80)}`, { blank: true }))).not.toContain('first-person')
  })
})

describe('heroName', () => {
  it('finds the person, skipping sentence openers, titles and places', () => {
    expect(heroName('Rohit, a final-year student, saw smoke.')).toBe('Rohit')
    expect(heroName('It was a cold morning when Priya noticed the boat.')).toBe('Priya')
    expect(heroName('Captain Arjun was on leave in Delhi.')).toBe('Arjun')
    expect(heroName('on a hot day the farmers gathered.')).toBeNull()
  })
})

describe('setFlags', () => {
  it('needs at least three stories to see a pattern', () => {
    expect(setFlags(['Rohit won the race.', 'Rohit won again.'])).toEqual([])
  })

  it('flags the same hero, a hero who always wins, and repeated endings and openings', () => {
    const set = [
      'Rohit, a college student, organised a cleanliness drive and it won first prize. He praised his team.',
      'Rohit, a college student, trained his juniors and his house won the cup. He felt content.',
      'Rohit, a college student, prepared well and won the debate. He felt content.',
      'Rohit, a college student, rebuilt the shed with friends.',
    ]
    expect(ids(setFlags(set))).toEqual(['same-hero', 'always-wins', 'same-ending', 'same-opening'])
  })

  it('flags a set where the hero never thinks or feels', () => {
    const set = ['Arun fixed the pump.', 'Neha cleaned the park with friends.', 'Vikram repaired the roof.', 'Sana organised a blood camp.']
    expect(ids(setFlags(set))).toEqual(['no-feelings'])
  })

  it('is quiet for a varied set', () => {
    expect(setFlags([GOOD, 'Arif, a lineman, was worried when the storm cut power to the clinic. He and the nurse moved patients and he fixed the line by dawn.',
      'Two cousins found an injured dog on the highway. Neha felt sorry for it, called a shelter and they waited with it until help came.'])).toEqual([])
  })
})

describe('blankSlideIdeas', () => {
  it('lists hobbies, sports, achievements and NCC from the PIQ', () => {
    expect(blankSlideIdeas({ hobbies: 'sketching, running', sports: 'football', achievements: '', ncc: 'B certificate' }))
      .toEqual(['sketching', 'running', 'football', 'NCC (B certificate)'])
    expect(blankSlideIdeas({ hobbies: '', sports: '', achievements: '', ncc: ' ' })).toEqual([])
  })
})

describe('boxFlags', () => {
  const c = (sex: BoxChar['sex'], age: string, mood: BoxChar['mood']): BoxChar => ({ x: 0.5, y: 0.5, sex, age, mood })

  it('asks for characters, complete details, exact ages and a hero', () => {
    expect(ids(boxFlags([], null, ''))).toEqual(['none'])
    expect(ids(boxFlags([c('M', '', '+'), c('', '20', '0')], null, ''))).toEqual(['incomplete', 'no-hero'])
    expect(ids(boxFlags([c('M', '20-25', '+')], 0, ''))).toEqual(['age-range'])
    expect(boxFlags([c('M', '22', '+'), c('F', '21', '0')], 0, 'He and his friend…')).toEqual([])
  })

  it('notes a negative hero mood, and a story about the other sex', () => {
    expect(ids(boxFlags([c('F', '22', '-')], 0, ''))).toEqual(['hero-mood'])
    expect(ids(boxFlags([c('M', '22', '+')], 0, 'She ran. She called her friend. Her bag was heavy.'))).toEqual(['hero-sex'])
  })

  it('catches a parent and child too close in age', () => {
    const story = 'The father and his son repaired the boat.'
    expect(ids(boxFlags([c('M', '45', '+'), c('M', '35', '+'), c('M', '30', '+')], 0, story))).toEqual(['family-gap'])
    expect(boxFlags([c('M', '45', '+'), c('M', '20', '+')], 0, story)).toEqual([])
  })
})

describe('narrationOrder', () => {
  it('reads the box in the order the group asks for', () => {
    expect(narrationOrder([{ x: 0, y: 0, sex: 'M', age: '21', mood: '+' }, { x: 1, y: 1, sex: 'F', age: '', mood: '0' }], 0, 'A cycle trip'))
      .toEqual(['2 characters', 'Sex: M, F', 'Age: 21, ?', 'Mood: +, 0', 'Hero: character 1', 'Action: A cycle trip', 'Then the story, in brief'])
  })
})

describe('watFlags', () => {
  it('raises nothing for a plain sentence of your own, and nothing for a blank', () => {
    expect(watFlags('River', 'The village children learnt to swim in the river.')).toEqual([])
    expect(watFlags('River', '')).toEqual([])
  })

  it('flags fragments, advice, sayings, facts, absolutes and the opposite word', () => {
    expect(ids(watFlags('Duty', 'bad habit'))).toContain('fragment')
    expect(ids(watFlags('Lie', 'One should never lie to parents.'))).toContain('advice')
    expect(ids(watFlags('Help', 'Be helpful to everyone around.'))).toContain('advice')
    expect(ids(watFlags('Doctor', 'An apple a day keeps the doctor away.'))).toContain('saying')
    expect(ids(watFlags('Mountain', 'Everest is the highest mountain on earth.'))).toContain('fact')
    expect(ids(watFlags('Friend', 'Friends are always there in hard times.'))).toEqual(['absolute'])
    expect(ids(watFlags('Fear', 'Courage helps soldiers in battle.'))).toContain('opposite')
    expect(ids(watFlags('Fear', 'Fear fades once you start.'))).not.toContain('opposite')
  })

  it('flags a sentence repeated word for word from an earlier set', () => {
    expect(ids(watFlags('Team', 'A good team shares the load.', ['a good team shares the load']))).toEqual(['repeat'])
  })
})

describe('watSetFlags', () => {
  it('flags many blanks and a set mostly about "I"', () => {
    expect(ids(watSetFlags(['', '', '', 'Rain cools the fields.']))).toEqual(['blanks'])
    expect(ids(watSetFlags(['I like rain.', 'My team wins.', 'I help friends.', 'Books teach.', 'Rivers flow.']))).toEqual(['i-heavy'])
    expect(watSetFlags(['Rain cools the fields.', 'Teams share work.', 'Books open minds.', 'Rivers feed farms.', 'I enjoy hills.'])).toEqual([])
  })
})
