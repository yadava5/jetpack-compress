import React from "react";
import { COLORS, FONTS, TYPE } from "../theme";
import { SourceNote } from "../primitives/SourceNote";

/**
 * Shared body-page building blocks — the recurring editorial pieces every
 * content page composes from, so the 15 pages stay visually consistent and
 * each file reads as intent, not boilerplate.
 */

/** Serif-italic lede/subhead. */
export const Lede: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p
    style={{
      fontFamily: FONTS.SERIF,
      fontStyle: "italic",
      fontSize: 17,
      lineHeight: 1.36,
      color: COLORS.INK_MUTED,
      margin: "0 0 20px",
      maxWidth: "6.4in",
      ...style,
    }}
  >
    {children}
  </p>
);

/** Sans body paragraph. */
export const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p
    style={{
      fontFamily: FONTS.SANS,
      fontSize: TYPE.body.size,
      lineHeight: TYPE.body.lh,
      letterSpacing: TYPE.body.tracking,
      color: COLORS.INK,
      margin: "0 0 14px",
      maxWidth: "6.4in",
      ...style,
    }}
  >
    {children}
  </p>
);

/** A ruled N-up strip of mono metrics. */
export const StatStrip: React.FC<{
  stats: ReadonlyArray<{ value: string; label: string }>;
  accent: string;
  style?: React.CSSProperties;
}> = ({ stats, accent, style }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
      gap: 0,
      borderTop: `1pt solid ${COLORS.INK}`,
      borderBottom: `0.5pt solid ${COLORS.HAIRLINE}`,
      ...style,
    }}
  >
    {stats.map((s, i) => (
      <div
        key={s.label}
        style={{
          padding: "14px 16px",
          borderLeft: i === 0 ? "none" : `0.5pt solid ${COLORS.HAIRLINE}`,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.MONO,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: accent,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {s.value}
        </span>
        <span
          style={{
            fontFamily: FONTS.MONO,
            fontSize: 8.5,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: COLORS.INK_MUTED,
          }}
        >
          {s.label}
        </span>
      </div>
    ))}
  </div>
);

/** A left-barred callout box (honesty notes, plain statements). */
export const Callout: React.FC<{
  label: string;
  accent: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ label, accent, children, style }) => (
  <div
    style={{
      background: COLORS.PAPER_ELEVATED,
      border: `0.5pt solid ${COLORS.HAIRLINE}`,
      borderLeft: `2.5px solid ${accent}`,
      borderRadius: 4,
      padding: "12px 16px",
      ...style,
    }}
  >
    <div
      style={{
        fontFamily: FONTS.MONO,
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: accent,
        marginBottom: 5,
      }}
    >
      {label}
    </div>
    <p style={{ fontFamily: FONTS.SANS, fontSize: 10.5, lineHeight: 1.45, color: COLORS.INK, margin: 0 }}>{children}</p>
  </div>
);

/** Absolute bottom-left source rail. */
export const SourceRail: React.FC<{ children: React.ReactNode; extra?: string }> = ({ children, extra }) => (
  <div style={{ position: "absolute", left: "0.75in", bottom: "1.05in", display: "flex", flexDirection: "column", gap: 6 }}>
    {extra && (
      <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, color: COLORS.INK_MUTED, fontVariantNumeric: "tabular-nums" }}>{extra}</div>
    )}
    <SourceNote>{children}</SourceNote>
  </div>
);

/** A scope column: a labeled list with colored square marks. */
export const ScopeColumn: React.FC<{
  label: string;
  accent: string;
  items: ReadonlyArray<string>;
  variant: "solid" | "dashed";
}> = ({ label, accent, items, variant }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
    <div
      style={{
        fontFamily: FONTS.MONO,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: accent,
        paddingBottom: 6,
        borderBottom: `1pt solid ${accent}`,
      }}
    >
      {label}
    </div>
    {items.map((it) => (
      <div key={it} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
        <span
          style={{
            width: 7,
            height: 7,
            marginTop: 4,
            flex: "none",
            borderRadius: 1.5,
            background: variant === "solid" ? accent : "transparent",
            border: variant === "dashed" ? `1px dashed ${accent}` : "none",
          }}
        />
        <span style={{ fontFamily: FONTS.SANS, fontSize: 10.5, lineHeight: 1.4, color: COLORS.INK }}>{it}</span>
      </div>
    ))}
  </div>
);
