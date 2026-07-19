/**
 * jetpack-compress System Card — design tokens (self-contained).
 *
 * This booklet ships standalone: every token is inlined here so
 * `jetpack-compress/booklet` builds with no external package. The palette is
 * jetpack-compress's OWN identity, lifted verbatim from the live web landing
 * (`web/src/index.css`) so the printed card and the site read as one product:
 *
 *   INK ground   #0a0b0d   the systems canvas (web --color-ink)
 *   AMBER        #ff9e2c   the ONE signal accent — the hand-written / hero path
 *   STEEL        #6ba5c4   the cool foil — the delegated / scalar baseline
 *   GREEN        #4ed08a   pass / live / measured-and-verified
 *   COPPER       #c9781a   deep-amber sibling (the site's bench-bar gradient stop)
 *   SLATE        #8b93a1   a lifted neutral — the deliberately-plain workshop
 *
 * Bright accents ride the dark surfaces (cover, dividers); the *_DEEP variants
 * are their legible-on-white counterparts for the light editorial pages.
 *
 * The type PAIRING is the shared booklet format — Instrument Serif + Plus
 * Jakarta Sans + a technical monospace (Monaspace Neon, bundled). The site's
 * mono is JetBrains Mono; the booklet keeps the framework's bundled Monaspace
 * for the numeric/label voice — both are systems monospace, and the palette +
 * serif/sans pairing carry the shared identity.
 */

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export const COLORS = {
  // Paper (light content pages)
  PAPER: "#FFFFFF",
  PAPER_WARM: "#FBFBFC",
  PAPER_ELEVATED: "#F4F5F7",
  SURFACE: "#ECEEF1", // echoes the site's on-dark fg as a light surface

  // Hairlines
  HAIRLINE: "#D3D7DE",
  HAIRLINE_STRONG: "#9AA0A8", // web --color-muted

  // Ink (primary text + the near-black full-bleed ground)
  INK: "#0A0B0D", // web --color-ink
  INK_SOFT: "#0E1013", // web --color-ink2
  INK_MUTED: "rgba(10, 11, 13, 0.62)",
  INK_SUBTLE: "rgba(10, 11, 13, 0.40)",

  // On-dark inks (text over the #0A0B0D ground)
  ON_DARK: "#ECEEF1", // web --color-fg
  ON_DARK_MUTED: "rgba(236, 238, 241, 0.66)", // ≈ web --color-muted
  ON_DARK_SUBTLE: "rgba(236, 238, 241, 0.40)", // ≈ web --color-faint
  ON_DARK_HAIRLINE: "rgba(236, 238, 241, 0.15)",

  // Dark grounds — cover / dividers / back cover (web ink / panel scale)
  GROUND: "#0A0B0D",
  GROUND_ELEVATED: "#121519", // web --color-panel
  GROUND_PANEL: "#0E1013", // web --color-ink2
  GROUND_LINE: "#23262D", // web --color-line
  GROUND_LINE2: "#2F333B", // web --color-line2

  // ── Signal accents (bright — for dark surfaces) ──
  AMBER: "#FF9E2C", // web --color-amber — THE signal
  STEEL: "#6BA5C4", // web --color-steel — the cool foil / baseline
  GREEN: "#4ED08A", // web --color-green — pass / live
  COPPER: "#C9781A", // web bench-bar gradient stop
  SLATE: "#8B93A1", // lifted neutral

  // ── Deep variants (legible on white — for editorial pages) ──
  AMBER_DEEP: "#B0630A",
  STEEL_DEEP: "#2F6D86",
  GREEN_DEEP: "#1F8A56",
  COPPER_DEEP: "#8A4E12",
  SLATE_DEEP: "#4A5160",

  // ── Accent tints (fills, bands) ──
  AMBER_TINT: "rgba(255, 158, 44, 0.12)",
  STEEL_TINT: "rgba(107, 165, 196, 0.12)",
  GREEN_TINT: "rgba(78, 208, 138, 0.13)",
  COPPER_TINT: "rgba(201, 120, 26, 0.12)",

  // Status
  SUCCESS: "#1F8A56",
  DANGER: "#D1495B",
  DANGER_TINT: "rgba(209, 73, 91, 0.08)",

  // Neutral scale
  NEUTRAL_300: "#D4D4D4",
  NEUTRAL_400: "#9CA3AF",
  NEUTRAL_500: "#6B7280",
  NEUTRAL_600: "#4B5563",
  NEUTRAL_700: "#374151",
} as const;

// ---------------------------------------------------------------------------
// Fonts — Instrument Serif + Plus Jakarta Sans + Monaspace Neon (mono).
// ---------------------------------------------------------------------------

