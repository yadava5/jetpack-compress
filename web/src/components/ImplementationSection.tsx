import type { ReactNode } from 'react'
import { ACTS, FEATURES, SCOPE, INSIDE_NOTES } from '../data/facts'
import { SectionHead } from './SectionHead'
import { SimdRace } from './SimdRace'
import { Reveal } from './Reveal'

/** Light sub-head to mark the movements inside the act (no act numeral). */
function SubHead({ kicker, title, lead }: { kicker: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <Reveal>
      <div className="impl-subhead">
        <div className="kicker">{kicker}</div>
        <h3 className="impl-subhead-title">{title}</h3>
        {lead ? <p className="impl-subhead-lead">{lead}</p> : null}
      </div>
    </Reveal>
  )
}

const SIMD_NOTES = [
  {
    t: 'The problem',
    b: 'Serial Adler-32 has a loop-carried dependency — each A feeds the next B — which blocks naive vectorization.',
  },
  {
    t: 'The decomposition',
    b: 'Accumulate two order-free sums over a segment: S1 = Σ bⱼ and S2 = Σ j·bⱼ. Both are plain reductions, so both vectorize.',
  },
  {
    t: 'Kept exact',
    b: 'Segments are capped at NMAX = 5552 bytes so accumulators never overflow before the modulo. Bit-identical to java.util.zip.Adler32.',
  },
]

const SCOPE_COLUMNS = [
  { key: 'implemented', label: 'Hand-written', tag: 'in this repo', cls: 'tag-hand', items: SCOPE.implemented },
  { key: 'delegated', label: 'Borrowed', tag: 'on purpose', cls: 'tag-deleg', items: SCOPE.delegated },
  { key: 'planned', label: 'Not yet', tag: 'future work', cls: 'tag-plan', items: SCOPE.planned },
] as const

export function ImplementationSection() {
  return (
    <section className="section hair" id="inside">
      <div className="wrap">
        <SectionHead
          act={ACTS.inside.n}
          actLabel={ACTS.inside.label}
          kicker="JDK 25, used in anger"
          title={
            <>
              The newest platform, where it <span className="accent">earns its place.</span>
            </>
          }
          lead={
            <>
              Every stage maps to a file. The parallel framing and one SIMD checksum are hand-written;
              the DEFLATE entropy coding is delegated to zlib on purpose — and each card says which it
              is, with no hand-waving about the difference.
            </>
          }
        />

        {/* 3a — the stack, stage by stage */}
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

        {/* 3b — the one stage we vectorized by hand */}
        <div className="impl-movement">
          <SubHead
            kicker="hand-vectorized SIMD"
            title={
              <>
                Adler-32, decomposed so it <span className="accent">vectorizes.</span>
              </>
            }
            lead="The project's genuinely hand-written SIMD stage — byte→int lane widening and position-weighted reductions on the Vector API, reading straight from a memory-mapped segment."
          />
          <Reveal>
            <SimdRace />
          </Reveal>
          <div className="simd-notes">
            {SIMD_NOTES.map((n, i) => (
              <Reveal key={n.t} delay={i * 80}>
                <div className="card simd-note">
                  <div className="simd-note-t mono">{n.t}</div>
                  <p>{n.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* 3c — keeping the parallelism honest */}
        <div className="impl-movement">
          <SubHead
            kicker="the details that keep it correct"
            title={
              <>
                Independent blocks, <span className="accent">one honest CRC.</span>
              </>
            }
          />
          <div className="arch-grid">
            {INSIDE_NOTES.map((n, i) => (
              <Reveal key={n.title} delay={(i % 2) * 80}>
                <article className="card arch-card">
                  <span className="arch-idx mono">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="arch-title">{n.title}</h3>
                  <p className="arch-body">{n.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="card callout">
              <span className="callout-mark mono">note</span>
              <p>
                Adler-32 is exposed as a fast content fingerprint (the CLI <code>adler</code> command).
                It is <span className="fg">not</span> the gzip trailer checksum — that is CRC-32, per
                the gzip spec.
              </p>
            </div>
          </Reveal>
        </div>

        {/* 3d — hand-written, borrowed, not-yet */}
        <div className="impl-movement">
          <SubHead
            kicker="honest scope"
            title={
              <>
                What is hand-written, borrowed, and <span className="accent">not yet built.</span>
              </>
            }
            lead="Being precise about this is the point — the value is the parallel framing and the SIMD stage, not a claim to have rewritten DEFLATE."
          />
          <div className="scope-grid">
            {SCOPE_COLUMNS.map((col, ci) => (
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
      </div>
    </section>
  )
}
