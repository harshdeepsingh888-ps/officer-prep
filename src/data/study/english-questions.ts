import type { QSpec } from './types'

// Extra English practice sets (original), added to each English guide's own questions so the CDS English
// mock can run full length. Same formats as the guides: error spotting ends with "No error", sentence
// improvement with "No improvement", and passage questions carry their passage. Answer positions are
// arranged by hand so no letter is a safe guess.

const PASSAGE_LEADER = `A young officer once asked his commanding officer what single quality mattered most in a leader. He expected to hear "courage" or "intelligence". Instead, the old colonel answered, "Reliability." Soldiers, he explained, will follow a leader whose words and actions match, even when that leader is not the bravest or the cleverest person in the room. A promise kept in a small matter — leave granted on time, a complaint heard and acted upon — builds a store of trust that can be drawn upon in a crisis.

The colonel added a warning. Trust, he said, is built slowly and lost quickly. A single instance of a leader taking credit for his team's work, or blaming them for his own mistake, can undo months of goodwill. That is why the best leaders are careful in small things: they know their soldiers are watching not only what they do in battle, but how they behave on every ordinary day.`

const PASSAGE_SLEEP = `Armies have long treated sleep as a luxury that a determined soldier can do without. Research suggests the opposite. After about seventeen to nineteen hours without sleep, studies have found, people's reaction times and judgement can fall to levels comparable with those of someone who has been drinking alcohol. Sleep-deprived soldiers are more likely to misidentify targets, forget instructions and take unnecessary risks.

None of this means that soldiers can always sleep eight hours. Operations do not run to a timetable. But planners increasingly treat sleep as a resource to be managed, like fuel or ammunition: they schedule rest in shifts, encourage short naps when possible, and avoid keeping everyone awake at once when only a few need to be alert.`

const CLOZE_SAND = `Before a major operation, commanders often (1) ____ the plan on a sand model, a three-dimensional map of the ground laid out on the floor or a table. Every officer can see (2) ____ the hills, rivers and roads lie, and where each unit will move. The model makes it easier to (3) ____ problems that a flat map might hide, such as a ridge that blocks the line of sight. It also gives junior leaders a (4) ____ to ask questions before the operation begins, (5) ____ than in the middle of it.`

