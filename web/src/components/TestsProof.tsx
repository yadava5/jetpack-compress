import { TESTS } from '../data/facts'
import { SectionHead } from './SectionHead'
import { Reveal } from './Reveal'
import { CheckIcon } from './icons'

export function TestsProof() {
  return (
    <section className="section hair" id="tests">
      <div className="wrap">
        <SectionHead
          kicker="correctness is the headline feature"
          title={
            <>
              {TESTS.total} tests. <span className="accent">Zero failures.</span>
            </>
          }
          lead="Round-trips, SIMD known-answer vectors, CRC folding, FFM mmap, and cross-tool checks against the system gzip(1) — re-run under OpenJDK 25.0.3."
        />
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
    </section>
  )
}
