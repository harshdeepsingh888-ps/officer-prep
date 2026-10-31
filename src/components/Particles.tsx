import { useEffect, useRef } from 'react'
import { isLight } from '../lib/theme'

// Procedural "constellation" visuals: tiny outlined triangles in vivid colours.
// Particles keep a palette index, so they recolour instantly when the theme changes.

//                iris       lilac      saffron    verdant    magenta    blue
const DARK = ['#8052ff', '#b9a3ff', '#ffb829', '#2fb592', '#e04fd9', '#4f7bff']
const LIGHT = ['#8052ff', '#9b7bff', '#e09600', '#15846e', '#cc3fc4', '#3f6bf0'] // deeper hues for white paper
const WEIGHTS = [0.3, 0.14, 0.2, 0.16, 0.1, 0.1]
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
    // With motion off there is no loop, so repaint when the theme switches.
    const mo = new MutationObserver(() => { if (still) draw(ctx, w, h, 0) })
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
    return () => { cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); io.disconnect() }
  }, []) // draw/init read refs, so the loop is set up once
  return ref
}

type P3 = { x: number; y: number; z: number; size: number; rot: number; spin: number; color: number; alpha: number; phase: number }

// A brain built from ellipsoids (x: front–back, y: down, z: left–right; normalised units).
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

/** The signature visual: a brain of outlined triangles, slowly turning in 3D. */
export function Constellation({ className = '', count = 1300 }: { className?: string; count?: number }) {
  const pts = useRef<P3[]>([])
  const ref = useCanvasLoop(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h)
      const R = Math.min(w, h * 1.45) * 0.4
      const cx = w / 2, cy = h / 2
      const a = t * 0.07, tilt = 0.28
      const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt)
      const light = isLight()
      const pal = palette()
      const boost = light ? 1.3 : 1 // thin outlines read fainter on white
      ctx.lineWidth = light ? 1.2 : 1
      for (const p of pts.current) {
        const x1 = p.x * ca + p.z * sa
        const z1 = -p.x * sa + p.z * ca
        const y1 = p.y * ct - z1 * st
        const z2 = p.y * st + z1 * ct
        const k = 3 / (3 + z2)
        const depth = 0.55 + 0.45 * (1 - (z2 + 1.3) / 2.6)
        const twinkle = 0.7 + 0.3 * Math.sin(t * 1.3 + p.phase)
        ctx.globalAlpha = Math.max(0.05, Math.min(1, p.alpha * depth * twinkle * boost))
        ctx.strokeStyle = pal[p.color]
        ctx.beginPath()
        triangle(ctx, cx + x1 * R * k, cy + y1 * R * k, p.size * k, p.rot + t * p.spin)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    },
    w => {
      if (pts.current.length) return
      const n = w < 640 ? Math.round(count * 0.6) : count // a phone-sized brain needs fewer points to look dense
      const out: P3[] = []
      while (out.length < n) {
        const x = (Math.random() * 2 - 1) * 1.1, y = (Math.random() * 2 - 1) * 0.9, z = (Math.random() * 2 - 1) * 0.8
        const ambient = out.length > n * 0.9
        const d = lobeDist(x, y, z)
        if (!ambient) {
          if (d > 1) continue
          if (Math.abs(z) < 0.05 && y < 0.15) continue // fissure between hemispheres
          if (Math.random() > 0.12 + 0.88 * d ** 4) continue // denser towards the surface
          if (0.55 + 0.45 * Math.sin(9 * x + 5 * y + 3 * z) * Math.cos(7 * y - 4 * z) < Math.random() * 0.95) continue // folds
        } else if (d <= 1.05) continue
        out.push({
          x: ambient ? x * 1.6 : x, y: ambient ? y * 1.5 : y, z,
          size: 2 + Math.random() * 2.6, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.6,
          color: pickColor(), alpha: ambient ? 0.35 : 0.65 + Math.random() * 0.35, phase: Math.random() * 6.28,
        })
      }
      pts.current = out
    },
  )
  return <canvas ref={ref} aria-hidden className={`block h-full w-full ${className}`} />
}

type P2 = { x: number; y: number; vx: number; vy: number; size: number; rot: number; spin: number; color: number; alpha: number }

/** Sparse drifting triangles behind every page. */
export function AmbientField() {
  const pts = useRef<P2[]>([])
  const last = useRef(0)
  const ref = useCanvasLoop(
    (ctx, w, h, t) => {
      const dt = Math.min(0.05, t - last.current)
      last.current = t
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      const pal = palette()
      for (const p of pts.current) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.spin * dt
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        ctx.globalAlpha = p.alpha
        ctx.strokeStyle = pal[p.color]
        ctx.beginPath()
        triangle(ctx, p.x, p.y, p.size, p.rot)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    },
    (w, h) => {
      const n = Math.round(Math.min(90, (w * h) / 24000))
      pts.current = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 6, vy: -(3 + Math.random() * 9),
        size: 1.8 + Math.random() * 2.4, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.5,
        color: pickColor(), alpha: 0.18 + Math.random() * 0.27,
      }))
    },
  )
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 h-full w-full" />
}

/** Brand mark: an upward chevron, violet fading to teal. */
export function Logo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-grad" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#8052ff" />
          <stop offset="1" stopColor="#15846e" />
        </linearGradient>
      </defs>
      <path d="M12 2.5 21.5 20 12 14.8 2.5 20Z" fill="url(#logo-grad)" />
    </svg>
  )
}
