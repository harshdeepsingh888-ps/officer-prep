// Point clouds for the hero visual. Each form is a few simple solids (profiles, tubes, ellipsoids);
// points are spread over their visible surfaces. Axes: x back→front, y down, z left→right.

export type V3 = [number, number, number]
type Pt = [number, number]
type Solid = { area: number; sample: () => V3; inside: (p: V3) => boolean }

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const TAU = Math.PI * 2

/** Local → shape coordinates: pitch about z, then yaw about y, then move to `at`. */
type Pose = { at?: V3; pitch?: number; yaw?: number }
function poser({ at = [0, 0, 0], pitch = 0, yaw = 0 }: Pose) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw)
  return {
    to([x, y, z]: V3): V3 {
      const x1 = x * cp - y * sp, y1 = x * sp + y * cp
      return [x1 * cy + z * sy + at[0], y1 + at[1], -x1 * sy + z * cy + at[2]]
    },
    from([x, y, z]: V3): V3 {
      x -= at[0]; y -= at[1]; z -= at[2]
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy
      return [x1 * cp + y * sp, -x1 * sp + y * cp, z1]
    },
  }
}

/** A tube along local x, radius r0 at the back end and r1 at the front (a cone when they differ). */
function tube(len: number, r0: number, r1 = r0, pose: Pose = {}, weight = 1): Solid {
  const P = poser(pose), h = len / 2, rm = Math.max(r0, r1)
  const side = Math.PI * (r0 + r1) * Math.hypot(len, r1 - r0), cap0 = Math.PI * r0 * r0, cap1 = Math.PI * r1 * r1
  const radius = (x: number) => r0 + ((r1 - r0) * (x + h)) / len
  return {
    area: (side + cap0 + cap1) * weight,
    sample() {
      const u = Math.random() * (side + cap0 + cap1), a = rnd(0, TAU)
      let x: number, r: number
      if (u < side) {
        do { x = rnd(-h, h); r = radius(x) } while (Math.random() * rm > r) // the wider end gets more points
      } else {
        x = u < side + cap0 ? -h : h
        r = (x < 0 ? r0 : r1) * Math.sqrt(Math.random())
      }
      return P.to([x, Math.cos(a) * r, Math.sin(a) * r])
    },
    inside(p) {
      const [x, y, z] = P.from(p)
      return Math.abs(x) < h && y * y + z * z < radius(x) ** 2
    },
  }
}

function blob(rx: number, ry: number, rz: number, pose: Pose = {}, weight = 1): Solid {
  const P = poser(pose), q = 1.6075, m = Math.min(rx, ry, rz)
  const area = 4 * Math.PI * (((rx * ry) ** q + (rx * rz) ** q + (ry * rz) ** q) / 3) ** (1 / q) // Thomsen's approximation
  return {
    area: area * weight,
    sample() {
      for (;;) {
        const u = rnd(-1, 1), a = rnd(0, TAU), s = Math.sqrt(1 - u * u)
        const n: V3 = [s * Math.cos(a), u, s * Math.sin(a)]
        // Stretching a sphere crowds points at the narrow ends; thin them out by the local stretch.
        if (Math.random() < m * Math.hypot(n[0] / rx, n[1] / ry, n[2] / rz)) return P.to([n[0] * rx, n[1] * ry, n[2] * rz])
      }
    },
    inside(p) {
      const [x, y, z] = P.from(p)
      return (x / rx) ** 2 + (y / ry) ** 2 + (z / rz) ** 2 < 1
    },
  }
}

function inPoly(u: number, v: number, poly: Pt[]) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ui, vi] = poly[i], [uj, vj] = poly[j]
    if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) hit = !hit
  }
  return hit
}

/** A flat profile with thickness: side view (x, y) extruded across z, or with `flat` a plan view (x, z)
 *  given thickness in y (wings, rotor blades). `half` may vary along x, e.g. a hull narrowing to the bow. */
