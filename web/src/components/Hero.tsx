import { Fragment } from 'react'
import { SITE, HERO_BADGES, PROOF_STRIP } from '../data/facts'
import { MemberRibbon } from './MemberRibbon'
import { Reveal } from './Reveal'
import { Scramble } from './Scramble'
import { CountUp } from './CountUp'
import { useCharField, useMagnetic, useTilt } from '../hooks/interactions'
import { GitHubIcon, BookIcon, CompressIcon } from './icons'

/** Splits a run of text into word→character spans so the title's letters can react
 *  to the cursor. Words stay whole on wrap; the spaces between them are real text
 *  nodes (outside the inline-block word spans) so word spacing survives. */
function SplitText({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span className="rx-word">
            {w.split('').map((ch, ci) => (
              <span className="rx-char" key={ci}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}

export function Hero() {
  const titleRef = useCharField<HTMLHeadingElement>(115)
  const vizRef = useTilt<HTMLElement>(4.5)
  const ctaRef = useMagnetic<HTMLSpanElement>(0.3, 9)

  return (
    <section className="section hero" id="top">
      <div className="wrap">
        <Reveal>
          <div className="kicker">parallel gzip · virtual threads · JDK 25</div>
          <h1 className="hero-title" ref={titleRef}>
            <SplitText text="Parallel gzip that is still," />
            <br />
            <SplitText text="byte for byte," />{' '}
            <span className="accent shimmer-text">
              <Scramble text="real gzip." />
            </span>
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
            <span className="mag" ref={ctaRef}>
              <a className="btn btn-primary" href={SITE.app} target="_blank" rel="noopener noreferrer">
                <CompressIcon />
                Try it — compress a file now
              </a>
            </span>
            <a className="btn btn-card" href={SITE.systemCard} target="_blank" rel="noopener noreferrer">
              <BookIcon />
              Read the System Card
            </a>
            <a className="btn" href={SITE.repo} target="_blank" rel="noopener noreferrer">
              <GitHubIcon />
              View the source
            </a>
          </div>
          <p className="hero-cta-note mono">
            Runs entirely in your browser via the native <span className="fg">CompressionStream</span>{' '}
            — the same DEFLATE the engine delegates to. Nothing is uploaded.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <figure className="hero-viz card glow-card beam tilt" ref={vizRef}>
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
                    <span className="accent">
                      {/^\d+$/.test(p.k) ? <CountUp value={Number(p.k)} /> : p.k}
                    </span>{' '}
                    {p.v}
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
