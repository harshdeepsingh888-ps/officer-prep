import type { ExamId } from '../exams'
import { ENGLISH_EXTRA } from './english-questions'
import { PYQ, ex, guide, guideQuestions, k, pts, tbl, type ReadItem } from './types'

const EXAMS: ExamId[] = ['cds', 'afcat', 'icg', 'capf']
const WREN: ReadItem = { title: 'Wren & Martin — High School English Grammar and Composition', detail: 'The standard grammar reference: agreement, tenses, articles, prepositions, voice and narration' }
const BAKSHI: ReadItem = { title: 'S. P. Bakshi — Objective General English (Arihant)', detail: 'Exam-style practice sets for every English question type' }
const LEWIS: ReadItem = { title: 'Norman Lewis — Word Power Made Easy', detail: 'Builds vocabulary through roots, prefixes and suffixes' }
const EDITORIAL: ReadItem = { title: 'One newspaper editorial a day (The Hindu / Indian Express)', detail: 'Read for the main idea and the author\'s stand; note five new words', free: true }

const PASSAGE_DRILL = `For centuries, armies have known that discipline is less about punishment than about habit. A recruit who learns to clean his rifle at the same hour every evening is not simply obeying an order; he is building a routine that will hold when fatigue and fear make thinking difficult. Psychologists describe this as "automaticity": once an action is practised often enough, it requires little conscious effort. This is why drills that look repetitive in peacetime prove valuable in an emergency.

Yet routine has a cost. Soldiers trained only to follow fixed procedures may struggle when a situation does not match the manual. Modern training therefore tries to combine the two — drilling basic tasks until they become second nature, while presenting unfamiliar problems in exercises so that leaders learn to think when the script runs out.`

const PASSAGE_WATER = `India receives most of its rainfall in just four months, yet water is needed throughout the year. For generations, villages bridged this gap with tanks, step-wells and small check-dams that slowed the run-off and let it seep into the ground. Many of these structures fell into disuse once tube-wells made it easy to pump groundwater directly.

The result, in several regions, has been falling water tables: wells must be dug deeper each decade, and pumping costs rise. Reviving traditional structures is not a nostalgic exercise. A restored tank recharges the aquifer that the tube-wells draw on, which means the old and new systems work best together rather than as rivals.`

const CLOZE = `The Siachen Glacier is often called the highest battlefield in the world. Soldiers posted there face temperatures that can (1) ____ to minus fifty degrees Celsius, and the air holds far (2) ____ oxygen than at sea level. Before being deployed, troops spend weeks (3) ____ to the altitude in stages. Even so, frostbite and altitude sickness (4) ____ a constant threat. Serving there demands not only physical (5) ____ but also great mental strength.`

