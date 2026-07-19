import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * A number that rolls up from zero the first time it scrolls into view. Under
 * reduced motion (or no IntersectionObserver) it renders the final value at once,
 * so the fact is always readable — the roll is decoration, never the source of truth.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1100,
  className = '',
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>(0.6)
  const [display, setDisplay] = useState(reduced ? value : 0)
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    if (reduced) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic — quick then settle
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, value, duration])

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
