import { ACTS } from '../data/facts'
import { SectionHead } from './SectionHead'
import { CoreLanes } from './CoreLanes'
import { Reveal } from './Reveal'

export function ProblemSection() {
  return (
    <section className="section hair" id="problem">
      <div className="wrap">
        <SectionHead
          act={ACTS.problem.n}
          actLabel={ACTS.problem.label}
          kicker="gzip runs in a single lane"
          title={
            <>
              A ten-core machine, and gzip <span className="accent">using one of them.</span>
            </>
          }
          lead={
            <>
              DEFLATE is a sequential loop — read a byte, slide the window, emit codes, repeat.{' '}
              <code>java.util.zip.GZIPOutputStream</code> runs that loop on a single thread, so on a
              ten-core machine one core works and nine wait. The throughput you paid for is left on
              the floor.
            </>
          }
        />
        <Reveal>
          <CoreLanes />
        </Reveal>
      </div>
    </section>
  )
}
