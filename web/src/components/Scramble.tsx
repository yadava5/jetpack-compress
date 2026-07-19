import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * A "decompress" text reveal: the word arrives as a run of byte-like glyphs that
 * resolve, left to right, into the real characters — the compression motif applied
 * to type. Fires once when it scrolls into view, and replays on hover.
 *
 * Honesty/accessibility: the real string is exposed via aria-label and the animated
 * glyphs are aria-hidden, so assistive tech and reduced-motion users always get the
 * final word, never the scramble.
 */
const GLYPHS = '0123456789ABCDEF<>/{}=+*·xz'

export function Scramble({
  text,
  className = '',
  replayOnHover = true,
}: {
  text: string
  className?: string
  replayOnHover?: boolean
}) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLSpanElement>(0.6)
  const [display, setDisplay] = useState(text)
  const raf = useRef<number | null>(null)
  const ranOnce = useRef(false)

  const run = () => {
    if (reduced) {
      setDisplay(text)
      return
    }
    if (raf.current) cancelAnimationFrame(raf.current)
    const len = text.length
    const start = performance.now()
    const dur = Math.min(120 * len, 900)
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const revealed = Math.floor(t * len)
      frame++
      let out = ''
      for (let i = 0; i < len; i++) {
        const ch = text[i]
        if (ch === ' ') out += ' '
        else if (i < revealed) out += ch
        else if (frame % 2 === 0) out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
        else out += display[i] && display[i] !== ' ' ? display[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      setDisplay(out)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else {
        setDisplay(text)
        raf.current = null
      }
    }
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (inView && !ranOnce.current) {
      ranOnce.current = true
      run()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current) }, [])

  return (
    <span
      ref={ref}
      className={`scramble ${className}`}
      aria-label={text}
      onPointerEnter={replayOnHover ? run : undefined}
    >
      <span aria-hidden="true">{display}</span>
    </span>
  )
}
