import { useEffect, useRef } from 'react'

/**
 * Micro-interaction primitives — the polish layer.
 *
 * Every hook here is imperative (it wires DOM listeners in an effect and mutates
 * style/CSS-vars directly) so it never triggers a React re-render on pointer move,
 * and every one is a no-op under prefers-reduced-motion. They are tuned to the
 * ink + amber palette via the CSS in interactions.css.
 */

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Cursor-follow spotlight. Sets --spot-x / --spot-y (px, element-local) and
 * toggles `.spot-on` so a soft amber radial can track the pointer inside the
 * element. The glow itself lives in CSS (behind the content), so readability is
 * never touched.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    let raf = 0
    let x = 0
    let y = 0
    const paint = () => {
      raf = 0
      el.style.setProperty('--spot-x', `${x}px`)
      el.style.setProperty('--spot-y', `${y}px`)
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      x = e.clientX - r.left
      y = e.clientY - r.top
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const onEnter = () => el.classList.add('spot-on')
    const onLeave = () => {
      el.classList.remove('spot-on')
      if (raf) cancelAnimationFrame(raf), (raf = 0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return ref
}

/**
 * Magnetic pull — the element eases toward the pointer while hovered and springs
 * back on leave. Used on primary CTAs. Small strength; smooth, not bouncy.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.32, max = 10) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const tx = Math.max(-max, Math.min(max, dx * strength))
      const ty = Math.max(-max, Math.min(max, dy * strength))
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mag-x', `${tx}px`)
        el.style.setProperty('--mag-y', `${ty}px`)
      })
    }
    const onEnter = () => el.classList.add('mag-on')
    const onLeave = () => {
      el.classList.remove('mag-on')
      el.style.setProperty('--mag-x', '0px')
      el.style.setProperty('--mag-y', '0px')
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [strength, max])
  return ref
}

/**
 * Subtle 3D tilt that follows the cursor, plus it doubles as a spotlight source
 * (sets --spot-x / --spot-y too) so a single signature card can carry both the
 * parallax and the sheen. Small angles; a gentle perspective.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 5) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    let raf = 0
    let rx = 0
    let ry = 0
    let sx = 0
    let sy = 0
    const paint = () => {
      raf = 0
      el.style.setProperty('--tilt-x', `${rx.toFixed(2)}deg`)
      el.style.setProperty('--tilt-y', `${ry.toFixed(2)}deg`)
      el.style.setProperty('--spot-x', `${sx}px`)
      el.style.setProperty('--spot-y', `${sy}px`)
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      ry = px * maxDeg * 2
      rx = -py * maxDeg * 2
      sx = e.clientX - r.left
      sy = e.clientY - r.top
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const onEnter = () => el.classList.add('tilt-on', 'spot-on')
    const onLeave = () => {
      el.classList.remove('tilt-on', 'spot-on')
      el.style.setProperty('--tilt-x', '0deg')
      el.style.setProperty('--tilt-y', '0deg')
      if (raf) cancelAnimationFrame(raf), (raf = 0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [maxDeg])
  return ref
}

/**
 * Per-character cursor magnet — the echo of the reference portfolio's cursor-
 * reactive wordmark, done with lightweight per-letter transforms instead of a
 * canvas swarm. Characters near the pointer lift and warm (amber) via a proximity
 * weight written to each `.rx-char` as --w (0..1); the visual response is in CSS.
 */
export function useCharField<T extends HTMLElement>(radius = 120) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const chars = Array.from(el.querySelectorAll<HTMLElement>('.rx-char'))
    if (!chars.length) return
    let raf = 0
    let mx = 0
    let my = 0
    const paint = () => {
      raf = 0
      for (const c of chars) {
        const r = c.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const d = Math.hypot(mx - cx, my - cy)
        const w = Math.max(0, 1 - d / radius)
        c.style.setProperty('--w', w.toFixed(3))
      }
    }
    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf), (raf = 0)
      for (const c of chars) c.style.setProperty('--w', '0')
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [radius])
  return ref
}
