import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

/**
 * Chaptered section head. When `act` is given it renders a numbered act marker
 * (e.g. "01 · The problem") above the kicker, turning the page into an explicit
 * five-act scroll. Without it, it degrades to the plain kicker/title/lead head.
 */
export function SectionHead({
  act,
  actLabel,
  kicker,
  title,
  lead,
}: {
  act?: string
  actLabel?: string
  kicker: string
  title: ReactNode
  lead?: ReactNode
}) {
  return (
    <Reveal>
      <div className="sec-head">
        {act ? (
          <div className="act-marker">
            <span className="act-n mono">{act}</span>
            <span className="act-rule" aria-hidden="true" />
            <span className="act-label mono">{actLabel}</span>
          </div>
        ) : null}
        <div className="kicker">{kicker}</div>
        <h2 className="h-sec">{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
    </Reveal>
  )
}
