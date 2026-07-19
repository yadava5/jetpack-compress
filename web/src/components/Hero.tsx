import { SITE, HERO_BADGES, PROOF_STRIP } from '../data/facts'
import { MemberRibbon } from './MemberRibbon'
import { Reveal } from './Reveal'
import { GitHubIcon, BookIcon, ArrowDown } from './icons'

export function Hero() {
  return (
    <section className="section hero" id="top">
      <div className="wrap">
        <Reveal>
          <div className="kicker">parallel gzip · virtual threads · JDK 25</div>
          <h1 className="hero-title">
            Parallel gzip that is still,
            <br />
            byte for byte, <span className="accent">real gzip.</span>
          </h1>
          <p className="lead hero-lead">
            {SITE.oneLiner} The novelty is the parallel framing and a hand-vectorized SIMD stage —{' '}
            <span className="fg">not a new codec</span>. DEFLATE entropy coding is delegated to zlib
            on purpose.
          </p>

          <div className="hero-badges">
            {HERO_BADGES.map((b) => (
              <span className="chip" key={b.label}>
                <span className="fg">{b.label}</span>
                <span style={{ color: 'var(--color-faint)' }}>{b.sub}</span>
              </span>
            ))}
          </div>

          <div className="hero-cta">
            <a className="btn btn-primary" href={SITE.repo} target="_blank" rel="noreferrer noopener">
              <GitHubIcon />
              View the source
            </a>
            <a className="btn btn-card" href={SITE.systemCard}>
              <BookIcon />
              Read the System Card
            </a>
            <a className="btn btn-ghost" href="#problem">
              <ArrowDown />
              Start the story
            </a>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <figure className="hero-viz card">
            <MemberRibbon />
          </figure>
        </Reveal>

        <Reveal delay={180}>
          <div className="proof-strip">
            {PROOF_STRIP.map((p) => (
              <div className="proof-item" key={p.k}>
                <span className="dot dot-live" aria-hidden="true" />
                <div>
                  <div className="proof-k">
                    <span className="accent">{p.k}</span> {p.v}
                  </div>
                  <div className="proof-mono mono">{p.mono}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
