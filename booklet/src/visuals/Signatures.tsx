import React from "react";
import { COLORS, FONTS } from "../theme";

/**
 * Per-section "signature" visuals — one distinct diagram per key page so the
 * content pages never read as one template. Each shows how that stage actually
 * works, drawn straight from the source:
 *
 *   VThreadFanout   — one input, split into blocks, a virtual thread per block,
 *                     folded by an ordered writer into a single member.
 *                     (core/ParallelGzipCompressor.java:143–176)
 *   SimdLanes       — scalar (1 byte / step) vs vector (16-byte NEON stride)
 *                     Adler-32, landing on the measured 2.8×.
 *                     (vector/VectorizedAdler32.java · bench/Adler32Benchmark)
 *   GzipByteLayout  — the single gzip member, byte for byte:
 *                     [1F 8B 08 …][deflate blocks…][CRC32·ISIZE].
 *                     (core/ParallelGzipCompressor.java:56–63, 178–217)
 */

const mono = "ui-monospace, 'SF Mono', Menlo, monospace";

const CARD: React.CSSProperties = {
  border: `0.5pt solid ${COLORS.HAIRLINE}`,
  borderRadius: 6,
  background: COLORS.PAPER_ELEVATED,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const CardHead: React.FC<{ label: string; accent: string; source: string }> = ({ label, accent, source }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
    <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent }}>
      {label}
    </span>
    <span style={{ fontFamily: FONTS.MONO, fontSize: 7, color: COLORS.INK_SUBTLE }}>{source}</span>
  </div>
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 10.5, color: COLORS.INK_MUTED }}>{children}</div>
);

// ── Signature 1 · virtual-thread fan-out ────────────────────────────────────

