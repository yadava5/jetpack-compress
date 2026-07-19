import { useEffect, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useInView } from '../hooks/useInView'

/**
 * The signature diagram — rebuilt as a clean top-to-bottom flow:
 *
 *     input bytes  ─ split ─┐
 *                           ▼        (one point fans out …)
 *        [w0] [w1] [w2] [w3] [w4]     five virtual-thread workers
 *                           ▼        (… and fans back into one point)
 *                        stitch
 *                           ▼
 *     ┌ hdr ┬ 0 ┬ 1 ┬ 2 ┬ 3 ┬ 4·final ┬ crc·isize ┐   one gzip member
 *
 * Because the fan-out and fan-in each radiate from a SINGLE node to a row of
 * evenly-spaced nodes (and back), no connector ever crosses a worker box — the
 * old overlap is gone by construction. Edges draw themselves in on scroll, bytes
 * flow along them, and each worker reveals its role on hover. A replay re-runs it;
 * reduced motion shows the whole thing at rest.
 */

const LANES = 5
const VB_W = 960
const VB_H = 660

// input
const CX = VB_W / 2
const IN_W = 288
const IN_H = 54
const IN_X = CX - IN_W / 2
const IN_Y = 30
const SPLIT_Y = IN_Y + IN_H + 44 // 128

// workers
const WK_W = 150
const WK_H = 78
const WK_TOP = 250
const WK_BOT = WK_TOP + WK_H
const STEP = 186
const workers = Array.from({ length: LANES }, (_, i) => {
  const cx = CX + (i - (LANES - 1) / 2) * STEP
  return { i, cx, x: cx - WK_W / 2, last: i === LANES - 1 }
})

// stitch + output
const STITCH_Y = 464
const OUT_X = 34
const OUT_W = VB_W - OUT_X * 2
const OUT_Y = 556
const OUT_H = 56

// output member segments
type Seg = { k: string; label: string; w: number; kind: 'meta' | 'block' | 'final' }
const rawSegs: Seg[] = [
  { k: 'hdr', label: 'gzip hdr', w: 0.95, kind: 'meta' },
  { k: 'b0', label: 'block 0', w: 1.5, kind: 'block' },
  { k: 'b1', label: 'block 1', w: 1.5, kind: 'block' },
  { k: 'b2', label: 'block 2', w: 1.35, kind: 'block' },
  { k: 'b3', label: 'block 3', w: 1.4, kind: 'block' },
  { k: 'bf', label: 'block 4 · final', w: 1.55, kind: 'final' },
  { k: 'tr', label: 'crc · isize', w: 1.05, kind: 'meta' },
]
const segs = (() => {
  const gap = 5
  const total = rawSegs.reduce((s, x) => s + x.w, 0)
  const usable = OUT_W - gap * (rawSegs.length - 1)
  let x = OUT_X
  return rawSegs.map((s) => {
    const w = (s.w / total) * usable
    const seg = { ...s, x, w }
    x += w + gap
    return seg
  })
})()

function segFill(kind: Seg['kind']) {
  if (kind === 'meta') return { fill: 'var(--steel-soft)', stroke: 'var(--steel-line)', text: 'var(--color-steel)' }
  if (kind === 'final') return { fill: 'rgba(255,158,44,0.30)', stroke: 'var(--color-amber)', text: 'var(--color-amber)' }
  return { fill: 'rgba(255,158,44,0.15)', stroke: 'var(--amber-line)', text: 'var(--color-amber)' }
}

// fan-out edge: one split point -> a worker top
const fanOut = (cx: number) =>
  `M ${CX} ${SPLIT_Y + 12} C ${CX} ${SPLIT_Y + 70}, ${cx} ${WK_TOP - 60}, ${cx} ${WK_TOP}`
// fan-in edge: a worker bottom -> one stitch point
const fanIn = (cx: number) =>
  `M ${cx} ${WK_BOT} C ${cx} ${WK_BOT + 60}, ${CX} ${STITCH_Y - 58}, ${CX} ${STITCH_Y - 12}`
