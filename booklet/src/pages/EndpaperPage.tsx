import React from "react";
import { Page } from "../primitives/Page";
import { COLORS, FONTS } from "../theme";
import { ABSTRACT, BRAND, MASTHEAD } from "../content";

/**
 * Welcome / endpaper (page 02). A quiet opening: the masthead kicker, a serif
 * "Welcome.", the ≤80-word abstract, and a three-fact strip that previews the
 * whole engine (72 tests, 2.8× SIMD, ~6.5× parallel) before chapter one.
 */
export const EndpaperPage: React.FC<{
  parity: "recto" | "verso";
  pageNumber: number;
  totalPages: number;
}> = ({ parity, pageNumber, totalPages }) => (
  <Page
    parity={parity}
    pageNumber={pageNumber}
    totalPages={totalPages}
    sectionLabel="FRONTMATTER"
    sectionColor={COLORS.INK_MUTED}
    hideFooter
  >
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Masthead */}
      <div
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: COLORS.INK_MUTED,
        }}
      >
        {MASTHEAD.volume}
      </div>

      <div style={{ flex: 1 }} />

      {/* Greeting + abstract */}
      <div style={{ maxWidth: "6.2in" }}>
        <h1
          style={{
            fontFamily: FONTS.SERIF,
            fontStyle: "italic",
            fontSize: 68,
            fontWeight: 400,
            lineHeight: 1,
            color: COLORS.INK,
            margin: "0 0 22px",
          }}
        >
          {ABSTRACT.greeting}
        </h1>
        <p
          style={{
            fontFamily: FONTS.SANS,
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.6,
            letterSpacing: "-0.005em",
            color: COLORS.INK,
            margin: 0,
          }}
        >
          {ABSTRACT.body}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      {/* Three-fact strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          borderTop: `1pt solid ${COLORS.INK}`,
          borderBottom: `0.5pt solid ${COLORS.HAIRLINE}`,
        }}
      >
        <Fact value="72" unit="tests green" note="incl. real gzip -t / gzip -dc" accent={COLORS.GREEN_DEEP} />
        <Fact value="2.8×" unit="SIMD" note="vector Adler-32 over scalar" accent={COLORS.AMBER_DEEP} first={false} />
        <Fact value="~6.5×" unit="parallel" note="over single-thread gzip (±50%)" accent={COLORS.STEEL_DEEP} first={false} />
      </div>

      {/* Kicker */}
      <p
        style={{
          fontFamily: FONTS.SERIF,
          fontStyle: "italic",
          fontSize: 13,
          lineHeight: 1.4,
          color: COLORS.INK_MUTED,
          margin: "16px 0 0",
          maxWidth: "6.2in",
        }}
      >
        {MASTHEAD.kicker}
      </p>

      <div
        style={{
          marginTop: 12,
          fontFamily: FONTS.MONO,
          fontSize: 8.5,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: COLORS.INK_SUBTLE,
        }}
      >
        {BRAND.author} · {BRAND.year} · {BRAND.liveUrl}
      </div>
    </div>
  </Page>
);

const Fact: React.FC<{
  value: string;
  unit: string;
  note: string;
  accent: string;
  first?: boolean;
}> = ({ value, unit, note, accent, first = true }) => (
  <div
    style={{
      padding: "14px 16px",
      borderLeft: first ? "none" : `0.5pt solid ${COLORS.HAIRLINE}`,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: accent,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: COLORS.INK_MUTED,
        }}
      >
        {unit}
      </span>
    </div>
    <span
      style={{
        fontFamily: FONTS.SERIF,
        fontStyle: "italic",
        fontSize: 11,
        color: COLORS.INK_MUTED,
      }}
    >
      {note}
    </span>
  </div>
);
