import React from "react";
import { COLORS } from "../theme";

/**
 * JetpackMark — the project's mark (web/public/favicon.svg), hand-transcribed
 * as inline SVG so the print/PDF path never fetches an asset: many lines
 * converging through a chevron into one — many members, one gzip stream. The
 * favicon's dark rounded tile is DROPPED (its #0A0B0D fill IS this book's
 * GROUND, so the tile would print as nothing) and the glyph keeps the
 * favicon's single all-amber voice, resolved explicitly from theme.ts
 * (COLORS.AMBER — measured APCA Lc -62 on GROUND; no currentColor, no
 * prefers-color-scheme).
 */
export const JetpackMark: React.FC<{
  /** Rendered glyph height in px; width follows the 20.4:14.4 crop. */
  height: number;
  style?: React.CSSProperties;
}> = ({ height, style }) => (
  <svg
    aria-hidden
    width={(height * 20.4) / 14.4}
    height={height}
    viewBox="5.8 8.8 20.4 14.4"
    fill="none"
    style={style}
  >
    <g stroke={COLORS.AMBER} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10 H14.5" />
      <path d="M7 16 H19" />
      <path d="M7 22 H14.5" />
      <path d="M14.5 10 L20 16 L14.5 22" />
      <path d="M20 16 H25" />
    </g>
  </svg>
);
