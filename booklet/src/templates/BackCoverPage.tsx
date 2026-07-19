import React from "react";
import { COLORS, FONTS } from "../theme";
import { BACK_COVER } from "../content";
import { CoverField } from "../visuals/CoverField";

/**
 * Back cover (page 24) — a PURE closing that bookends the front cover. It
 * reuses the front cover's pipeline field (reseeded + dimmed as a wraparound),
 * echoes the cover's wordmark and its "one member · every core" margin motif,
 * and lands on one quiet closing line. There is deliberately NO QR, URL, or
 * CTA here: the reader was sent to the live product on the Try-It page (23);
 * the very last page just closes the book, the way a real book's last page does.
 */
export const BackCoverPage: React.FC = () => (
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
    <CoverField widthIn={8.75} heightIn={11.25} variant="back" />

    {/* Colophon — upper-left (mirrors the cover masthead's position) */}
    <div
      style={{
        position: "absolute",
        top: "0.7in",
        left: "0.7in",
        fontFamily: FONTS.MONO,
        fontSize: 8.5,
        fontWeight: 500,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.ON_DARK_MUTED,
        lineHeight: 1.7,
      }}
    >
      {BACK_COVER.colophon.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          <br />
        </React.Fragment>
      ))}
    </div>

    {/* End-mark — upper-right, a quiet serif echo of the cover's legend pill */}
    <div
      style={{
        position: "absolute",
        top: "0.62in",
        right: "0.7in",
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      {[COLORS.AMBER, COLORS.STEEL, COLORS.GREEN].map((c, i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c, opacity: 0.85 }} />
      ))}
      <span
        style={{
          fontFamily: FONTS.SERIF,
          fontStyle: "italic",
          fontSize: 15,
          color: COLORS.ON_DARK_MUTED,
          marginLeft: 4,
        }}
      >
        {BACK_COVER.endMark}
      </span>
    </div>

    {/* Vertical margin motif — right edge (mirrors the cover's callout) */}
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
      {BACK_COVER.motif}
    </div>

    {/* Scrim behind the closing block (identical to the cover's) */}
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

    {/* Closing block — lower-left, mirrors the cover's title block */}
    <div
      style={{
        position: "absolute",
        left: "0.7in",
        bottom: "0.95in",
        right: "0.7in",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.MONO,
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 0.98,
          color: COLORS.ON_DARK,
        }}
      >
        jetpack<span style={{ color: COLORS.AMBER }}>-compress</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 44, height: 1, background: COLORS.ON_DARK_HAIRLINE }} />
        <span
          style={{
            fontFamily: FONTS.SERIF,
            fontStyle: "italic",
            fontSize: 17,
            lineHeight: 1.25,
            color: COLORS.ON_DARK_MUTED,
          }}
        >
          {BACK_COVER.closingLine}
        </span>
      </div>
    </div>
  </section>
);
