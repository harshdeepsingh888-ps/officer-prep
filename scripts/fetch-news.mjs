// Builds public/news/latest.json: exam-relevant headlines from publishers' RSS feeds, sorted into categories.
// Runs in the deploy workflow twice a day; `npm run news` runs it locally. Only titles, a short summary and the
// link are kept: every headline links back to the publisher's article.
//
// PIB blocks automated requests, and Indian Express blocks GitHub's servers, so neither is fetched here;
// the app links to PIB and other official sources for reading in the browser.

import { mkdir, readFile, writeFile } from 'node:fs/promises'

const OUT = new URL('../public/news/latest.json', import.meta.url)
const KEEP_DAYS = 10
const UA = 'OfficerPrep/1.0 (personal study app; +https://github.com/harshdeepsingh888-ps/officer-prep)'

// desk: where the feed's items go unless a rule moves them (e.g. a national story about the Navy → defence).
const SOURCES = [
  { source: 'The Hindu', desk: 'national', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
  { source: 'The Hindu', desk: 'international', url: 'https://www.thehindu.com/news/international/feeder/default.rss' },
  { source: 'The Hindu', desk: 'economy', url: 'https://www.thehindu.com/business/Economy/feeder/default.rss' },
  { source: 'The Hindu', desk: 'science', url: 'https://www.thehindu.com/sci-tech/feeder/default.rss' },
  { source: 'The Hindu', desk: 'environment', url: 'https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss' },
  { source: 'The Hindu', desk: 'sports', url: 'https://www.thehindu.com/sport/feeder/default.rss' },
  { source: 'The Hindu', desk: 'editorial', url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss' },
]

// Most headlines a category keeps per day, best first.
const CAP = { national: 15, international: 12, defence: 15, economy: 10, science: 8, environment: 8, sports: 8, appointments: 8, editorial: 6 }

// India context: international, economy and science stories that involve India rank first.
const INDIA = /\b(india|indian|indians|new delhi|modi|jaishankar|rajnath)\b/i
// Weapon names like Akash, Agni or Tejas are also people's and trains' names, so they only count next to "missile" etc.
const DEFENCE = /\b(army|navy|naval|air force|iaf|drdo|missiles?|defence|defense|military|armed forces|soldiers?|troops|warships?|frigate|destroyer|submarines?|fighter jets?|rafale|brahmos|coast guard|bsf|crpf|itbp|cisf|assam rifles|chief of defence staff|line of control|line of actual control|joint exercise|military exercise|wargames?)\b/i
const WARSHIP = /\bINS [A-Z][a-z]+/ // INS Vikrant, INS Arighaat …
const APPOINTMENT = /\b(appointed|appointment|takes (over|charge)|sworn in|new chief|named (as )?(the )?(new )?(chief|head|president|chairman)|nobel|bharat ratna|padma|gallantry|award(ed|s)? (for|to)|honoured with|prize)\b/i
// Union-level subjects. A state or local story only counts as national news if it involves one of these.
const NATIONAL = /\b(supreme court|parliament|lok sabha|rajya sabha|union cabinet|cabinet (approves|nod)|central government|union government|centre|prime minister|president (droupadi )?murmu|vice-president|election commission|niti aayog|rbi|reserve bank|isro|census|scheme|yojana|national mission|bill|ordinance|union minister|governor|chief justice)\b/i
const NOISE = /\b(murder|murdered|rape|raped|arrested|held for|gang|robbery|theft|stabbed|dowry|road accident|drowned|suicide|horoscope|recipe|bollywood|box office|trailer|celebrity|marries|wedding)\b/i
const SPORT_KEEP = /\b(india|indian|olympic|paralympic|asian games|commonwealth|world cup|world championships?|grand slam|wimbledon|medal|gold|title|record|khelo|fifa|icc|bcci)\b/i
const MARKETS = /\b(shares?|stocks?|sensex|nifty|ipo|revenue|profit|market value|earnings)\b/i

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, '’').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/�/g, '’') // a stray Windows apostrophe in some feeds
  .replace(/\s+/g, ' ')
  .trim()

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decode(m[1]) : ''
}

