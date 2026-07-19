import { useEffect, useRef, useState } from 'react'

/**
 * Fires once when the element scrolls into view (used to trigger reveal + bar animations).
 * Falls back to visible when IntersectionObserver is unavailable.
 */
export function useInView<T extends Element>(threshold = 0.2, once = true) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) obs.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, once])

  return [ref, inView] as const
}