// stitch -> output member (straight down the centre)
const outLink = `M ${CX} ${STITCH_Y + 12} L ${CX} ${OUT_Y - 4}`

export function PipelineViz() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>(0.3)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    if (inView && runId === 0) setRunId(1)
  }, [inView, runId])

  const playing = runId > 0 && !reduced

  return (
    <div className="pipe-wrap" ref={ref}>
      {!reduced && (
        <button
          type="button"
          className="pipe-replay mono"
          onClick={() => setRunId((n) => n + 1)}
          aria-label="Replay the pipeline animation"
        >
          <ReplayIcon />
          replay
        </button>
      )}
      <svg
        key={runId}
        className={`svg-flow pipe-flow ${playing ? 'play' : ''}`}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="Parallel pipeline: input bytes are split, compressed on five virtual-thread workers, and stitched into one byte-valid gzip member."
      >
        {/* ---- edges (drawn behind the nodes) ---- */}
        <g className="pipe-edges">
          {workers.map((wk) => (
            <path
              key={`fo-${wk.i}`}
              className="pipe-edge steel"
              pathLength={1}
              style={{ ['--d' as string]: `${wk.i * 90}ms` }}
              d={fanOut(wk.cx)}
            />
          ))}
          {workers.map((wk) => (
            <path
              key={`fi-${wk.i}`}
              className="pipe-edge warm"
              pathLength={1}
              style={{ ['--d' as string]: `${520 + wk.i * 90}ms` }}
              d={fanIn(wk.cx)}
            />
          ))}
          <path
            className="pipe-edge warm"
            pathLength={1}
            style={{ ['--d' as string]: '1020ms', strokeWidth: 2.4 }}
            d={outLink}
          />
        </g>

        {/* ---- flowing bytes ---- */}
        {playing && (
          <g className="pipe-packets" aria-hidden="true">
            {workers.map((wk) => (
              <rect
                key={`po-${wk.i}`}
                className="pipe-packet steel"
                width={7}
                height={7}
                rx={1.5}
                style={{ offsetPath: `path("${fanOut(wk.cx)}")`, animationDelay: `${0.3 + wk.i * 0.22}s` }}
              />
            ))}
            {workers.map((wk) => (
              <rect
                key={`pi-${wk.i}`}
                className="pipe-packet amber"
                width={7}
                height={7}
                rx={1.5}
                style={{ offsetPath: `path("${fanIn(wk.cx)}")`, animationDelay: `${1.0 + wk.i * 0.16}s` }}
              />
            ))}
            <rect
              className="pipe-packet amber bright"
              width={9}
              height={9}
              rx={2}
              style={{ offsetPath: `path("${outLink}")`, animationDelay: '1.7s' }}
            />
          </g>
        )}

        {/* ---- input bytes ---- */}
        <g className="pipe-node">
          <rect x={IN_X} y={IN_Y} width={IN_W} height={IN_H} rx={11} fill="var(--color-panel2)" stroke="var(--color-line2)" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={IN_X + 18 + i * 28} y={IN_Y + 15} width={14} height={IN_H - 30} rx={2} fill="rgba(255,255,255,0.08)" />
          ))}
          <text x={CX} y={IN_Y - 11} textAnchor="middle" fontSize="13" className="svg-txt">input bytes</text>
          <text x={IN_X + IN_W + 12} y={IN_Y + IN_H / 2 + 4} fontSize="10.5" className="svg-txt-faint">FFM mmap · one Arena</text>
        </g>

        {/* ---- split node ---- */}
        <g className="pipe-node">
          <circle cx={CX} cy={SPLIT_Y} r={7} fill="var(--steel-soft)" stroke="var(--color-steel)" />
          <text x={CX + 16} y={SPLIT_Y + 4} fontSize="11" className="svg-txt-faint">split · 1 MiB blocks</text>
        </g>

        {/* ---- workers ---- */}
        {workers.map((wk) => (
          <g className="pipe-worker" key={`w-${wk.i}`} tabIndex={0}>
            <title>{`virtual thread · block ${wk.i} — ${wk.last ? 'Deflater.finish(), BFINAL=1' : 'Deflater SYNC_FLUSH, BFINAL=0'}`}</title>
            <rect
              className="worker-box"
              x={wk.x}
              y={WK_TOP}
              width={WK_W}
              height={WK_H}
              rx={11}
              fill="var(--color-panel)"
              stroke={wk.last ? 'var(--amber-line)' : 'var(--color-line2)'}
            />
            <circle cx={wk.x + 18} cy={WK_TOP + 20} r={4} fill={wk.last ? 'var(--color-amber)' : 'var(--color-steel)'} />
            <text x={wk.x + 30} y={WK_TOP + 24} fontSize="12" className="svg-txt" fill="var(--color-fg)">vthread {wk.i}</text>
            <text x={wk.x + 14} y={WK_TOP + 44} fontSize="9.5" className="svg-txt-faint">blk {wk.i} · DEFLATE</text>
            <text x={wk.x + 14} y={WK_TOP + 60} fontSize="8.5" className="svg-txt-faint">
              {wk.last ? 'finish() BFINAL=1' : 'SYNC_FLUSH B=0'}
            </text>
            {/* compressing ticks */}
            {Array.from({ length: 3 }, (_, j) => (
              <rect
                key={j}
                className={playing ? 'worker-tick' : undefined}
                style={playing ? { animationDelay: `${wk.i * 0.1 + j * 0.16}s` } : { opacity: 0.55 }}
                x={wk.x + WK_W - 34 + j * 8}
                y={WK_TOP + 15}
                width={4.5}
                height={12}
                rx={1}
                fill={wk.last ? 'var(--color-amber)' : 'var(--color-steel)'}
              />
            ))}
          </g>
        ))}

        {/* ---- stitch node ---- */}
        <g className="pipe-node">
          <circle cx={CX} cy={STITCH_Y} r={11} fill="var(--amber-soft)" stroke="var(--color-amber)" />
          <circle cx={CX} cy={STITCH_Y} r={3.5} fill="var(--color-amber)" />
          <text x={CX + 22} y={STITCH_Y - 3} fontSize="12.5" className="svg-txt" fill="var(--color-fg)">stitch</text>
          <text x={CX + 22} y={STITCH_Y + 13} fontSize="9.5" className="svg-txt-faint">SYNC_FLUSH · fold CRC</text>
        </g>

        {/* ---- output: one valid single-member gzip stream ---- */}
        <g>
          <text x={OUT_X} y={OUT_Y - 12} fontSize="12.5" className="svg-txt" fill="var(--color-fg)">one valid single-member gzip stream</text>
          {segs.map((s) => {
            const c = segFill(s.kind)
            return (
              <g key={s.k} className="pipe-seg">
                <rect x={s.x} y={OUT_Y} width={s.w} height={OUT_H} rx={6} fill={c.fill} stroke={c.stroke} />
                <text
                  x={s.x + s.w / 2}
                  y={OUT_Y + OUT_H / 2 + 4}
                  textAnchor="middle"
                  fontSize={s.w < 78 ? 9 : 10.5}
                  className="svg-txt"
                  fill={c.text}
                >
                  {s.label}
                </text>
              </g>
            )
          })}
          <text x={OUT_X + OUT_W} y={OUT_Y + OUT_H + 22} textAnchor="end" fontSize="11" className="svg-txt-faint">
            decompresses with gzip -d · zcat · GZIPInputStream
          </text>
        </g>
      </svg>
    </div>
  )
}

function ReplayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M11.5 3.5A5 5 0 1 0 12 7" strokeLinecap="round" />
      <path d="M11.5 1.5v2.6H8.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
