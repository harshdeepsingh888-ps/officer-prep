import { pts, tbl, type NoteBlock } from './types'

// Short revision notes for the GK and Reasoning guides: the facts and methods the exams test most.
// Settled facts only; anything that changes year to year (budgets, rankings, exercise names) belongs in
// your own current-affairs notes.

export const GK_NOTES: Record<string, { notes: NoteBlock[]; traps?: string[] }> = {
  'gk-polity': {
    notes: [
      pts('The Constitution at a glance',
        'Adopted on 26 November 1949 (Constitution Day); came into force on 26 January 1950 (Republic Day).',
        'Dr B. R. Ambedkar chaired the Drafting Committee; Dr Rajendra Prasad presided over the Constituent Assembly.',
        'Preamble: Sovereign, Socialist, Secular, Democratic Republic. “Socialist”, “Secular” and “Integrity” were added by the 42nd Amendment (1976).',
        'Originally 395 Articles in 22 Parts and 8 Schedules; there are now 12 Schedules.'),
      tbl('Articles to know', [
        ['14–18', 'Right to Equality (17 abolishes untouchability)'],
        ['19–22', 'Right to Freedom (19: six freedoms; 21: life and personal liberty)'],
        ['23–24', 'Right against Exploitation'],
        ['25–28', 'Freedom of Religion'],
        ['29–30', 'Cultural and Educational Rights'],
        ['32', 'Constitutional Remedies: writs from the Supreme Court (226: High Courts)'],
        ['36–51', 'Directive Principles of State Policy (Part IV)'],
        ['51A', 'Fundamental Duties (Part IVA, added in 1976; now 11)'],
        ['52 / 63', 'President / Vice-President'],
        ['72', 'President’s power to pardon'],
        ['110 / 112', 'Money Bill / Union Budget (“Annual Financial Statement”)'],
        ['280', 'Finance Commission'],
        ['324', 'Election Commission'],
        ['352 / 356 / 360', 'National emergency / President’s Rule in a state / financial emergency'],
        ['368', 'Amending the Constitution'],
      ]),
      tbl('Borrowed features', [
        ['Britain', 'Parliamentary system, rule of law, single citizenship, writs'],
        ['USA', 'Fundamental Rights, judicial review, independent judiciary, impeachment of the President'],
        ['Ireland', 'Directive Principles, nominating members to the Rajya Sabha, how the President is elected'],
        ['Canada', 'Federation with a strong Centre; residuary powers with the Centre'],
        ['Former USSR', 'Fundamental Duties'],
        ['Australia', 'Concurrent List, joint sitting of Parliament'],
        ['Germany (Weimar)', 'Suspending Fundamental Rights during an emergency'],
        ['South Africa', 'Amendment procedure, election of Rajya Sabha members'],
      ]),
      pts('Parliament',
        'Lok Sabha: at most 550 members (543 elected now); 5-year term; minimum age 25.',
        'Rajya Sabha: at most 250 (up to 238 elected by states and UTs, 12 nominated by the President); a permanent House, with a third of members retiring every 2 years; minimum age 30.',
        'A joint sitting (Article 108) is chaired by the Speaker. It is not used for Money Bills or constitutional amendments.'),
    ],
    traps: [
      'Article 32 enforces Fundamental Rights in the Supreme Court; under Article 226 High Courts can issue writs for other legal rights too.',
      'The Vice-President chairs the Rajya Sabha but is not a member of it.',
    ],
  },

  'gk-economy': {
    notes: [
      pts('National income',
        'GDP: the value of final goods and services produced within the country in a year. GNP = GDP + net income from abroad.',
        'Nominal GDP uses current prices; real GDP removes the effect of price changes.',
        'Per capita income = national income ÷ population.'),
      tbl('The RBI’s tools', [
        ['Repo rate', 'Rate at which the RBI lends to banks for the short term, against securities'],
        ['Standing Deposit Facility', 'Rate the RBI pays on banks’ surplus money (the floor of the corridor)'],
        ['CRR', 'Share of deposits banks must keep with the RBI as cash'],
        ['SLR', 'Share of deposits banks must hold as liquid assets: cash, gold, government securities'],
        ['Open market operations', 'The RBI buys or sells government securities to add or remove money'],
      ]),
      tbl('Who does what', [
        ['Monetary Policy Committee', 'Sets the repo rate; 6 members; targets 4% CPI inflation within ±2%'],
        ['Finance Commission', 'Recommends how central taxes are shared with states (Article 280)'],
        ['GST Council', 'Sets GST rates; chaired by the Union Finance Minister'],
        ['NITI Aayog', 'Policy think tank; replaced the Planning Commission on 1 January 2015'],
        ['SEBI · IRDAI · PFRDA', 'Securities markets · insurance · pensions'],
      ]),
      pts('Taxes and deficits',
        'Direct taxes fall on the person who pays them (income tax, corporation tax). Indirect taxes are passed on (GST, customs).',
        'Fiscal deficit = total expenditure − total receipts excluding borrowings.',
        'Revenue deficit = revenue expenditure − revenue receipts. Primary deficit = fiscal deficit − interest payments.'),
    ],
    traps: [
      'Raising the repo rate makes money dearer and fights inflation; cutting it does the opposite.',
      'WPI measures wholesale prices and CPI retail prices; the RBI targets CPI.',
    ],
  },

  'gk-modern': {
    notes: [
      tbl('Timeline', [
        ['1757', 'Battle of Plassey'], ['1764', 'Battle of Buxar'], ['1857', 'Revolt of 1857'],
        ['1885', 'Indian National Congress founded'], ['1905', 'Partition of Bengal; Swadeshi movement'],
        ['1906', 'Muslim League founded at Dhaka'], ['1907', 'Surat split: Moderates and Extremists'],
        ['1909', 'Morley–Minto Reforms (separate electorates)'], ['1915', 'Gandhi returns from South Africa'],
        ['1917', 'Champaran Satyagraha'], ['1919', 'Rowlatt Act; Jallianwala Bagh; Montagu–Chelmsford Reforms'],
        ['1920–22', 'Non-Cooperation and Khilafat movements'], ['1928', 'Simon Commission arrives'],
        ['1929', 'Lahore session: Purna Swaraj resolution'], ['1930', 'Dandi March; Civil Disobedience'],
        ['1931', 'Gandhi–Irwin Pact; Second Round Table Conference'], ['1932', 'Communal Award; Poona Pact'],
        ['1935', 'Government of India Act'], ['1942', 'Cripps Mission; Quit India Movement'],
        ['1946', 'Cabinet Mission'], ['1947', 'Independence on 15 August; Partition'],
      ]),
      tbl('Congress sessions worth knowing', [
        ['1885 Bombay', 'First session, presided over by W. C. Bonnerjee'],
        ['1906 Calcutta', 'Swaraj demanded (Dadabhai Naoroji)'],
        ['1929 Lahore', 'Purna Swaraj, with Jawaharlal Nehru presiding'],
        ['1931 Karachi', 'Resolution on Fundamental Rights, with Sardar Patel presiding'],
        ['1938 Haripura', 'Subhas Chandra Bose elected president'],
      ]),
      pts('Governors-General and Viceroys: one line each',
        'Warren Hastings: first Governor-General of Bengal (Regulating Act, 1773).',
        'Lord Cornwallis: Permanent Settlement of Bengal (1793). Lord Wellesley: Subsidiary Alliance.',
        'Lord William Bentinck: abolished sati (1829); first Governor-General of India (1833).',
        'Lord Dalhousie: Doctrine of Lapse; railways and the telegraph.',
        'Lord Canning: last Governor-General and first Viceroy (1858). Lord Ripon: local self-government (1882).',
        'Lord Curzon: Partition of Bengal (1905). Lord Mountbatten: last Viceroy; partition plan of June 1947.'),
    ],
    traps: [
      'After the Lahore session, 26 January 1930 was celebrated as Independence Day; that is why the Constitution began on 26 January.',
      'The INA was formed under Mohan Singh in 1942; Subhas Chandra Bose took command in 1943.',
    ],
  },

  'gk-ancient': {
    notes: [
      pts('Harappan civilisation (mature phase c. 2600–1900 BCE)',
        'Planned cities with grid streets, covered drains and burnt-brick houses; the script is still undeciphered.',
        'Harappa (on the Ravi), Mohenjo-daro (Indus: Great Bath, granary), Lothal (dockyard), Kalibangan (ploughed field, fire altars), Dholavira (water reservoirs), Rakhigarhi (among the largest).'),
      tbl('Dynasties and rulers', [
        ['Mauryas', 'Chandragupta (founder, with Kautilya), Bindusara, Ashoka (Kalinga war, edicts, dhamma)'],
        ['Kushanas', 'Kanishka: Fourth Buddhist Council, Mahayana, Gandhara and Mathura art'],
        ['Guptas', 'Samudragupta (conquests); Chandragupta II (Vikramaditya; Kalidasa at court; Fa-Hien visits)'],
        ['Harsha (7th century)', 'Ruled from Kannauj; Hiuen Tsang visits; Nalanda flourishes'],
        ['Delhi Sultanate (1206–1526)', 'Mamluk (Slave), Khalji, Tughlaq, Sayyid and Lodi dynasties'],
        ['Mughals (1526–1857)', 'Babur, Humayun, Akbar, Jahangir, Shah Jahan, Aurangzeb …'],
        ['Vijayanagara (1336–1646)', 'Founded by Harihara and Bukka; at its peak under Krishnadevaraya'],
      ]),
      tbl('Battles', [
        ['1191 / 1192', 'First and Second Battles of Tarain: Prithviraj Chauhan against Muhammad Ghori'],
        ['1526', 'First Panipat: Babur defeats Ibrahim Lodi'],
        ['1527', 'Khanwa: Babur defeats Rana Sanga'],
        ['1556', 'Second Panipat: Akbar’s forces defeat Hemu'],
        ['1565', 'Talikota: the fall of Vijayanagara'],
        ['1576', 'Haldighati: the Mughal army against Maharana Pratap'],
        ['1761', 'Third Panipat: Ahmad Shah Abdali defeats the Marathas'],
      ]),
    ],
    traps: [
      'Most of Ashoka’s edicts are in Prakrit in the Brahmi script; in the north-west they use Kharosthi, Greek and Aramaic.',
      'Aibak began the Qutub Minar; Iltutmish completed it.',
    ],
  },

  'gk-art': {
    notes: [
      tbl('Classical dances (the eight recognised by the Sangeet Natak Akademi)', [
        ['Bharatanatyam', 'Tamil Nadu'], ['Kathak', 'North India (Uttar Pradesh)'], ['Kathakali', 'Kerala'], ['Mohiniyattam', 'Kerala'],
        ['Kuchipudi', 'Andhra Pradesh'], ['Odissi', 'Odisha'], ['Manipuri', 'Manipur'], ['Sattriya', 'Assam'],
      ]),
      pts('Architecture',
        'Nagara (north Indian) temples have a curved shikhara; Dravida (south Indian) temples have a pyramid-shaped vimana and tall gopurams; Vesara mixes the two (Chalukyas, Hoysalas).',
        'Rock-cut: Ajanta (Buddhist murals), Ellora (Buddhist, Hindu and Jain caves, including the Kailasa temple), Elephanta (Shiva caves).',
        'Indo-Islamic: Qutub Minar, Alai Darwaza, Fatehpur Sikri, the Taj Mahal (built by Shah Jahan for Mumtaz Mahal).'),
      tbl('Painting and folk art', [
        ['Madhubani', 'Bihar (Mithila)'], ['Warli', 'Maharashtra'], ['Pattachitra', 'Odisha and West Bengal'], ['Kalamkari', 'Andhra Pradesh'],
        ['Pithora', 'Gujarat (Rathwa community)'], ['Gond', 'Madhya Pradesh'], ['Tanjore', 'Tamil Nadu'],
      ]),
    ],
    traps: ['Kathakali and Mohiniyattam are both from Kerala.', 'Ellora has caves of three faiths; Ajanta is entirely Buddhist.'],
  },

  'gk-physical-geo': {
    notes: [
      tbl('Layers of the atmosphere, from the ground up', [
        ['Troposphere', 'Weather and clouds; temperature falls with height; about 8 km thick at the poles, 18 km at the equator'],
        ['Stratosphere', 'Ozone layer; jet aircraft cruise in its lower part'],
        ['Mesosphere', 'The coldest layer; meteors burn up here'],
        ['Thermosphere (ionosphere)', 'Reflects radio waves; auroras'],
        ['Exosphere', 'The outermost layer, thinning into space'],
      ]),
      pts('Interior and rocks',
        'Crust → mantle → outer core (liquid) → inner core (solid). The Moho separates crust and mantle; the Gutenberg discontinuity separates mantle and core.',
        'Igneous rocks (granite, basalt) form from magma; sedimentary (sandstone, limestone, shale) from layers of sediment; metamorphic from heat and pressure: limestone → marble, shale → slate, sandstone → quartzite.'),
      tbl('Pressure belts and winds', [
        ['Equatorial low (doldrums)', 'Calm, rising air, heavy rain'],
        ['Trade winds', 'Subtropical high → equator; north-easterly in the Northern Hemisphere'],
        ['Westerlies', 'Subtropical high → subpolar low; the “Roaring Forties” in the south'],
        ['Local winds', 'Loo (north India, hot), Chinook (Rockies, warm and dry), Foehn (Alps), Mistral (France, cold), Sirocco (Sahara → Mediterranean, hot)'],
      ]),
      pts('Ocean currents',
        'Warm: Gulf Stream, North Atlantic Drift, Kuroshio, Brazil, Agulhas.',
        'Cold: Labrador, California, Humboldt (Peru), Benguela, Canary, Oyashio.',
        'Where warm and cold currents meet (Newfoundland, off Japan) there are rich fishing grounds and fog.'),
    ],
    traps: [
      'Most ozone is in the stratosphere, not the troposphere.',
      'Isobars join equal pressure, isotherms equal temperature, isohyets equal rainfall.',
    ],
  },

  'gk-indian-geo': {
    notes: [
      pts('Location and borders',
        'India lies between about 8°4′ N and 37°6′ N, and 68°7′ E and 97°25′ E; the Tropic of Cancer runs through the middle.',
        'It is the seventh-largest country by area. Its longest land border is with Bangladesh.',
        'Standard time is set at 82°30′ E, near Mirzapur, 5 h 30 min ahead of GMT.'),
      tbl('Rivers', [
        ['Indus', 'Rises near Lake Mansarovar in Tibet; tributaries Jhelum, Chenab, Ravi, Beas, Sutlej'],
        ['Ganga', 'Bhagirathi (from Gangotri) and Alaknanda meet at Devprayag; the Yamuna joins at Prayagraj'],
        ['Brahmaputra', 'Called the Tsangpo in Tibet; enters India in Arunachal Pradesh; Majuli river island in Assam'],
        ['Godavari', 'Longest peninsular river: from near Nashik to the Bay of Bengal'],
        ['Narmada, Tapi', 'Flow west through rift valleys into the Arabian Sea (estuaries)'],
        ['Mahanadi, Krishna, Kaveri', 'Flow east and form deltas on the Bay of Bengal'],
      ]),
      tbl('Soils', [
        ['Alluvial', 'Indo-Gangetic plain; the most widespread and fertile'],
        ['Black (regur)', 'Deccan lava plateau; holds moisture; cotton'],
        ['Red and yellow', 'Eastern and southern Deccan; iron oxide gives the colour'],
        ['Laterite', 'Heavy-rainfall areas such as the Western Ghats; leached; cashew, tea'],
        ['Arid', 'Rajasthan; sandy and saline'],
      ]),
      pts('Monsoon',
        'The south-west monsoon (June–September) brings most of India’s rain. It reaches Kerala around 1 June and covers the country by mid-July.',
        'Tamil Nadu gets much of its rain from the north-east (retreating) monsoon, October–December.',
        'The Western Ghats and the north-east are wettest; Ladakh and western Rajasthan are driest.'),
    ],
    traps: [
      'The Narmada and Tapi form estuaries, not deltas.',
      'Kangchenjunga is the highest peak wholly within India; K2 is in Gilgit-Baltistan, which India claims.',
    ],
  },

  'gk-world-geo': {
    notes: [
      tbl('Straits and what they join', [
        ['Gibraltar', 'Mediterranean ↔ Atlantic (Spain–Morocco)'],
        ['Bosphorus', 'Black Sea ↔ Sea of Marmara (Istanbul)'],
        ['Hormuz', 'Persian Gulf ↔ Gulf of Oman (Iran–Oman)'],
        ['Bab-el-Mandeb', 'Red Sea ↔ Gulf of Aden'],
        ['Malacca', 'Andaman Sea ↔ South China Sea (Malaysia–Sumatra)'],
        ['Palk', 'Bay of Bengal ↔ Palk Bay (India–Sri Lanka)'],
        ['Bering', 'Arctic ↔ Pacific (Russia–USA)'],
        ['Dover', 'English Channel ↔ North Sea (UK–France)'],
      ]),
      tbl('Superlatives', [
        ['Largest ocean', 'Pacific'], ['Largest hot desert', 'Sahara'], ['Highest peak', 'Mount Everest, about 8,849 m'],
        ['Largest freshwater lake by area', 'Lake Superior'], ['Deepest lake', 'Baikal (Russia)'],
        ['Longest mountain range on land', 'Andes'], ['Largest island', 'Greenland'],
      ]),
      pts('Lines and grasslands',
        'Durand Line: Afghanistan–Pakistan. McMahon Line: India–China (east). Radcliffe Line: India–Pakistan and India–Bangladesh.',
        '38th parallel: the two Koreas. 49th parallel: much of the USA–Canada border.',
        'Temperate grasslands: Prairies (North America), Pampas (Argentina), Steppes (Eurasia), Veld (South Africa), Downs (Australia).'),
    ],
    traps: ['The Caspian Sea is the largest lake on Earth, but it is salty; Lake Superior is the largest freshwater lake by area.'],
  },

  'gk-environment': {
    notes: [
      tbl('Agreements and what they cover', [
        ['Ramsar (1971)', 'Wetlands'], ['CITES (1973)', 'Trade in endangered species'], ['Montreal Protocol (1987)', 'Ozone-depleting substances'],
        ['Basel Convention (1989)', 'Hazardous waste crossing borders'], ['UNFCCC (1992)', 'Climate change framework (Rio Earth Summit)'],
        ['CBD (1992)', 'Biodiversity'], ['Kyoto Protocol (1997)', 'Emission cuts for developed countries'],
        ['Paris Agreement (2015)', 'Keep warming well below 2 °C and aim for 1.5 °C'],
      ]),
      pts('Protected areas',
        'National parks are stricter than wildlife sanctuaries. Biosphere reserves have a core, a buffer and a transition zone.',
        'Jim Corbett (1936, first named Hailey National Park) is India’s first national park; Nilgiri (1986) was India’s first biosphere reserve.',
        'Project Tiger began in 1973 and Project Elephant in 1992.'),
      pts('Ecology basics',
        'Food chain: producers → primary consumers → secondary consumers, with decomposers recycling everything. About 10% of energy passes up each level.',
        'Biomagnification: toxins such as DDT build up in animals higher up the food chain.',
        'Eutrophication: fertiliser run-off feeds algal blooms that use up the water’s oxygen.'),
    ],
    traps: ['Montreal is about ozone; Kyoto and Paris are about climate.', 'The IUCN publishes the Red List of threatened species.'],
  },

  'gk-physics': {
    notes: [
      tbl('SI units', [
        ['Force', 'newton (N)'], ['Work, energy', 'joule (J)'], ['Power', 'watt (W)'], ['Pressure', 'pascal (Pa)'], ['Frequency', 'hertz (Hz)'],
        ['Charge', 'coulomb (C)'], ['Current', 'ampere (A)'], ['Resistance', 'ohm (Ω)'], ['Temperature', 'kelvin (K)'], ['Luminous intensity', 'candela (cd)'],
      ]),
      pts('Light and sound',
        'Light travels at about 3 × 10⁸ m/s. Sound travels at about 340 m/s in air, faster in water and fastest in solids.',
        'Concave mirrors: shaving mirrors, torches, headlights. Convex mirrors: rear-view mirrors.',
        'Total internal reflection: optical fibres, the sparkle of diamonds, mirages.',
        'The sky looks blue because air scatters blue light most; the setting Sun looks red for the same reason.'),
      pts('Everyday physics',
        'A pressure cooker cooks faster because higher pressure raises water’s boiling point.',
        'A fuse is a thin wire with a low melting point that breaks the circuit when the current is too high.',
        'Transformers work only on alternating current (AC); they step voltage up or down.',
        'Escape velocity from Earth is about 11.2 km/s.'),
    ],
    traps: ['Mass is the same everywhere; weight changes with gravity (on the Moon it is about one-sixth).', 'The kilowatt-hour measures energy, not power.'],
  },

  'gk-chemistry': {
    notes: [
      tbl('Common names', [
        ['Baking soda', 'Sodium bicarbonate, NaHCO₃'], ['Washing soda', 'Sodium carbonate, Na₂CO₃·10H₂O'], ['Bleaching powder', 'Calcium oxychloride, CaOCl₂'],
        ['Plaster of Paris', 'CaSO₄·½H₂O'], ['Gypsum', 'CaSO₄·2H₂O'], ['Quicklime / slaked lime', 'CaO / Ca(OH)₂'], ['Laughing gas', 'Nitrous oxide, N₂O'], ['Dry ice', 'Solid CO₂'],
      ]),
      pts('Acids, bases and pH',
        'pH below 7 is acidic, 7 is neutral, above 7 is basic.',
        'Natural acids: citric (lemon), acetic (vinegar), lactic (curd), tartaric (tamarind), oxalic (tomato), formic (ant sting).',
        'Antacids such as milk of magnesia, Mg(OH)₂, neutralise excess stomach acid.'),
      pts('Elements and gases',
        'The most abundant element in the Earth’s crust is oxygen; the most abundant metal is aluminium.',
        'Galvanising coats iron with zinc to stop rust.',
        'Noble gases: helium (balloons), neon (signs), argon (filling bulbs).',
        'Ozone is O₃; CFCs from old refrigerants and sprays damage the ozone layer.'),
    ],
    traps: ['Baking soda and washing soda are different compounds.', 'Hydrogen is the lightest gas, but balloons use helium because it does not burn.'],
  },

  'gk-biology': {
    notes: [
      tbl('Vitamins and deficiencies', [
        ['A', 'Night blindness'], ['B1 (thiamine)', 'Beriberi'], ['B3 (niacin)', 'Pellagra'], ['B12', 'Pernicious anaemia'],
        ['C', 'Scurvy'], ['D', 'Rickets in children, osteomalacia in adults'], ['K', 'Blood fails to clot properly'],
      ]),
      tbl('Diseases and what causes them', [
        ['Bacteria', 'Tuberculosis, cholera, typhoid, tetanus, diphtheria, leprosy'],
        ['Viruses', 'Influenza, measles, polio, rabies, dengue, hepatitis, AIDS, COVID-19'],
        ['Protozoa', 'Malaria (Plasmodium), amoebic dysentery, kala-azar (Leishmania)'],
        ['Fungi', 'Ringworm, athlete’s foot'],
      ]),
      pts('The human body',
        'Red blood cells carry oxygen (haemoglobin); white blood cells fight infection; platelets help blood clot.',
        'Largest gland: liver. Largest organ: skin. Longest bone: femur. Smallest bone: stapes, in the ear.',
        'Insulin (pancreas) lowers blood sugar; thyroxine (thyroid) controls metabolism; adrenaline (adrenal glands) prepares the body for “fight or flight”.'),
    ],
    traps: ['Universal donor: O negative. Universal recipient: AB positive.', 'Antibiotics work against bacteria, not viruses.'],
  },

  'gk-defence': {
    notes: [
      tbl('Equivalent ranks: Army · Navy · Air Force', [
        ['Lieutenant', 'Sub Lieutenant · Flying Officer'], ['Captain', 'Lieutenant · Flight Lieutenant'],
        ['Major', 'Lieutenant Commander · Squadron Leader'], ['Lieutenant Colonel', 'Commander · Wing Commander'],
        ['Colonel', 'Captain · Group Captain'], ['Brigadier', 'Commodore · Air Commodore'],
        ['Major General', 'Rear Admiral · Air Vice Marshal'], ['Lieutenant General', 'Vice Admiral · Air Marshal'],
        ['General', 'Admiral · Air Chief Marshal'],
      ]),
      tbl('Where officers train', [
        ['NDA', 'Khadakwasla, Pune (all three services)'], ['IMA', 'Dehradun (Army)'], ['OTA', 'Chennai (Army, short service)'],
        ['INA', 'Ezhimala, Kerala (Navy)'], ['AFA', 'Dundigal, Hyderabad (Air Force)'],
      ]),
      pts('Missiles',
        'Agni: long-range ballistic. Prithvi: short-range ballistic. BrahMos: supersonic cruise (India–Russia). Akash: surface-to-air. Nag: anti-tank. Astra: air-to-air.',
        'The Integrated Guided Missile Development Programme (1983) was led by Dr A. P. J. Abdul Kalam.'),
      tbl('Days and gallantry awards', [
        ['15 January', 'Army Day'], ['8 October', 'Air Force Day'], ['4 December', 'Navy Day'], ['7 December', 'Armed Forces Flag Day'],
        ['26 July', 'Kargil Vijay Diwas'], ['Wartime gallantry', 'Param Vir Chakra → Maha Vir Chakra → Vir Chakra'],
        ['Peacetime gallantry', 'Ashoka Chakra → Kirti Chakra → Shaurya Chakra'],
      ]),
    ],
    traps: [
      'A Navy Captain equals an Army Colonel, not an Army Captain.',
      'Exercise names and partner countries change every year: keep them in your current-affairs notes.',
    ],
  },

  'gk-sports': {
    notes: [
      tbl('Trophies and their sports', [
        ['Durand Cup, Santosh Trophy', 'Football'], ['Ranji Trophy, Duleep Trophy', 'Cricket'], ['Thomas Cup / Uber Cup', 'Badminton, men / women'],
        ['Davis Cup', 'Tennis'], ['Ryder Cup', 'Golf'], ['Beighton Cup, Aga Khan Cup', 'Hockey'],
      ]),
      tbl('National awards', [
        ['Major Dhyan Chand Khel Ratna', 'India’s highest sporting honour'], ['Arjuna Award', 'Outstanding sportspersons'],
        ['Dronacharya Award', 'Coaches'], ['Bharat Ratna (1954)', 'Highest civilian award'],
        ['Padma Vibhushan → Padma Bhushan → Padma Shri', 'Civilian awards, announced on the eve of Republic Day'],
      ]),
      pts('India at the Olympics',
        'First individual Olympic gold: Abhinav Bindra, shooting, Beijing 2008. Neeraj Chopra won javelin gold at Tokyo 2020.',
        'India has won 8 Olympic golds in men’s hockey, the last at Moscow 1980.'),
    ],
    traps: ['The Thomas Cup is men’s badminton; the Uber Cup is women’s.'],
  },

  'gk-current': {
    notes: [
      pts('How to cover current affairs',
        'Daily: 20–30 minutes on the News page or a newspaper. Note only exam-type facts: who, what, where, the numbers, and why it matters.',
        'Link each item to static GK: a new Ramsar site → wetlands; a missile test → DRDO and missile types; a summit → the grouping and its members.',
        'Weekly: read your recap and turn the key facts into revision cards. Monthly: skim a compilation.',
        'The last 6–12 months before the exam matter most.'),
      tbl('Groupings to know (membership changes: check the latest)', [
        ['BRICS', 'Brazil, Russia, India, China and South Africa, plus members added since 2024'],
        ['Quad', 'India, the USA, Japan and Australia'],
        ['SCO', 'Secretariat in Beijing; India a full member since 2017'],
        ['G20', '19 countries plus the European Union and the African Union'],
        ['SAARC', 'Eight South Asian countries; secretariat in Kathmandu'],
      ]),
    ],
    traps: ['Don’t memorise every number: focus on names, places, firsts and records.'],
  },

  // ── Reasoning: methods ──
  'rsn-verbal': {
    notes: [
      pts('Coding–decoding',
        'Write the alphabet positions (A 1 … Z 26). Opposite letters add up to 27 (A↔Z, M↔N).',
        'Work out the rule from the first two letters (+1, −2, reversed, opposite), then check it on the rest.'),
      pts('Blood relations and directions',
        'Draw a family tree: + for male, − for female, a horizontal line for siblings, a vertical line for each generation.',
        'Draw every turn in a direction question: right = 90° clockwise, left = 90° anticlockwise. Use Pythagoras for the straight-line distance (3 and 4 → 5).',
        'Shadows: in the morning the Sun is in the east, so shadows fall west; in the evening they fall east.'),
      pts('Ranking, syllogisms and clocks',
        'Total = position from the left + position from the right − 1.',
        'Syllogisms: draw Venn diagrams. A conclusion follows only if it is true in every possible diagram. “Some” means at least one, possibly all.',
        'Clock angle = |30H − 5.5M|; if it is over 180°, subtract it from 360°.'),
    ],
    traps: ['In syllogisms, use only the statements given, never your general knowledge.'],
  },
  'rsn-series': {
    notes: [
      pts('Number series: check in this order',
        'Differences between terms (and differences of the differences).',
        'Ratios (× 2, × 3) and patterns like × n + c.',
        'Squares, cubes and primes.',
        'Two series interleaved (odd and even positions).'),
      pts('Letters, analogies, odd one out',
        'Turn letters into numbers and look for the pattern in the jumps.',
        'Analogies: say the relationship as a sentence (“a doctor works in a hospital”), then apply it to the second pair.',
        'Odd one out: find what three of them share: type, use, a number property (prime, square) or category.'),
    ],
    traps: ['Check the pattern on every term, not just the first two.'],
  },
  'rsn-spatial': {
    notes: [
      pts('Mirror and water images',
        'In a mirror placed to the side, left and right swap. In a water image, top and bottom swap.',
        'Clock in a mirror: actual time = 11:60 − the time shown. If that comes out negative, use 23:60 instead.'),
      pts('Cubes and dice',
        'A painted cube cut into n × n × n small cubes: 3 faces painted = 8 (corners); 2 faces = 12(n − 2); 1 face = 6(n − 2)²; none = (n − 2)³.',
        'On a standard die, opposite faces add up to 7.'),
      pts('Counting and folding',
        'Count figures systematically: single pieces first, then pairs, then bigger combinations.',
        'Each fold doubles the layers, so one punch through k folds makes 2ᵏ holes.'),
    ],
    traps: ['Embedded figures and figure matrices need drawings: practise them in R. S. Aggarwal and the AFCAT official mock.'],
  },
}
