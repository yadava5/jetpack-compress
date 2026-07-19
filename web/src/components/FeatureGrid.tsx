import { FEATURES } from '../data/facts'
import { SectionHead } from './SectionHead'
import { Reveal } from './Reveal'

export function FeatureGrid() {
  return (
    <section className="section hair" id="features">
      <div className="wrap">
        <SectionHead
          kicker="JDK 25, used in anger"
          title={
            <>
              The newest platform, where it <span className="accent">earns its place.</span>
            </>
          }
          lead="Every feature maps to a file. Hand-written stages are marked; delegated ones say so — no hand-waving about which is which."
        />
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.id} delay={(i % 2) * 80}>
              <article className="card feat-card">
                <div className="feat-top">
                  <h3 className="feat-title">{f.title}</h3>
                  <span className={`chip ${f.kind === 'hand-written' ? 'tag-hand' : 'tag-deleg'}`}>
                    {f.kind}
                  </span>
                </div>
                <div className="feat-meta mono">
                  <span>{f.module}</span>
                  <span className="feat-where">{f.where}</span>
                </div>
                <p className="feat-body">{f.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
