import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * The signature — jetpack's own closing flow-mark. A scattered stream of bytes
 * collapses inward and folds into one compact glyph (the compression arrow inside
 * a single gzip member), which then signs off with the wordmark. It is original to
 * this project: a compression motif, not a borrowed one.
 *
 * On scroll-in it plays once; a quiet "replay" re-runs it. Reduced motion shows the
 * resolved mark immediately, with no collapse.
 */

// Byte start positions (spread around the centre), in px, with a stagger delay.
const BYTES = Array.from({ length: 18 }, (_, i) => {
  const ang = (i / 18) * Math.PI * 2 + (i % 3) * 0.4
  const r = 120 + ((i * 37) % 90)
  return {
    sx: Math.round(Math.cos(ang) * r * 1.7),
    sy: Math.round(Math.sin(ang) * r * 0.62),
    d: (i % 6) * 60 + ((i * 53) % 40),
    tone: i % 3 === 0 ? 'steel' : 'amber',
  }
})

export function EndingMark() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>(0.4)
  const [runId, setRunId] = useState(0)
  const played = useRef(false)

  useEffect(() => {
    if (inView && !played.current) {
      played.current = true
      setRunId((n) => n + 1)
    }
  }, [inView])

  const play = runId > 0
  const stateCls = reduced ? 'reduced' : play ? 'play' : ''

  return (
    <section className="ending" aria-label="jetpack-compress">
      <div className="wrap ending-wrap">
        <div className={`ending-stage ${stateCls}`} ref={ref} key={runId}>
          {!reduced &&
            BYTES.map((b, i) => (
              <span
                key={i}
                className={`efx-byte ${b.tone}`}
                style={
                  {
                    '--sx': `${b.sx}px`,
                    '--sy': `${b.sy}px`,
                    '--d': `${b.d}ms`,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              />
            ))}

          <svg className="ending-mark" viewBox="0 0 96 96" role="img" aria-label="jetpack-compress mark">
            <rect
              className="ending-member"
              x="6"
              y="20"
              width="84"
              height="56"
              rx="14"
            />
            <g
              className="ending-glyph"
              fill="none"
              stroke="var(--color-amber)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path className="gp" d="M26 34 H44" />
              <path className="gp" d="M26 48 H52" />
              <path className="gp" d="M26 62 H44" />
              <path className="gp gp-arrow" d="M44 34 L58 48 L44 62" />
              <path className="gp gp-arrow" d="M58 48 H72" />
            </g>
          </svg>
        </div>

        <div className={`ending-sign ${stateCls}`}>
          <p className="ending-word sqz-host">
            jetpack-<span className="squeeze accent">compress</span>
          </p>
          <p className="ending-tag mono">
            bytes in, parallel — one valid gzip member out
          </p>
          {!reduced && (
            <button
              type="button"
              className="ending-replay mono"
              onClick={() => setRunId((n) => n + 1)}
              aria-label="Replay the closing animation"
            >
              <ReplayIcon />
              replay
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function ReplayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M11.5 3.5A5 5 0 1 0 12 7" strokeLinecap="round" />
      <path d="M11.5 1.5v2.6H8.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
