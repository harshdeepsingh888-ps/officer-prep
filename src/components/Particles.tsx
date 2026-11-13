import { useEffect, useRef, useState } from 'react'
import { isLight } from '../lib/theme'
import { FORMS, ambient, type Form, type V3 } from './shapes'
import { SERVICES } from './Services'

// Procedural "constellation" visual: tiny outlined triangles in the tricolour (the flag's saffron is also the app's
// accent), with a little pale saffron and grey. Particles keep a palette index, so they recolour when the theme changes.

//                saffron    white      green      pale       grey
const DARK = ['#ff9933', '#ffffff', '#2fb05a', '#ffcc99', '#9b9b9b']
const LIGHT = ['#e07b10', '#3d3d3d', '#138808', '#c2620a', '#8f8f8f'] // deeper shades for white paper
const WEIGHTS = [0.34, 0.26, 0.2, 0.1, 0.1]
const palette = () => (isLight() ? LIGHT : DARK)

function pickColor() {
  let r = Math.random()
  for (let i = 0; i < WEIGHTS.length; i++) { if ((r -= WEIGHTS[i]) <= 0) return i }
  return 0
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function triangle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
  ctx.moveTo(x + Math.cos(rot) * size, y + Math.sin(rot) * size)
  ctx.lineTo(x + Math.cos(rot + 2.094) * size, y + Math.sin(rot + 2.094) * size)
  ctx.lineTo(x + Math.cos(rot + 4.189) * size, y + Math.sin(rot + 4.189) * size)
  ctx.closePath()
}

/** Keeps a canvas sized to its box at device pixel ratio and runs a draw loop. */
function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void, init: (w: number, h: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let w = 0, h = 0, raf = 0
    const still = reducedMotion()
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      init(w, h)
      if (still) draw(ctx, w, h, 0)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    // With motion off there is no loop, so repaint when the theme switches or the owner asks.
    const repaint = () => { if (still) draw(ctx, w, h, 0) }
    canvas.addEventListener('repaint', repaint)
    const mo = new MutationObserver(repaint)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const start = performance.now()
    // Phones and tablets: 30 frames a second is plenty for a slow drift and saves battery.
    const gap = window.matchMedia('(pointer: coarse)').matches ? 1000 / 30 - 4 : 0
    let last = 0, onScreen = true
    const loop = (now: number) => {
      if (!onScreen) return // restarted by the observer below
      if (now - last >= gap) { last = now; draw(ctx, w, h, (now - start) / 1000) }
      raf = requestAnimationFrame(loop)
    }
    // Stop drawing while the canvas is scrolled out of view.
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      cancelAnimationFrame(raf)
      if (onScreen && !still) raf = requestAnimationFrame(loop)
    })
    io.observe(canvas)
    if (!still) raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); io.disconnect(); canvas.removeEventListener('repaint', repaint) }
  }, []) // draw/init read refs, so the loop is set up once
  return ref
}

type Dot = { size: number; rot: number; spin: number; color: number; alpha: number; phase: number; drift: V3 }
type Angles = Pick<Form, 'yaw' | 'sway' | 'tilt' | 'dot'>

const HOLD = 6, BRAIN_HOLD = 8, MORPH = 2.6 // seconds
const IDLE = 12 // after you pick a form or turn it, it stays yours this long before the tour resumes
const STAGGER = 0.35 // share of the morph spent on the wave from tail to nose
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2)
const mix = (a: number, b: number, k: number) => a + (b - a) * k
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const wrap = (a: number) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2))

/** The signature visual: outlined triangles that form a brain, then morph through a tank, a fighter jet,
 *  a naval ship, a rifle, a helicopter and a missile. Pick a form below it; drag to turn it to any side. */
