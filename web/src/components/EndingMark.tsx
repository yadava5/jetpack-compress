import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * The signature — jetpack's own closing flow-mark, now a full-bleed band at the
 * very bottom of the page (the AutoML-landing treatment, in jetpack's own
 * compression language). Scattered bytes rain in across the WHOLE width and
 * collapse into eight parallel chunk blocks — the workers — which then sink
 * into one continuous amber gzip member drawn edge to edge along the page's
 * bottom edge. A quiet shine keeps sweeping the member afterwards. The glyph
 * mark and wordmark sign off above it.
 *
 * On scroll-in it plays once; clicking the band (or the quiet replay control)
 * re-runs it. Reduced motion shows the resolved band immediately: member
 * stitched, mark drawn, no collapse and no shine.
 */

const CHUNKS = 8
const BYTES_PER_CHUNK = 6

// Deterministic scatter per chunk — replays are identical, and the initial
// render never depends on Math.random.
const BYTES = Array.from({ length: CHUNKS * BYTES_PER_CHUNK }, (_, i) => {
  const c = Math.floor(i / BYTES_PER_CHUNK)
  const j = i % BYTES_PER_CHUNK
  const ang = (j / BYTES_PER_CHUNK) * Math.PI * 2 + c * 0.7
  const r = 46 + ((i * 37) % 52)
  return {
    c,
    cx: ((c + 0.5) / CHUNKS) * 100, // lane centre, % of band width
    sx: Math.round(Math.cos(ang) * r * 1.5),
    sy: Math.round(Math.sin(ang) * r * 0.8) - 26,
    d: c * 70 + ((i * 53) % 60),
    tone: i % 3 === 0 ? 'steel' : 'amber',
  }
})

export function EndingMark() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>(0.35)
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
  const replay = () => setRunId((n) => n + 1)

  return (
    <section className="ending" aria-label="jetpack-compress">
      {/* the sign-off — centered over the band */}
      <div className={`ending-sign ${stateCls}`}>
        <svg className="ending-mark" viewBox="0 0 96 96" role="img" aria-label="jetpack-compress mark">
          <rect className="ending-member" x="6" y="20" width="84" height="56" rx="14" />
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
        <p className="ending-word sqz-host">
          jetpack-<span className="squeeze accent">compress</span>
        </p>
        <p className="ending-tag mono">bytes in, parallel — one valid gzip member out</p>
        {!reduced && (
          <button type="button" className="ending-replay mono" onClick={replay} aria-label="Replay the closing animation">
            <ReplayIcon />
            replay
          </button>
        )}
      </div>

      {/* the full-bleed stage: byte rain → chunk blocks → one member */}
      <div
        className={`ending-stage ${stateCls}`}
        ref={ref}
        key={runId}
        onClick={reduced ? undefined : replay}
        aria-hidden="true"
      >
        {!reduced &&
          BYTES.map((b, i) => (
            <span
              key={i}
              className={`efx-byte ${b.tone}`}
              style={
                {
                  '--cx': `${b.cx}%`,
                  '--sx': `${b.sx}px`,
                  '--sy': `${b.sy}px`,
                  '--d': `${b.d}ms`,
                } as React.CSSProperties
              }
            />
          ))}

        {/* the eight parallel chunk blocks — the workers */}
        {Array.from({ length: CHUNKS }, (_, c) => (
          <span
            key={c}
            className="efx-block mono"
            style={
              {
                '--bx': `${(c / CHUNKS) * 100}%`,
                '--bd': `${900 + c * 90}ms`,
                '--sd': `${1500 + c * 110}ms`,
              } as React.CSSProperties
            }
          >
            blk {c}
          </span>
        ))}

        {/* one continuous gzip member, edge to edge on the page's bottom */}
        <span className="efx-member" />
        {!reduced && <span className="efx-member-shine" />}
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
