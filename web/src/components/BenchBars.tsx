import { useInView } from '../hooks/useInView'
import { ADLER_BENCH, COMPRESSION_BENCH, BENCH_META } from '../data/facts'

type Role = 'baseline' | 'hero' | 'reference'
type Bar = {
  id: string
  label: string
  note: string
  value: number
  mult: number
  role: Role
  errorPct?: number
}

function BarGroup({
  eyebrow,
  headline,
  headlineSub,
  unit,
  max,
  bars,
  footer,
}: {
  eyebrow: string
  headline: string
  headlineSub: string
  unit: string
  max: number
  bars: Bar[]
  footer: string
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.3)

  return (
    <div className="card viz-card" ref={ref}>
      <div className="kicker" style={{ marginBottom: 14 }}>
        {eyebrow}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <span className="stat-num" style={{ fontSize: '2.4rem', color: 'var(--color-amber)' }}>
          {headline}
        </span>
        <span className="viz-cap" style={{ fontSize: '0.82rem' }}>
          {headlineSub}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        {bars.map((b) => {
          const pct = (b.value / max) * 100
          const wLeft = b.errorPct ? (b.value * (1 - b.errorPct / 100)) / max : 0
          const wRight = b.errorPct ? (b.value * (1 + b.errorPct / 100)) / max : 0
          return (
            <div className="bar-row" key={b.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--color-fg)' }}>
                  {b.label}
                  <span style={{ color: 'var(--color-faint)' }}> · {b.note}</span>
                </span>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline', flex: 'none' }}>
                  <span className="mono" style={{ fontSize: '0.86rem', color: 'var(--color-muted)' }}>
                    {b.value} {unit}
                  </span>
                  <span className={`mult-chip ${b.role === 'hero' ? 'hero' : ''}`}>
                    {b.role === 'reference' ? `${b.mult}× · ref` : `${b.mult}×`}
                  </span>
                </span>
              </div>
              <div className="bar-track">
                <div
                  className={`bar-fill ${b.role}`}
                  style={{ width: inView ? `${pct}%` : '0%' }}
                  aria-hidden="true"
                />
                {b.errorPct ? (
                  <div
                    className={`whisker ${inView ? 'in' : ''}`}
                    style={{ left: `${wLeft * 100}%`, width: `${(wRight - wLeft) * 100}%` }}
                    title={`±${b.errorPct}%`}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <p className="viz-cap" style={{ marginTop: 18 }}>
        {footer}
      </p>
    </div>
  )
}

export function BenchBars() {
  const adlerBars: Bar[] = ADLER_BENCH.bars.map((b) => ({
    id: b.id,
    label: b.label,
    note: b.note,
    value: b.gbps,
    mult: b.mult,
    role: b.role,
  }))
  const adlerMax = Math.max(...ADLER_BENCH.bars.map((b) => b.gbps))

  const compBars: Bar[] = COMPRESSION_BENCH.bars.map((b) => ({
    id: b.id,
    label: b.label,
    note: b.note,
    value: b.mbps,
    mult: b.mult,
    role: b.role,
    errorPct: 'errorPct' in b ? b.errorPct : undefined,
  }))
  // Headroom so the +50% whisker on the parallel bar fits inside the track.
  const compMax = 434.6 * 1.5

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="bench-grid">
        <BarGroup
          eyebrow="SIMD · Adler-32 throughput"
          headline={ADLER_BENCH.headline}
          headlineSub={ADLER_BENCH.headlineSub}
          unit={ADLER_BENCH.unit}
          max={adlerMax}
          bars={adlerBars}
          footer={`Measured over an ${ADLER_BENCH.buffer}. The JDK intrinsic is a native reference point, shown to be honest about the ceiling — not a target that was beaten.`}
        />
        <BarGroup
          eyebrow="Parallel · compression throughput"
          headline={COMPRESSION_BENCH.headline}
          headlineSub={COMPRESSION_BENCH.headlineSub}
          unit={COMPRESSION_BENCH.unit}
          max={compMax}
          bars={compBars}
          footer={`Same DEFLATE level 6 on a ${COMPRESSION_BENCH.corpus}. The whisker is the ±50% spread on the quick run — indicative, not rigorous.`}
        />
      </div>

      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-faint)', display: 'grid', gap: 6 }}>
          <div>
            <span style={{ color: 'var(--color-muted)' }}>machine</span> · {BENCH_META.machine}
          </div>
          <div>
            <span style={{ color: 'var(--color-muted)' }}>jvm</span> · {BENCH_META.jvm}
            <span style={{ margin: '0 8px', color: 'var(--color-line2)' }}>|</span>
            <span style={{ color: 'var(--color-muted)' }}>harness</span> · {BENCH_META.harness}
          </div>
          <div style={{ color: 'var(--color-faint)' }}>{BENCH_META.caveat}</div>
        </div>
      </div>
    </div>
  )
}