export function Constellation({ className = '', count = 1300 }: { className?: string; count?: number }) {
  const dots = useRef<Dot[]>([])
  const forms = useRef<V3[][]>([]) // one point per dot, per form
  const [shown, setShown] = useState(0)
  // Holding a form: from === to. Morphing: from → to, started at `since`. Times are seconds into the loop.
  // yaw/tilt are your own turn on top of the form's presentation angle; spin keeps it coasting after a flick.
  // A pick mid-morph starts from wherever the points are: `start`/`startView` hold that snapshot.
  const view = useRef({
    from: 0, to: 0, since: 0, morphing: false, t: 0, last: 0,
    start: null as V3[] | null, startView: null as Angles | null, now: [] as V3[], nowView: FORMS[0] as Angles,
    yaw: 0, tilt: 0, spin: 0, auto: 1, touchedAt: -Infinity,
    drag: null as null | { x: number; y: number; at: number },
  })
  const morphTo = (i: number, t: number) => {
    const v = view.current
    if (i === v.to) return
    if (v.morphing) {
      const was = v.start ?? forms.current[v.from]
      v.start = forms.current[v.to].map((to, j) => (was[j] === to ? to : v.now[j] ?? was[j]))
      v.startView = { ...v.nowView }
    }
    v.from = v.to
    v.to = i
    v.since = t
    v.morphing = true
    setShown(i)
  }

  const ref = useCanvasLoop(
    (ctx, w, h, t) => {
      const v = view.current
      const dt = Math.max(0, Math.min(0.1, t - v.last))
      v.t = v.last = t
      const idle = t - v.touchedAt > IDLE
      if (v.morphing && t - v.since >= MORPH) {
        v.morphing = false
        v.from = v.to
        v.since = t
        v.start = v.startView = null
      } else if (!v.morphing && idle && t - v.since >= (v.to === 0 ? BRAIN_HOLD : HOLD)) morphTo((v.to + 1) % FORMS.length, t)
      if (!v.drag) {
        v.yaw += v.spin * dt
        v.spin *= Math.exp(-dt * 2.5)
        if (idle) { // drift back to the presentation angle
          v.yaw = wrap(v.yaw)
          const f = Math.exp(-dt * 1.2)
          v.yaw *= f
          v.tilt *= f
        }
      }
      v.auto = mix(v.auto, idle ? 1 : 0, 1 - Math.exp(-dt * 2)) // the gentle sway steps aside while you're turning it
      const P = v.morphing ? (t - v.since) / MORPH : 1, E = ease(P)
      const A = v.startView ?? FORMS[v.from], B = FORMS[v.to], pa = v.start ?? forms.current[v.from], pb = forms.current[v.to]
      if (v.morphing) v.nowView = { yaw: mix(A.yaw, B.yaw, E), sway: mix(A.sway, B.sway, E), tilt: mix(A.tilt, B.tilt, E), dot: mix(A.dot, B.dot, E) }

      ctx.clearRect(0, 0, w, h)
      const R = Math.min(w, h * 1.45) * 0.4
      const cx = w / 2, cy = h / 2
      const a = mix(A.yaw, B.yaw, E) + v.auto * mix(A.sway, B.sway, E) * Math.sin(t * 0.21) + v.yaw
      const tilt = clamp(mix(A.tilt, B.tilt, E) + v.tilt, -1.45, 1.45), dot = mix(A.dot, B.dot, E)
      const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt)
      const light = isLight()
      const pal = palette()
      const boost = light ? 1.3 : 1 // thin outlines read fainter on white
      ctx.lineWidth = light ? 1.2 : 1
      const n = dots.current.length
      for (let i = 0; i < n; i++) {
        const p = dots.current[i], from = pa[i], to = pb[i]
        let [x, y, z] = to
        if (from !== to) {
          // A wave runs from tail to nose; mid-flight each point lifts off a little, like dust.
          const e = ease(clamp((P - (i / n) * STAGGER) / (1 - STAGGER), 0, 1))
          const lift = Math.sin(Math.PI * e) * 0.22
          x = mix(from[0], to[0], e) + p.drift[0] * lift
          y = mix(from[1], to[1], e) + p.drift[1] * lift
          z = mix(from[2], to[2], e) + p.drift[2] * lift
          v.now[i] = [x, y, z]
        }
        const x1 = x * ca + z * sa
        const z1 = -x * sa + z * ca
        const y1 = y * ct - z1 * st
        const z2 = y * st + z1 * ct
        const k = 3 / (3 + z2)
        const depth = 0.55 + 0.45 * (1 - (z2 + 1.3) / 2.6)
        const twinkle = 0.7 + 0.3 * Math.sin(t * 1.3 + p.phase)
        ctx.globalAlpha = Math.max(0.05, Math.min(1, p.alpha * depth * twinkle * boost))
        ctx.strokeStyle = pal[p.color]
        ctx.beginPath()
        triangle(ctx, cx + x1 * R * k, cy + y1 * R * k, p.size * k * dot, p.rot + t * p.spin)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    },
    w => {
      if (dots.current.length) return
      const n = w < 640 ? Math.round(count * 0.6) : count // a phone-sized form needs fewer points to look dense
      const core = Math.round(n * 0.9), around = ambient(n - core)
      forms.current = FORMS.map(f => [...f.make(core), ...around]) // shared ambient points stay put
      dots.current = Array.from({ length: n }, (_, i) => {
        const u = Math.random() * 2 - 1, ang = Math.random() * 6.28, r = Math.sqrt(1 - u * u)
        return {
          size: 2 + Math.random() * 2.6, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.6,
          color: pickColor(), alpha: i >= core ? 0.35 : 0.65 + Math.random() * 0.35, phase: Math.random() * 6.28,
          drift: [r * Math.cos(ang), u, r * Math.sin(ang)],
        }
      })
    },
  )

  // With reduced motion there's no loop, so changes are drawn straight away.
  const repaint = () => ref.current?.dispatchEvent(new Event('repaint'))
  const pick = (i: number) => {
    const v = view.current
    v.touchedAt = v.t
    if (!reducedMotion()) return morphTo(i, v.t)
    v.from = v.to = i
    setShown(i)
    repaint()
  }
  const turn = {
    onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      const v = view.current
      v.drag = { x: e.clientX, y: e.clientY, at: e.timeStamp }
      v.spin = 0
      v.touchedAt = v.t
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      const v = view.current, d = v.drag
      if (!d) return
      const dx = e.clientX - d.x, dy = e.clientY - d.y, secs = Math.max(0.008, (e.timeStamp - d.at) / 1000)
      v.yaw -= dx * 0.01 // drag right: the near side follows your pointer
      v.tilt = clamp(v.tilt + dy * 0.008, -3, 3) // drag down: look more from above
      v.spin = mix(v.spin, (-dx * 0.01) / secs, 0.5)
      v.touchedAt = v.t
      v.drag = { x: e.clientX, y: e.clientY, at: e.timeStamp }
      if (reducedMotion()) repaint()
    },
    onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
      const v = view.current
      if (v.drag && e.timeStamp - v.drag.at > 80) v.spin = 0 // held still before letting go: no coasting
      if (reducedMotion()) v.spin = 0
      v.drag = null
      v.touchedAt = v.t
    },
  }

  return (
    <div className={`flex h-full min-w-0 flex-col ${className}`}>
      {/* touch-pan-y: on phones a sideways swipe turns it and an up/down swipe still scrolls the page */}
      <canvas ref={ref} aria-hidden {...turn} onPointerCancel={turn.onPointerUp}
        className="block min-h-0 w-full flex-1 cursor-grab touch-pan-y select-none active:cursor-grabbing" />
      <div className="overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div role="group" aria-label="Choose a form" className="mx-auto flex w-max gap-1">
          {FORMS.map((f, i) => (
            <button key={f.name} aria-pressed={shown === i} onClick={() => pick(i)}
              className={`shrink-0 rounded-full px-3 py-1 caption-4 transition-colors duration-300 ease-soft pointer-coarse:min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 ${shown === i ? 'bg-fg/[0.1] text-fg' : 'text-ink-400 hover:text-fg'}`}>
              {f.name}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 flex min-h-5 items-center justify-center gap-2 px-4 text-center caption-5 text-ink-400" aria-live="polite">
        {FORMS[shown].caption.service && <span className={`size-2 shrink-0 rounded-full ${SERVICES[FORMS[shown].caption.service].dot}`} aria-hidden />}
        {FORMS[shown].caption.text}
      </p>
    </div>
  )
}

/** Brand mark: an upward chevron in saffron, as on the landing page. */
export function Logo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`text-accent-500 ${className}`} aria-hidden>
      <path d="M12 2.5 21.5 20 12 14.8 2.5 20Z" fill="currentColor" />
    </svg>
  )
}
