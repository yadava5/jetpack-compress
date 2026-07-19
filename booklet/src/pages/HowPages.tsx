import React from "react";
import { BodyPage } from "../templates/BodyPage";
import { COLORS, FONTS, SECTION_INK } from "../theme";
import { HOW } from "../content";
import { PullQuote } from "../primitives/PullQuote";
import { VThreadFanout, GzipByteLayout } from "../visuals/Signatures";
import { Body, Lede, StatStrip, SourceRail } from "./_shared";

type PageProps = { parity: "recto" | "verso"; pageNumber: number; totalPages: number };
const AMBER = SECTION_INK["02_HOW"];

/** Page 09 — split & fan out (signature: virtual-thread fan-out). */
export const HowBlocksPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="HOW" sectionColor={AMBER} eyebrow={HOW.blocks.eyebrow} headline={HOW.blocks.headline}>
    <Lede>{HOW.blocks.lede}</Lede>
    <div style={{ marginBottom: 16 }}>
      <VThreadFanout />
    </div>
    <Body>{HOW.blocks.body}</Body>
    <StatStrip stats={HOW.blocks.stats} accent={AMBER} style={{ marginTop: 10 }} />
    <SourceRail>{HOW.blocks.source}</SourceRail>
  </BodyPage>
);

/** Page 10 — single-member stitching (signature: gzip byte layout). */
export const HowStitchPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="HOW" sectionColor={AMBER} eyebrow={HOW.stitch.eyebrow} headline={HOW.stitch.headline}>
    <Lede>{HOW.stitch.lede}</Lede>
    <div style={{ marginBottom: 16 }}>
      <GzipByteLayout />
    </div>
    <Body>{HOW.stitch.body}</Body>

    {/* Member accounting — the fixed framing overhead, all standard-gzip constants. */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginTop: 14, borderTop: `1pt solid ${COLORS.INK}`, borderBottom: `0.5pt solid ${COLORS.HAIRLINE}`, maxWidth: "6.4in" }}>
      {[
        { v: "10 B", k: "header", note: "1F 8B 08 · mtime · OS", c: COLORS.GREEN_DEEP },
        { v: "0 → 0 → 1", k: "BFINAL", note: "SYNC_FLUSH ×N, then finish()", c: COLORS.AMBER_DEEP },
        { v: "4 B", k: "CRC-32", note: "of the whole input", c: COLORS.GREEN_DEEP },
        { v: "4 B", k: "ISIZE", note: "input size mod 2³²", c: COLORS.GREEN_DEEP },
      ].map((x, i) => (
        <div key={x.k} style={{ padding: "10px 12px", borderLeft: i === 0 ? "none" : `0.5pt solid ${COLORS.HAIRLINE}`, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: FONTS.MONO, fontSize: 15, fontWeight: 700, color: x.c, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{x.v}</span>
          <span style={{ fontFamily: FONTS.MONO, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.INK_MUTED }}>{x.k}</span>
          <span style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 9.5, lineHeight: 1.25, color: COLORS.INK_SUBTLE }}>{x.note}</span>
        </div>
      ))}
    </div>

    <SourceRail>{HOW.stitch.source}</SourceRail>
  </BodyPage>
);

/** Page 11 — the CRC, folded. */
export const HowCrcPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="HOW" sectionColor={AMBER} eyebrow={HOW.crc.eyebrow} headline={HOW.crc.headline}>
    <Lede>{HOW.crc.lede}</Lede>
    <CrcFold />
    <Body style={{ marginTop: 18 }}>{HOW.crc.body}</Body>
    <StatStrip stats={HOW.crc.stats} accent={AMBER} style={{ marginTop: 10 }} />
    <SourceRail>{HOW.crc.source}</SourceRail>
  </BodyPage>
);

