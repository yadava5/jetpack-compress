import React from "react";
import { COLORS, FONTS } from "../theme";
import { BRAND, MASTHEAD } from "../content";
import { CoverField } from "../visuals/CoverField";

/**
 * Front cover (page 01). A full-bleed #0a0b0d field carrying the engine's
 * whole story — input bytes fanning into parallel blocks, SIMD lanes, and one
 * stitched gzip member (CoverField) — under a mono wordmark, a three-dot
 * legend that seeds the book's semantic color language (hand-written / zlib /
 * verified), and a soft scrim behind the title block.
 */
export const CoverPage: React.FC = () => (
  <section
    className="page"
    data-bleed="true"
    style={{
      background: COLORS.GROUND,
      color: COLORS.ON_DARK,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <CoverField widthIn={8.75} heightIn={11.25} variant="front" />

    {/* Masthead — top-left */}
    <div
      style={{
        position: "absolute",
        top: "0.7in",
        left: "0.7in",
        fontFamily: FONTS.MONO,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: COLORS.ON_DARK_MUTED,
      }}
    >
      jetpack-compress · System Card
    </div>

    {/* Semantic legend — top-right, establishes the color language up front. */}
    <div
      style={{
        position: "absolute",
        top: "0.58in",
        right: "0.62in",
        display: "flex",
        gap: 13,
        alignItems: "center",
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(8, 9, 12, 0.66)",
        border: `0.5pt solid ${COLORS.ON_DARK_HAIRLINE}`,
      }}
    >
      {[
        { c: COLORS.AMBER, l: "hand-written" },
        { c: COLORS.STEEL, l: "zlib" },
        { c: COLORS.GREEN, l: "verified" },
      ].map((x) => (
        <span
          key={x.l}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: FONTS.MONO,
            fontSize: 8,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: COLORS.ON_DARK,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: x.c }} />
          {x.l}
        </span>
      ))}
    </div>

    {/* Vertical margin callout — right edge */}
    <div
      style={{
        position: "absolute",
        right: "0.4in",
        bottom: "1.0in",
        writingMode: "vertical-rl",
        fontFamily: FONTS.MONO,
        fontSize: 8.5,
        fontWeight: 500,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: COLORS.ON_DARK_SUBTLE,
      }}
    >
      one member · every core
    </div>

    {/* Scrim behind the title block */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "3.6in",
        background: `linear-gradient(to top, ${COLORS.GROUND} 14%, rgba(10,11,13,0.86) 48%, rgba(10,11,13,0) 100%)`,
        pointerEvents: "none",
      }}
    />

    {/* Title block — lower-left */}
    <div
      style={{
        position: "absolute",
        left: "0.7in",
        bottom: "0.95in",
        right: "0.7in",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 56,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 0.98,
          color: COLORS.ON_DARK,
        }}
      >
        jetpack<span style={{ color: COLORS.AMBER }}>-compress</span>
      </div>
      <div
        style={{
          fontFamily: FONTS.SERIF,
          fontStyle: "italic",
          fontSize: 23,
          lineHeight: 1.22,
          color: COLORS.ON_DARK_MUTED,
          maxWidth: "5.6in",
        }}
      >
        {BRAND.subtitle}
      </div>
      <div
        style={{
          marginTop: 6,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: FONTS.MONO,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.ON_DARK,
        }}
      >
        <span>
          {BRAND.author} · {BRAND.year}
        </span>
        <span style={{ width: 28, height: 1, background: COLORS.ON_DARK_HAIRLINE }} />
        <span style={{ color: COLORS.ON_DARK_SUBTLE }}>{MASTHEAD.volume}</span>
      </div>
    </div>
  </section>
);