/** Category and exam-relevance score for an item, or null to leave it out. */
function categorise({ source, desk }, title, summary, feedCategories) {
  const text = `${title} ${summary}`
  const india = INDIA.test(text)
  const national = NATIONAL.test(text)
  // Defence news is about India's forces: national stories, or foreign ones that mention India. Never sports teams.
  const defence = desk !== 'sports' && (DEFENCE.test(text) || WARSHIP.test(text)) && (desk === 'national' || india)
  if (NOISE.test(title) && !defence) return null

  let category
  let score = 0
  if (desk === 'editorial') category = 'editorial' // the paper's view on the day's big issues: essay material
  else if (defence) { category = 'defence'; score += 2 }
  else if (APPOINTMENT.test(title) && (desk === 'international' || national)) category = 'appointments'
  else if (desk === 'national') {
    // The Hindu files Union-level stories under "India"; anything else needs a national hook.
    const unionDesk = source === 'The Hindu' && feedCategories.some(c => /^india$/i.test(c))
    if (!unionDesk && !national) return null
    category = 'national'
  } else if (desk === 'sports') {
    if (!SPORT_KEEP.test(text)) return null
    category = 'sports'
  } else if (desk === 'science' && MARKETS.test(title)) return null
  else category = desk

  if (national) score += 2
  if (india && desk !== 'national') score += 2
  if (/\|\s*explained\b/i.test(title) || /^(what|why|how) /i.test(title)) score += 2 // explainers are the best revision material
  if (/\|\s*live\b/i.test(title)) score -= 2
  return { category, score }
}

async function fetchFeed(src) {
  const res = await fetch(src.url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5' }, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  const items = []
  for (const [, body] of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const title = tag(body, 'title')
    const link = tag(body, 'link')
    if (!title || !/^https:\/\//.test(link)) continue
    const summary = tag(body, 'description').slice(0, 280)
    const feedCategories = [...body.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map(m => decode(m[1]))
    const kept = categorise(src, title, summary, feedCategories)
    if (!kept) continue
    const when = new Date(tag(body, 'pubDate'))
    items.push({ title, summary, link, source: src.source, ...kept, published: isNaN(when) ? new Date().toISOString() : when.toISOString() })
  }
  return items
}

async function previous() {
  try { return JSON.parse(await readFile(OUT, 'utf8')).items ?? [] } catch { return [] }
}

const results = await Promise.allSettled(SOURCES.map(fetchFeed))
const fresh = []
results.forEach((r, i) => {
  const s = SOURCES[i]
  if (r.status === 'fulfilled') { fresh.push(...r.value); console.log(`${s.source} ${s.desk}: ${r.value.length} relevant`) }
  else console.warn(`${s.source} ${s.desk}: failed (${r.reason?.message ?? r.reason})`)
})

// Merge with the copy already on the site (CI downloads it first), so older days survive a feed's rolling window.
const cutoff = Date.now() - KEEP_DAYS * 86_400_000
const byLink = new Map()
for (const item of [...(await previous()), ...fresh]) byLink.set(item.link, item) // newer copies win
const istDay = iso => new Date(Date.parse(iso) + 330 * 60_000).toISOString().slice(0, 10)
const groups = new Map()
for (const item of byLink.values()) {
  if (Date.parse(item.published) < cutoff) continue
  const key = `${istDay(item.published)}|${item.category}`
  groups.set(key, [...(groups.get(key) ?? []), item])
}
const items = [...groups.entries()]
  .flatMap(([key, list]) => list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.published.localeCompare(a.published)).slice(0, CAP[key.split('|')[1]] ?? 8))
  .sort((a, b) => b.published.localeCompare(a.published))

await mkdir(new URL('.', OUT), { recursive: true })
await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sources: [...new Set(items.map(i => i.source))], items }))
console.log(`Wrote ${items.length} headlines (${fresh.length} relevant fetched now) to public/news/latest.json`)
