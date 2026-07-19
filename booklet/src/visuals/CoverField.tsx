import React from "react";
import { COLORS } from "../theme";

/**
 * CoverField — the cover motif, told in one image:
 *
 *   input bytes  →  split into blocks  →  SIMD lanes  →  one gzip member
 *
 * A horizontal ribbon of input bytes fans out (a virtual thread per block)
 * into a stack of parallel block-lanes carrying SIMD stride texture, which
 * are then stitched — each block a contiguous slice — into a single
 * byte-valid gzip member at the foot: [1F 8B 08 header][blocks…][CRC32·ISIZE].
 *
 * Deterministic (a seeded mulberry32 PRNG, no deps) so the render is identical
 * in dev preview and the headless PDF export. Amber is the signal (the
 * hand-written parallel path); steel is the cool baseline; everything rides
 * the #0a0b0d systems ground with a faint measurement grid + soft grain.
 *
 *   front — the full pipeline.
 *   back  — reseeded + dimmed as a wraparound continuation.
 *
 * All vector: no blend-modes, masks, or external images (PDF-safe).
 */

export type CoverFieldProps = {
  widthIn: number;
  heightIn: number;
  variant: "front" | "back";
  seed?: string;
};

const VB_W = 875;
const VB_H = 1125;

const LX = 92;
const RX = 783;
const USABLE = RX - LX;

// --- deterministic PRNG ----------------------------------------------------
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const HEX = "0123456789abcdef";
const mono = "ui-monospace, 'SF Mono', Menlo, monospace";

const NBLOCKS = 6;

