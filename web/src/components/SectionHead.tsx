import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

export function SectionHead({
  kicker,
  title,
  lead,
}: {
  kicker: string
  title: ReactNode
  lead?: ReactNode
}) {
  return (
    <Reveal>
      <div className="sec-head">
        <div className="kicker">{kicker}</div>
        <h2 className="h-sec">{title}</h2>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
    </Reveal>
  )
}