const RAW = [
  guide({
    id: 'eng-rc', track: 'English', subject: 'English', topic: 'Reading comprehension', exams: [...EXAMS, 'cse'],
    syllabus: [k('cds', 'English', 'Reading comprehension'), k('afcat', 'Verbal Ability', 'Comprehension'), k('icg', 'English', 'Comprehension'), k('capf', 'Paper II', 'Comprehension'), k('cse', 'CSAT', 'Comprehension')],
    summary: 'A passage followed by questions on its main idea, specific details, inferences, the author\'s tone and the meaning of words in context.',
    read: [PYQ, EDITORIAL, BAKSHI],
    notes: [
      pts('Method',
        'Skim the questions first so you know what to look for.',
        'Read the passage once, actively: note the main idea of each paragraph in three or four words.',
        'Answer from the passage, never from general knowledge — even if you "know" the topic.',
        'For a detail question, find the keyword in the passage and read the sentences just before and after it.'),
      tbl('Question types and how to crack them', [
        ['Main idea / title', 'Pick the option that covers the whole passage, not just one paragraph.'],
        ['Inference', 'Must follow from the text without being stated outright. Reject anything that needs outside facts.'],
        ['Tone / attitude', 'Look at the adjectives and verbs: critical, appreciative, balanced, sarcastic, neutral.'],
        ['Word in context', 'Put each option back into the sentence; the dictionary meaning may not be the one used.'],
        ['Detail', 'Locate it; the right option often paraphrases the passage rather than copying it.'],
      ]),
      pts('Elimination',
        'Extreme words (always, never, only, completely) are usually wrong.',
        'An option that is true in real life but not supported by the passage is wrong.',
        'A partly correct option is a wrong option.'),
    ],
    traps: ['Choosing an option that repeats words from the passage but changes their meaning.', 'Spending too long on one passage — move on and come back.'],
    questions: [
      ['The passage mainly argues that —', ['punishment is the basis of military discipline', 'repetitive drills are a waste of time in peacetime', 'good training combines automatic routines with the ability to handle the unexpected', 'psychologists have replaced drill instructors'], 2, 'Both paragraphs together: routine is valuable, but training must also prepare people to think.', 2, PASSAGE_DRILL],
      ['According to the passage, "automaticity" means —', ['obeying orders without question', 'performing a practised action with little conscious effort', 'acting without any training', 'the ability to think under pressure'], 1, 'Stated directly in the first paragraph.', 1, PASSAGE_DRILL],
      ['It can be inferred that a soldier trained only in fixed procedures —', ['will never make mistakes', 'needs no further training', 'is more disciplined than an officer', 'may be at a disadvantage in an unfamiliar situation'], 3, 'The second paragraph says such soldiers "may struggle" when the situation doesn\'t match the manual.', 2, PASSAGE_DRILL],
      ['"Second nature", as used in the passage, means —', ['something done instinctively after long practice', 'a natural talent', 'a second attempt', 'a weakness'], 0, undefined, 1, PASSAGE_DRILL],
      ['The author\'s attitude towards routine is best described as —', ['wholly dismissive', 'sarcastic', 'balanced — it sees both its value and its limits', 'indifferent'], 2, '"Yet routine has a cost" introduces the other side.', 2, PASSAGE_DRILL],
      ['Why did traditional water structures fall into disuse?', ['They were destroyed by floods', 'Rainfall increased', 'The government banned them', 'Tube-wells made pumping groundwater easy'], 3, undefined, 1, PASSAGE_WATER],
      ['The "gap" mentioned in the first paragraph is between —', ['the months when rain falls and the year-round need for water', 'rich and poor villages', 'old and new technology', 'surface water and seawater'], 0, undefined, 2, PASSAGE_WATER],
      ['The author would most likely agree that —', ['tube-wells should be banned', 'traditional structures and tube-wells can complement each other', 'reviving tanks is mere nostalgia', 'water tables are rising everywhere'], 1, '"…work best together rather than as rivals."', 2, PASSAGE_WATER],
      ['"Aquifer" most nearly means —', ['a canal', 'a rain gauge', 'an underground layer that holds water', 'a type of pump'], 2, 'The context: a tank "recharges" it and tube-wells "draw on" it.', 2, PASSAGE_WATER],
    ],
  }),

  guide({
    id: 'eng-errors', track: 'English', subject: 'English', topic: 'Spotting errors', exams: EXAMS,
    syllabus: [k('cds', 'English', 'Spotting errors'), k('afcat', 'Verbal Ability', 'Error detection'), k('icg', 'English', 'Grammar & usage'), k('capf', 'Paper II', 'Grammar & usage')],
    summary: 'A sentence split into parts plus "No error". Find the part that breaks a rule of grammar or usage.',
    read: [WREN, BAKSHI, PYQ],
    notes: [
      pts('Subject–verb agreement',
        'Each / every / either / neither + singular noun → singular verb: "Each of the boys *is* ready."',
        'Neither…nor / either…or: the verb agrees with the nearer subject: "Neither the captain nor the players *were* late."',
        '"A number of" + plural → plural verb; "The number of" + plural → singular verb.',
        'Phrases like "as well as", "along with", "together with" don\'t change the verb: "The officer, along with his men, *was* present."',
        'A collective noun acting as one unit takes a singular verb: "The committee *has* decided."'),
      pts('Tenses',
        'Since + point of time, for + period: "since 2019", "for five years".',
        'No "will" in if/when clauses of time or condition: "When he *comes*, tell him."',
        'Pairs: hardly/scarcely… *when*; no sooner… *than*.',
        'After did / does / do use the base form: "Did he *go*?"'),
      pts('Pronouns, comparison, articles',
        'After "than"/"as" use the case the full clause needs: "He is taller than *I* (am)."',
        'Senior, junior, superior, inferior, prefer take *to*, not "than".',
        'No double comparatives: "more better" → "better".',
        '"One of the" + plural noun: "One of the *officers* was absent."',
        '"An" goes before a vowel *sound* (an hour, an MBA); "a" before a consonant sound (a university, a one-way road).'),
      tbl('Fixed prepositions', [
        ['comply / agree', 'with'], ['abide', 'by'], ['aware / afraid / accused', 'of'], ['insist / depend / rely', 'on'],
        ['different', 'from'], ['charged', 'with'], ['prefer A', 'to B'],
        ['No preposition after', 'discuss, attack, resemble, reach, enter, order'],
      ]),
    ],
    traps: ['Read the whole sentence — an error in one part often shows only against a word in another part.', 'Don\'t mark a part wrong just because it sounds informal; find the rule it breaks.'],
    questions: [
      ['Find the part with an error: "Each of the cadets / have completed / the obstacle course."', ['Each of the cadets', 'have completed', 'the obstacle course', 'No error'], 1, '"Each" takes a singular verb: has completed.', 1],
      ['Find the part with an error: "The number of applicants / have increased / this year."', ['The number of applicants', 'have increased', 'this year', 'No error'], 1, '"The number of" takes a singular verb: has increased.', 2],
      ['Find the part with an error: "He insisted / to see / the commanding officer."', ['He insisted', 'to see', 'the commanding officer', 'No error'], 1, '"Insist" takes "on": insisted on seeing.', 2],
      ['Find the part with an error: "We discussed about / the plan / before the exercise."', ['We discussed about', 'the plan', 'before the exercise', 'No error'], 0, '"Discuss" takes no preposition.', 1],
      ['Find the part with an error: "She has been working here / since five years / and loves her job."', ['She has been working here', 'since five years', 'and loves her job', 'No error'], 1, 'A period takes "for": for five years.', 1],
      ['Find the part with an error: "If it will rain tomorrow, / the parade / will be cancelled."', ['If it will rain tomorrow,', 'the parade', 'will be cancelled', 'No error'], 0, 'No "will" in an if-clause: If it rains tomorrow.', 2],
      ['Find the part with an error: "No sooner had the bugle sounded / when the cadets / fell in."', ['No sooner had the bugle sounded', 'when the cadets', 'fell in', 'No error'], 1, 'No sooner… than.', 2],
      ['Find the part with an error: "One of the officer / was awarded / a medal."', ['One of the officer', 'was awarded', 'a medal', 'No error'], 0, 'One of the officers.', 1],
      ['Find the part with an error: "The captain, along with his team, / were present / at the ceremony."', ['The captain, along with his team,', 'were present', 'at the ceremony', 'No error'], 1, '"Along with" doesn\'t change the subject: was present.', 2],
      ['Find the part with an error: "He is an honest man / and a university graduate / from Delhi."', ['He is an honest man', 'and a university graduate', 'from Delhi', 'No error'], 3, '"An honest" (silent h) and "a university" (y-sound) are both correct.', 3],
    ],
  }),

  guide({
    id: 'eng-improve', track: 'English', subject: 'English', topic: 'Sentence improvement', exams: EXAMS,
    syllabus: [k('cds', 'English', 'Sentence improvement'), k('icg', 'English', 'Sentence correction')],
    summary: 'Part of a sentence is underlined (shown in CAPITALS here). Choose the option that improves it, or "No improvement".',
    read: [WREN, BAKSHI, PYQ],
    notes: [
      tbl('Conditionals', [
        ['Real / likely', 'If it rains, the march will be cancelled.'],
        ['Imaginary present', 'If I were the commander, I would change the plan.'],
        ['Imaginary past', 'If he had studied harder, he would have passed.'],
      ]),
      pts('Patterns examiners love',
        'It is high time + past tense: "It is high time we *left*."',
        'Lest + should: "Work hard lest you *should* fail."',
        '"Unless" is already negative: "Unless you *practise*…" (not "unless you do not").',
        'Would rather / had better + base form: "I would rather *walk*", "You had better *consult* a doctor."',
        '"Despite" takes no "of"; "in spite of" does.',
        'Keep lists parallel: "swimming, cycling and *running*".'),
      pts('Cut the redundancy', 'return back → return', 'repeat again → repeat', 'revert back → revert', 'final conclusion → conclusion', 'cousin brother → cousin'),
      ex('Worked example', '"He DID NOT KNEW the answer."', '"did not know" — after "did", use the base form.'),
    ],
    traps: ['Choose "No improvement" only after checking every rule — but don\'t be afraid to choose it.', 'Make sure the new option fits the rest of the sentence, not just the underlined part.'],
    questions: [
      ['Improve: "It is high time WE LEAVE for the station."', ['we will leave', 'we left', 'we should leave', 'No improvement'], 1, 'It is high time + past tense.', 2],
      ['Improve: "Work hard lest you WILL FAIL."', ['should fail', 'fail not', 'might not fail', 'No improvement'], 0, 'Lest… should.', 2],
      ['Improve: "Unless you DO NOT PRACTISE, you will not improve."', ['will practise', 'did not practise', 'practise', 'No improvement'], 2, '"Unless" already means "if not".', 1],
      ['Improve: "DESPITE OF the rain, the march continued."', ['In spite', 'Although', 'Despite', 'No improvement'], 2, 'Despite (no "of") or "In spite of".', 1],
      ['Improve: "He RETURNED BACK to the camp at dusk."', ['returned', 'came back again', 'returned again', 'No improvement'], 0, '"Back" repeats the idea of "returned".', 1],
      ['Improve: "I WOULD RATHER TO WALK than take the bus."', ['would rather walking', 'would rather walk', 'had rather to walk', 'No improvement'], 1, 'Would rather + base form.', 2],
      ['Improve: "If he HAD STUDIED harder, he would have passed."', ['studied', 'would have studied', 'has studied', 'No improvement'], 3, 'Correct third conditional.', 2],
      ['Improve: "She likes swimming, cycling and TO RUN."', ['to running', 'run', 'running', 'No improvement'], 2, 'Keep the list parallel.', 1],
      ['Improve: "You HAD BETTER TO CONSULT a doctor."', ['had better consult', 'had better consulted', 'better consult to', 'No improvement'], 0, 'Had better + base form.', 2],
      ['Improve: "The cadet, as well as his instructors, WERE PRAISED."', ['have praised', 'was praised', 'were being praised', 'No improvement'], 1, 'The subject is "the cadet" — singular.', 3],
    ],
  }),

  guide({
    id: 'eng-vocab', track: 'English', subject: 'English', topic: 'Synonyms & antonyms', exams: EXAMS,
    syllabus: [k('cds', 'English', 'Synonyms'), k('cds', 'English', 'Antonyms'), k('afcat', 'Verbal Ability', 'Synonyms'), k('afcat', 'Verbal Ability', 'Antonyms'), k('afcat', 'Verbal Ability', 'Vocabulary'), k('icg', 'English', 'Vocabulary')],
    summary: 'Pick the word closest in meaning (synonym) or opposite in meaning (antonym) to a given word.',
    read: [LEWIS, EDITORIAL, { title: 'Revise → Flashcards → Vocabulary deck', detail: 'Spaced revision of high-frequency words', url: '#/revise/cards' }],
    notes: [
      tbl('Roots that unlock hundreds of words', [
        ['bene / bon', 'good — benevolent, benefactor'], ['mal', 'bad — malice, malign'], ['chron', 'time — chronic, chronology'],
        ['loqu / locu', 'speak — eloquent, loquacious'], ['voc / vok', 'call — vocal, invoke'], ['ambi', 'both — ambiguous, ambivalent'],
        ['omni / pan', 'all — omnipresent, panorama'], ['vert / vers', 'turn — divert, adverse'], ['dict', 'say — predict, contradict'],
        ['spec / spic', 'see — spectator, conspicuous'], ['mort', 'death — mortal, mortify'], ['phil · mis', 'love · hate — philanthropy, misanthrope'],
      ]),
      tbl('Prefixes', [
        ['a / an / in / im / un / dis', 'not — apathy, impartial, disloyal'], ['anti / contra', 'against'], ['circum', 'around'],
        ['pre · post', 'before · after'], ['sub · super', 'under · above'], ['trans', 'across'],
      ]),
      pts('Method',
        'First decide the word\'s "charge": positive or negative. That alone eliminates two options.',
        'For an antonym, first find the synonym in your head, then its opposite.',
        'Use the word in a sentence you know; try each option in that sentence.',
        'Learn words in pairs and groups (timid ↔ intrepid, laud ↔ criticise), not in isolation.'),
    ],
    traps: ['A word that "sounds like" the given word is a classic distractor (e.g. "eminent" vs "imminent").', 'In antonym questions, the synonym is usually among the options — don\'t pick it by reflex.'],
    questions: [
      ['Synonym of ALACRITY:', ['reluctance', 'eagerness', 'sorrow', 'caution'], 1, 'Alacrity: brisk, cheerful readiness.', 2],
      ['Antonym of PRUDENT:', ['careful', 'wise', 'thrifty', 'reckless'], 3, undefined, 1],
      ['Synonym of VERBOSE:', ['wordy', 'brief', 'silent', 'loud'], 0, undefined, 1],
      ['Antonym of AUGMENT:', ['increase', 'enlarge', 'diminish', 'support'], 2, undefined, 1],
      ['Synonym of INTREPID:', ['timid', 'clever', 'tired', 'fearless'], 3, undefined, 2],
      ['Antonym of AMIABLE:', ['hostile', 'friendly', 'gentle', 'polite'], 0, undefined, 1],
      ['Synonym of CURSORY:', ['thorough', 'hasty', 'careful', 'angry'], 1, 'Cursory: quick and superficial.', 2],
      ['Antonym of TRANSIENT:', ['brief', 'passing', 'permanent', 'fleeting'], 2, undefined, 2],
      ['Synonym of ABJURE:', ['accept', 'request', 'adore', 'renounce'], 3, 'Abjure: to solemnly give up.', 3],
      ['Antonym of LAUD:', ['criticise', 'praise', 'applaud', 'honour'], 0, undefined, 2],
    ],
  }),

  guide({
    id: 'eng-blanks', track: 'English', subject: 'English', topic: 'Fill in the blanks', exams: EXAMS,
    syllabus: [k('cds', 'English', 'Fill in the blanks'), k('afcat', 'Verbal Ability', 'Sentence completion')],
    summary: 'Complete a sentence with the word that fits both the grammar and the meaning.',
    read: [WREN, BAKSHI, PYQ],
    notes: [
      pts('Method',
        'Read the whole sentence and predict the word before looking at the options.',
        'Check the grammar the blank needs: part of speech, tense, singular/plural, the preposition that follows.',
        'Use signal words: but / although / despite = contrast; and / moreover = continuation; because / so = cause and effect.'),
      tbl('Collocations — words that go together', [
        ['make', 'a decision, an effort, progress, a mistake'], ['take', 'a step, a chance, part, charge'], ['pay', 'attention, a visit, tribute'],
        ['commit', 'a crime, an offence'], ['heavy', 'rain, traffic, losses'], ['strong', 'tea, wind, opposition'],
      ]),
      ex('Worked example', '"Although the route was ____, the patrol reached the post on time." (easy / difficult / short / known)', '"difficult" — "although" signals a contrast with reaching on time.'),
    ],
    traps: ['A word can mean the right thing and still be wrong because the preposition after it doesn\'t fit.'],
    questions: [
      ['The sentry remained ____ throughout the night, despite the bitter cold.', ['careless', 'vigilant', 'asleep', 'absent'], 1, '"Despite the cold" points to a positive quality.', 1],
      ['Although he was exhausted, he ____ to finish the march.', ['refused', 'failed', 'managed', 'forgot'], 2, '"Although" signals a contrast with being exhausted.', 1],
      ['The officer was accused ____ negligence.', ['for', 'with', 'about', 'of'], 3, 'Accused of; charged with.', 1],
      ['The two countries agreed to ____ their differences through dialogue.', ['resolve', 'increase', 'ignore', 'widen'], 0, undefined, 1],
      ['He is ____ honest officer.', ['a', 'an', 'the', 'no article needed'], 1, 'Silent "h": an honest.', 1],
      ['The team was ____ by the sudden change in orders, and nobody knew what to do.', ['delighted', 'rewarded', 'baffled', 'strengthened'], 2, undefined, 2],
      ['Neither of the answers ____ correct.', ['are', 'were', 'have been', 'is'], 3, '"Neither" takes a singular verb.', 2],
      ['We must ____ the rules even when no one is watching.', ['abide by', 'abide', 'abide with', 'abide to'], 0, undefined, 2],
      ['The report was so ____ that it covered every minor detail.', ['brief', 'exhaustive', 'vague', 'careless'], 1, undefined, 2],
      ['The commander ____ the troops for their courage under fire.', ['blamed', 'warned', 'commended', 'dismissed'], 2, undefined, 1],
    ],
  }),

  guide({
    id: 'eng-ordering', track: 'English', subject: 'English', topic: 'Ordering of words & sentences', exams: EXAMS,
    syllabus: [k('cds', 'English', 'Ordering of words'), k('cds', 'English', 'Ordering of sentences')],
    summary: 'Rearrange jumbled parts (P, Q, R, S) into a meaningful sentence, or jumbled sentences into a logical paragraph.',
    read: [BAKSHI, PYQ],
    notes: [
      pts('Ordering words within a sentence',
        'Find the subject and the main verb first; they anchor everything else.',
        'Articles, adjectives and prepositions attach to the noun after them.',
        'Use the options: once you fix the first two parts, usually only one option survives.'),
      pts('Ordering sentences in a paragraph',
        'The opening sentence introduces the topic and doesn\'t depend on anything before it.',
        'Words like "he", "this", "such", "then", "however", "finally" point back — they cannot come first.',
        'Look for pairs that must stay together: a name and the pronoun for it, a question and its answer, a cause and its effect.',
        'Time order (first, next, then, finally) is a strong clue.'),
    ],
    traps: ['Two orders can both be grammatical — choose the one a careful writer would actually use.'],
    questions: [
      ['Arrange to complete the sentence beginning "He": P: the letter  Q: to his mother  R: wrote  S: last night', ['R P Q S', 'P R Q S', 'R S Q P', 'Q R P S'], 0, '"He wrote the letter to his mother last night."', 1],
      ['Arrange to complete the sentence beginning "The": P: was postponed  Q: due to heavy rain  R: match  S: scheduled for Sunday', ['R P S Q', 'R S P Q', 'S R P Q', 'R Q P S'], 1, '"The match scheduled for Sunday was postponed due to heavy rain."', 2],
      ['Arrange the sentences: P. Finally, he was commissioned and posted to a unit on the border. Q. After college, Arjun cleared the CDS written exam. R. He then trained for eighteen months at the Indian Military Academy. S. Next came the five-day SSB interview, which he also cleared.', ['Q R S P', 'S Q R P', 'Q S R P', 'Q S P R'], 2, 'Time order: written exam → SSB → training → commission.', 2],
      ['Arrange the sentences: P. As a result, the river carries less water in summer. Q. Forests on the hills hold rainwater and release it slowly. R. When the forests are cut, the rain runs off quickly instead. S. This keeps streams flowing even in the dry months.', ['Q R S P', 'R Q S P', 'Q S P R', 'Q S R P'], 3, 'Q introduces; S explains its effect; R gives the contrast; P is the result.', 3],
      ['Arrange to make a sentence: P: never  Q: a good soldier  R: his post  S: leaves', ['Q P S R', 'Q S P R', 'P Q S R', 'R Q P S'], 0, '"A good soldier never leaves his post."', 1],
      ['Arrange to make a sentence: P: the instructor  Q: to the recruits  R: the rules  S: explained', ['S P R Q', 'P S R Q', 'P S Q R', 'R S P Q'], 1, '"The instructor explained the rules to the recruits."', 1],
    ],
  }),

  guide({
    id: 'eng-cloze', track: 'English', subject: 'English', topic: 'Cloze test', exams: EXAMS,
    syllabus: [k('cds', 'English', 'Cloze test')],
    summary: 'A passage with numbered blanks. Choose the word that fits each blank in grammar, meaning and flow.',
    read: [BAKSHI, PYQ, EDITORIAL],
    notes: [
      pts('Method',
        'Read the whole passage once before filling anything: the theme decides many blanks.',
        'For each blank, decide the part of speech first (noun, verb, adjective…), then the meaning.',
        'Check agreement and tense with the words around the blank.',
        'Re-read the full passage with your answers — it should read smoothly.'),
    ],
    traps: ['Options in a cloze often share a root (endure / endurance / enduring) — the grammar decides.'],
    questions: [
      ['Blank (1):', ['rise', 'drop', 'climb', 'raise'], 1, 'Temperatures drop to minus fifty.', 1, CLOZE],
      ['Blank (2):', ['more', 'much', 'less', 'few'], 2, 'Thin air at altitude holds less oxygen; "less" pairs with "than".', 1, CLOZE],
      ['Blank (3):', ['accelerating', 'accumulating', 'accommodating', 'acclimatising'], 3, 'Acclimatise: adjust to a new climate or altitude.', 2, CLOZE],
      ['Blank (4):', ['remain', 'remains', 'remaining', 'has remained'], 0, 'Two subjects joined by "and" take a plural verb.', 2, CLOZE],
      ['Blank (5):', ['endure', 'endurance', 'enduring', 'endured'], 1, 'After the adjective "physical" we need a noun.', 2, CLOZE],
    ],
  }),

  guide({
    id: 'eng-idioms', track: 'English', subject: 'English', topic: 'Idioms & phrases', exams: EXAMS,
    syllabus: [k('cds', 'English', 'Idioms & phrases'), k('afcat', 'Verbal Ability', 'Idioms & phrases')],
    summary: 'Choose the meaning of an idiom or phrase. One-word substitutions are tested alongside, so they are covered here too.',
    read: [BAKSHI, LEWIS, PYQ],
    notes: [
      tbl('Common idioms', [
        ['At the eleventh hour', 'at the last moment'], ['Burn the midnight oil', 'work or study late into the night'],
        ['A blessing in disguise', 'something good that first seemed bad'], ['Bite off more than one can chew', 'take on more than one can handle'],
        ['Cross swords', 'argue or fight'], ['Hold one\'s horses', 'wait; be patient'], ['Leave no stone unturned', 'try every possible way'],
        ['Pull one\'s weight', 'do one\'s fair share'], ['Turn a blind eye', 'deliberately ignore'], ['A dark horse', 'a little-known competitor who may win'],
        ['Call it a day', 'stop working'], ['In the line of fire', 'exposed to attack or criticism'],
      ]),
      tbl('One-word substitution', [
        ['One who cannot be corrected', 'Incorrigible'], ['A speech made without preparation', 'Extempore'], ['One who knows everything', 'Omniscient'],
        ['Fear of heights', 'Acrophobia'], ['Fear of closed spaces', 'Claustrophobia'], ['A place where arms are kept', 'Armoury / Arsenal'],
        ['One who walks in sleep', 'Somnambulist'], ['Killing of one\'s mother', 'Matricide'], ['Government by the people', 'Democracy'],
      ]),
      pts('Method', 'Don\'t read idioms literally — the literal option is almost always the trap.', 'Imagine the idiom in a sentence about a real situation.'),
    ],
    traps: ['The option that describes the literal picture ("to build a wall", "to waste fuel") is the classic distractor.'],
    questions: [
      ['"To leave no stone unturned" means —', ['to build a wall', 'to be lazy', 'to try every possible means', 'to search a quarry'], 2, undefined, 1],
      ['"A blessing in disguise" means —', ['an unexpected misfortune', 'a good thing that first seemed bad', 'a hidden enemy', 'a religious ceremony'], 1, undefined, 1],
      ['"To pull one\'s weight" means —', ['to lift heavy loads', 'to lose weight', 'to dominate others', 'to do one\'s fair share of work'], 3, undefined, 2],
      ['"At the eleventh hour" means —', ['at the last moment', 'at 11 o\'clock', 'very early', 'never'], 0, undefined, 1],
      ['"To turn a blind eye" means —', ['to become blind', 'to look carefully', 'to deliberately ignore', 'to wink'], 2, undefined, 1],
      ['One word for "a speech delivered without preparation":', ['Eulogy', 'Extempore', 'Epilogue', 'Elocution'], 1, undefined, 2],
      ['One word for "one who cannot be corrected":', ['Incurable', 'Invincible', 'Indelible', 'Incorrigible'], 3, undefined, 2],
      ['One word for "fear of heights":', ['Acrophobia', 'Hydrophobia', 'Claustrophobia', 'Xenophobia'], 0, undefined, 2],
      ['One word for "a place where weapons are stored":', ['Aviary', 'Apiary', 'Armoury', 'Granary'], 2, 'Aviary: birds; apiary: bees; granary: grain.', 1],
      ['"To burn the midnight oil" means —', ['to waste fuel', 'to work or study late into the night', 'to start a fire', 'to sleep early'], 1, undefined, 1],
    ],
  }),
]

// Each guide's own questions, then its extra practice set (ids <guide>-x-1 … so they never clash).
export const ENGLISH = RAW.map(g => (ENGLISH_EXTRA[g.id]
  ? { ...g, questions: [...g.questions, ...guideQuestions({ ...g, id: `${g.id}-x` }, ENGLISH_EXTRA[g.id])] }
  : g))