export const CoverField: React.FC<CoverFieldProps> = ({
  widthIn,
  heightIn,
  variant,
  seed = "jetpack-2026",
}) => {
  void widthIn;
  void heightIn;
  const back = variant === "back";
  const rand = React.useMemo(() => mulberry32(xmur3(`${seed}::${variant}`)()), [seed, variant]);

  // Global dim for the back cover so the spread reads as a wraparound.
  const dim = back ? 0.5 : 1;
  const grainId = back ? "cf-grain-back" : "cf-grain-front";

  // ---- geometry ----------------------------------------------------------
  const ribbonY = 196;
  const ribbonH = 34;
  const nCells = 20;
  const cellGap = 6;
  const cellW = (USABLE - cellGap * (nCells - 1)) / nCells;

  const blkX0 = 214;
  const blkX1 = 656;
  const blkW = blkX1 - blkX0;
  const blkH = 26;
  const blkPitch = 42;
  const blkTop = 372;
  const blockY = (i: number) => blkTop + i * blkPitch; // top of block i
  const blkCY = (i: number) => blockY(i) + blkH / 2;

  const bandY = 686;
  const bandH = 46;

  // Precompute per-block callout + a compressed-width factor (blocks shrink).
  const blocks = Array.from({ length: NBLOCKS }, (_, i) => {
    const active = i % 2 === 0; // alternate the amber "signal" callout
    const laneCount = 16;
    const shrink = 0.5 + rand() * 0.28; // compressed slice ← raw block
    return { i, active, laneCount, shrink };
  });

  // Stream-band segment widths: header + N blocks (by shrink) + crc + isize.
  const headerW = 46;
  const trailerW = 40; // each of crc, isize
  const gap = 3;
  const rawSlots = blocks.map((b) => b.shrink);
  const rawSum = rawSlots.reduce((a, b) => a + b, 0);
  const segSpace = USABLE - headerW - trailerW * 2 - gap * (NBLOCKS + 2);
  let cursor = LX;
  const headerSeg = { x: cursor, w: headerW };
  cursor += headerW + gap;
  const blockSegs = rawSlots.map((s) => {
    const w = (s / rawSum) * segSpace;
    const seg = { x: cursor, w };
    cursor += w + gap;
    return seg;
  });
  const crcSeg = { x: cursor, w: trailerW };
  cursor += trailerW + gap;
  const isizeSeg = { x: cursor, w: trailerW };

  const ribbonCX = (LX + RX) / 2;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <filter id={grainId} x="-2%" y="-2%" width="104%" height="104%" primitiveUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" seed={back ? 13 : 7} />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.58  0 0 0 0 0.62  0 0 0 0.05 0" />
        </filter>
        <radialGradient id={`cf-glow-${variant}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={COLORS.AMBER} stopOpacity={back ? 0.04 : 0.08} />
          <stop offset="60%" stopColor={COLORS.AMBER} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`cf-vignette-${variant}`} cx="50%" cy={back ? "60%" : "40%"} r="80%">
          <stop offset="0%" stopColor={COLORS.GROUND} stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
        </radialGradient>
      </defs>

      {/* Ground + faint amber glow up top (mirrors the site's hero) */}
      <rect x={0} y={0} width={VB_W} height={VB_H} fill={COLORS.GROUND} />
      <rect x={0} y={0} width={VB_W} height={VB_H} fill={`url(#cf-glow-${variant})`} />

      {/* faint measurement grid */}
      <MeasurementGrid dim={dim} />

      <g opacity={dim * 0.99}>
        {/* ── STAGE 01 · input bytes ─────────────────────────────────── */}
        <StageLabel x={LX} y={ribbonY - 16} n="01" label="INPUT · BYTES" hint="mmap · FFM" />
        {Array.from({ length: nCells }, (_, c) => {
          const x = LX + c * (cellW + cellGap);
          const on = rand() > 0.42;
          const hex = `${HEX[Math.floor(rand() * 16)]}${HEX[Math.floor(rand() * 16)]}`;
          return (
            <g key={c}>
              <rect
                x={x}
                y={ribbonY}
                width={cellW}
                height={ribbonH}
                rx={3}
                fill={on ? COLORS.ON_DARK : "none"}
                fillOpacity={on ? 0.06 : 0}
                stroke={COLORS.ON_DARK}
                strokeOpacity={0.22}
                strokeWidth={0.8}
              />
              <text
                x={x + cellW / 2}
                y={ribbonY + ribbonH / 2 + 3.2}
                textAnchor="middle"
                fontFamily={mono}
                fontSize={8.5}
                fill={COLORS.ON_DARK}
                fillOpacity={0.4}
              >
                {hex}
              </text>
            </g>
          );
        })}

        {/* ── STAGE 02 · split / fan-out (a virtual thread per block) ─── */}
        <StageLabel x={LX} y={ribbonY + ribbonH + 40} n="02" label="SPLIT · 1 MiB BLOCKS" hint="vthread / block" />
        {blocks.map((b) => {
          const startX = ribbonCX + (b.i - (NBLOCKS - 1) / 2) * 22;
          const startY = ribbonY + ribbonH;
          const endX = blkX0;
          const endY = blkCY(b.i);
          const midY = (startY + endY) / 2;
          return (
            <path
              key={b.i}
              d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX - 60} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke={b.active ? COLORS.AMBER : COLORS.STEEL}
              strokeOpacity={b.active ? 0.5 : 0.34}
              strokeWidth={1}
            />
          );
        })}

        {/* ── STAGE 03 · parallel blocks with SIMD lanes ─────────────── */}
        {blocks.map((b) => {
          const y = blockY(b.i);
          const accent = b.active ? COLORS.AMBER : COLORS.STEEL;
          return (
            <g key={b.i}>
              {/* vthread worker tag on the left gutter */}
              <circle cx={blkX0 - 26} cy={blkCY(b.i)} r={3} fill={accent} fillOpacity={0.9} />
              <text
                x={blkX0 - 40}
                y={blkCY(b.i) + 3}
                textAnchor="end"
                fontFamily={mono}
                fontSize={8}
                fill={COLORS.ON_DARK}
                fillOpacity={0.42}
              >
                vt{b.i}
              </text>
              {/* block frame */}
              <rect
                x={blkX0}
                y={y}
                width={blkW}
                height={blkH}
                rx={4}
                fill={accent}
                fillOpacity={0.05}
                stroke={accent}
                strokeOpacity={b.active ? 0.6 : 0.4}
                strokeWidth={1}
              />
              {/* amber signal cap on the leading edge */}
              <rect x={blkX0} y={y} width={3} height={blkH} rx={1.5} fill={accent} fillOpacity={0.85} />
              {/* SIMD lane ticks — every 4th brighter (int-lane grouping) */}
              {Array.from({ length: b.laneCount }, (_, l) => {
                const lx = blkX0 + 12 + (l * (blkW - 20)) / b.laneCount;
                const strong = l % 4 === 0;
                return (
                  <line
                    key={l}
                    x1={lx}
                    y1={y + 4}
                    x2={lx}
                    y2={y + blkH - 4}
                    stroke={COLORS.ON_DARK}
                    strokeOpacity={strong ? 0.34 : 0.14}
                    strokeWidth={strong ? 1 : 0.6}
                  />
                );
              })}
            </g>
          );
        })}
        {/* SIMD-lane callout on the first active block */}
        {(() => {
          const y = blockY(0);
          return (
            <g>
              <line x1={blkX1 + 8} y1={y + blkH / 2} x2={blkX1 + 40} y2={y + blkH / 2} stroke={COLORS.AMBER} strokeOpacity={0.5} strokeWidth={0.8} />
              <text x={blkX1 + 44} y={y + blkH / 2 - 2} fontFamily={mono} fontSize={8} fill={COLORS.AMBER} fillOpacity={0.8}>
                SIMD lanes
              </text>
              <text x={blkX1 + 44} y={y + blkH / 2 + 8} fontFamily={mono} fontSize={7} fill={COLORS.ON_DARK} fillOpacity={0.4}>
                16-byte stride
              </text>
            </g>
          );
        })()}

        {/* ── STAGE 04 · stitch each block into one member ───────────── */}
        <StageLabel x={LX} y={bandY - 40} n="03" label="STITCH · SYNC_FLUSH → finish()" hint="one gzip member" />
        {blocks.map((b) => {
          const startX = blkX1 - 6;
          const startY = blkCY(b.i);
          const seg = blockSegs[b.i]!;
          const endX = seg.x + seg.w / 2;
          const endY = bandY;
          const midY = (startY + endY) / 2;
          return (
            <path
              key={b.i}
              d={`M ${startX} ${startY} C ${startX + 40} ${startY}, ${endX} ${midY}, ${endX} ${endY}`}
              fill="none"
              stroke={b.active ? COLORS.AMBER : COLORS.STEEL}
              strokeOpacity={b.active ? 0.42 : 0.28}
              strokeWidth={0.9}
            />
          );
        })}

        {/* ── STAGE 05 · the single gzip member ──────────────────────── */}
        {/* header */}
        <Segment seg={headerSeg} y={bandY} h={bandH} color={COLORS.GREEN} fill={0.16} label="hdr" />
        <text x={headerSeg.x + headerSeg.w / 2} y={bandY + bandH + 13} textAnchor="middle" fontFamily={mono} fontSize={8} fill={COLORS.GREEN} fillOpacity={0.85}>
          1F 8B 08
        </text>
        {/* block slices */}
        {blockSegs.map((seg, i) => (
          <Segment key={i} seg={seg} y={bandY} h={bandH} color={blocks[i]!.active ? COLORS.AMBER : COLORS.STEEL} fill={0.2} label={`b${i}`} />
        ))}
        {/* trailer: crc + isize */}
        <Segment seg={crcSeg} y={bandY} h={bandH} color={COLORS.GREEN} fill={0.16} label="crc" />
        <Segment seg={isizeSeg} y={bandY} h={bandH} color={COLORS.GREEN} fill={0.16} label="isz" />
        <text x={crcSeg.x} y={bandY + bandH + 13} fontFamily={mono} fontSize={8} fill={COLORS.GREEN} fillOpacity={0.85}>
          CRC32 · ISIZE
        </text>
        {/* the payoff caption */}
        <text x={RX} y={bandY - 12} textAnchor="end" fontFamily={mono} fontSize={9} letterSpacing="0.5" fill={COLORS.ON_DARK} fillOpacity={0.55}>
          one valid single-member gzip stream
        </text>
      </g>

      {/* vignette + grain on top */}
      <rect x={0} y={0} width={VB_W} height={VB_H} fill={`url(#cf-vignette-${variant})`} pointerEvents="none" />
      <rect x={0} y={0} width={VB_W} height={VB_H} filter={`url(#${grainId})`} pointerEvents="none" opacity={0.85} />
    </svg>
  );
};

