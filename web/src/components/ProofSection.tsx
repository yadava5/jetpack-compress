import { ACTS, TESTS } from '../data/facts'
import { SectionHead } from './SectionHead'
import { BenchBars } from './BenchBars'
import { Reveal } from './Reveal'
import { CheckIcon } from './icons'

export function ProofSection() {
  return (
    <section className="section hair" id="proof">
      <div className="wrap">
        <SectionHead
          act={ACTS.proof.n}
          actLabel={ACTS.proof.label}
          kicker="measured, not estimated"
          title={
            <>
              The numbers, and exactly what <span className="accent">they mean.</span>
            </>
          }
          lead="Real JMH throughput from a reduced quick run on this machine — each figure scoped to what it measures, error bars shown where a number is soft. Then the part that actually matters: it is provably still gzip."
        />

        <BenchBars />

        <div className="impl-movement">
          <Reveal>
            <div className="impl-subhead">
              <div className="kicker">correctness is the headline feature</div>
              <h3 className="impl-subhead-title">
                {TESTS.total} tests. <span className="accent">Zero failures.</span>
              </h3>
              <p className="impl-subhead-lead">
                Round-trips, SIMD known-answer vectors, CRC folding, FFM mmap, and cross-tool checks
                against the system gzip(1) — re-run under OpenJDK 25.0.3.
              </p>
            </div>
          </Reveal>
          <div className="tests-grid">
            {TESTS.suites.map((s, i) => (
              <Reveal key={s.name} delay={(i % 2) * 70}>
                <div className="card test-row">
                  <div className="test-row-top">
                    <span className="test-name mono">{s.name}</span>
                    <span className="chip test-count">
                      <CheckIcon size={12} />
                      {s.count}
                    </span>
                  </div>
                  <p className="test-proves">{s.proves}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="tests-summary mono">
              Tests run: {TESTS.total} · Failures: 0 · Errors: 0 · Skipped: 0
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