function slab(poly: Pt[], half: number | ((x: number) => number), opt: { at?: V3; flat?: boolean; weight?: number } = {}): Solid {
  const { at = [0, 0, 0], flat = false, weight = 1 } = opt
  const hw = typeof half === 'number' ? () => half : half
  const place = (u: number, v: number, w: number): V3 => (flat ? [u + at[0], w + at[1], v + at[2]] : [u + at[0], v + at[1], w + at[2]])
  let face = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) face += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1])
  face = Math.abs(face) / 2
  const edges = poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length]
    return { p, q, area: Math.hypot(q[0] - p[0], q[1] - p[1]) * 2 * hw((p[0] + q[0]) / 2) }
  })
  const rim = edges.reduce((s, e) => s + e.area, 0)
  const us = poly.map(p => p[0]), vs = poly.map(p => p[1])
  const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)]
  return {
    area: (2 * face + rim) * weight,
    sample() {
      let r = Math.random() * (2 * face + rim)
      if (r < 2 * face) {
        for (;;) {
          const u = rnd(u0, u1), v = rnd(v0, v1)
          if (inPoly(u, v, poly)) return place(u, v, (r < face ? 1 : -1) * hw(u))
        }
      }
      r -= 2 * face
      const e = edges.find(x => (r -= x.area) < 0) ?? edges[edges.length - 1]
      const k = Math.random(), u = e.p[0] + (e.q[0] - e.p[0]) * k
      return place(u, e.p[1] + (e.q[1] - e.p[1]) * k, rnd(-1, 1) * hw(u))
    },
    inside([x, y, z]) {
      const u = x - at[0], v = (flat ? z - at[2] : y - at[1]), w = (flat ? y - at[1] : z - at[2])
      return Math.abs(w) < hw(u) && inPoly(u, v, poly)
    },
  }
}

/** Rectangle with semicircular ends: a tank track seen from the side. */
function stadium(x0: number, x1: number, y0: number, y1: number, steps = 6): Pt[] {
  const r = (y1 - y0) / 2, cy = (y0 + y1) / 2, out: Pt[] = []
  for (let i = 0; i <= steps; i++) { const a = -Math.PI / 2 + (Math.PI * i) / steps; out.push([x1 - r + Math.cos(a) * r, cy + Math.sin(a) * r]) }
  for (let i = 0; i <= steps; i++) { const a = Math.PI / 2 + (Math.PI * i) / steps; out.push([x0 + r + Math.cos(a) * r, cy + Math.sin(a) * r]) }
  return out
}

const sides = <T>(f: (s: 1 | -1) => T) => [f(1), f(-1)]
const UP = Math.PI / 2 // pitch that turns a tube upright
const ACROSS = Math.PI / 2 // yaw that turns a tube across the body (along z)

const tank = (): Solid[] => [
  slab([[-0.82, -0.04], [0.55, -0.04], [0.86, 0.07], [0.76, 0.2], [-0.82, 0.2]], 0.34), // hull with sloped glacis
  ...sides(s => slab(stadium(-0.88, 0.8, 0, 0.36), 0.08, { at: [0, 0, s * 0.42], weight: 1.4 })), // tracks
  ...sides(s => [-0.62, -0.38, -0.14, 0.1, 0.34, 0.56].map(x => tube(0.02, 0.1, 0.1, { at: [x, 0.2, s * 0.505], yaw: ACROSS }, 1.6))).flat(), // road wheels
  slab([[-0.55, -0.04], [0.3, -0.04], [0.46, -0.14], [0.3, -0.3], [-0.45, -0.3], [-0.62, -0.18]], 0.24), // turret
  tube(1.1, 0.038, 0.032, { at: [0.95, -0.17, 0], pitch: -0.04 }, 3), // main gun
  tube(0.12, 0.06, 0.06, { at: [0.9, -0.175, 0], pitch: -0.04 }, 1.5), // fume extractor
  tube(0.06, 0.07, 0.07, { at: [-0.2, -0.33, 0.1], pitch: UP }), // commander's hatch
]