export const VThreadFanout: React.FC = () => {
  const N = 6;
  const laneX0 = 196;
  const laneX1 = 384;
  const laneY = (i: number) => 26 + i * 25;
  const inX = 96;
  const inY = 90;
  const writerX = 470;
  const writerY = 90;
  return (
    <div style={CARD}>
      <CardHead label="virtual-thread fan-out" accent={COLORS.AMBER_DEEP} source="ParallelGzipCompressor.java:143–176" />
      <svg viewBox="0 0 600 200" width="100%" style={{ display: "block" }}>
        {/* input */}
        <rect x={inX - 40} y={inY - 26} width={78} height={52} rx={4} fill={COLORS.SURFACE} stroke={COLORS.HAIRLINE_STRONG} strokeWidth={1} />
        {[0, 1, 2, 3].map((r) => (
          <line key={r} x1={inX - 30} y1={inY - 16 + r * 11} x2={inX + 28} y2={inY - 16 + r * 11} stroke={COLORS.INK_SUBTLE} strokeWidth={1} />
        ))}
        <text x={inX - 1} y={inY + 44} textAnchor="middle" fontFamily={mono} fontSize={9} fill={COLORS.INK_MUTED}>input</text>
        <text x={inX - 1} y={inY + 55} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={COLORS.INK_SUBTLE}>1 MiB blocks</text>

        {/* fan-out + lanes */}
        <text x={(inX + laneX0) / 2 + 6} y={12} textAnchor="middle" fontFamily={mono} fontSize={8} letterSpacing="1" fill={COLORS.AMBER_DEEP}>split</text>
        {Array.from({ length: N }, (_, i) => {
          const last = i === N - 1;
          const accent = last ? COLORS.AMBER_DEEP : i % 2 === 0 ? COLORS.AMBER_DEEP : COLORS.STEEL_DEEP;
          const y = laneY(i);
          return (
            <g key={i}>
              <path d={`M ${inX + 38} ${inY} C ${inX + 90} ${inY}, ${laneX0 - 46} ${y}, ${laneX0} ${y}`} fill="none" stroke={accent} strokeOpacity={0.5} strokeWidth={1} />
              <rect x={laneX0} y={y - 9} width={laneX1 - laneX0} height={18} rx={3} fill={accent} fillOpacity={0.06} stroke={accent} strokeOpacity={0.55} strokeWidth={0.9} />
              <rect x={laneX0} y={y - 9} width={2.5} height={18} rx={1} fill={accent} />
              <circle cx={laneX0 - 12} cy={y} r={2.6} fill={accent} />
              <text x={laneX0 + 8} y={y + 3} fontFamily={mono} fontSize={7.5} fill={COLORS.INK_MUTED}>{`vt${i} · Deflater(nowrap)`}</text>
              <text x={laneX1 - 6} y={y + 3} textAnchor="end" fontFamily={mono} fontSize={6.8} fill={accent}>
                {last ? "finish()" : "SYNC_FLUSH"}
              </text>
              {/* stitch to writer */}
              <path d={`M ${laneX1} ${y} C ${laneX1 + 44} ${y}, ${writerX - 40} ${writerY}, ${writerX - 22} ${writerY}`} fill="none" stroke={accent} strokeOpacity={0.42} strokeWidth={0.9} />
            </g>
          );
        })}

        {/* ordered writer → member */}
        <text x={(laneX1 + writerX) / 2 + 8} y={12} textAnchor="middle" fontFamily={mono} fontSize={8} letterSpacing="1" fill={COLORS.AMBER_DEEP}>stitch</text>
        <circle cx={writerX} cy={writerY} r={20} fill={COLORS.AMBER_TINT} stroke={COLORS.AMBER_DEEP} strokeWidth={1.2} />
        <text x={writerX} y={writerY + 3} textAnchor="middle" fontFamily={mono} fontSize={7} fontWeight={700} fill={COLORS.AMBER_DEEP}>writer</text>
        <text x={writerX} y={writerY - 30} textAnchor="middle" fontFamily={mono} fontSize={7} fill={COLORS.INK_MUTED}>ordered · bounded window</text>
        <text x={writerX} y={writerY + 40} textAnchor="middle" fontFamily={mono} fontSize={7} fill={COLORS.INK_MUTED}>+ CRC fold</text>
        {/* arrow to member */}
        <line x1={writerX + 22} y1={writerY} x2={writerX + 74} y2={writerY} stroke={COLORS.GREEN_DEEP} strokeWidth={1.4} />
        <path d={`M ${writerX + 74} ${writerY - 4} L ${writerX + 82} ${writerY} L ${writerX + 74} ${writerY + 4} Z`} fill={COLORS.GREEN_DEEP} />
        <text x={writerX + 78} y={writerY - 12} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={COLORS.GREEN_DEEP}>one</text>
        <text x={writerX + 78} y={writerY + 20} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={COLORS.GREEN_DEEP}>member</text>
      </svg>
      <Caption>
        One <b>virtual thread per block</b> on <code style={{ fontFamily: mono }}>newVirtualThreadPerTaskExecutor()</code>; the writer drains
        them in order behind a bounded in-flight window, folding each block's CRC as it goes.
      </Caption>
    </div>
  );
};

// ── Signature 2 · scalar-vs-vector SIMD lanes ───────────────────────────────

