import { ACTS, CLI, SITE } from '../data/facts'
import { SectionHead } from './SectionHead'
import { Reveal } from './Reveal'
import { CopyButton } from './CopyButton'
import { GitHubIcon, BookIcon, ArrowRight } from './icons'

const COPY_TEXT = [
  'JAR=target/jetpack-compress.jar',
  'VEC=--add-modules=jdk.incubator.vector',
  'java $VEC -jar $JAR compress notes.txt notes.txt.gz -l 6',
].join('\n')

export function TryItSection() {
  return (
    <section className="section hair" id="try">
      <div className="wrap">
        <SectionHead
          act={ACTS.tryit.n}
          actLabel={ACTS.tryit.label}
          kicker="command line"
          title={
            <>
              Compress it here. Verify it with <span className="accent">system gzip.</span>
            </>
          }
          lead="Because the output is standard gzip, the strongest test is the one you can run yourself — round-trip through the real gzip(1)."
        />

        <div className="cli-grid">
          <Reveal>
            <div className="card terminal">
              <div className="term-bar">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-title mono">zsh — jetpack-compress</span>
                <CopyButton text={COPY_TEXT} />
              </div>
              <div className="term-body mono">
                {CLI.lines.map((ln, i) => (
                  <div className="term-line" key={i}>
                    <div className="term-cmd">{ln.c}</div>
                    <div className="term-out">{ln.o}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="card cli-ref">
              <div className="cli-ref-head mono">commands</div>
              <ul className="cli-cmds">
                {CLI.commands.map((c) => (
                  <li key={c.name}>
                    <span className="cli-name mono">{c.name}</span>
                    <span className="cli-args mono">{c.args || '—'}</span>
                  </li>
                ))}
              </ul>
              <div className="cli-env mono">
                <span style={{ color: 'var(--color-faint)' }}>run with</span>
                <br />
                {CLI.env}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="card end-card">
            <div className="end-card-copy">
              <div className="kicker">go deeper</div>
              <h3 className="end-card-title">
                The full build, end to end — the <span className="accent">System Card.</span>
              </h3>
              <p className="end-card-lead">
                Twenty-four pages on the same five acts: why gzip leaves cores idle, how the blocks
                stitch into one member, the hand-vectorized checksum, the measured proof, and the
                toolchain. Or read the source and run the 72 tests yourself.
              </p>
            </div>
            <div className="end-card-cta">
              <a className="btn btn-primary btn-lg" href={SITE.systemCard}>
                <BookIcon />
                Read the System Card
                <ArrowRight />
              </a>
              <a className="btn btn-lg" href={SITE.repo} target="_blank" rel="noreferrer noopener">
                <GitHubIcon />
                View on GitHub
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
