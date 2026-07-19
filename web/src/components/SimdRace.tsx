import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useInView } from '../hooks/useInView'
import { ADLER_BENCH } from '../data/facts'

/**
 * Visual 2 — scalar vs vectorized Adler-32, racing over the same 8 MiB buffer.
 * The vector lane consumes a 16-byte NEON stride but finishes 2.8x sooner, not 16x:
 * the honest gain, because the reductions + modulo are not free and this is not the JDK intrinsic.
 */

const TOTAL_BYTES = 8 * 1024 * 1024
const SCALAR_MS = 3400
const RATIO = ADLER_BENCH.headline // "2.8×"
const RATIO_NUM = 2.8
const VECTOR_MS = SCALAR_MS / RATIO_NUM

function fmtMiB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2)
}

export function SimdRace() {
  const reduced = useReducedMotion()
  const [container, inView] = useInView<HTMLDivElement>(0.35)
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')

  const scalarFill = useRef<HTMLDivElement>(null)
  const vectorFill = useRef<HTMLDivElement>(null)
  const scalarNum = useRef<HTMLSpanElement>(null)
  const vectorNum = useRef<HTMLSpanElement>(null)
  const raf = useRef<number | null>(null)

  const paint = (
    fill: React.RefObject<HTMLDivElement | null>,
    num: React.RefObject<HTMLSpanElement | null>,
    frac: number,
  ) => {
    if (fill.current) fill.current.style.width = `${(frac * 100).toFixed(2)}%`
    if (num.current) num.current.textContent = fmtMiB(frac * TOTAL_BYTES)
  }

  const run = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    if (reduced) {
      paint(scalarFill, scalarNum, 1)
      paint(vectorFill, vectorNum, 1)
      setStatus('done')
      return
    }
    setStatus('running')
    const start = performance.now()
    const tick = (now: number) => {
      const t = now - start
      const sc = Math.min(1, t / SCALAR_MS)
      const ve = Math.min(1, t / VECTOR_MS)
      paint(scalarFill, scalarNum, sc)
      paint(vectorFill, vectorNum, ve)
      if (sc >= 1 && ve >= 1) {
        setStatus('done')
        raf.current = null
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [reduced])

  // Auto-run once when it scrolls into view.
  useEffect(() => {
    if (inView && status === 'idle') run()
  }, [inView, status, run])

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current) }, [])

  return (
    <div className="card viz-card" ref={container}>
      <div className="race-head" style={{ marginBottom: 18 }}>
        <div className="kicker">Adler-32 · vector vs scalar</div>
        <button className="btn" onClick={run} disabled={status === 'running'} aria-label="Run the race again">
          <PlayIcon />
          {status === 'running' ? 'running…' : 'run again'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 22 }}>
        <div className="race-lane">
          <div className="race-head">
            <span className="chip tag-deleg">scalar</span>
            <span className="race-num" style={{ color: 'var(--color-muted)' }}>
              1 byte / step ·{' '}
              <span ref={scalarNum} style={{ color: 'var(--color-steel)' }}>
                0.00
              </span>{' '}
              / 8.00 MiB
            </span>
          </div>
          <div className="race-track scalar">
            <div className="race-fill scalar" ref={scalarFill} />
          </div>
        </div>

        <div className="race-lane">
          <div className="race-head">
            <span className="chip tag-hand">vector</span>
            <span className="race-num" style={{ color: 'var(--color-muted)' }}>
              16-byte NEON stride ·{' '}
              <span ref={vectorNum} style={{ color: 'var(--color-amber)' }}>
                0.00
              </span>{' '}
              / 8.00 MiB
            </span>
          </div>
          <div className="race-track vector">
            <div className="race-fill vector" ref={vectorFill} />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div
          className="stat-num"
          style={{ fontSize: '2.1rem', color: status === 'done' ? 'var(--color-amber)' : 'var(--color-faint)', transition: 'color .4s ease' }}
        >
          {RATIO}
        </div>
        <p className="viz-cap" style={{ maxWidth: 560, margin: 0 }}>
          vector over scalar — both pure Java, only the Vector API differs. It consumes 16 bytes per
          stride but lands at <span style={{ color: 'var(--color-amber)' }}>2.8×</span>, not 16×: the
          reductions and modulo are real work. This is <em>not</em> compared to the JDK's native
          Adler-32 intrinsic.
        </p>
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M2 1.5v9l8-4.5z" />
    </svg>
  )
}
