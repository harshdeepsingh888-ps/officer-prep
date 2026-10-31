import type { ExamId } from './exams'
import type { Difficulty, Question } from './questions'

// Question generators: templates with random numbers whose answers are calculated, so Maths and Reasoning
// practice never runs out and is always right. Every question explains its working. Topics match the
// study guides, so generated questions join topic tests, "Practise this topic", quizzes and mocks.

type Made = { text: string; options: string[]; answer: number; explanation: string }
type Gen = { id: string; subject: 'Mathematics' | 'Reasoning'; topic: string; difficulty: Difficulty; make: () => Made }

const MATHS_EXAMS: ExamId[] = ['cds', 'afcat', 'icg', 'capf', 'cse']
const REASONING_EXAMS: ExamId[] = ['afcat', 'capf', 'icg', 'cse']
const examsOf = (g: Gen) => (g.subject === 'Mathematics' ? MATHS_EXAMS : REASONING_EXAMS)

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]
const r2 = (n: number) => Math.round(n * 100) / 100
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b
const shuffle = <T,>(xs: T[]) => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉'
const sup = (n: number) => String(n).replace(/\d/g, d => SUP[+d])
const sub = (n: number) => String(n).replace(/\d/g, d => SUB[+d])
const frac = (n: number, d: number) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}` }
const pad = (n: number) => String(n).padStart(2, '0')
const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** The answer plus three different positive wrong values, in ascending order as exam papers print them. */
function nums(answer: number, wrong: number[], fmt: (n: number) => string = String) {
  const a = r2(answer)
  const seen = new Set([a])
  const out: number[] = []
  const add = (v: number) => {
    const x = r2(v)
    if (out.length < 3 && Number.isFinite(x) && x > 0 && !seen.has(x)) { seen.add(x); out.push(x) }
  }
  wrong.forEach(add)
  const step = Math.max(1, Math.round(Math.abs(a) / 10))
  for (let k = 1; out.length < 3; k++) { add(a + step * k); add(a - step * k) }
  const all = [a, ...out].sort((x, y) => x - y)
  return { options: all.map(fmt), answer: all.indexOf(a) }
}

/** The right text answer and three different wrong ones, in random order. */
function texts(right: string, wrong: string[]) {
  const others = [...new Set(wrong)].filter(w => w !== right).slice(0, 3)
  const all = shuffle([right, ...others])
  return { options: all, answer: all.indexOf(right) }
}

const M = (id: string, topic: string, difficulty: Difficulty, make: () => Made): Gen => ({ id, subject: 'Mathematics', topic, difficulty, make })
const R = (id: string, topic: string, difficulty: Difficulty, make: () => Made): Gen => ({ id, subject: 'Reasoning', topic, difficulty, make })
const SERIES = 'Analogy, classification & series'
const VERBAL = 'Verbal reasoning'
const SPATIAL = 'Spatial & figure reasoning'

export const GENERATORS: Gen[] = [
  // ── Percentage ──
  M('pct-of', 'Percentage', 1, () => {
    const p = pick([5, 10, 12.5, 15, 20, 25, 30, 35, 40, 45, 60, 75]), n = ri(2, 40) * 40, ans = (p * n) / 100
    return { text: `What is ${p}% of ${n}?`, ...nums(ans, [ans + n / 20, ans - n / 20, ((p + 10) * n) / 100]), explanation: `${p}% of ${n} = ${p}/100 × ${n} = ${ans}.` }
  }),
  M('pct-change', 'Percentage', 2, () => {
    const p = pick([10, 20, 25, 40, 50, 60]), a = ri(2, 30) * 20, b = a + (a * p) / 100, onNew = r2(((b - a) / b) * 100)
    return {
      text: `The price of an item rises from ${rupees(a)} to ${rupees(b)}. By what percentage did it rise?`,
      ...nums(p, [onNew, p + 5, p - 5], n => `${n}%`),
      explanation: `The rise is ${rupees(b - a)}. As a share of the original price: ${b - a} ÷ ${a} × 100 = ${p}%. (Dividing by the new price, ${onNew}%, is the usual mistake.)`,
    }
  }),
  M('pct-successive', 'Percentage', 2, () => {
    const x = pick([10, 20, 30, 40, 50]), loss = (x * x) / 100
    return {
      text: `A price is first increased by ${x}% and then decreased by ${x}%. What is the net change?`,
      ...texts(`${loss}% decrease`, ['No change', `${loss}% increase`, `${2 * x}% decrease`]),
      explanation: `Net change = +${x} − ${x} − (${x} × ${x})/100 = −${loss}%, a ${loss}% decrease.`,
    }
  }),
  M('pct-exam', 'Percentage', 3, () => {
    const total = ri(2, 10) * 100, p = pick([30, 33, 35, 40]), pass = (total * p) / 100, fail = ri(5, 30), got = pass - fail
    return {
      text: `A candidate needs ${p}% of the maximum marks to pass, scores ${got} marks and fails by ${fail} marks. What are the maximum marks?`,
      ...nums(total, [total + 100, total - 100, total + 50]),
      explanation: `Pass mark = ${got} + ${fail} = ${pass}, which is ${p}% of the maximum: ${pass} ÷ ${p} × 100 = ${total}.`,
    }
  }),

  // ── Profit & loss ──
  M('pl-sp', 'Profit & loss', 1, () => {
    const cp = ri(4, 50) * 20, p = pick([5, 10, 15, 20, 25, 30, 40]), gain = (cp * p) / 100, sp = cp + gain
    return {
      text: `An article bought for ${rupees(cp)} is sold at a profit of ${p}%. What is the selling price?`,
      ...nums(sp, [cp - gain, cp + p, sp + cp / 10], rupees),
      explanation: `Selling price = cost × (100 + ${p})/100 = ${cp} × ${100 + p}/100 = ${rupees(sp)}.`,
    }
  }),
  M('pl-percent', 'Profit & loss', 2, () => {
    const cp = ri(2, 20) * 100, p = pick([5, 10, 20, 25, -5, -10, -20, -25]), sp = cp + (cp * p) / 100
    const word = p > 0 ? 'profit' : 'loss', other = p > 0 ? 'loss' : 'profit', a = Math.abs(p), diff = Math.abs(sp - cp)
    const onSp = r2((diff / sp) * 100)
    return {
      text: `An article is bought for ${rupees(cp)} and sold for ${rupees(sp)}. What is the profit or loss per cent?`,
      ...texts(`${a}% ${word}`, [`${a}% ${other}`, `${onSp}% ${word}`, `${a + 5}% ${word}`, `${a + 10}% ${word}`, `${Math.max(1, a - 5)}% ${word}`]),
      explanation: `${word === 'profit' ? 'Profit' : 'Loss'} = ${rupees(diff)}; as a share of the cost price: ${diff} ÷ ${cp} × 100 = ${a}% ${word}.`,
    }
  }),
  M('pl-discount', 'Profit & loss', 1, () => {
    const mp = ri(3, 50) * 100, d = pick([5, 10, 15, 20, 25, 30]), off = (mp * d) / 100, sp = mp - off
    return {
      text: `An item marked at ${rupees(mp)} is sold at a discount of ${d}%. What is the selling price?`,
      ...nums(sp, [mp + off, mp - d, sp - mp / 20], rupees),
      explanation: `Discount = ${d}% of ${mp} = ${rupees(off)}; selling price = ${mp} − ${off} = ${rupees(sp)}.`,
    }
  }),
  M('pl-markup', 'Profit & loss', 3, () => {
    const [up, off] = pick([[20, 10], [25, 20], [50, 20], [40, 25], [30, 10], [20, 20], [60, 25], [50, 30]] as const)
    const net = ((100 + up) * (100 - off)) / 100 - 100
    const right = net === 0 ? 'No profit, no loss' : `${Math.abs(net)}% ${net > 0 ? 'profit' : 'loss'}`
    return {
      text: `A shopkeeper marks goods ${up}% above cost price and gives a discount of ${off}%. What is the profit or loss per cent?`,
      ...texts(right, [`${Math.abs(up - off) || 5}% profit`, `${Math.abs(net) + 2}% profit`, 'No profit, no loss', `${up}% profit`, `${Math.abs(net) || 4}% loss`]),
      explanation: `Take the cost as 100. Marked price = ${100 + up}; after ${off}% off it sells for ${(100 + up) * (100 - off) / 100}. Result: ${right.toLowerCase()}.`,
    }
  }),

  // ── Interest ──
  M('si', 'Simple & compound interest', 1, () => {
    const p = ri(5, 100) * 100, r = ri(4, 12), t = ri(2, 6), si = (p * r * t) / 100, year = (p * r) / 100
    return {
      text: `What is the simple interest on ${rupees(p)} at ${r}% a year for ${t} years?`,
      ...nums(si, [year, si + year, si * 2], rupees),
      explanation: `SI = P × R × T / 100 = ${p} × ${r} × ${t} / 100 = ${rupees(si)}.`,
    }
  }),
  M('ci', 'Simple & compound interest', 2, () => {
    const r = pick([5, 10, 20]), p = ri(2, 25) * 400, amount = Math.round(p * (1 + r / 100) ** 2), ci = amount - p, si = (2 * p * r) / 100
    return {
      text: `What is the compound interest on ${rupees(p)} at ${r}% a year for 2 years, compounded yearly?`,
      ...nums(ci, [si, amount, ci + (p * r) / 100], rupees),
      explanation: `Amount = ${p} × (1 + ${r}/100)² = ${rupees(amount)}; CI = amount − principal = ${rupees(ci)}. (Simple interest would be ${rupees(si)}.)`,
    }
  }),
  M('ci-si-diff', 'Simple & compound interest', 3, () => {
    const r = pick([4, 5, 10]), d = ri(5, 60), p = (d * 10000) / (r * r)
    return {
      text: `The difference between compound and simple interest on a sum for 2 years at ${r}% a year is ${rupees(d)}. What is the sum?`,
      ...nums(p, [p / 2, p * 2, p + p / 4], rupees),
      explanation: `For 2 years, CI − SI = P × (R/100)², so P = ${d} × (100/${r})² = ${rupees(p)}.`,
    }
  }),

  // ── Ratio & proportion, ages ──
  M('ratio-share', 'Ratio & proportion', 1, () => {
    const [a, b] = pick([[2, 3], [3, 4], [3, 5], [4, 5], [5, 7], [2, 5], [5, 8], [7, 9]] as const), k = ri(5, 60) * 10, total = (a + b) * k
    return {
      text: `${rupees(total)} is divided between A and B in the ratio ${a} : ${b}. What is B’s share?`,
      ...nums(b * k, [a * k, total / 2, b * k + k], rupees),
      explanation: `B gets ${b}/${a + b} of ${total} = ${rupees(b * k)}.`,
    }
  }),
  M('ratio-ages', 'Ratio & proportion', 3, () => {
    const [a, b] = pick([[3, 5], [2, 3], [4, 7], [5, 8], [3, 4], [5, 6]] as const), k = ri(2, 8), t = ri(2, 10)
    const g = gcd(a * k + t, b * k + t), c = (a * k + t) / g, d = (b * k + t) / g
    return {
      text: `The present ages of A and B are in the ratio ${a} : ${b}. After ${t} years the ratio will be ${c} : ${d}. What is A’s present age in years?`,
      ...nums(a * k, [b * k, a * k + t, a * (k + 1)]),
      explanation: `Let the ages be ${a}x and ${b}x. (${a}x + ${t}) : (${b}x + ${t}) = ${c} : ${d} gives x = ${k}, so A is ${a * k} years old.`,
    }
  }),

  // ── Average ──
  M('avg-added', 'Average', 2, () => {
    const n = ri(4, 12), a = ri(20, 60), b = a + ri(1, 5), x = (n + 1) * b - n * a
    return {
      text: `The average of ${n} numbers is ${a}. When one more number is added, the average becomes ${b}. What number was added?`,
      ...nums(x, [b, x - (b - a), x + n]),
      explanation: `New total − old total = ${n + 1} × ${b} − ${n} × ${a} = ${(n + 1) * b} − ${n * a} = ${x}.`,
    }
  }),
  M('avg-consecutive', 'Average', 1, () => {
    const avg = ri(10, 60) * 2
    return {
      text: `The average of five consecutive even numbers is ${avg}. What is the largest of them?`,
      ...nums(avg + 4, [avg + 2, avg + 6, avg + 8]),
      explanation: `They are ${avg - 4}, ${avg - 2}, ${avg}, ${avg + 2} and ${avg + 4}; the middle one equals the average.`,
    }
  }),

  // ── Time & work ──
  M('work-together', 'Time & work', 1, () => {
    const [a, b] = pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [15, 30], [20, 30], [18, 36], [24, 40], [30, 60], [36, 45], [12, 36]] as const), t = (a * b) / (a + b)
    return {
      text: `A can finish a job in ${a} days and B in ${b} days. Working together, how many days will they take?`,
      ...nums(t, [(a + b) / 2, b - a, t + 2]),
      explanation: `Each day they do 1/${a} + 1/${b} = ${a + b}/${a * b} of the job, so together they take ${a * b}/${a + b} = ${t} days.`,
    }
  }),
  M('pipes', 'Time & work', 2, () => {
    const [a, b] = pick([[2, 3], [3, 4], [4, 6], [6, 8], [5, 10], [10, 15], [12, 18], [4, 12]] as const), t = (a * b) / (b - a)
    return {
      text: `One pipe fills a tank in ${a} hours and another empties it in ${b} hours. If both are opened on an empty tank, how many hours will it take to fill?`,
      ...nums(t, [(a * b) / (a + b), b - a, t * 2]),
      explanation: `Net filling per hour = 1/${a} − 1/${b} = ${b - a}/${a * b}, so the tank fills in ${a * b}/${b - a} = ${t} hours.`,
    }
  }),

  // ── Time, speed & distance ──
  M('kmph-ms', 'Time, speed & distance', 1, () => {
    const kmh = pick([18, 36, 54, 72, 90, 108, 126, 144]), ms = (kmh * 5) / 18
    return {
      text: `${kmh} km/h is how many metres per second?`,
      ...nums(ms, [kmh / 2, ms + 5, (kmh * 18) / 5]),
      explanation: `Multiply by 5/18: ${kmh} × 5/18 = ${ms} m/s.`,
    }
  }),
  M('train-pole', 'Time, speed & distance', 2, () => {
    const kmh = pick([36, 54, 72, 90, 108]), v = (kmh * 5) / 18, t = ri(6, 20), len = v * t
    return {
      text: `A train ${len} m long runs at ${kmh} km/h. How many seconds does it take to pass a pole?`,
      ...nums(t, [t + 2, t - 2, len / kmh]),
      explanation: `Speed = ${kmh} × 5/18 = ${v} m/s. Time = length ÷ speed = ${len} ÷ ${v} = ${t} s.`,
    }
  }),
  M('train-platform', 'Time, speed & distance', 3, () => {
    const kmh = pick([36, 54, 72, 90]), v = (kmh * 5) / 18, t = ri(15, 40), total = v * t
    const len = ri(Math.round(total * 0.3), Math.round(total * 0.6)), plat = total - len
    return {
      text: `A train ${len} m long, running at ${kmh} km/h, crosses a platform ${plat} m long. How many seconds does it take?`,
      ...nums(t, [Math.round(len / v), Math.round(plat / v), t + 5]),
      explanation: `It covers its own length plus the platform: ${len} + ${plat} = ${total} m at ${v} m/s, which takes ${t} s.`,
    }
  }),
  M('avg-speed', 'Time, speed & distance', 2, () => {
    const [a, b] = pick([[30, 60], [40, 60], [20, 30], [60, 90], [45, 90], [12, 24], [36, 45], [10, 15]] as const), avg = (2 * a * b) / (a + b)
    return {
      text: `A convoy drives to a camp at ${a} km/h and returns along the same road at ${b} km/h. What is the average speed for the whole journey?`,
      ...nums(avg, [(a + b) / 2, avg + 4, avg - 4], n => `${n} km/h`),
      explanation: `The two distances are equal, so average speed = 2ab/(a + b) = 2 × ${a} × ${b}/${a + b} = ${avg} km/h (not the simple average, ${(a + b) / 2}).`,
    }
  }),
  M('relative-speed', 'Time, speed & distance', 3, () => {
    const sum = pick([72, 90, 108, 126, 144]), x = ri(30, sum - 31), y = sum - x, v = (sum * 5) / 18, t = ri(8, 20), total = v * t
    const l1 = ri(Math.round(total * 0.35), Math.round(total * 0.65)), l2 = total - l1
    return {
      text: `Two trains ${l1} m and ${l2} m long run towards each other on parallel tracks at ${x} km/h and ${y} km/h. How many seconds do they take to pass each other completely?`,
      ...nums(t, [t + 3, t - 3, t * 2]),
      explanation: `Running towards each other, the relative speed is ${x} + ${y} = ${sum} km/h = ${v} m/s. They must cover ${l1} + ${l2} = ${total} m, which takes ${t} s.`,
    }
  }),

  // ── Number system, HCF & LCM ──
  M('hcf-lcm', 'HCF & LCM', 2, () => {
    const h = ri(2, 12)
    let m = 2, n = 3
    do { m = ri(2, 9); n = ri(2, 9) } while (gcd(m, n) !== 1 || m === n)
    const a = h * m, b = h * n, l = h * m * n
    return {
      text: `The HCF of two numbers is ${h} and their LCM is ${l}. If one of them is ${a}, what is the other?`,
      ...nums(b, [m * n, a + h, b + h]),
      explanation: `HCF × LCM = the product of the two numbers, so the other is ${h} × ${l} ÷ ${a} = ${b}.`,
    }
  }),
  M('bells', 'HCF & LCM', 1, () => {
    let xs = [4, 6, 8], L = 24
    do { xs = [ri(2, 8), ri(6, 15), ri(10, 24)]; L = xs.reduce(lcm) } while (new Set(xs).size < 3 || L < 30 || L > 360)
    return {
      text: `Three bells ring at intervals of ${xs.join(', ')} minutes. If they ring together now, after how many minutes will they next ring together?`,
      ...nums(L, [xs[0] + xs[1] + xs[2], Math.max(...xs) * 2, L / 2]),
      explanation: `They next ring together after LCM(${xs.join(', ')}) = ${L} minutes.`,
    }
  }),
  M('unit-digit', 'Number system', 2, () => {
    const CYCLES: Record<number, number[]> = { 2: [2, 4, 8, 6], 3: [3, 9, 7, 1], 7: [7, 9, 3, 1], 8: [8, 4, 2, 6], 4: [4, 6], 9: [9, 1] }
    const base = pick([2, 3, 7, 8, 4, 9]), e = ri(21, 99), cyc = CYCLES[base], d = cyc[(e - 1) % cyc.length]
    const wrong = [...cyc, 0, 1, 5, 3, 7].filter(x => x !== d).map(String)
    return {
      text: `What is the unit digit of ${base}${sup(e)}?`,
      ...texts(String(d), wrong),
      explanation: `The unit digits of powers of ${base} repeat every ${cyc.length}: ${cyc.join(', ')}. ${e} ÷ ${cyc.length} leaves remainder ${e % cyc.length} (0 means the last in the cycle), so the unit digit is ${d}.`,
    }
  }),
  M('largest-divisible', 'Number system', 1, () => {
    const d = ri(13, 97), ans = Math.floor(9999 / d) * d
    return {
      text: `What is the largest four-digit number exactly divisible by ${d}?`,
      ...nums(ans, [ans - d, 10000 - d, ans + 1]),
      explanation: `9999 ÷ ${d} leaves remainder ${9999 % d}; 9999 − ${9999 % d} = ${ans}.`,
    }
  }),

  // ── Algebra & logarithms ──
  M('linear', 'Algebra', 1, () => {
    const a = ri(2, 9), x = ri(2, 15), b = ri(1, 30), c = a * x - b
    return { text: `If ${a}x − ${b} = ${String(c).replace('-', '−')}, what is x?`, ...nums(x, [x + 1, x - 1, (c - b) / a]), explanation: `${a}x = ${String(c).replace('-', '−')} + ${b} = ${c + b}, so x = ${x}.` }
  }),
  M('sum-product', 'Algebra', 2, () => {
    const x = ri(1, 9), y = ri(1, 9), s = x + y, p = x * y, ans = s * s - 2 * p
    return { text: `If a + b = ${s} and ab = ${p}, what is a² + b²?`, ...nums(ans, [s * s, s * s + 2 * p, s * s - p]), explanation: `a² + b² = (a + b)² − 2ab = ${s * s} − ${2 * p} = ${ans}.` }
  }),
  M('reciprocal', 'Algebra', 2, () => {
    const k = ri(3, 9), ans = k * k - 2
    return { text: `If x + 1/x = ${k}, what is x² + 1/x²?`, ...nums(ans, [k * k, k * k + 2, 2 * k]), explanation: `Square both sides: x² + 2 + 1/x² = ${k * k}, so x² + 1/x² = ${ans}.` }
  }),
  M('log-value', 'Logarithms', 1, () => {
    const b = pick([2, 3, 4, 5, 10]), e = b === 10 ? ri(2, 6) : ri(2, b === 2 ? 8 : 4), n = b ** e
    return { text: `What is log${sub(b)} ${n}?`, ...nums(e, [e + 1, e - 1, n / b]), explanation: `${b}${sup(e)} = ${n}, so log${sub(b)} ${n} = ${e}.` }
  }),
  M('log-rules', 'Logarithms', 2, () => {
    const [a, b] = pick([[2, 50], [4, 25], [5, 20], [8, 125], [20, 50], [25, 40], [4, 250], [125, 80]] as const), ans = Math.round(Math.log10(a * b))
    return {
      text: `What is log ${a} + log ${b}, taking logarithms to base 10?`,
      ...nums(ans, [ans + 1, ans - 1, ans + 2]),
      explanation: `log ${a} + log ${b} = log (${a} × ${b}) = log ${a * b} = ${ans}.`,
    }
  }),

  // ── Trigonometry, heights ──
  M('trig-ratio', 'Trigonometry', 2, () => {
    const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]] as const), ask = pick(['tan', 'cos'] as const)
    const right = ask === 'tan' ? `${a}/${b}` : `${b}/${c}`
    return {
      text: `If sin θ = ${a}/${c} and θ is acute, what is ${ask} θ?`,
      ...texts(right, ask === 'tan' ? [`${b}/${a}`, `${a}/${c}`, `${b}/${c}`] : [`${a}/${c}`, `${c}/${b}`, `${a}/${b}`]),
      explanation: `Opposite = ${a} and hypotenuse = ${c}, so adjacent = √(${c}² − ${a}²) = ${b}. Then ${ask} θ = ${right}.`,
    }
  }),
  M('trig-values', 'Trigonometry', 2, () => {
    const TERMS = [['sin²30°', 1], ['cos²60°', 1], ['sin²45°', 2], ['cos²45°', 2], ['sin²60°', 3], ['cos²30°', 3], ['tan²45°', 4], ['sin²90°', 4], ['cos²0°', 4]] as const
    const chosen = shuffle([...TERMS]).slice(0, 3), q = chosen.reduce((s, t) => s + t[1], 0)
    return {
      text: `What is the value of ${chosen.map(t => t[0]).join(' + ')}?`,
      ...texts(frac(q, 4), [frac(q + 1, 4), frac(q + 2, 4), frac(Math.max(1, q - 1), 4), frac(q + 3, 4)]),
      explanation: `${chosen.map(t => `${t[0]} = ${frac(t[1], 4)}`).join(', ')}. The sum is ${frac(q, 4)}.`,
    }
  }),
  M('heights', 'Heights & distances', 2, () => {
    const angle = pick([30, 45, 60] as const), d = angle === 30 ? ri(1, 5) * 30 : ri(1, 9) * 10
    const right = angle === 45 ? `${d} m` : angle === 60 ? `${d}√3 m` : `${d / 3}√3 m`
    return {
      text: `From a point ${d} m from the foot of a tower, the angle of elevation of its top is ${angle}°. How tall is the tower?`,
      ...texts(right, [`${d}√3 m`, `${d} m`, `${2 * d} m`, `${d / 2} m`]),
      explanation: `tan ${angle}° = height ÷ ${d}, and tan ${angle}° = ${angle === 45 ? '1' : angle === 60 ? '√3' : '1/√3'}, so the height is ${right}.`,
    }
  }),

  // ── Mensuration & geometry ──
  M('circle', 'Mensuration', 1, () => {
    const r = ri(1, 6) * 7, ask = pick(['area', 'circumference'] as const), area = (22 * r * r) / 7, circ = (44 * r) / 7
    const val = ask === 'area' ? area : circ, unit = ask === 'area' ? 'cm²' : 'cm'
    return {
      text: `Taking π = 22/7, what is the ${ask} of a circle of radius ${r} cm?`,
      ...nums(val, [ask === 'area' ? circ : area, val * 2, val / 2], n => `${n} ${unit}`),
      explanation: ask === 'area' ? `Area = πr² = 22/7 × ${r} × ${r} = ${area} cm².` : `Circumference = 2πr = 2 × 22/7 × ${r} = ${circ} cm.`,
    }
  }),
  M('square-diagonal', 'Mensuration', 1, () => {
    const d = ri(2, 20) * 2, area = (d * d) / 2
    return { text: `What is the area of a square whose diagonal is ${d} cm?`, ...nums(area, [d * d, (d * d) / 4, 2 * d], n => `${n} cm²`), explanation: `Area = diagonal² ÷ 2 = ${d * d} ÷ 2 = ${area} cm².` }
  }),
  M('cube', 'Mensuration', 1, () => {
    const a = ri(2, 15), ask = pick(['total surface area', 'volume'] as const), tsa = 6 * a * a, vol = a ** 3
    const val = ask === 'volume' ? vol : tsa, unit = ask === 'volume' ? 'cm³' : 'cm²'
    return {
      text: `What is the ${ask} of a cube with edges of ${a} cm?`,
      ...nums(val, [ask === 'volume' ? tsa : vol, 4 * a * a, val * 2], n => `${n} ${unit}`),
      explanation: ask === 'volume' ? `Volume = a³ = ${a}³ = ${vol} cm³.` : `Total surface area = 6a² = 6 × ${a * a} = ${tsa} cm².`,
    }
  }),
  M('cylinder', 'Mensuration', 2, () => {
    const r = ri(1, 3) * 7, h = ri(2, 20), vol = (22 * r * r * h) / 7, csa = (44 * r * h) / 7
    return {
      text: `Taking π = 22/7, what is the volume of a cylinder of radius ${r} cm and height ${h} cm?`,
      ...nums(vol, [csa, vol * 2, vol / 2], n => `${n} cm³`),
      explanation: `Volume = πr²h = 22/7 × ${r} × ${r} × ${h} = ${vol} cm³.`,
    }
  }),
  M('polygon-angle', 'Geometry', 1, () => {
    const n = pick([5, 6, 8, 9, 10, 12, 15, 18]), ext = 360 / n, ang = 180 - ext
    return {
      text: `What is each interior angle of a regular polygon with ${n} sides?`,
      ...nums(ang, [ext, ang + 10, ang - 10], x => `${x}°`),
      explanation: `Each exterior angle = 360° ÷ ${n} = ${ext}°, so each interior angle = 180° − ${ext}° = ${ang}°.`,
    }
  }),
  M('diagonals', 'Geometry', 2, () => {
    const n = ri(5, 15), d = (n * (n - 3)) / 2
    return { text: `How many diagonals does a polygon with ${n} sides have?`, ...nums(d, [(n * (n - 1)) / 2, n * (n - 3), n]), explanation: `Diagonals = n(n − 3)/2 = ${n} × ${n - 3}/2 = ${d}.` }
  }),

  // ── Statistics ──
  M('mean', 'Statistics', 1, () => {
    const n = ri(5, 7), mean = ri(15, 40)
    let xs: number[] = []
    do { xs = Array.from({ length: n - 1 }, () => ri(mean - 12, mean + 12)); xs.push(n * mean - xs.reduce((s, x) => s + x, 0)) } while (xs[n - 1] <= 0)
    const sorted = [...xs].sort((a, b) => a - b), median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    return { text: `What is the mean of ${xs.join(', ')}?`, ...nums(mean, [median, mean + 2, mean - 2]), explanation: `Sum = ${n * mean}; mean = ${n * mean} ÷ ${n} = ${mean}.` }
  }),
  M('median', 'Statistics', 1, () => {
    const n = pick([5, 6, 7, 8]), set = new Set<number>()
    while (set.size < n) set.add(ri(1, 60))
    const xs = shuffle([...set]), sorted = [...xs].sort((a, b) => a - b)
    const odd = n % 2 === 1, med = odd ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    return {
      text: `What is the median of ${xs.join(', ')}?`,
      ...nums(med, [xs[Math.floor(n / 2)], r2(xs.reduce((s, x) => s + x, 0) / n), (sorted[0] + sorted[n - 1]) / 2]),
      explanation: `In order: ${sorted.join(', ')}. The median is ${odd ? 'the middle value' : 'the average of the two middle values'}: ${med}.`,
    }
  }),

  // ── Reasoning: series and analogies ──
  R('series-arith', SERIES, 1, () => {
    const a = ri(2, 30), d = ri(3, 15), t = Array.from({ length: 5 }, (_, i) => a + i * d), next = a + 5 * d
    return { text: `What comes next: ${t.join(', ')}, ?`, ...nums(next, [next + d, next - 1, next + 1]), explanation: `Each term adds ${d}: ${t[4]} + ${d} = ${next}.` }
  }),
  R('series-geo', SERIES, 1, () => {
    const a = ri(1, 5), r = pick([2, 3]), t = Array.from({ length: 5 }, (_, i) => a * r ** i), next = t[4] * r
    return { text: `What comes next: ${t.join(', ')}, ?`, ...nums(next, [t[4] + (t[4] - t[3]), next + a, next - a]), explanation: `Each term is multiplied by ${r}: ${t[4]} × ${r} = ${next}.` }
  }),
  R('series-diff', SERIES, 2, () => {
    const a = ri(1, 20), d0 = ri(1, 5), s = ri(1, 4), t = [a]
    for (let i = 0; i < 4; i++) t.push(t[i] + d0 + i * s)
    const gaps = t.slice(1).map((x, i) => x - t[i]), gap = d0 + 4 * s, next = t[4] + gap
    return { text: `What comes next: ${t.join(', ')}, ?`, ...nums(next, [t[4] + gaps[3], next + s, next - 1]), explanation: `The gaps grow by ${s} each time (${gaps.join(', ')}), so the next gap is ${gap}: ${t[4]} + ${gap} = ${next}.` }
  }),
  R('series-squares', SERIES, 2, () => {
    const n0 = ri(2, 9), c = pick([0, 1, -1, 2]), t = Array.from({ length: 5 }, (_, i) => (n0 + i) ** 2 + c), next = (n0 + 5) ** 2 + c
    return {
      text: `What comes next: ${t.join(', ')}, ?`,
      ...nums(next, [next + 1, next - 1, t[4] + (t[4] - t[3])]),
      explanation: `The terms are squares${c ? ` ${c > 0 ? 'plus' : 'minus'} ${Math.abs(c)}` : ''}: ${n0}² … ${n0 + 4}², so next is ${n0 + 5}²${c ? ` ${c > 0 ? '+' : '−'} ${Math.abs(c)}` : ''} = ${next}.`,
    }
  }),
  R('series-alt', SERIES, 2, () => {
    const up = ri(3, 9), down = ri(1, up - 1), t = [ri(5, 30)]
    for (let i = 0; i < 5; i++) t.push(t[i] + (i % 2 === 0 ? up : -down))
    const next = t[5] - down // the last step was +up, so the next is −down
    return { text: `What comes next: ${t.join(', ')}, ?`, ...nums(next, [t[5] + up, next + 1, t[5] - up]), explanation: `The pattern alternates +${up} and −${down}; the last step was +${up}, so next is ${t[5]} − ${down} = ${next}.` }
  }),
  R('series-double', SERIES, 3, () => {
    const k = pick([1, 2, 3, -1]), t = [ri(k < 0 ? 2 : 1, 6)]
    for (let i = 0; i < 4; i++) t.push(t[i] * 2 + k)
    const next = t[4] * 2 + k
    return {
      text: `What comes next: ${t.join(', ')}, ?`,
      ...nums(next, [t[4] * 2, next + 2, t[4] + (t[4] - t[3])]),
      explanation: `Each term is doubled and then ${k > 0 ? `${k} is added` : `${-k} is taken away`}: ${t[4]} × 2 ${k > 0 ? '+' : '−'} ${Math.abs(k)} = ${next}.`,
    }
  }),
  R('letter-series', SERIES, 2, () => {
    const step = ri(2, 5), start = ri(0, 25 - 4 * step), idx = Array.from({ length: 4 }, (_, i) => start + i * step), next = start + 4 * step
    return {
      text: `What comes next: ${idx.map(i => LETTERS[i]).join(', ')}, ?`,
      ...texts(LETTERS[next], [LETTERS[next - 1], LETTERS[(next + 1) % 26], LETTERS[next - step + 1], LETTERS[(next + step) % 26]]),
      explanation: `Each letter moves ${step} places forward: ${LETTERS[idx[3]]} + ${step} = ${LETTERS[next]}.`,
    }
  }),
  R('analogy-number', SERIES, 1, () => {
    const rel = pick(['square', 'cube', 'square plus one'] as const), f = (x: number) => (rel === 'cube' ? x ** 3 : x * x + (rel === 'square' ? 0 : 1))
    const a = ri(2, 9)
    let b = ri(2, 12)
    while (b === a) b = ri(2, 12)
    return {
      text: `${a} : ${f(a)} :: ${b} : ?`,
      ...nums(f(b), [b * b, b ** 3, b * b + 1, f(b) + b]),
      explanation: `Each number pairs with its ${rel}: ${b} → ${f(b)}.`,
    }
  }),
  R('odd-prime', SERIES, 2, () => {
    const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
    const COMPOSITE = [[21, 3], [27, 3], [33, 3], [39, 3], [49, 7], [51, 3], [57, 3], [63, 7], [69, 3], [77, 7], [87, 3], [91, 7], [93, 3]] as const
    const ps = shuffle(PRIMES).slice(0, 3), [c, f] = pick(COMPOSITE)
    return {
      text: 'Which number is the odd one out?',
      ...nums(c, ps),
      explanation: `${ps.join(', ')} are prime numbers; ${c} = ${f} × ${c / f} is not.`,
    }
  }),

  // ── Reasoning: verbal ──
  R('code-shift', VERBAL, 1, () => {
    const WORDS = ['ARMY', 'NAVY', 'TANK', 'CADET', 'SONAR', 'MEDAL', 'BADGE', 'RIFLE', 'SCOUT', 'GUARD', 'PILOT', 'SHIP', 'FORT', 'CAMP', 'DRILL', 'MARCH', 'BUGLE', 'RANK', 'UNIT', 'FLEET']
    const w1 = pick(WORDS)
    let w2 = pick(WORDS)
    while (w2 === w1) w2 = pick(WORDS)
    const s = pick([1, 2, 3, -1, -2]), shift = (w: string, k: number) => [...w].map(ch => LETTERS[(LETTERS.indexOf(ch) + k + 26) % 26]).join('')
    const right = shift(w2, s)
    return {
      text: `In a code, ${w1} is written as ${shift(w1, s)}. How is ${w2} written in that code?`,
      ...texts(right, [shift(w2, s + 1), shift(w2, -s), [...right].reverse().join(''), shift(w2, s - 1 || 2)]),
      explanation: `Each letter moves ${Math.abs(s)} place${Math.abs(s) === 1 ? '' : 's'} ${s > 0 ? 'forward' : 'back'} in the alphabet: ${w2} → ${right}.`,
    }
  }),
  R('code-sum', VERBAL, 1, () => {
    const w = pick(['ARMY', 'NAVY', 'TANK', 'CADET', 'MEDAL', 'BADGE', 'RIFLE', 'GUARD', 'PILOT', 'SHIP', 'FORT', 'CAMP']), vals = [...w].map(ch => LETTERS.indexOf(ch) + 1)
    const sum = vals.reduce((s, x) => s + x, 0)
    return {
      text: `If A = 1, B = 2, C = 3 and so on, what is the sum of the letters of ${w}?`,
      ...nums(sum, [sum + 1, sum - 1, sum + w.length]),
      explanation: `${[...w].map((ch, i) => `${ch} ${vals[i]}`).join(' + ')} = ${sum}.`,
    }
  }),
  R('direction', VERBAL, 2, () => {
    const k = pick([1, 2, 3]), [dx, dy] = pick([[3, 4], [4, 3]] as const).map(x => x * k)
    const b = ri(1, dx - 1), e = dx - b, c = ri(1, 6), a = dy + c
    return {
      text: `A soldier walks ${a} km north, turns right and walks ${b} km, turns right again and walks ${c} km, then turns left and walks ${e} km. How far is the soldier from the starting point?`,
      ...nums(5 * k, [dx + dy, a + b + c + e, dy], n => `${n} km`),
      explanation: `He ends ${dx} km east and ${dy} km north of the start: √(${dx}² + ${dy}²) = ${5 * k} km.`,
    }
  }),
  R('ranking', VERBAL, 1, () => {
    const n = ri(20, 60), p = ri(3, n - 3), right = n - p + 1
    return pick([
      { text: `In a row of ${n} cadets, Arjun is ${ord(p)} from the left. What is Arjun’s position from the right?`, ...nums(right, [right - 1, right + 1, n - p], ord), explanation: `From the right = total − from the left + 1 = ${n} − ${p} + 1 = ${right}.` },
      { text: `Arjun is ${ord(p)} from the left and ${ord(right)} from the right in a row of cadets. How many cadets are in the row?`, ...nums(n, [n + 1, n - 1, p + right + 1]), explanation: `Total = ${p} + ${right} − 1 = ${n} (Arjun is counted from both ends).` },
    ])
  }),
  R('clock-angle', VERBAL, 2, () => {
    const h = ri(1, 12), m = ri(0, 29) * 2, raw = Math.abs(30 * (h % 12) - 5.5 * m), ang = raw > 180 ? 360 - raw : raw
    const naive = Math.abs(30 * (h % 12) - 6 * m), naiveAng = naive > 180 ? 360 - naive : naive
    return {
      text: `What is the smaller angle between the hands of a clock at ${h}:${pad(m)}?`,
      ...nums(ang, [naiveAng, ang + 15, ang + 30], x => `${x}°`),
      explanation: `Angle = |30 × ${h % 12} − 5.5 × ${m}| = ${raw}°${raw > 180 ? `; the smaller angle is 360° − ${raw}° = ${ang}°` : ''}.`,
    }
  }),
  R('calendar', VERBAL, 2, () => {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const y = ri(2021, 2032), leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
    const day = new Date(y, 0, 1).getDay(), next = new Date(y + 1, 0, 1).getDay()
    return {
      text: `1 January ${y} is a ${DAYS[day]}. What day of the week is 1 January ${y + 1}?`,
      ...texts(DAYS[next], [DAYS[day], DAYS[(next + 1) % 7], DAYS[(next + 6) % 7], DAYS[(next + 2) % 7]]),
      explanation: `${y} ${leap ? 'is a leap year: 366 days = 52 weeks + 2 days' : 'has 365 days = 52 weeks + 1 day'}, so the day moves ${leap ? 'two days' : 'one day'} forward: ${DAYS[next]}.`,
    }
  }),

  // ── Reasoning: spatial ──
  R('cube-paint', SPATIAL, 2, () => {
    const n = pick([3, 4, 5, 6]), k = n - 2
    const counts = { three: 8, two: 12 * k, one: 6 * k * k, no: k ** 3 }
    const ask = pick(['three', 'two', 'one', 'no'] as const)
    return {
      text: `A cube painted on all faces is cut into ${n ** 3} equal small cubes. How many small cubes have ${ask === 'no' ? 'no face' : `exactly ${ask} face${ask === 'one' ? '' : 's'}`} painted?`,
      ...nums(counts[ask], Object.values(counts)),
      explanation: `With ${n} cubes along each edge: 3 faces = 8 corners; 2 faces = 12 × (${n} − 2) = ${counts.two}; 1 face = 6 × (${n} − 2)² = ${counts.one}; none = (${n} − 2)³ = ${counts.no}.`,
    }
  }),
  R('mirror-clock', SPATIAL, 2, () => {
    const h = ri(1, 11), m = ri(1, 11) * 5, mins = 720 - (h * 60 + m)
    const fmt = (t: number) => { const x = ((t % 720) + 720) % 720, hh = Math.floor(x / 60); return `${hh === 0 ? 12 : hh}:${pad(x % 60)}` }
    return {
      text: `A clock shows ${h}:${pad(m)}. What time does its reflection in a mirror appear to show?`,
      ...texts(fmt(mins), [fmt(h * 60 + m), fmt(mins + 30), fmt(mins - 30), fmt(mins + 60)]),
      explanation: `Mirror time = 11:60 − ${h}:${pad(m)} = ${fmt(mins)}.`,
    }
  }),
  R('die-opposite', SPATIAL, 1, () => {
    const top = ri(1, 6), bottom = 7 - top
    return {
      text: `Opposite faces of a standard die add up to 7. If ${top} is on top, what number is at the bottom?`,
      ...texts(String(bottom), [1, 2, 3, 4, 5, 6].filter(x => x !== top && x !== bottom).map(String)),
      explanation: `7 − ${top} = ${bottom}.`,
    }
  }),
  R('paper-fold', SPATIAL, 1, () => {
    const k = ri(1, 3), h = ri(1, 2), holes = h * 2 ** k
    return {
      text: `A sheet of paper is folded in half ${k === 1 ? 'once' : `${k} times`} and ${h === 1 ? 'one hole is' : `${h} holes are`} punched through all the layers. How many holes are there when it is unfolded?`,
      ...nums(holes, [h * k * 2 + 1, h * 2 ** (k + 1), h + k]),
      explanation: `${k} fold${k > 1 ? 's' : ''} make${k > 1 ? '' : 's'} ${2 ** k} layers, so each punch makes ${2 ** k} holes: ${h} × ${2 ** k} = ${holes}.`,
    }
  }),
]

export type GenFilter = { subject?: string; topic?: string; exam?: ExamId; difficulty?: number }
const matches = (g: Gen, f: GenFilter) =>
  (!f.subject || f.subject === 'All' || g.subject === f.subject) && (!f.topic || g.topic === f.topic)
  && (!f.exam || examsOf(g).includes(f.exam)) && (!f.difficulty || g.difficulty === f.difficulty)

/** True if fresh questions can be generated for this subject / topic. */
export const hasGenerators = (f: GenFilter) => GENERATORS.some(g => matches(g, f))
/** Topics that have generators, for a subject ('All' for every subject). */
export const generatedTopics = (subject: string) => [...new Set(GENERATORS.filter(g => matches(g, { subject })).map(g => g.topic))]

let seq = 0
/** n fresh questions, cycling through the matching templates so every kind appears; no repeats within a set. */
export function generate(n: number, f: GenFilter = {}): Question[] {
  const gens = shuffle(GENERATORS.filter(g => matches(g, f)))
  if (!gens.length || n <= 0) return []
  const seen = new Set<string>()
  const out: Question[] = []
  for (let i = 0, tries = 0; out.length < n && tries < n * 6; i++, tries++) {
    const g = gens[i % gens.length]
    const made = g.make()
    if (seen.has(made.text)) continue
    seen.add(made.text)
    out.push({ id: `gen-${g.id}-${Date.now().toString(36)}-${(seq++).toString(36)}`, exams: examsOf(g), subject: g.subject, topic: g.topic, difficulty: g.difficulty, source: 'Generated', ...made })
  }
  return out
}