export const SimdLanes: React.FC = () => {
  // Fill proportions are the measured GB/s (1.54 vs 4.34), normalized to the
  // vector bar = full track. The intrinsic is PROOF-page territory; here the
  // point is only scalar-lane vs vector-lane mechanism → 2.8×.
  const trackX0 = 92;
  const trackX1 = 560;
  const trackW = trackX1 - trackX0;
  const scalarFrac = 1.54 / 4.34;
  return (
    <div style={CARD}>
      <CardHead label="scalar vs vector · Adler-32" accent={COLORS.COPPER_DEEP} source="VectorizedAdler32.java · Adler32Benchmark" />
      <svg viewBox="0 0 600 200" width="100%" style={{ display: "block" }}>
        {/* SCALAR lane */}
        <text x={trackX0} y={34} fontFamily={mono} fontSize={8.5} fontWeight={700} fill={COLORS.STEEL_DEEP}>SCALAR</text>
        <text x={trackX0 + 62} y={34} fontFamily={mono} fontSize={7.5} fill={COLORS.INK_SUBTLE}>1 byte / step</text>
        <rect x={trackX0} y={42} width={trackW} height={26} rx={5} fill={COLORS.SURFACE} stroke={COLORS.HAIRLINE} strokeWidth={0.8} />
        {/* fine 1-byte comb */}
        {Array.from({ length: 48 }, (_, i) => {
          const x = trackX0 + 4 + (i * (trackW - 8)) / 48;
          return <line key={i} x1={x} y1={45} x2={x} y2={65} stroke={COLORS.STEEL_DEEP} strokeOpacity={0.18} strokeWidth={0.6} />;
        })}
        <rect x={trackX0} y={42} width={trackW * scalarFrac} height={26} rx={5} fill={COLORS.STEEL} fillOpacity={0.28} />
        <rect x={trackX0 + trackW * scalarFrac - 2} y={42} width={2.5} height={26} fill={COLORS.STEEL_DEEP} />
        <text x={trackX0 + trackW * scalarFrac + 8} y={59} fontFamily={mono} fontSize={9} fontWeight={700} fill={COLORS.STEEL_DEEP}>1.54 GB/s</text>

        {/* VECTOR lane */}
        <text x={trackX0} y={104} fontFamily={mono} fontSize={8.5} fontWeight={700} fill={COLORS.AMBER_DEEP}>VECTOR</text>
        <text x={trackX0 + 62} y={104} fontFamily={mono} fontSize={7.5} fill={COLORS.INK_SUBTLE}>16-byte NEON stride → int lanes</text>
        <rect x={trackX0} y={112} width={trackW} height={26} rx={5} fill={COLORS.SURFACE} stroke={COLORS.HAIRLINE} strokeWidth={0.8} />
        {/* coarse 16-wide stride groups (each = a ByteVector) */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = trackX0 + 4 + (i * (trackW - 8)) / 12;
          return <line key={i} x1={x} y1={115} x2={x} y2={135} stroke={COLORS.AMBER_DEEP} strokeOpacity={0.3} strokeWidth={1.1} />;
        })}
        <rect x={trackX0} y={112} width={trackW} height={26} rx={5} fill={COLORS.AMBER} fillOpacity={0.24} />
        <rect x={trackX1 - 2} y={112} width={2.5} height={26} fill={COLORS.AMBER_DEEP} />
        <text x={trackX0 + 12} y={129} fontFamily={mono} fontSize={9} fontWeight={700} fill={COLORS.AMBER_DEEP}>4.34 GB/s</text>

        {/* the multiple */}
        <rect x={trackX0} y={158} width={148} height={30} rx={6} fill={COLORS.AMBER_TINT} stroke={COLORS.AMBER_DEEP} strokeWidth={1} />
        <text x={trackX0 + 16} y={178} fontFamily={mono} fontSize={16} fontWeight={700} fill={COLORS.AMBER_DEEP}>2.8×</text>
        <text x={trackX0 + 62} y={174} fontFamily={mono} fontSize={7.5} fill={COLORS.INK_MUTED}>vector over</text>
        <text x={trackX0 + 62} y={184} fontFamily={mono} fontSize={7.5} fill={COLORS.INK_MUTED}>scalar</text>
        <text x={trackX1} y={178} textAnchor="end" fontFamily={FONTS.SERIF} fontStyle="italic" fontSize={11} fill={COLORS.INK_MUTED}>
          same bytes, same result — only the Vector API differs
        </text>
      </svg>
      <Caption>
        Each vector stride loads 16 bytes, widens them to int lanes (<code style={{ fontFamily: mono }}>B2I</code>), and accumulates the order-free
        S1 / S2 sums — bit-identical to <code style={{ fontFamily: mono }}>java.util.zip.Adler32</code>.
      </Caption>
    </div>
  );
};

// ── Signature 3 · gzip-member byte layout ───────────────────────────────────