export const FONTS = {
  SANS: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  SERIF: '"Instrument Serif", Georgia, "Times New Roman", serif',
  MONO: '"Monaspace Neon", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

// ---------------------------------------------------------------------------
// Section color map — one accent per chapter. Bright variant rides the dark
// dividers + accent dots/bars; the *_INK map is the legible-on-white variant
// for content-page eyebrows and page-number footers.
//
//   01 WHY     steel   · the idle, single-threaded baseline — the "before"
//   02 HOW     amber   · the parallel framing — the core novelty (the signal)
//   03 INSIDE  copper  · the hand-vectorized engine room (a warm amber sibling)
//   04 PROOF   green   · measured · verified · byte-valid
//   05 BUILD   slate   · the toolchain workshop (deliberately neutral)
// ---------------------------------------------------------------------------

export const SECTION = {
  "01_WHY": COLORS.STEEL,
  "02_HOW": COLORS.AMBER,
  "03_INSIDE": COLORS.COPPER,
  "04_PROOF": COLORS.GREEN,
  "05_BUILD": COLORS.SLATE,
} as const;

export const SECTION_INK = {
  "01_WHY": COLORS.STEEL_DEEP,
  "02_HOW": COLORS.AMBER_DEEP,
  "03_INSIDE": COLORS.COPPER_DEEP,
  "04_PROOF": COLORS.GREEN_DEEP,
  "05_BUILD": COLORS.SLATE_DEEP,
} as const;

export type SectionKey = keyof typeof SECTION;

// ---------------------------------------------------------------------------
// Typography — sized for a held-in-hand 8.5"×11" page. Ported from the
// framework's proven ladder (px at 96 CSS DPI; printed pt = px ÷ 1.333).
// ---------------------------------------------------------------------------

export const TYPE = {
  // Display — cover title, divider numerals
  display: { size: 220, weight: 700, tracking: "-0.03em", lh: 0.92 },
  displayMedium: { size: 112, weight: 700, tracking: "-0.025em", lh: 1 },

  // Section title on divider pages (italic serif)
  sectionTitle: { size: 80, weight: 400, tracking: "0", lh: 1, italic: true },

  // Page headlines and subheads
  h1: { size: 36, weight: 700, tracking: "-0.02em", lh: 1.08 },
  h2: { size: 22, weight: 600, tracking: "-0.015em", lh: 1.2 },

  // Italic serif subheads
  subheadLarge: { size: 20, weight: 400, italic: true, lh: 1.2 },
  subheadMedium: { size: 18, weight: 400, italic: true, lh: 1.25 },
  subheadSmall: { size: 14, weight: 400, italic: true, lh: 1.3 },

  // Body
  body: { size: 11, weight: 400, tracking: "-0.005em", lh: 1.46 },

  // Pull quotes (serif italic)
  pullQuote: { size: 28, weight: 400, tracking: "0", lh: 1.25, italic: true },
  pullQuoteSmall: { size: 24, weight: 400, tracking: "0", lh: 1.25, italic: true },

  // Supporting
  caption: { size: 10, weight: 500, tracking: "0.02em", lh: 1.25 },
  mono: { size: 10, weight: 500, tracking: "0.04em", lh: 1.2 },
  pageNum: { size: 9, weight: 500, tracking: "0.04em", lh: 1 },

  // Monaspace UPPERCASE eyebrow
  eyebrow: { size: 10, weight: 500, tracking: "0.12em", lh: 1 },
  eyebrowLarge: { size: 14, weight: 500, tracking: "0.12em", lh: 1 },

  // Subtitle under divider number
  dividerSubtitle: { size: 24, weight: 400, tracking: "-0.01em", lh: 1.2 },

  // Small caps on callouts
  approvalLabel: { size: 10, weight: 600, tracking: "0.18em", lh: 1 },

  // Metric tiers — the numeric voice (mono 700, tabular)
  metricHero: { size: 92, weight: 700, tracking: "-0.03em", lh: 0.95 },
  metricLarge: { size: 60, weight: 700, tracking: "-0.02em", lh: 1 },
  metricMedium: { size: 44, weight: 700, tracking: "-0.03em", lh: 1 },
  metricSmall: { size: 30, weight: 700, tracking: "-0.02em", lh: 1 },
} as const;

// ---------------------------------------------------------------------------
// Page geometry — 8.5"×11" trim, 0.125" bleed, asymmetric margins.
// ---------------------------------------------------------------------------

export const PAGE = {
  trimW: 8.5,
  trimH: 11,
  bleedIn: 0.125,
  margin: {
    outer: 0.75,
    top: 0.875,
    bottom: 1.0,
    inner: 0.75,
  },
  grid: {
    cols: 4,
    gutterIn: 0.25,
  },
} as const;

// ---------------------------------------------------------------------------
// Card chrome
// ---------------------------------------------------------------------------

export const CARD = {
  bg: COLORS.PAPER_ELEVATED,
  border: `1px solid ${COLORS.HAIRLINE}`,
  radius: 6,
  padding: 10,
} as const;

// ---------------------------------------------------------------------------
// Color utility — hex → rgba().
// ---------------------------------------------------------------------------

export function hexWithAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