const jet = (): Solid[] => [
  blob(1, 0.1, 0.1), // fuselage
  blob(0.22, 0.065, 0.065, { at: [0.42, -0.085, 0] }), // canopy
  slab([[0.32, 0], [-0.52, 0.8], [-0.7, 0.8], [-0.7, -0.8], [-0.52, -0.8]], 0.012, { flat: true, at: [0, 0.03, 0] }), // delta wing
  slab([[-0.5, -0.06], [-0.94, -0.06], [-1, -0.48], [-0.84, -0.48]], 0.012), // tail fin
  tube(0.12, 0.085, 0.075, { at: [-0.98, 0, 0] }), // exhaust nozzle
  ...sides(s => slab([[0, -0.03], [0.36, -0.03], [0.4, 0.08], [0, 0.08]], 0.05, { at: [0, 0, s * 0.13] })), // air intakes
  ...sides(s => tube(0.48, 0.022, 0.022, { at: [-0.3, 0.08, s * 0.55] }, 2)), // missiles under the wings
]

const hull = (x: number) => (x < 0.25 ? 0.17 : Math.max(0.01, 0.17 * (1 - (x - 0.25) / 0.9)))
const ship = (): Solid[] => [
  slab([[-1, -0.02], [0.85, -0.05], [1.12, -0.1], [0.97, 0.14], [-0.97, 0.14]], hull), // hull narrowing to the bow
  slab([[-0.55, -0.02], [0.32, -0.02], [0.32, -0.2], [-0.55, -0.2]], 0.13), // superstructure
  slab([[-0.72, -0.02], [-0.55, -0.02], [-0.55, -0.15], [-0.72, -0.15]], 0.12), // hangar
  slab([[0.08, -0.2], [0.34, -0.2], [0.3, -0.31], [0.08, -0.31]], 0.11), // bridge
  tube(0.42, 0.014, 0.04, { at: [0.12, -0.41, 0], pitch: UP }), // mast
  tube(0.28, 0.01, 0.01, { at: [0.12, -0.54, 0], yaw: ACROSS }, 2), // yardarm
  blob(0.05, 0.05, 0.05, { at: [0.12, -0.66, 0] }, 2), // radar dome
  slab([[-0.32, -0.2], [-0.1, -0.2], [-0.14, -0.37], [-0.28, -0.37]], 0.07), // funnel
  slab([[0.36, -0.04], [0.5, -0.045], [0.5, -0.09], [0.36, -0.09]], 0.1), // missile launchers
  tube(0.22, 0.01, 0.025, { at: [-0.42, -0.31, 0], pitch: UP }), // aft mast
  slab([[0.52, -0.05], [0.74, -0.05], [0.7, -0.12], [0.56, -0.12]], 0.07), // gun turret
  tube(0.24, 0.012, 0.012, { at: [0.84, -0.1, 0], pitch: -0.08 }, 2), // gun barrel
]

const rifle = (): Solid[] => [
  slab([[-1, -0.03], [-0.56, -0.06], [-0.56, 0.06], [-1, 0.21]], 0.035), // butt stock
  slab([[-0.56, -0.08], [0.18, -0.08], [0.18, 0.06], [-0.56, 0.06]], 0.035), // receiver
  slab([[-0.42, 0.06], [-0.3, 0.06], [-0.37, 0.3], [-0.48, 0.28]], 0.03), // pistol grip
  slab([[-0.14, 0.06], [0.02, 0.06], [0.09, 0.2], [0.13, 0.34], [0, 0.37], [-0.04, 0.22]], 0.03), // curved magazine
  slab([[0.18, -0.065], [0.56, -0.055], [0.56, 0.045], [0.18, 0.06]], 0.038), // handguard
  slab([[-0.24, -0.08], [-0.02, -0.08], [-0.04, -0.12], [-0.22, -0.12]], 0.02), // rear sight
  slab([[0.66, -0.07], [0.7, -0.07], [0.69, -0.16], [0.67, -0.16]], 0.008, { weight: 3 }), // front sight
  tube(0.47, 0.013, 0.013, { at: [0.42, -0.075, 0] }, 2), // gas tube
  tube(0.48, 0.018, 0.018, { at: [0.78, 0, 0] }, 3), // barrel
  tube(0.08, 0.026, 0.026, { at: [1, 0, 0] }, 2), // flash hider
]

