import { SITE } from '../data/facts'
import { GitHubIcon } from './icons'

export function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a href="#top" className="nav-brand" aria-label="jetpack-compress home">
          <BrandGlyph />
          <span className="mono nav-word">jetpack-compress</span>
          <span className="chip chip-amber nav-jdk">JDK 25</span>
        </a>

        <nav className="nav-links" aria-label="Sections">
          <a href="#scope">Scope</a>
          <a href="#simd">SIMD</a>
          <a href="#benchmarks">Benchmarks</a>
          <a href="#architecture">Architecture</a>
          <a href="#cli">CLI</a>
        </nav>

        <a className="btn nav-gh" href={SITE.repo} target="_blank" rel="noreferrer noopener">
          <GitHubIcon />
          <span className="nav-gh-label">GitHub</span>
        </a>
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
