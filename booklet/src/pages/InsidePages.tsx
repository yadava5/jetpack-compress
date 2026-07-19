import React from "react";
import { BodyPage } from "../templates/BodyPage";
import { COLORS, FONTS, SECTION_INK } from "../theme";
import { INSIDE, FEATURES } from "../content";
import { SimdLanes } from "../visuals/Signatures";
import { Body, Lede, StatStrip, Callout, SourceRail } from "./_shared";

type PageProps = { parity: "recto" | "verso"; pageNumber: number; totalPages: number };
const COPPER = SECTION_INK["03_INSIDE"];

/** Page 14 — hand-vectorized Adler-32 (signature: scalar vs vector lanes). */
export const InsideSimdPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="INSIDE" sectionColor={COPPER} eyebrow={INSIDE.simd.eyebrow} headline={INSIDE.simd.headline}>
    <Lede>{INSIDE.simd.lede}</Lede>
    <div style={{ marginBottom: 14 }}>
      <SimdLanes />
    </div>
    <Body>{INSIDE.simd.body}</Body>
    <StatStrip stats={INSIDE.simd.stats} accent={COPPER} style={{ marginTop: 10 }} />
    <p style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 11.5, lineHeight: 1.35, color: COLORS.INK_MUTED, margin: "10px 0 0", maxWidth: "6.4in" }}>
      {INSIDE.simd.honestNote}
    </p>
    <SourceRail>{INSIDE.simd.source}</SourceRail>
  </BodyPage>
);

/** Page 15 — memory-mapped, never copied. */
export const InsideFfmPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="INSIDE" sectionColor={COPPER} eyebrow={INSIDE.ffm.eyebrow} headline={INSIDE.ffm.headline}>
    <Lede>{INSIDE.ffm.lede}</Lede>
    <Body>{INSIDE.ffm.body}</Body>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0,
        marginTop: 14,
        border: `0.5pt solid ${COLORS.HAIRLINE}`,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {INSIDE.ffm.facts.map((f, i) => (
        <div
          key={f.k}
          style={{
            padding: "13px 16px",
            borderLeft: i % 2 === 1 ? `0.5pt solid ${COLORS.HAIRLINE}` : "none",
            borderTop: i >= 2 ? `0.5pt solid ${COLORS.HAIRLINE}` : "none",
            background: COLORS.PAPER_ELEVATED,
          }}
        >
          <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COPPER, marginBottom: 4 }}>
            {f.k}
          </div>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 11, color: COLORS.INK }}>{f.v}</div>
        </div>
      ))}
    </div>

    <MappedSlab />

    <SourceRail>{INSIDE.ffm.source}</SourceRail>
  </BodyPage>
);

const monoFF = "ui-monospace, 'SF Mono', Menlo, monospace";

/**
 * Zero-copy memory map, schematically: one shared read-only MemorySegment over
 * the file; each virtual-thread block worker reads its own slice concurrently,
 * straight from mapped memory — the Java heap is bypassed entirely.
 */
