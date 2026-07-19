import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Visual 1 — the parallel pipeline.
 * Input stream -> split into N blocks -> a virtual thread per block ->
 * stitched (SYNC_FLUSH) into one byte-valid gzip member.
 */

const LANES = 5

const VB_W = 920
const VB_H = 452

const INPUT_X = 40
const INPUT_W = 96
const INPUT_H = 150
const CENTER_Y = 156
const INPUT_Y = CENTER_Y - INPUT_H / 2
const INPUT_RIGHT = INPUT_X + INPUT_W

const WORKER_X = 344
const WORKER_W = 262
const WORKER_H = 44
const LANE_TOP = 22
const LANE_STEP = WORKER_H + 12

const STITCH_X = 712
const STITCH_Y = CENTER_Y

const OUT_X = 40
const OUT_Y = 372
const OUT_W = 840
const OUT_H = 52

type Lane = { i: number; mid: number; last: boolean }
const lanes: Lane[] = Array.from({ length: LANES }, (_, i) => ({
  i,
  mid: LANE_TOP + i * LANE_STEP + WORKER_H / 2,
  last: i === LANES - 1,
}))

type Seg = { k: string; label: string; w: number; kind: 'meta' | 'block' | 'final' }
const rawSegs: Seg[] = [
  { k: 'hdr', label: 'hdr', w: 0.85, kind: 'meta' },
  { k: 'b0', label: '0', w: 1.5, kind: 'block' },
  { k: 'b1', label: '1', w: 1.5, kind: 'block' },
  { k: 'b2', label: '2', w: 1.35, kind: 'block' },
  { k: 'b3', label: '3', w: 1.4, kind: 'block' },
  { k: 'bf', label: '4 · final', w: 1.5, kind: 'final' },
  { k: 'tr', label: 'CRC·ISIZE', w: 1.05, kind: 'meta' },
]

function segLayout() {
  const gap = 4
  const totalW = rawSegs.reduce((s, x) => s + x.w, 0)
  const usable = OUT_W - gap * (rawSegs.length - 1)
  let x = OUT_X
  return rawSegs.map((s) => {
    const w = (s.w / totalW) * usable
    const seg = { ...s, x, w }
    x += w + gap
    return seg
  })
}

const segs = segLayout()

function segFill(kind: Seg['kind']) {
  if (kind === 'meta') return { fill: 'var(--steel-soft)', stroke: 'var(--steel-line)' }
  if (kind === 'final') return { fill: 'rgba(255,158,44,0.28)', stroke: 'var(--color-amber)' }
  return { fill: 'rgba(255,158,44,0.15)', stroke: 'var(--amber-line)' }
}