// --- sub-components ---------------------------------------------------------

const StageLabel: React.FC<{ x: number; y: number; n: string; label: string; hint: string }> = ({ x, y, n, label, hint }) => (
  <g>
    <text x={x} y={y} fontFamily={mono} fontSize={9} fontWeight={700} letterSpacing="1.5" fill={COLORS.AMBER} fillOpacity={0.85}>
      {n}
    </text>
    <text x={x + 22} y={y} fontFamily={mono} fontSize={9} letterSpacing="1.5" fill={COLORS.ON_DARK} fillOpacity={0.6}>
      {label}
    </text>
    <text x={x + 22} y={y + 12} fontFamily={mono} fontSize={7.5} letterSpacing="0.8" fill={COLORS.ON_DARK} fillOpacity={0.34}>
      {hint}
    </text>
  </g>
);

const Segment: React.FC<{ seg: { x: number; w: number }; y: number; h: number; color: string; fill: number; label: string }> = ({ seg, y, h, color, fill, label }) => (
  <g>
    <rect x={seg.x} y={y} width={seg.w} height={h} rx={3} fill={color} fillOpacity={fill} stroke={color} strokeOpacity={0.55} strokeWidth={0.9} />
    {seg.w > 22 && (
      <text x={seg.x + seg.w / 2} y={y + h / 2 + 3} textAnchor="middle" fontFamily={mono} fontSize={8} fill={color} fillOpacity={0.9}>
        {label}
      </text>
    )}
  </g>
);

const MeasurementGrid: React.FC<{ dim: number }> = ({ dim }) => {
  const step = 46;
  const cols = Math.ceil(VB_W / step);
  const rows = Math.ceil(VB_H / step);
  return (
    <g opacity={dim}>
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line key={`c${i}`} x1={i * step} y1={0} x2={i * step} y2={VB_H} stroke={COLORS.ON_DARK} strokeOpacity={0.022} strokeWidth={1} />
      ))}
      {Array.from({ length: rows + 1 }, (_, j) => (
        <line key={`r${j}`} x1={0} y1={j * step} x2={VB_W} y2={j * step} stroke={COLORS.ON_DARK} strokeOpacity={0.022} strokeWidth={1} />
      ))}
    </g>
  );
};
