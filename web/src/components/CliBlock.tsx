import { CLI } from '../data/facts'
import { SectionHead } from './SectionHead'
import { Reveal } from './Reveal'
import { CopyButton } from './CopyButton'

const COPY_TEXT = [
  'JAR=target/jetpack-compress.jar',
  'VEC=--add-modules=jdk.incubator.vector',
  'java $VEC -jar $JAR compress notes.txt notes.txt.gz -l 6',
].join('\n')

export function CliBlock() {
  return (
    <section className="section hair" id="cli">
      <div className="wrap">
        <SectionHead
          kicker="command line"
          title={
            <>
              Real usage. Real gzip <span className="accent">round-trip.</span>
            </>
          }
          lead="Compress with the parallel engine, then verify the output with the system gzip itself — because it is standard gzip."
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
      </div>
    </section>
  )
}
