import { ARCH_NOTES } from '../data/facts'
import { SectionHead } from './SectionHead'
import { Reveal } from './Reveal'

export function Architecture() {
  return (
    <section className="section hair" id="architecture">
      <div className="wrap">
        <SectionHead
          kicker="how the parallelism stays correct"
          title={
            <>
              Independent blocks, <span className="accent">one valid stream.</span>
            </>
          }
          lead="The hard part isn't speed — it's that the concatenated output is always decodable by any standard tool. These are the details that make that true."
        />
        <div className="arch-grid">
          {ARCH_NOTES.map((n, i) => (
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
    </section>
  )
}
