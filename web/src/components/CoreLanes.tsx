import { PROBLEM } from '../data/facts'

/**
 * Problem visual — a many-core CPU with a single-threaded gzip on it.
 * Ten core lanes; one runs a DEFLATE loop (amber, a marching conveyor), nine
 * sit idle (steel, near-empty). The contrast is the whole argument.
 *
 * Pure CSS/HTML so it stays crisp and responsive; the conveyor is a translated
 * background that the global reduced-motion rule freezes into a static striped
 * fill (still legibly "the busy one").
 */
export function CoreLanes() {
  const lanes = Array.from({ length: PROBLEM.cores }, (_, i) => i)

  return (
    <div className="card viz-card cores">
      <div className="cores-head">
        <div className="kicker">the machine · {PROBLEM.cores} cores</div>
        <div className="cores-readout">
          <span className="stat-num accent">{PROBLEM.idle}</span>
          <span className="cores-readout-cap">
            cores idle
            <br />
            while one compresses
          </span>
        </div>
      </div>

      <div className="cores-lanes" role="img" aria-label={`${PROBLEM.cores} CPU cores: one runs the gzip DEFLATE loop, ${PROBLEM.idle} sit idle.`}>
        {lanes.map((i) => {
          const active = i < PROBLEM.active
          return (
            <div className={`core-lane ${active ? 'on' : 'off'}`} key={i}>
              <span className="core-id mono">c{i}</span>
              <div className="core-track">
                {active ? <div className="core-run" /> : <div className="core-flat" />}
              </div>
              <span className="core-tag mono">{active ? PROBLEM.activeLabel : PROBLEM.idleLabel}</span>
            </div>
          )
        })}
      </div>

      <p className="viz-cap cores-foot">
        One lane, lit — <span className="accent mono">{PROBLEM.singleMbps} MB/s</span> of single-threaded{' '}
        <code>GZIPOutputStream</code>, measured on this machine. The other {PROBLEM.idle} cores are paid
        for and doing nothing.
      </p>
    </div>
  )
}
