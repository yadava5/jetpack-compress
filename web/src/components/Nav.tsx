import { SITE } from '../data/facts'
import { GitHubIcon, BookIcon } from './icons'

export function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a href="#top" className="nav-brand sqz-host" aria-label="jetpack-compress home">
          <BrandGlyph />
          <span className="mono nav-word">
            jetpack-<span className="squeeze">compress</span>
          </span>
          <span className="chip chip-amber nav-jdk">JDK 25</span>
        </a>

        <nav className="nav-links" aria-label="Sections">
          <a href="#problem">Problem</a>
          <a href="#solution">Solution</a>
          <a href="#inside">Inside</a>
          <a href="#proof">Proof</a>
          <a href={SITE.app} className="nav-try">
            Try it
          </a>
        </nav>

        <div className="nav-actions">
          <a className="nav-card" href={SITE.systemCard}>
            <BookIcon size={14} />
            <span className="nav-card-label">System Card</span>
          </a>
          <a className="btn nav-gh" href={SITE.repo} target="_blank" rel="noreferrer noopener">
            <GitHubIcon />
            <span className="nav-gh-label">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}

function BrandGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="none" stroke="var(--color-amber)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 9 H13" />
        <path d="M5 16 H18" />
        <path d="M5 23 H13" />
        <path d="M13 9 L19 16 L13 23" />
        <path d="M19 16 H25" />
      </g>
    </svg>
  )
}
