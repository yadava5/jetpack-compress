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

/** Page 12 — virtual threads, honestly. */
export const HowVThreadsPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="HOW" sectionColor={AMBER} eyebrow={HOW.vthreads.eyebrow} headline={HOW.vthreads.headline}>
    <Lede>{HOW.vthreads.lede}</Lede>
    {HOW.vthreads.body.map((t) => (
      <Body key={t.slice(0, 24)}>{t}</Body>
    ))}
    <div style={{ marginTop: 22, maxWidth: "6.2in", borderTop: `1pt solid ${COLORS.INK}`, paddingTop: 18 }}>
      <PullQuote color={COLORS.INK}>{HOW.vthreads.pullQuote}</PullQuote>
    </div>
    <SourceRail>{HOW.vthreads.source}</SourceRail>
  </BodyPage>
);
