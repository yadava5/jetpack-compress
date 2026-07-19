import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Hero motif — the payoff, in one slim strip: the bytes that come out are a
 * single, standard gzip member. A steel header, amber block payloads, a bright
 * final block, a steel CRC/ISIZE trailer — the same leitmotif the full pipeline
 * viz resolves to, shown up front as the promise. A one-shot shimmer sweeps
 * left→right to read as "assembled"; reduced motion drops it.
 */

type Seg = { k: string; label: string; grow: number; kind: 'meta' | 'block' | 'final' }

const SEGS: Seg[] = [
  { k: 'hdr', label: 'gzip hdr', grow: 1.1, kind: 'meta' },
  { k: 'b0', label: 'block 0', grow: 1.5, kind: 'block' },
  { k: 'b1', label: 'block 1', grow: 1.5, kind: 'block' },
  { k: 'b2', label: 'block 2', grow: 1.35, kind: 'block' },
  { k: 'b3', label: 'block 3', grow: 1.4, kind: 'block' },
  { k: 'bf', label: 'final', grow: 1.4, kind: 'final' },
  { k: 'tr', label: 'crc · isize', grow: 1.2, kind: 'meta' },
]

export function MemberRibbon() {
  const anim = !useReducedMotion()

  return (
    <div className="ribbon">
      <div className="ribbon-label mono">
        <span className="dot dot-live" aria-hidden="true" />
        what comes out — <span className="fg">one byte-valid gzip member</span>
      </div>
      <div
        className="ribbon-tape"
        role="img"
        aria-label="Output layout: gzip header, four parallel blocks, a final block, and a CRC/ISIZE trailer — one gzip member."
      >
        {SEGS.map((s) => (
          <div className={`ribbon-seg ${s.kind}`} key={s.k} style={{ flexGrow: s.grow }}>
            <span className="ribbon-seg-label mono">{s.label}</span>
          </div>
        ))}
        {anim ? <div className="ribbon-scan" aria-hidden="true" /> : null}
      </div>
      <div className="ribbon-foot mono">
        <span>gzip -d</span>
        <span className="ribbon-foot-sep">·</span>
        <span>zcat</span>
        <span className="ribbon-foot-sep">·</span>
        <span>GZIPInputStream</span>
        <span className="ribbon-foot-tail">all decompress it, none the wiser</span>
      </div>
    </div>
  )
}
