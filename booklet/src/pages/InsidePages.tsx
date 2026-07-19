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
    <SourceRail>{INSIDE.ffm.source}</SourceRail>
  </BodyPage>
);

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
