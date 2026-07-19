import { useInView } from '../hooks/useInView'
import { COMPRESSION_BENCH, PROBLEM } from '../data/facts'
import { CountUp } from './CountUp'

/**
 * Parallel compression as WALL-TIME, not a bar pair. The x-axis is time to compress
 * the same corpus: the single thread runs the whole width; the parallel workers each
 * finish in ~1/6.5 of it. The ±50% spread from the quick run is drawn as a real
 * uncertainty band around the parallel finish — so the softness of the number is
 * visible, not hidden. Bars grow in on scroll; reduced motion shows them settled.
 */

const single = COMPRESSION_BENCH.bars[0] // GZIPOutputStream, 66.8 MB/s
const parallel = COMPRESSION_BENCH.bars[1] // block-parallel, 434.6 MB/s, ±50%
const err = 'errorPct' in parallel ? parallel.errorPct : 0

// time is inversely proportional to throughput; express as a fraction of single-thread time
const tPar = single.mbps / parallel.mbps
const tFast = single.mbps / (parallel.mbps * (1 + err / 100))
const tSlow = single.mbps / (parallel.mbps * (1 - err / 100))

const LANES = Math.min(PROBLEM.cores, 10)

export function ParallelTimeline() {
  const [ref, inView] = useInView<HTMLDivElement>(0.35)
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`

  return (
    <div className="card viz-card timeline-card" ref={ref}>
      <div className="kicker" style={{ marginBottom: 6 }}>
        Parallel · compression wall-time
      </div>

      <div className="tl-headline">
        <span className="gauge-mult">
          <CountUp value={parallel.mult} decimals={1} prefix="~" suffix="×" />
        </span>
        <span className="viz-cap" style={{ fontSize: '0.82rem' }}>
          faster to compress the same corpus · <span style={{ color: 'var(--color-muted)' }}>±{err}% on the quick run</span>
        </span>
      </div>

      <div className={`tl-plot ${inView ? 'in' : ''}`}>
        {/* single-thread — the whole width is its wall time */}
        <div className="tl-block">
          <div className="tl-row-label mono">
            <span className="tl-dot steel" /> single-thread
            <span className="tl-sub">GZIPOutputStream · {single.mbps} MB/s</span>
          </div>
          <div className="tl-track">
            <div className="tl-bar single" style={{ width: '100%' }} />
          </div>
        </div>

        {/* parallel — the workers finish in a fraction of that time */}
        <div className="tl-block">
          <div className="tl-row-label mono">
            <span className="tl-dot amber" /> parallel · {LANES} cores
            <span className="tl-sub">block-parallel on virtual threads · {parallel.mbps} MB/s</span>
          </div>
          <div className="tl-track tall">
            {/* ±50% uncertainty band around the parallel finish */}
            <div
              className="tl-band"
              style={{ left: pct(tFast), width: pct(tSlow - tFast) }}
              title={`±${err}% spread — the parallel figure could land anywhere in this band`}
            />
            <div className="tl-lanes">
              {Array.from({ length: LANES }, (_, i) => (
                <div
                  key={i}
                  className="tl-lane"
                  style={{ width: pct(tPar), transitionDelay: `${i * 45}ms` }}
                />
              ))}
            </div>
            <div className="tl-finish" style={{ left: pct(tPar) }}>
              <span className="tl-finish-cap mono">~{parallel.mult}× faster</span>
            </div>
          </div>
        </div>

        {/* axis */}
        <div className="tl-axis mono">
          <span style={{ left: '0%' }}>0</span>
          <span style={{ left: pct(tPar) }}>parallel done</span>
          <span style={{ left: '100%' }}>single done</span>
        </div>
      </div>

      <p className="viz-cap" style={{ marginTop: 16 }}>
        Same DEFLATE level 6 on a {COMPRESSION_BENCH.corpus}. The band is the ±{err}% spread on the
        quick run — indicative, not rigorous.
      </p>
    </div>
  )
}
