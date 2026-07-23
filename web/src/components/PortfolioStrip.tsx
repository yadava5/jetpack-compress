import { PROJECTS, SITE } from '../data/facts'
import { SectionHead } from './SectionHead'
import { Reveal } from './Reveal'
import { GitHubIcon, BookIcon, ArrowUpRight } from './icons'

export function PortfolioStrip() {
  return (
    <footer className="footer" id="portfolio">
      <div className="wrap">
        <SectionHead
          kicker="the portfolio"
          title={
            <>
              Part of a connected set of <span className="accent">builds.</span>
            </>
          }
          lead="Each project has its own identity and its own live demo. This is the systems one."
        />

        <div className="proj-grid">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.name} delay={(i % 3) * 70}>
              <a className="card proj-card" href={p.href} target="_blank" rel="noopener noreferrer">
                <div className="proj-top">
                  <span className="dot dot-live" aria-hidden="true" />
                  <span className="proj-name">{p.name}</span>
                  <ArrowUpRight />
                </div>
                <p className="proj-desc">{p.desc}</p>
                <span className="proj-host mono">{hostOf(p.href)}</span>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="footer-bar">
          <div className="footer-brand">
            <span className="mono">jetpack-compress</span>
            <span className="footer-sep">·</span>
            <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="footer-link">
              <GitHubIcon size={14} />
              yadava5/jetpack-compress
            </a>
            <span className="footer-sep">·</span>
            <a href={SITE.systemCard} className="footer-link" target="_blank" rel="noopener noreferrer">
              <BookIcon size={14} />
              System Card
            </a>
          </div>
          <p className="footer-note mono">Every metric on this page is measured and reproducible.</p>
        </div>
      </div>
    </footer>
  )
}

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}
