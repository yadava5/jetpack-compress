import { ByteField } from './components/ByteField'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { ProblemSection } from './components/ProblemSection'
import { SolutionSection } from './components/SolutionSection'
import { ImplementationSection } from './components/ImplementationSection'
import { ProofSection } from './components/ProofSection'
import { TryItSection } from './components/TryItSection'
import { PortfolioStrip } from './components/PortfolioStrip'
import { EndingMark } from './components/EndingMark'

/**
 * The landing is a five-act scroll that flows on arrival — no prompt to begin:
 *   Hero — the thesis, and the payoff motif (one gzip member).
 *   01 Problem      — gzip runs single-threaded; cores sit idle.
 *   02 Solution     — split into blocks, compress in parallel, stitch one member.
 *   03 Implementation — the JDK 25 stages, hand-written vs delegated, the SIMD race.
 *   04 Proof        — measured throughput (gauge + timeline) + 72 green tests.
 *   05 Try it       — the CLI, the source, and the System Card booklet.
 * A living byte-field sits behind everything; a signature flow-mark closes it.
 */
export default function App() {
  return (
    <>
      <ByteField />
      <div className="app-shell">
        <Nav />
        <main>
          <Hero />
          <ProblemSection />
          <SolutionSection />
          <ImplementationSection />
          <ProofSection />
          <TryItSection />
        </main>
        <PortfolioStrip />
        <EndingMark />
      </div>
    </>
  )
}