const MappedSlab: React.FC = () => {
  const X0 = 40;
  const X1 = 560;
  const W = X1 - X0;
  const N = 4;
  const sliceW = W / N;
  const slabY = 92;
  const slabH = 34;
  return (
    <div style={{ border: `0.5pt solid ${COLORS.HAIRLINE}`, borderRadius: 6, background: COLORS.PAPER_ELEVATED, padding: 14, marginTop: 16, maxWidth: "6.4in" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: COPPER }}>
          one mapping · concurrent slice reads
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 7, color: COLORS.INK_SUBTLE }}>MappedInput.java:37–49</span>
      </div>
      <svg viewBox="0 0 600 176" width="100%" style={{ display: "block", overflow: "visible" }}>
        {/* heap — bypassed */}
        <rect x={X1 - 96} y={8} width={96} height={26} rx={4} fill="none" stroke={COLORS.HAIRLINE_STRONG} strokeWidth={0.8} strokeDasharray="3 3" />
        <text x={X1 - 48} y={21} textAnchor="middle" fontFamily={monoFF} fontSize={8} fill={COLORS.INK_MUTED}>Java heap</text>
        <text x={X1 - 48} y={30} textAnchor="middle" fontFamily={monoFF} fontSize={6.8} fill={COLORS.INK_SUBTLE}>bypassed — no copy</text>

        {/* worker nodes */}
        {Array.from({ length: N }, (_, i) => {
          const cx = X0 + i * sliceW + sliceW / 2;
          return (
            <g key={i}>
              <rect x={cx - 30} y={40} width={60} height={20} rx={4} fill={COLORS.COPPER_TINT} stroke={COLORS.COPPER_DEEP} strokeWidth={0.9} />
              <text x={cx} y={53} textAnchor="middle" fontFamily={monoFF} fontSize={8.5} fontWeight={700} fill={COLORS.COPPER_DEEP}>{`vt${i}`}</text>
              {/* read line into its slice */}
              <line x1={cx} y1={60} x2={cx} y2={slabY - 2} stroke={COLORS.COPPER_DEEP} strokeWidth={0.9} strokeOpacity={0.55} />
              <path d={`M ${cx - 3} ${slabY - 7} L ${cx} ${slabY - 2} L ${cx + 3} ${slabY - 7} Z`} fill={COLORS.COPPER_DEEP} fillOpacity={0.7} />
              <text x={cx} y={74} textAnchor="middle" fontFamily={monoFF} fontSize={6.6} fill={COLORS.INK_SUBTLE}>slice read</text>
            </g>
          );
        })}

        {/* the mapped slab */}
        {Array.from({ length: N }, (_, i) => (
          <rect key={i} x={X0 + i * sliceW + (i === 0 ? 0 : 1)} y={slabY} width={sliceW - (i === 0 ? 1 : 2)} height={slabH} rx={2}
            fill={COLORS.COPPER} fillOpacity={0.1} stroke={COLORS.COPPER_DEEP} strokeOpacity={0.5} strokeWidth={0.9} />
        ))}
        {/* fine byte ticks */}
        {Array.from({ length: 48 }, (_, i) => {
          const x = X0 + 3 + (i * (W - 6)) / 48;
          return <line key={i} x1={x} y1={slabY + 4} x2={x} y2={slabY + slabH - 4} stroke={COLORS.COPPER_DEEP} strokeOpacity={0.14} strokeWidth={0.5} />;
        })}
        <text x={X0 + 6} y={slabY + slabH / 2 + 3} fontFamily={monoFF} fontSize={8} fontWeight={700} fill={COLORS.COPPER_DEEP} fillOpacity={0.85}>MemorySegment</text>
        <text x={X1 - 6} y={slabY + slabH / 2 + 3} textAnchor="end" fontFamily={monoFF} fontSize={7.5} fill={COLORS.INK_MUTED}>mmap · READ_ONLY · shared Arena</text>

        {/* base rail */}
        <line x1={X0} y1={slabY + slabH + 12} x2={X1} y2={slabY + slabH + 12} stroke={COLORS.HAIRLINE} strokeWidth={0.6} />
        <text x={X0} y={slabY + slabH + 26} fontFamily={monoFF} fontSize={7} fill={COLORS.INK_SUBTLE}>0x00</text>
        <text x={(X0 + X1) / 2} y={slabY + slabH + 26} textAnchor="middle" fontFamily={monoFF} fontSize={7.5} fill={COLORS.INK_MUTED}>gigabytes, mapped where they lie — read, never copied</text>
        <text x={X1} y={slabY + slabH + 26} textAnchor="end" fontFamily={monoFF} fontSize={7} fill={COLORS.INK_SUBTLE}>EOF</text>
      </svg>
    </div>
  );
};

/** Page 16 — hand-written vs zlib (the JDK 25 ledger). */
export const InsideDelegatedPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="INSIDE" sectionColor={COPPER} eyebrow={INSIDE.delegated.eyebrow} headline={INSIDE.delegated.headline}>
    <Lede>{INSIDE.delegated.lede}</Lede>

    <div style={{ borderTop: `1pt solid ${COLORS.INK}`, marginBottom: 18 }}>
      {FEATURES.map((f) => {
        const hand = f.kind === "hand-written";
        const accent = hand ? COLORS.AMBER_DEEP : COLORS.STEEL_DEEP;
        return (
          <div
            key={f.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.5in 1fr 1.05in",
              columnGap: 14,
              alignItems: "center",
              padding: "10px 0",
              borderBottom: `0.5pt solid ${COLORS.HAIRLINE}`,
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.SANS, fontSize: 12.5, fontWeight: 600, color: COLORS.INK, letterSpacing: "-0.01em" }}>{f.label}</div>
              <div style={{ fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.INK_SUBTLE, marginTop: 1 }}>{f.module}</div>
            </div>
            <div style={{ fontFamily: FONTS.MONO, fontSize: 9, color: COLORS.STEEL_DEEP }}>{f.where}</div>
            <div
              style={{
                justifySelf: "end",
                fontFamily: FONTS.MONO,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: accent,
                border: `1px solid ${accent}`,
                borderRadius: 3,
                padding: "3px 7px",
                whiteSpace: "nowrap",
              }}
            >
              {f.kind}
            </div>
          </div>
        );
      })}
    </div>

    <Callout label="Stated plainly" accent={COLORS.AMBER_DEEP}>
      {INSIDE.delegated.plainStatement}
    </Callout>
    <SourceRail>{INSIDE.delegated.source}</SourceRail>
  </BodyPage>
);