export const GzipByteLayout: React.FC = () => {
  const X0 = 20;
  const X1 = 580;
  const W = X1 - X0;
  const y = 64;
  const h = 40;
  // header (10B) · block0 · block1 · block2 · final · crc(4B) · isize(4B)
  const parts: { w: number; color: string; label: string; sub: string }[] = [
    { w: 0.11, color: COLORS.GREEN_DEEP, label: "1F 8B 08 00…", sub: "header · 10 B" },
    { w: 0.19, color: COLORS.AMBER_DEEP, label: "block 0", sub: "SYNC_FLUSH" },
    { w: 0.17, color: COLORS.STEEL_DEEP, label: "block 1", sub: "SYNC_FLUSH" },
    { w: 0.17, color: COLORS.AMBER_DEEP, label: "block 2", sub: "SYNC_FLUSH" },
    { w: 0.16, color: COLORS.COPPER_DEEP, label: "final block", sub: "finish()" },
    { w: 0.1, color: COLORS.GREEN_DEEP, label: "CRC32", sub: "4 B" },
    { w: 0.1, color: COLORS.GREEN_DEEP, label: "ISIZE", sub: "4 B" },
  ];
  const total = parts.reduce((a, p) => a + p.w, 0);
  let cx = X0;
  const laid = parts.map((p) => {
    const w = (p.w / total) * W;
    const seg = { ...p, x: cx, w };
    cx += w;
    return seg;
  });
  return (
    <div style={CARD}>
      <CardHead label="gzip member · byte layout" accent={COLORS.AMBER_DEEP} source="ParallelGzipCompressor.java:56–63, 178–217" />
      <svg viewBox="0 0 600 150" width="100%" style={{ display: "block" }}>
        {/* BFINAL rail */}
        <text x={X0} y={30} fontFamily={mono} fontSize={7.5} fill={COLORS.INK_SUBTLE}>BFINAL</text>
        {laid.map((s, i) => {
          const isBlock = s.label.includes("block");
          if (!isBlock) return null;
          const final = s.sub === "finish()";
          return (
            <text key={i} x={s.x + s.w / 2} y={30} textAnchor="middle" fontFamily={mono} fontSize={8} fontWeight={700} fill={final ? COLORS.COPPER_DEEP : COLORS.INK_MUTED}>
              {final ? "1" : "0"}
            </text>
          );
        })}
        {/* the strip */}
        {laid.map((s, i) => (
          <g key={i}>
            <rect x={s.x + 1} y={y} width={s.w - 2} height={h} rx={2.5} fill={s.color} fillOpacity={0.14} stroke={s.color} strokeWidth={1} />
            <text x={s.x + s.w / 2} y={y + h / 2 - 1} textAnchor="middle" fontFamily={mono} fontSize={s.w < 60 ? 7 : 8.5} fontWeight={700} fill={s.color}>
              {s.label}
            </text>
            <text x={s.x + s.w / 2} y={y + h / 2 + 11} textAnchor="middle" fontFamily={mono} fontSize={6.5} fill={COLORS.INK_MUTED}>
              {s.sub}
            </text>
          </g>
        ))}
        {/* offset rail */}
        <line x1={X0} y1={y + h + 10} x2={X1} y2={y + h + 10} stroke={COLORS.HAIRLINE} strokeWidth={0.6} />
        <text x={X0} y={y + h + 24} fontFamily={mono} fontSize={7} fill={COLORS.INK_SUBTLE}>0x00</text>
        <text x={laid[1]!.x} y={y + h + 24} textAnchor="middle" fontFamily={mono} fontSize={7} fill={COLORS.INK_SUBTLE}>0x0A</text>
        <text x={X1} y={y + h + 24} textAnchor="end" fontFamily={mono} fontSize={7} fill={COLORS.INK_SUBTLE}>EOF</text>
        {/* bracket over the concatenated deflate stream */}
        <path d={`M ${laid[1]!.x} 52 L ${laid[1]!.x} 47 L ${laid[4]!.x + laid[4]!.w} 47 L ${laid[4]!.x + laid[4]!.w} 52`} fill="none" stroke={COLORS.AMBER_DEEP} strokeWidth={0.8} />
        <text x={(laid[1]!.x + laid[4]!.x + laid[4]!.w) / 2} y={43} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={COLORS.AMBER_DEEP}>
          one concatenated DEFLATE stream
        </text>
      </svg>
      <Caption>
        Every block but the last is <code style={{ fontFamily: mono }}>SYNC_FLUSH</code>ed (BFINAL = 0); only the final block is
        <code style={{ fontFamily: mono }}> finish()</code>ed (BFINAL = 1). Concatenated, it's one member any tool decodes.
      </Caption>
    </div>
  );
};
