import { useInView } from '../hooks/useInView'
import { ADLER_BENCH } from '../data/facts'
import { CountUp } from './CountUp'

/**
 * Adler-32 throughput as a dial, not a bar. The arc runs 0 → the JDK's native
 * intrinsic, so the honest story is spatial: the hand-vectorized result (amber)
 * clears the scalar baseline (steel) by 2.8×, and the native intrinsic sits far
 * up the dial as a ceiling that was never claimed. The amber arc sweeps in on
 * scroll; reduced motion shows it filled.
 */

const MAX = 15 // GB/s — a hair above the native intrinsic (14.1)
const CX = 180
const CY = 172
const R = 132

const scalar = ADLER_BENCH.bars.find((b) => b.id === 'scalar')!
const vector = ADLER_BENCH.bars.find((b) => b.id === 'vector')!
const intrinsic = ADLER_BENCH.bars.find((b) => b.id === 'intrinsic')!

function pt(frac: number, r = R) {
  const a = Math.PI * (1 - Math.min(1, Math.max(0, frac)))
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }
}
function arc(f0: number, f1: number, r = R) {
  const s = pt(f0, r)
  const e = pt(f1, r)
  const large = f1 - f0 > 0.5 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}
function tick(frac: number, inner: number, outer: number) {
  const a = pt(frac, inner)
  const b = pt(frac, outer)
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

export function AdlerGauge() {
  const [ref, inView] = useInView<HTMLDivElement>(0.4)
  const fScalar = scalar.gbps / MAX
  const fVector = vector.gbps / MAX
  const fIntr = intrinsic.gbps / MAX
  const knob = pt(fVector)

  return (
    <div className="card viz-card gauge-card" ref={ref}>
      <div className="kicker" style={{ marginBottom: 6 }}>
        SIMD · Adler-32 throughput
      </div>

      <div className="gauge-stage">
        <svg className={`gauge-svg ${inView ? 'in' : ''}`} viewBox="0 0 360 210" role="img"
          aria-label={`Adler-32 throughput dial. Scalar ${scalar.gbps} gigabytes per second, hand-vectorized ${vector.gbps}, the JDK native intrinsic ${intrinsic.gbps} as an unbeaten reference ceiling.`}>
          {/* track */}
          <path d={arc(0, 1)} className="gauge-track" pathLength={1} />
          {/* achieved: 0 -> vector (amber), draws in */}
          <path d={arc(0, fVector)} className="gauge-arc" pathLength={1} />

          {/* scalar baseline tick */}
          <path d={tick(fScalar, R - 13, R + 5)} className="gauge-tick-scalar" />
          <text {...labelPos(fScalar, R + 24)} className="gauge-mini" fill="var(--color-steel)">
            scalar
          </text>

          {/* intrinsic ceiling — dashed, explicitly a reference (numbers live in the legend) */}
          <path d={tick(fIntr, R - 13, R + 5)} className="gauge-tick-intr" />
          <text {...labelPos(fIntr, R + 23)} dy={-3} className="gauge-mini" fill="var(--color-faint)">
            intrinsic
          </text>
          <text {...labelPos(fIntr, R + 23)} dy={9} className="gauge-mini-2" fill="var(--color-faint)">
            ceiling
          </text>

          {/* vector knob (the hero) */}
          <circle cx={knob.x} cy={knob.y} r={9} className="gauge-knob">
            <title>Hand-vectorized Adler-32 — {vector.gbps} GB/s (Vector API)</title>
          </circle>
          <circle cx={knob.x} cy={knob.y} r={3.5} fill="#1a1204" />

          {/* endpoints */}
          <text x={pt(0).x} y={pt(0).y + 18} textAnchor="middle" className="gauge-mini-2">0</text>
          <text x={pt(1).x} y={pt(1).y + 18} textAnchor="middle" className="gauge-mini-2">{MAX} GB/s</text>
        </svg>

        <div className="gauge-readout">
          <div className="gauge-mult">
            <CountUp value={2.8} decimals={1} suffix="×" />
          </div>
          <div className="gauge-readout-cap">
            vector over scalar
            <br />
            <span style={{ color: 'var(--color-faint)' }}>both pure Java · only the Vector API differs</span>
          </div>
        </div>
      </div>

      <div className="gauge-legend">
        <LegendRow tone="steel" label="Adler32.scalar" note="pure-Java baseline" value={`${scalar.gbps} GB/s`} />
        <LegendRow tone="amber" label="Adler32.vector" note="hand-vectorized SIMD" value={`${vector.gbps} GB/s`} />
        <LegendRow tone="ref" label="Adler32.jdkIntrinsic" note="native — reference, not a target" value={`${intrinsic.gbps} GB/s`} />
      </div>

      <p className="viz-cap" style={{ marginTop: 14 }}>
        Measured over an {ADLER_BENCH.buffer}. The intrinsic is shown to be honest about the
        ceiling — the vector-vs-scalar gap is the real result.
      </p>
    </div>
  )
}

function labelPos(frac: number, r: number) {
  const p = pt(frac, r)
  return { x: p.x, y: p.y, textAnchor: 'middle' as const }
}

function LegendRow({ tone, label, note, value }: { tone: 'steel' | 'amber' | 'ref'; label: string; note: string; value: string }) {
  return (
    <div className="gauge-leg-row">
      <span className={`gauge-swatch ${tone}`} aria-hidden="true" />
      <span className="mono gauge-leg-label">{label}</span>
      <span className="gauge-leg-note">{note}</span>
      <span className="mono gauge-leg-val">{value}</span>
    </div>
  )
}