export const ENGLISH_EXTRA: Record<string, QSpec[]> = {
  'eng-rc': [
    ['According to the colonel, the most important quality in a leader is —', ['courage', 'intelligence', 'reliability', 'strictness'], 2, 'He answers “Reliability” and explains why in the next sentences.', 1, PASSAGE_LEADER],
    ['The example of “leave granted on time” is given to show that —', ['leaders should be generous with leave', 'small promises kept build trust', 'soldiers care only about leave', 'rules must never be broken'], 1, 'It illustrates “a promise kept in a small matter”, which builds a store of trust.', 2, PASSAGE_LEADER],
    ['As used in the passage, “undo” most nearly means —', ['repeat', 'reverse', 'increase', 'explain'], 1, 'One unfair act can reverse, or cancel out, months of goodwill.', 1, PASSAGE_LEADER],
    ['Which statement best sums up the colonel’s warning?', ['Trust takes time to build but can be lost through one unfair act', 'Leaders should avoid taking decisions', 'Soldiers rarely notice how a leader behaves', 'Courage matters more than trust in a crisis'], 0, '“Trust is built slowly and lost quickly.”', 2, PASSAGE_LEADER],
    ['The tone of the passage is —', ['humorous', 'instructive', 'angry', 'sarcastic'], 1, 'It passes on advice about leadership.', 2, PASSAGE_LEADER],
    ['The best title for the passage would be —', ['The Courage of Colonels', 'Leave Rules in the Army', 'Trust: Built Slowly, Lost Quickly', 'Why Officers Fail'], 2, 'The whole passage is about how trust is earned and lost.', 2, PASSAGE_LEADER],
    ['According to the passage, armies in the past regarded sleep as —', ['essential for fitness', 'a luxury that could be sacrificed', 'a form of punishment', 'a medical problem'], 1, 'Stated in the first sentence.', 1, PASSAGE_SLEEP],
    ['The passage says that long periods without sleep make soldiers —', ['stronger', 'more cautious', 'more likely to make errors of judgement', 'better at following instructions'], 2, 'They misidentify targets, forget instructions and take unnecessary risks.', 1, PASSAGE_SLEEP],
    ['Planners treat sleep “like fuel or ammunition” because it —', ['is expensive', 'has to be planned and managed', 'is stored in depots', 'is rarely needed'], 1, '“A resource to be managed”, with rest scheduled in shifts.', 2, PASSAGE_SLEEP],
    ['Which of these is NOT mentioned as a way of managing sleep?', ['Rest in shifts', 'Short naps', 'Keeping only a few soldiers alert at a time', 'Sleeping tablets'], 3, 'The passage never mentions medication.', 2, PASSAGE_SLEEP],
    ['As used in the passage, “comparable” most nearly means —', ['similar', 'opposite', 'smaller', 'unrelated'], 0, 'Reaction times fall to levels similar to those of someone who has been drinking.', 1, PASSAGE_SLEEP],
  ],
  'eng-errors': [
    ['Find the part with an error: "Neither the captain nor his men / was aware / of the change in plan."', ['Neither the captain nor his men', 'was aware', 'of the change in plan', 'No error'], 1, 'With “neither … nor”, the verb agrees with the nearer subject, “men”: were aware.', 2],
    ['Find the part with an error: "He is one of those officers / who has served / in all three sectors."', ['He is one of those officers', 'who has served', 'in all three sectors', 'No error'], 1, '“Who” refers to “officers” (plural): who have served.', 3],
    ['Find the part with an error: "The committee have / submitted its report / to the ministry."', ['The committee have', 'submitted its report', 'to the ministry', 'No error'], 0, 'Acting as one body with “its” report, the committee takes a singular verb: The committee has.', 2],
    ['Find the part with an error: "I prefer tea / in the morning / than coffee."', ['I prefer tea', 'in the morning', 'than coffee', 'No error'], 2, '“Prefer” takes “to”: prefer tea to coffee.', 1],
    ['Find the part with an error: "Scarcely had he reached / the camp / than it started to rain."', ['Scarcely had he reached', 'the camp', 'than it started to rain', 'No error'], 2, '“Scarcely” and “hardly” pair with “when”: scarcely … when. (“No sooner” takes “than”.)', 2],
    ['Find the part with an error: "The news / he brought / were encouraging."', ['The news', 'he brought', 'were encouraging', 'No error'], 2, '“News” is singular: was encouraging.', 1],
    ['Find the part with an error: "Since five years / she has been working / in this regiment."', ['Since five years', 'she has been working', 'in this regiment', 'No error'], 0, 'Use “for” with a length of time and “since” with a point in time: for five years.', 1],
    ['Find the part with an error: "Every soldier and every officer / was present / at the parade."', ['Every soldier and every officer', 'was present', 'at the parade', 'No error'], 3, 'Subjects joined by “and” but each preceded by “every” take a singular verb, so “was” is correct.', 3],
    ['Find the part with an error: "One should do / his duty / sincerely."', ['One should do', 'his duty', 'sincerely', 'No error'], 1, '“One” is followed by “one’s”: one should do one’s duty.', 2],
  ],
  'eng-improve': [
    ['Improve: "If I WAS a general, I would change the rules."', ['were', 'am', 'had been', 'No improvement'], 0, 'An unreal condition takes the subjunctive: If I were.', 2],
    ['Improve: "No sooner did the bugle sound THAN THE TROOPS FELL IN."', ['when the troops fell in', 'then the troops fell in', 'before the troops fell in', 'No improvement'], 3, '“No sooner … than” is correct as written.', 2],
    ['Improve: "The patrol RETURNED BACK to the base at dawn."', ['came back again', 'returned', 'returned again', 'No improvement'], 1, '“Returned back” is redundant: returned.', 1],
    ['Improve: "Hardly HAD WE STARTED when it began to snow."', ['we had started', 'did we start', 'we started', 'No improvement'], 3, '“Hardly had we started … when” is correct.', 2],
    ['Improve: "Let YOU AND I discuss the plan."', ['you and me', 'you and myself', 'I and you', 'No improvement'], 0, '“Let” takes the object form: Let you and me.', 2],
    ['Improve: "The officer, along with his men, WERE honoured at the ceremony."', ['have been', 'was', 'are', 'No improvement'], 1, 'The subject is “the officer”; “along with his men” does not make it plural.', 2],
    ['Improve: "He did not come to the parade BECAUSE OF he was ill."', ['due to', 'owing to', 'as', 'No improvement'], 2, 'A clause (“he was ill”) needs a conjunction: as / because. “Because of” and “due to” take a noun.', 2],
  ],
  'eng-vocab': [
    ['Synonym of INTREPID:', ['fearless', 'timid', 'clever', 'tired'], 0, undefined, 1],
    ['Synonym of AUSTERE:', ['luxurious', 'severe', 'cheerful', 'careless'], 1, 'Austere: strict, plain, without comfort.', 2],
    ['Synonym of TENACIOUS:', ['weak', 'flexible', 'persistent', 'forgetful'], 2, undefined, 2],
    ['Synonym of BENEVOLENT:', ['cruel', 'kind', 'jealous', 'proud'], 1, undefined, 1],
    ['Synonym of VIGILANT:', ['watchful', 'lazy', 'noisy', 'angry'], 0, undefined, 1],
    ['Antonym of OBSCURE:', ['dark', 'vague', 'hidden', 'clear'], 3, undefined, 2],
    ['Antonym of FRUGAL:', ['thrifty', 'extravagant', 'careful', 'poor'], 1, 'Frugal: careful with money.', 2],
    ['Antonym of ZENITH:', ['peak', 'summit', 'nadir', 'climax'], 2, 'Zenith: the highest point; nadir: the lowest.', 2],
    ['Antonym of COWARDICE:', ['fear', 'panic', 'weakness', 'valour'], 3, undefined, 1],
  ],
  'eng-blanks': [
    ['The convoy was delayed ____ a landslide on the highway.', ['because', 'owing to', 'despite', 'although'], 1, '“A landslide” is a noun phrase, so it needs “owing to” (or “because of”).', 2],
    ['She has been preparing for the exam ____ January.', ['for', 'from', 'since', 'by'], 2, '“Since” with a point in time.', 1],
    ['Neither of the two candidates ____ selected.', ['were', 'was', 'have been', 'are'], 1, '“Neither of” takes a singular verb.', 2],
    ['The officer was accused ____ negligence.', ['for', 'with', 'of', 'about'], 2, 'Accused of; charged with.', 1],
    ['He is good ____ mathematics but weak ____ English.', ['at … in', 'in … at', 'with … in', 'at … at'], 0, 'Good at; weak in.', 2],
    ['The soldiers marched ____ the bridge to the other bank.', ['along', 'among', 'across', 'between'], 2, '“Across” means from one side to the other.', 1],
    ['If it ____ tomorrow, the parade will be cancelled.', ['will rain', 'rained', 'would rain', 'rains'], 3, 'A first conditional: if + present simple, will + verb.', 1],
  ],
  'eng-ordering': [
    ['Arrange to complete the sentence beginning "The": P: of the regiment  Q: commanding officer  R: inspected  S: the guard of honour', ['Q P R S', 'P Q R S', 'Q R P S', 'R Q P S'], 0, '“The commanding officer of the regiment inspected the guard of honour.”', 1],
    ['Arrange to complete the sentence beginning "Every": P: a water bottle  Q: and a first-aid kit  R: cadet on the trek  S: must carry', ['S R P Q', 'R S P Q', 'R P S Q', 'P Q R S'], 1, '“Every cadet on the trek must carry a water bottle and a first-aid kit.”', 1],
    ['Arrange to complete the sentence beginning "Although": P: it was raining heavily  Q: in record time  R: he completed  S: the cross-country run', ['R P S Q', 'P S R Q', 'P R S Q', 'R S P Q'], 2, '“Although it was raining heavily, he completed the cross-country run in record time.”', 2],
    ['Arrange to complete the sentence beginning "Having": P: the officers  Q: dispersed  R: finished the briefing  S: to their units', ['R Q P S', 'P R Q S', 'Q R P S', 'R P Q S'], 3, '“Having finished the briefing, the officers dispersed to their units.”', 2],
  ],
  'eng-cloze': [
    ['Blank (1):', ['rehearse', 'abandon', 'conceal', 'postpone'], 0, 'Commanders rehearse the plan on the model before the operation.', 2, CLOZE_SAND],
    ['Blank (2):', ['what', 'where', 'which', 'whom'], 1, 'Officers see where the hills, rivers and roads lie.', 1, CLOZE_SAND],
    ['Blank (3):', ['create', 'ignore', 'spot', 'cause'], 2, 'The model makes hidden problems easier to spot.', 1, CLOZE_SAND],
    ['Blank (4):', ['reason', 'chance', 'order', 'fear'], 1, 'A chance to ask questions.', 1, CLOZE_SAND],
    ['Blank (5):', ['more', 'sooner', 'rather', 'better'], 2, '“Rather than”: before the operation instead of during it.', 2, CLOZE_SAND],
  ],
  'eng-idioms': [
    ['"To bite off more than one can chew" means —', ['to eat too fast', 'to take on more than one can manage', 'to be very hungry', 'to speak rudely'], 1, undefined, 1],
    ['"To hold one’s ground" means —', ['to refuse to retreat or give way', 'to buy land', 'to lie down', 'to dig a trench'], 0, undefined, 1],
    ['"A close shave" means —', ['a neat haircut', 'a careful plan', 'a narrow escape', 'a quick victory'], 2, undefined, 1],
    ['"To burn the midnight oil" means —', ['to waste fuel', 'to start a fire', 'to sleep early', 'to work or study late into the night'], 3, undefined, 1],
    ['"To call a spade a spade" means —', ['to speak plainly and frankly', 'to dig a trench', 'to insult someone', 'to name tools correctly'], 0, undefined, 2],
    ['"At the eleventh hour" means —', ['at eleven o’clock', 'at the last possible moment', 'very early', 'during the night'], 1, undefined, 1],
  ],
}
