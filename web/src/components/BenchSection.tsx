import { SectionHead } from './SectionHead'
import { BenchBars } from './BenchBars'

export function BenchSection() {
  return (
    <section className="section hair" id="benchmarks">
      <div className="wrap">
        <SectionHead
          kicker="measured, not estimated"
          title={
            <>
              The numbers, with their <span className="accent">error bars.</span>
            </>
          }
          lead="Real JMH throughput from a reduced quick run on this machine. Each figure is scoped to exactly what it measures, and where a number is soft, it says so."
        />
        <BenchBars />
      </div>
    </section>
  )
}
