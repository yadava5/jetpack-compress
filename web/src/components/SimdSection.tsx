import { SectionHead } from './SectionHead'
import { SimdRace } from './SimdRace'
import { Reveal } from './Reveal'

const NOTES = [
  {
    t: 'The problem',
    b: 'Serial Adler-32 has a loop-carried dependency — each A feeds the next B — which blocks naive vectorization.',
  },
  {
    t: 'The decomposition',
    b: 'Accumulate two order-free sums over a segment: S1 = Σ bⱼ and S2 = Σ j·bⱼ. Both are plain reductions, so both vectorize.',
  },
  {
    t: 'Kept exact',
    b: 'Segments are capped at NMAX = 5552 bytes so accumulators never overflow before the modulo. Bit-identical to java.util.zip.Adler32.',
  },
]

export function SimdSection() {
  return (
    <section className="section hair" id="simd">
      <div className="wrap">
        <SectionHead
          kicker="hand-vectorized SIMD"
          title={
            <>
              Adler-32, decomposed so it <span className="accent">vectorizes.</span>
            </>
          }
          lead="This is the project's genuinely hand-written SIMD component — byte→int lane widening and position-weighted reductions on the Vector API, reading straight from a memory-mapped segment."
        />
        <Reveal>
          <SimdRace />
        </Reveal>
        <div className="simd-notes">
          {NOTES.map((n, i) => (
            <Reveal key={n.t} delay={i * 80}>
              <div className="card simd-note">
                <div className="simd-note-t mono">{n.t}</div>
                <p>{n.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
