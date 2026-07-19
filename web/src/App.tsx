import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { ProblemSection } from './components/ProblemSection'
import { SolutionSection } from './components/SolutionSection'
import { ImplementationSection } from './components/ImplementationSection'
import { ProofSection } from './components/ProofSection'
import { TryItSection } from './components/TryItSection'
import { PortfolioStrip } from './components/PortfolioStrip'

/**
 * The landing is a five-act scroll:
 *   Hero — the thesis, and the payoff motif (one gzip member).
 *   01 Problem      — gzip runs single-threaded; cores sit idle.
 *   02 Solution     — split into blocks, compress in parallel, stitch one member.
 *   03 Implementation — the JDK 25 stages, hand-written vs delegated, the SIMD race.
 *   04 Proof        — measured throughput (with error bars) + 72 green tests.
 *   05 Try it       — the CLI, the source, and the System Card booklet.
 */
export default function App() {
  return (
    <>
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
    </>
  )
}
