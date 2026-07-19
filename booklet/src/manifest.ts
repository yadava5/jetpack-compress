/**
 * The booklet's page registry — single source of truth for ordering, parity,
 * and page-kind dispatch. Pure data: the validator script and the runtime
 * `Booklet.tsx` both consume this file, so it must stay JSX-free.
 *
 * Saddle-stitch parity (24-page book = 6 folded sheets): page 01 is a recto
 * (odd index), pages alternate recto/verso, and the page count is a multiple
 * of 4. `scripts/validate-parity.mjs` enforces this at PDF-export time.
 *
 * This edition carries no two-page spreads — the architecture reads as a
 * portrait cover motif plus per-chapter dioramas and signatures, so every
 * interior page is a single `body` or `divider`.
 */

import type { SectionKey } from "./theme";

export type PageKind =
  | "cover"
  | "back-cover"
  | "endpaper"
  | "toc"
  | "divider"
  | "body";

/** Body-page kinds — one per unique body content module. */
export type BodyKey =
  | "why-idle"
  | "why-floor"
  | "why-scope"
  | "how-blocks"
  | "how-stitch"
  | "how-crc"
  | "how-vthreads"
  | "inside-simd"
  | "inside-ffm"
  | "inside-delegated"
  | "proof-simd"
  | "proof-parallel"
  | "proof-tests"
  | "build-stack"
  | "build-closing";

export type PageSpec =
  | { num: 1; kind: "cover"; parity: "recto"; sectionKey: null }
  | { num: 2; kind: "endpaper"; parity: "verso"; sectionKey: null }
  | { num: 3; kind: "toc"; parity: "recto"; sectionKey: null }
  | {
      num: number;
      kind: "divider";
      parity: "recto" | "verso";
      sectionKey: SectionKey;
      chapterNum: string;
      chapterTitle: string;
      subtitle: string;
      chapterIndex: number;
      chapterTotal: number;
    }
  | {
      num: number;
      kind: "body";
      parity: "recto" | "verso";
      sectionKey: SectionKey;
      body: BodyKey;
    }
  | { num: 24; kind: "back-cover"; parity: "verso"; sectionKey: null };

// ---------------------------------------------------------------------------
// Manifest — the 24 pages, in order.
// ---------------------------------------------------------------------------

export const PAGES: readonly PageSpec[] = [
  { num: 1, kind: "cover", parity: "recto", sectionKey: null },
  { num: 2, kind: "endpaper", parity: "verso", sectionKey: null },
  { num: 3, kind: "toc", parity: "recto", sectionKey: null },

  {
    num: 4, kind: "divider", parity: "verso", sectionKey: "01_WHY",
    chapterNum: "01", chapterTitle: "WHY",
    subtitle: "a many-core CPU, and gzip using one lane of it",
    chapterIndex: 1, chapterTotal: 5,
  },
  { num: 5, kind: "body", parity: "recto", sectionKey: "01_WHY", body: "why-idle" },
  { num: 6, kind: "body", parity: "verso", sectionKey: "01_WHY", body: "why-floor" },
  { num: 7, kind: "body", parity: "recto", sectionKey: "01_WHY", body: "why-scope" },

  {
    num: 8, kind: "divider", parity: "verso", sectionKey: "02_HOW",
    chapterNum: "02", chapterTitle: "HOW",
    subtitle: "split into blocks · fan out on virtual threads · stitch one member",
    chapterIndex: 2, chapterTotal: 5,
  },
  { num: 9, kind: "body", parity: "recto", sectionKey: "02_HOW", body: "how-blocks" },
  { num: 10, kind: "body", parity: "verso", sectionKey: "02_HOW", body: "how-stitch" },
  { num: 11, kind: "body", parity: "recto", sectionKey: "02_HOW", body: "how-crc" },
  { num: 12, kind: "body", parity: "verso", sectionKey: "02_HOW", body: "how-vthreads" },

  {
    num: 13, kind: "divider", parity: "recto", sectionKey: "03_INSIDE",
    chapterNum: "03", chapterTitle: "INSIDE",
    subtitle: "the hand-vectorized checksum, memory-mapped I/O, and what's delegated",
    chapterIndex: 3, chapterTotal: 5,
  },
  { num: 14, kind: "body", parity: "verso", sectionKey: "03_INSIDE", body: "inside-simd" },
  { num: 15, kind: "body", parity: "recto", sectionKey: "03_INSIDE", body: "inside-ffm" },
  { num: 16, kind: "body", parity: "verso", sectionKey: "03_INSIDE", body: "inside-delegated" },

  {
    num: 17, kind: "divider", parity: "recto", sectionKey: "04_PROOF",
    chapterNum: "04", chapterTitle: "PROOF",
    subtitle: "2.8× measured · ~6.5× on a quick run · 72 green · byte-valid gzip",
    chapterIndex: 4, chapterTotal: 5,
  },
  { num: 18, kind: "body", parity: "verso", sectionKey: "04_PROOF", body: "proof-simd" },
  { num: 19, kind: "body", parity: "recto", sectionKey: "04_PROOF", body: "proof-parallel" },
  { num: 20, kind: "body", parity: "verso", sectionKey: "04_PROOF", body: "proof-tests" },

  {
    num: 21, kind: "divider", parity: "recto", sectionKey: "05_BUILD",
    chapterNum: "05", chapterTitle: "BUILD",
    subtitle: "JDK 25 · Maven · the CLI, and the JMH harness behind a profile",
    chapterIndex: 5, chapterTotal: 5,
  },
  { num: 22, kind: "body", parity: "verso", sectionKey: "05_BUILD", body: "build-stack" },
  { num: 23, kind: "body", parity: "recto", sectionKey: "05_BUILD", body: "build-closing" },

  { num: 24, kind: "back-cover", parity: "verso", sectionKey: null },
] as const;

// ---------------------------------------------------------------------------
// Invariants — enforced at validate-parity.mjs time.
// ---------------------------------------------------------------------------

/** Expected parity for a given 1-based page index: recto on odd, verso on even. */
export function expectedParity(num: number): "recto" | "verso" {
  return num % 2 === 1 ? "recto" : "verso";
}

/** Assert manifest invariants. Throws the first failure it encounters. */
export function assertManifestInvariants(): void {
  if (PAGES.length % 4 !== 0) {
    throw new Error(`saddle-stitch needs a multiple of 4 pages, got ${PAGES.length}`);
  }
  for (const p of PAGES) {
    if (p.parity !== expectedParity(p.num)) {
      throw new Error(
        `page ${p.num}: expected ${expectedParity(p.num)}, manifest says ${p.parity}`,
      );
    }
  }
  const dividers = PAGES.filter((p) => p.kind === "divider");
  if (dividers.length !== 5) {
    throw new Error(`expected 5 chapter dividers, got ${dividers.length}`);
  }
}