export function PipelineViz() {
  const anim = !useReducedMotion()

  return (
    <svg
      className="svg-flow"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label="Parallel pipeline: input bytes split into blocks, compressed on virtual threads, and stitched into one gzip member."
    >
      {/* input byte stack */}
      <g>
        <rect
          x={INPUT_X}
          y={INPUT_Y}
          width={INPUT_W}
          height={INPUT_H}
          rx={9}
          fill="var(--color-panel2)"
          stroke="var(--color-line2)"
        />
        {Array.from({ length: 7 }, (_, i) => (
          <rect
            key={i}
            x={INPUT_X + 14}
            y={INPUT_Y + 16 + i * 18}
            width={INPUT_W - 28}
            height={7}
            rx={2}
            fill="rgba(255,255,255,0.09)"
          />
        ))}
        <text x={INPUT_X + INPUT_W / 2} y={INPUT_Y - 14} textAnchor="middle" fontSize="13" className="svg-txt">
          input bytes
        </text>
        <text x={INPUT_X + INPUT_W / 2} y={INPUT_Y + INPUT_H + 24} textAnchor="middle" fontSize="11" className="svg-txt-faint">
          FFM mmap
        </text>
      </g>

      {/* fan-out: input -> workers */}
      {lanes.map((l) => (
        <path
          key={`fan-${l.i}`}
          className={anim ? 'flow-line steel' : 'flow-line steel'}
          style={anim ? { animationDelay: `${l.i * -0.18}s` } : { animation: 'none' }}
          d={`M ${INPUT_RIGHT} ${CENTER_Y} C ${INPUT_RIGHT + 90} ${CENTER_Y}, ${WORKER_X - 90} ${l.mid}, ${WORKER_X} ${l.mid}`}
        />
      ))}

      {/* split marker */}
      <text x={INPUT_RIGHT + 150} y={22} textAnchor="middle" fontSize="11" className="svg-txt-faint">
        split · 1 MiB blocks
      </text>

      {/* workers (one virtual thread per block) */}
      {lanes.map((l) => {
        const top = l.mid - WORKER_H / 2
        return (
          <g key={`w-${l.i}`}>
            <rect
              x={WORKER_X}
              y={top}
              width={WORKER_W}
              height={WORKER_H}
              rx={9}
              fill="var(--color-panel)"
              stroke={l.last ? 'var(--amber-line)' : 'var(--color-line2)'}
            />
            {/* vthread marker */}
            <circle cx={WORKER_X + 18} cy={l.mid} r={4} fill={l.last ? 'var(--color-amber)' : 'var(--color-steel)'} />
            <text x={WORKER_X + 32} y={l.mid - 3} fontSize="12.5" className="svg-txt" fill="var(--color-fg)">
              vthread · blk {l.i}
            </text>
            <text x={WORKER_X + 32} y={l.mid + 12} fontSize="9.5" className="svg-txt-faint">
              {l.last ? 'Deflater.finish() · BFINAL=1' : 'Deflater · SYNC_FLUSH · BFINAL=0'}
            </text>
            {/* compressing activity */}
            {Array.from({ length: 3 }, (_, j) => (
              <rect
                key={j}
                className={anim ? 'worker-fill' : undefined}
                style={anim ? { animationDelay: `${l.i * 0.12 + j * 0.18}s` } : { opacity: 0.7 }}
                x={WORKER_X + WORKER_W - 40 + j * 10}
                y={l.mid - 8}
                width={6}
                height={16}
                rx={1.5}
                fill={l.last ? 'var(--color-amber)' : 'var(--color-steel)'}
              />
            ))}
          </g>
        )
      })}

      {/* converge: workers -> stitch node */}
      {lanes.map((l) => (
        <path
          key={`cv-${l.i}`}
          className="flow-line warm"
          style={anim ? { animationDelay: `${l.i * -0.14}s` } : { animation: 'none' }}
          d={`M ${WORKER_X + WORKER_W} ${l.mid} C ${WORKER_X + WORKER_W + 70} ${l.mid}, ${STITCH_X - 70} ${STITCH_Y}, ${STITCH_X} ${STITCH_Y}`}
        />
      ))}

      {/* stitch node */}
      <circle cx={STITCH_X} cy={STITCH_Y} r={9} fill="var(--amber-soft)" stroke="var(--color-amber)" />
      <circle cx={STITCH_X} cy={STITCH_Y} r={3} fill="var(--color-amber)" />
      <text x={STITCH_X + 18} y={STITCH_Y - 8} fontSize="12.5" className="svg-txt" fill="var(--color-fg)">
        stitch
      </text>
      <text x={STITCH_X + 18} y={STITCH_Y + 8} fontSize="9.5" className="svg-txt-faint">
        combine CRC
      </text>

      {/* stitch -> single output member */}
      <path
        className="flow-line warm"
        style={{ strokeWidth: 2.2, animationDelay: '-0.4s', ...(anim ? {} : { animation: 'none' }) }}
        d={`M ${STITCH_X} ${STITCH_Y + 10} C ${STITCH_X} 300, 120 300, 80 ${OUT_Y}`}
      />

      {/* output: one valid single-member gzip stream */}
      <g>
        {segs.map((s) => {
          const c = segFill(s.kind)
          return (
            <g key={s.k} className="pipe-seg">
              <rect x={s.x} y={OUT_Y} width={s.w} height={OUT_H} rx={5} fill={c.fill} stroke={c.stroke} />
              <text
                x={s.x + s.w / 2}
                y={OUT_Y + OUT_H / 2 + 4}
                textAnchor="middle"
                fontSize={s.w < 70 ? 9 : 11}
                className="svg-txt"
                fill={s.kind === 'meta' ? 'var(--color-steel)' : 'var(--color-amber)'}
              >
                {s.label}
              </text>
            </g>
          )
        })}
        <text x={OUT_X} y={OUT_Y - 14} fontSize="12.5" className="svg-txt" fill="var(--color-fg)">
          one valid single-member gzip stream
        </text>
        <text x={OUT_X + OUT_W} y={OUT_Y + OUT_H + 22} textAnchor="end" fontSize="11" className="svg-txt-faint">
          decompresses with gzip -d · GZIPInputStream
        </text>
      </g>
    </svg>
  )
}