/** A compact "per-block CRCs → combine → whole-input CRC" fold diagram. */
const CrcFold: React.FC = () => {
  const chips = ["crc(b0)", "crc(b1)", "crc(b2)", "crc(b3)"];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "14px 16px",
        border: `0.5pt solid ${COLORS.HAIRLINE}`,
        borderRadius: 6,
        background: COLORS.PAPER_ELEVATED,
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        {chips.map((c, i) => (
          <React.Fragment key={c}>
            <span
              style={{
                fontFamily: FONTS.MONO,
                fontSize: 10,
                fontWeight: 600,
                color: i % 2 === 0 ? COLORS.AMBER_DEEP : COLORS.STEEL_DEEP,
                background: COLORS.SURFACE,
                border: `0.5pt solid ${COLORS.HAIRLINE}`,
                borderRadius: 3,
                padding: "4px 8px",
              }}
            >
              {c}
            </span>
            {i < chips.length - 1 && <span style={{ color: COLORS.INK_SUBTLE, alignSelf: "center" }}>·</span>}
          </React.Fragment>
        ))}
      </div>
      <span style={{ fontFamily: FONTS.MONO, fontSize: 13, color: COLORS.INK_MUTED }}>→</span>
      <span
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.INK,
          background: COLORS.AMBER_TINT,
          border: `0.5pt solid ${COLORS.AMBER_DEEP}`,
          borderRadius: 3,
          padding: "4px 10px",
        }}
      >
        Crc32Combine (GF2)
      </span>
      <span style={{ fontFamily: FONTS.MONO, fontSize: 13, color: COLORS.INK_MUTED }}>→</span>
      <span
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.GREEN_DEEP,
          background: COLORS.GREEN_TINT,
          border: `0.5pt solid ${COLORS.GREEN_DEEP}`,
          borderRadius: 3,
          padding: "4px 10px",
        }}
      >
        CRC-32 of the whole input
      </span>
    </div>
  );
};

/** Page 12 — virtual threads, honestly (waffle: cheap threads vs the core ceiling). */
export const HowVThreadsPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="HOW" sectionColor={AMBER} eyebrow={HOW.vthreads.eyebrow} headline={HOW.vthreads.headline}>
    <Lede>{HOW.vthreads.lede}</Lede>
    {HOW.vthreads.body.map((t) => (
      <Body key={t.slice(0, 24)}>{t}</Body>
    ))}

    <CarrierCeiling />

    <div style={{ marginTop: 18, maxWidth: "6.2in", borderTop: `1pt solid ${COLORS.INK}`, paddingTop: 14 }}>
      <PullQuote color={COLORS.INK}>{HOW.vthreads.pullQuote}</PullQuote>
    </div>
    <SourceRail>{HOW.vthreads.source}</SourceRail>
  </BodyPage>
);

/**
 * A unit (waffle) chart of the honest ceiling: virtual threads are spawned one
 * per block, by the dozens and nearly free; but the real parallelism is pinned
 * to the ~10 carrier threads ≈ 10 cores — which is exactly the measured ~6.5×.
 */
const CarrierCeiling: React.FC = () => {
  const VT = 40; // illustrative "many cheap vthreads" — schematic, not a count
  const CORES = 10; // the machine these benchmarks ran on (BENCH_META)
  return (
    <div style={{ border: `0.5pt solid ${COLORS.HAIRLINE}`, borderRadius: 6, background: COLORS.PAPER_ELEVATED, padding: 14, marginTop: 18, maxWidth: "6.4in" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: AMBER }}>
          cheap threads · a hard ceiling
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 7, color: COLORS.INK_SUBTLE }}>schematic · 10-core machine</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5in", columnGap: 18, alignItems: "center" }}>
        {/* Left — many cheap vthreads */}
        <div>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, color: COLORS.INK_MUTED, marginBottom: 6 }}>virtual threads — one per block, spawned by the dozens, ~free</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: "3.1in" }}>
            {Array.from({ length: VT }, (_, i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: 2, border: `1px solid ${AMBER}`, background: COLORS.AMBER_TINT }} />
            ))}
          </div>
        </div>

        {/* Right — the carrier / core ceiling */}
        <div style={{ borderLeft: `0.5pt solid ${COLORS.HAIRLINE}`, paddingLeft: 18 }}>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, color: COLORS.INK_MUTED, marginBottom: 6 }}>carriers ≈ {CORES} cores — the real parallelism</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {Array.from({ length: CORES }, (_, i) => (
              <span key={i} style={{ width: 13, height: 13, borderRadius: 2, background: AMBER }} />
            ))}
          </div>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 13, fontWeight: 700, color: COLORS.INK, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
            ≈6.5<span style={{ fontSize: 10 }}>×</span> <span style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 10, fontWeight: 400, color: COLORS.INK_MUTED }}>the measured ceiling</span>
          </div>
        </div>
      </div>
    </div>
  );
};
