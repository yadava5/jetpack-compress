import { ACTS, SOLUTION_INVARIANTS } from '../data/facts'
import { SectionHead } from './SectionHead'
import { PipelineViz } from './PipelineViz'
import { Reveal } from './Reveal'

export function SolutionSection() {
  return (
    <section className="section hair" id="solution">
      <div className="wrap">
        <SectionHead
          act={ACTS.solution.n}
          actLabel={ACTS.solution.label}
          kicker="split the stream · keep the format"
          title={
            <>
              Cut it into blocks. Compress them at once.{' '}
              <span className="accent">Stitch one gzip member.</span>
            </>
          }
          lead={
            <>
              Hand every core a slice. Compress the blocks concurrently, then concatenate them into
              one standard gzip stream — the kind <code>gzip -d</code>, <code>zcat</code>, and{' '}
              <code>GZIPInputStream</code> all decompress without ever knowing it was made in
              parallel.
            </>
          }
        />

        <Reveal>
          <figure className="solution-viz card viz-card">
            <PipelineViz />
            <figcaption className="viz-cap solution-viz-cap">
              One input, memory-mapped and split into 1 MiB blocks, each compressed on its own virtual
              thread, then stitched with <code>SYNC_FLUSH</code> into a single gzip member — the
              trailer CRC folded from per-block CRCs.
            </figcaption>
          </figure>
        </Reveal>

        <div className="invariant-grid">
          {SOLUTION_INVARIANTS.map((n, i) => (
            <Reveal key={n.title} delay={i * 90}>
              <article className="card invariant-card">
                <div className="invariant-tick" aria-hidden="true" />
                <h3 className="invariant-title">{n.title}</h3>
                <p className="invariant-body">{n.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
