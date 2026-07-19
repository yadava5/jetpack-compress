import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { ScopePanel } from './components/ScopePanel'
import { FeatureGrid } from './components/FeatureGrid'
import { SimdSection } from './components/SimdSection'
import { BenchSection } from './components/BenchSection'
import { Architecture } from './components/Architecture'
import { CliBlock } from './components/CliBlock'
import { TestsProof } from './components/TestsProof'
import { PortfolioStrip } from './components/PortfolioStrip'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ScopePanel />
        <FeatureGrid />
        <SimdSection />
        <BenchSection />
        <Architecture />
        <CliBlock />
        <TestsProof />
      </main>
      <PortfolioStrip />
    </>
  )
}
