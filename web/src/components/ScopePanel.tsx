import { SCOPE, THESIS } from '../data/facts'
import { SectionHead } from './SectionHead'
import { Reveal } from './Reveal'

const COLUMNS = [
  { key: 'implemented', label: 'Implemented', tag: 'hand-written', cls: 'tag-hand', items: SCOPE.implemented },
  { key: 'delegated', label: 'Delegated', tag: 'on purpose', cls: 'tag-deleg', items: SCOPE.delegated },
  { key: 'planned', label: 'Planned', tag: 'not in this build', cls: 'tag-plan', items: SCOPE.planned },
] as const

export function ScopePanel() {
  return (
    <section className="section hair" id="scope">
      <div className="wrap">
        <SectionHead
          kicker="honest scope"
          title={
            <>
              Implemented, delegated, planned — <span className="accent">stated plainly.</span>
            </>
          }
          lead={THESIS}
        />
        <div className="scope-grid">
          {COLUMNS.map((col, ci) => (
            <Reveal key={col.key} delay={ci * 90}>
              <div className="card scope-col">
                <div className="scope-col-head">
                  <span className="scope-col-label">{col.label}</span>
                  <span className={`chip ${col.cls}`}>{col.tag}</span>
                </div>
                <ul className="scope-list">
                  {col.items.map((it, i) => (
                    <li key={i}>
                      <span className={`scope-mark ${col.cls}`} aria-hidden="true" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