const helicopter = (): Solid[] => [
  blob(0.5, 0.26, 0.21, { at: [0.12, 0, 0] }), // cabin
  blob(0.3, 0.2, 0.18, { at: [0.42, 0.02, 0] }), // cockpit
  tube(0.95, 0.035, 0.09, { at: [-0.72, -0.06, 0] }), // tail boom
  slab([[-1.08, -0.06], [-1.2, -0.06], [-1.26, -0.34], [-1.16, -0.34]], 0.012), // tail fin
  slab([[-0.9, -0.16], [-0.98, -0.16], [-0.98, 0.16], [-0.9, 0.16]], 0.008, { flat: true, at: [0, -0.04, 0] }), // stabiliser
  tube(0.01, 0.15, 0.15, { at: [-1.2, -0.22, 0.03], yaw: ACROSS }, 0.5), // tail rotor
  tube(0.12, 0.03, 0.03, { at: [0.12, -0.31, 0], pitch: UP }), // rotor mast
  slab([[-1.12, -0.035], [1.12, -0.035], [1.12, 0.035], [-1.12, 0.035]], 0.008, { flat: true, at: [0.12, -0.37, 0] }), // rotor blades
  slab([[-0.035, -1.12], [0.035, -1.12], [0.035, 1.12], [-0.035, 1.12]], 0.008, { flat: true, at: [0.12, -0.37, 0] }),
  ...sides(s => tube(0.8, 0.018, 0.018, { at: [0.12, 0.33, s * 0.2] }, 2)), // skids
  ...sides(s => [0.35, -0.1].map(x => tube(0.12, 0.014, 0.014, { at: [x, 0.27, s * 0.18], pitch: UP }))).flat(), // skid struts
]

const fin = (x0: number, x1: number, r: number, span: number, sweep: number): Pt[] => [[x0, r], [x1, r], [x1 - sweep, r + span], [x1 - sweep + (x0 - x1) * 0.45, r + span]]
const flip = (poly: Pt[]): Pt[] => poly.map(([u, v]) => [u, -v])
const missile = (): Solid[] => [
  tube(1.5, 0.09, 0.09, { at: [-0.1, 0, 0] }), // body
  tube(0.42, 0.09, 0.006, { at: [0.86, 0, 0] }), // nose cone
  tube(0.08, 0.07, 0.06, { at: [-0.89, 0, 0] }), // nozzle
  tube(0.5, 0.17, 0.05, { at: [-1.17, 0, 0] }, 0.35), // exhaust plume
  ...[fin(-0.58, -0.84, 0.08, 0.24, 0.08), fin(0.2, 0.02, 0.08, 0.12, 0.04)].flatMap(f => [
    slab(f, 0.008), slab(flip(f), 0.008), slab(f, 0.008, { flat: true }), slab(flip(f), 0.008, { flat: true }),
  ]), // tail fins and mid-body wings
]

/** Spreads n points over the solids' exposed surfaces, centres them and scales to a common size. */
function build(solids: Solid[], n: number, pitch = 0): V3[] {
  const total = solids.reduce((s, x) => s + x.area, 0)
  const out: V3[] = []
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    let r = Math.random() * total
    const s = solids.find(x => (r -= x.area) < 0) ?? solids[solids.length - 1]
    const p = s.sample()
    if (!solids.some(o => o !== s && o.inside(p))) out.push(p) // hidden inside another part
  }
  while (out.length < n) out.push(out[Math.floor(Math.random() * out.length)] ?? [0, 0, 0])
  const lo = [0, 1, 2].map(i => Math.min(...out.map(p => p[i]))), hi = [0, 1, 2].map(i => Math.max(...out.map(p => p[i])))
  const c = lo.map((l, i) => (l + hi[i]) / 2), half = lo.map((l, i) => (hi[i] - l) / 2)
  const k = Math.min(1 / half[0], 0.62 / half[1], 1.15 / half[2])
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  return out.map(([x, y, z]) => {
    x = (x - c[0]) * k; y = (y - c[1]) * k
    return [x * cp - y * sp, x * sp + y * cp, (z - c[2]) * k] as V3
  })
}

