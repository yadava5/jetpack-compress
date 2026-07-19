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

      <div style={{ flex: 0.5 }} />

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

      <div style={{ flex: 0.42 }} />

      {/* The engine in one line — a quiet pipeline motif that seeds the book. */}
      <PipelineMotif />

      <div style={{ flex: 0.42 }} />

      {/* Provenance rule — the honesty spine every data page carries. */}
      <div
        style={{
          fontFamily: FONTS.SERIF,
          fontStyle: "italic",
          fontSize: 12,
          lineHeight: 1.4,
          color: COLORS.INK_MUTED,
          margin: "0 0 12px",
          maxWidth: "6.2in",
          borderLeft: `2px solid ${COLORS.GREEN_DEEP}`,
          paddingLeft: 12,
        }}
      >
        Every figure in this card traces to a file:line in the repo — the source rails at the foot of each page are the receipts.
      </div>

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

/** The four-stage engine as a quiet inline motif — seeds the book's flow. */
const PipelineMotif: React.FC = () => {
  const stages: ReadonlyArray<{ label: string; sub: string; accent: string }> = [
    { label: "split", sub: "1 MiB blocks", accent: COLORS.STEEL_DEEP },
    { label: "fan out", sub: "vthread / block", accent: COLORS.AMBER_DEEP },
    { label: "stitch", sub: "one gzip member", accent: COLORS.AMBER_DEEP },
    { label: "verify", sub: "real gzip · CRC-32", accent: COLORS.GREEN_DEEP },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        border: `0.5pt solid ${COLORS.HAIRLINE}`,
        borderRadius: 6,
        background: COLORS.PAPER_WARM,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontFamily: FONTS.MONO,
          fontSize: 8.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: COLORS.INK_SUBTLE,
          borderRight: `0.5pt solid ${COLORS.HAIRLINE}`,
          whiteSpace: "nowrap",
        }}
      >
        bytes in
      </div>
      {stages.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && (
            <div style={{ display: "flex", alignItems: "center", color: COLORS.INK_SUBTLE, fontFamily: FONTS.MONO, fontSize: 12, padding: "0 2px" }}>→</div>
          )}
          <div style={{ flex: 1, padding: "11px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.accent }} />
              <span style={{ fontFamily: FONTS.MONO, fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.INK }}>{s.label}</span>
            </div>
            <span style={{ fontFamily: FONTS.MONO, fontSize: 7.5, letterSpacing: "0.04em", color: COLORS.INK_MUTED }}>{s.sub}</span>
          </div>
        </React.Fragment>
      ))}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontFamily: FONTS.MONO,
          fontSize: 8.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: COLORS.GREEN_DEEP,
          borderLeft: `0.5pt solid ${COLORS.HAIRLINE}`,
          whiteSpace: "nowrap",
        }}
      >
        .gz out
      </div>
    </div>
  );
};

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