// A brain built from ellipsoids (normalised units).
const LOBES = [
  { x: 0, y: -0.06, z: 0, rx: 1, ry: 0.6, rz: 0.72 }, // cerebrum
  { x: 0.45, y: 0, z: 0, rx: 0.55, ry: 0.54, rz: 0.64 }, // frontal
  { x: 0.12, y: 0.3, z: 0, rx: 0.56, ry: 0.27, rz: 0.62 }, // temporal
  { x: -0.62, y: 0.4, z: 0, rx: 0.34, ry: 0.22, rz: 0.5 }, // cerebellum
  { x: -0.3, y: 0.58, z: 0, rx: 0.1, ry: 0.26, rz: 0.11 }, // stem
]
/** Smallest normalised radius across lobes: ≤ 1 means inside, ~1 means near the surface. */
const lobeDist = (x: number, y: number, z: number) =>
  Math.min(...LOBES.map(l => Math.sqrt(((x - l.x) / l.rx) ** 2 + ((y - l.y) / l.ry) ** 2 + ((z - l.z) / l.rz) ** 2)))
const cube = (): V3 => [rnd(-1, 1) * 1.1, rnd(-1, 1) * 0.9, rnd(-1, 1) * 0.8]

function brain(n: number): V3[] {
  const out: V3[] = []
  while (out.length < n) {
    const [x, y, z] = cube()
    const d = lobeDist(x, y, z)
    if (d > 1) continue
    if (Math.abs(z) < 0.05 && y < 0.15) continue // fissure between hemispheres
    if (Math.random() > 0.12 + 0.88 * d ** 4) continue // denser towards the surface
    if (0.55 + 0.45 * Math.sin(9 * x + 5 * y + 3 * z) * Math.cos(7 * y - 4 * z) < Math.random() * 0.95) continue // folds
    out.push([x, y, z])
  }
  return out
}

/** Faint scattered points around the main form; they stay put while the form changes. */
export function ambient(n: number): V3[] {
  const out: V3[] = []
  while (out.length < n) {
    const [x, y, z] = cube()
    if (lobeDist(x, y, z) > 1.05) out.push([x * 1.6, y * 1.5, z])
  }
  return out
}

/** How each form is shown: tilt looks down from above, yaw turns it, sway rocks it back and forth;
 *  dot scales the triangles (machines need finer points than the brain to keep thin parts crisp). */
export type Form = {
  name: string; tilt: number; yaw: number; sway: number; dot: number; make: (n: number) => V3[]
  /** Shown under the picker: who flies, sails or fields it, and their motto. */
  caption: { text: string; service?: 'army' | 'navy' | 'airforce' }
}

const byX = (pts: V3[]) => pts.sort((a, b) => a[0] - b[0]) // neighbours morph into neighbours

export const FORMS: Form[] = [
  { name: 'Brain', caption: { text: 'Officer-like qualities start in the mind' }, tilt: 0.28, yaw: 0, sway: 0.9, dot: 1, make: n => byX(brain(n)) },
  { name: 'Tank', caption: { service: 'army', text: 'Indian Army · “Service Before Self”' }, tilt: 0.3, yaw: 0.4, sway: 0.45, dot: 0.75, make: n => byX(build(tank(), n)) },
  { name: 'Fighter jet', caption: { service: 'airforce', text: 'Indian Air Force · “Touch the sky with glory”' }, tilt: 0.85, yaw: 0.5, sway: 0.4, dot: 0.75, make: n => byX(build(jet(), n)) },
  { name: 'Naval ship', caption: { service: 'navy', text: 'Indian Navy · “Sham No Varunah”: may the Lord of the Waters be auspicious unto us' }, tilt: 0.22, yaw: 0.3, sway: 0.3, dot: 0.75, make: n => byX(build(ship(), n)) },
  { name: 'Rifle', caption: { service: 'army', text: 'Indian Army · the infantry' }, tilt: 0.08, yaw: 0.15, sway: 0.35, dot: 0.75, make: n => byX(build(rifle(), n)) },
  { name: 'Helicopter', caption: { text: 'Flown by the Army, the Navy and the Air Force' }, tilt: 0.42, yaw: 0.5, sway: 0.45, dot: 0.75, make: n => byX(build(helicopter(), n)) },
  { name: 'Missile', caption: { text: 'DRDO · “Balasya Mulam Vigyanam”: science is the root of strength' }, tilt: 0.3, yaw: 0.4, sway: 0.4, dot: 0.75, make: n => byX(build(missile(), n, -0.3)) },
]
