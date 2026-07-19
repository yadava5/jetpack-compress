import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { BodyPage } from "../templates/BodyPage";
import { COLORS, FONTS, TYPE, SECTION_INK } from "../theme";
import { BUILD } from "../content";
import { Body, Lede, SourceRail } from "./_shared";

type PageProps = { parity: "recto" | "verso"; pageNumber: number; totalPages: number };
const SLATE = SECTION_INK["05_BUILD"];

/** Page 22 — the stack. */
export const BuildStackPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="BUILD" sectionColor={SLATE} eyebrow={BUILD.stack.eyebrow} headline={BUILD.stack.headline}>
    <Lede>{BUILD.stack.lede}</Lede>

    <div style={{ borderTop: `1pt solid ${COLORS.INK}` }}>
      {BUILD.stack.rows.map((r) => (
        <div
          key={r.area}
          style={{
            display: "grid",
            gridTemplateColumns: "1.1in 1fr",
            columnGap: 18,
            padding: "10px 0",
            borderBottom: `0.5pt solid ${COLORS.HAIRLINE}`,
            alignItems: "baseline",
          }}
        >
          <span style={{ fontFamily: FONTS.MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SLATE }}>
            {r.area}
          </span>
          <div>
            <div style={{ fontFamily: FONTS.SANS, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: COLORS.INK, marginBottom: 1 }}>{r.tech}</div>
            <div style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 11, color: COLORS.INK_MUTED }}>{r.note}</div>
          </div>
        </div>
      ))}
    </div>

    <Body style={{ margin: "18px 0 0" }}>{BUILD.stack.closing}</Body>

    <EngineModuleMap />

    <SourceRail>{BUILD.stack.source}</SourceRail>
  </BodyPage>
);

/**
 * The engine as an architecture strip: the thin CLI, the four hand-written
 * classes named in BUILD.stack.closing, and the zlib codec they wrap. Colors
 * follow the book's hand-written (amber) vs delegated (steel) language.
 */
const EngineModuleMap: React.FC = () => {
  const classes = [
    { n: "ParallelGzipCompressor", r: "block scheduler" },
    { n: "Crc32Combine", r: "GF(2) parallel CRC" },
    { n: "VectorizedAdler32", r: "hand-vectorized SIMD" },
    { n: "MappedInput", r: "FFM mmap I/O" },
  ];
  return (
    <div style={{ marginTop: 18, maxWidth: "6.4in", borderTop: `1pt solid ${COLORS.INK}`, paddingTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: SLATE }}>
          the engine · four classes, wrapped around zlib
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.INK_SUBTLE }}>■ hand-written&nbsp;&nbsp;■ delegated</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "0.85in 1fr 0.95in", columnGap: 12, alignItems: "stretch" }}>
        {/* CLI */}
        <div style={{ border: `0.5pt solid ${COLORS.HAIRLINE}`, borderRadius: 5, background: COLORS.PAPER_ELEVATED, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 6px" }}>
          <span style={{ fontFamily: FONTS.MONO, fontSize: 10, fontWeight: 700, color: COLORS.INK }}>CLI</span>
          <span style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 8.5, color: COLORS.INK_MUTED, textAlign: "center" }}>Main.java</span>
        </div>
        {/* Four hand-written classes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {classes.map((c) => (
            <div key={c.n} style={{ border: `0.5pt solid ${COLORS.HAIRLINE}`, borderLeft: `2.5px solid ${COLORS.AMBER_DEEP}`, borderRadius: 4, background: COLORS.PAPER_ELEVATED, padding: "8px 10px" }}>
              <div style={{ fontFamily: FONTS.MONO, fontSize: 9, fontWeight: 700, color: COLORS.INK, lineHeight: 1.15 }}>{c.n}</div>
              <div style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 9, color: COLORS.INK_MUTED, marginTop: 2 }}>{c.r}</div>
            </div>
          ))}
        </div>
        {/* zlib */}
        <div style={{ border: `0.5pt solid ${COLORS.STEEL_DEEP}`, borderRadius: 5, background: COLORS.STEEL_TINT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 6px" }}>
          <span style={{ fontFamily: FONTS.MONO, fontSize: 10, fontWeight: 700, color: COLORS.STEEL_DEEP }}>zlib</span>
          <span style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 8.5, color: COLORS.INK_MUTED, textAlign: "center" }}>Deflater · the codec</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Page 23 — the Try-It page (second-to-last recto). Two moves on one recto:
 * build + run it locally (the terminal, left), and open the live app (the QR
 * card, right). This page owns the "go to the product" moment; the final page
 * is a pure closing with no CTA.
 */
export const BuildClosingPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="BUILD" sectionColor={SLATE} eyebrow={BUILD.closing.eyebrow} headline={BUILD.closing.headline} headlineSize="h1">
    <p style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.35, color: COLORS.INK_MUTED, margin: "0 0 18px", maxWidth: "6.2in" }}>
      {BUILD.closing.tagline}
    </p>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 2.05in", columnGap: 22, alignItems: "start" }}>
      {/* Left — run it locally */}
      <div>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: SLATE, marginBottom: 8 }}>
          Run it locally
        </div>
        {/* Terminal */}
        <div style={{ borderRadius: 8, overflow: "hidden", border: `0.5pt solid ${COLORS.HAIRLINE}`, background: COLORS.GROUND }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderBottom: `0.5pt solid ${COLORS.GROUND_LINE}`, background: COLORS.GROUND_PANEL }}>
            {[COLORS.AMBER, COLORS.GROUND_LINE2, COLORS.GROUND_LINE2].map((c, i) => (
              <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
            ))}
            <span style={{ marginLeft: 6, fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.ON_DARK_SUBTLE }}>jetpack-compress — zsh</span>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
            {BUILD.closing.cli.map((line, i) => (
              <div key={i}>
                <div style={{ fontFamily: FONTS.MONO, fontSize: 9.5, color: COLORS.ON_DARK, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{line.c}</div>
                {line.o && (
                  <div style={{ fontFamily: FONTS.MONO, fontSize: 9, color: line.o.startsWith("#") ? COLORS.GREEN : COLORS.ON_DARK_SUBTLE, whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 2 }}>
                    {line.o}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 7.5, color: COLORS.INK_SUBTLE, marginTop: 6, fontStyle: "italic" }}>{BUILD.closing.cliNote}</div>

        {/* Three-step rail */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, marginTop: 16, borderTop: `1pt solid ${COLORS.INK}`, borderBottom: `0.5pt solid ${COLORS.HAIRLINE}` }}>
          {BUILD.closing.steps.map((s, i) => (
            <div key={s.k} style={{ padding: "10px 12px", borderLeft: i === 0 ? "none" : `0.5pt solid ${COLORS.HAIRLINE}`, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: FONTS.MONO, fontSize: 15, fontWeight: 700, color: SLATE, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.k}</span>
              <span style={{ fontFamily: FONTS.SANS, fontSize: 9.5, lineHeight: 1.3, color: COLORS.INK_MUTED }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — open the live app (QR on a paper card) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.AMBER_DEEP }}>
          Open the live app
        </div>
        <div style={{ border: `0.5pt solid ${COLORS.HAIRLINE}`, borderRadius: 10, background: COLORS.PAPER_ELEVATED, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ background: COLORS.PAPER, borderRadius: 8, padding: 12, boxShadow: `0 0 0 1px ${COLORS.HAIRLINE}` }}>
            <QRCodeSVG value={BUILD.closing.qrTarget} size={132} level="M" marginSize={0} fgColor={COLORS.INK} />
          </div>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.INK, textAlign: "center" }}>
            {BUILD.closing.scanCaption}
          </div>
          <div style={{ fontFamily: FONTS.SANS, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: COLORS.AMBER_DEEP, textAlign: "center" }}>
            {BUILD.closing.liveUrl}
          </div>
          <div style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 10.5, lineHeight: 1.35, color: COLORS.INK_MUTED, textAlign: "center", borderTop: `0.5pt solid ${COLORS.HAIRLINE}`, paddingTop: 10 }}>
            {BUILD.closing.scanSub}
          </div>
        </div>
      </div>
    </div>

    {/* Link chips */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
      <LinkChip label={BUILD.closing.liveLabel} url={BUILD.closing.liveUrl} accent={COLORS.AMBER_DEEP} />
      <LinkChip label={BUILD.closing.repoLabel} url={BUILD.closing.repoUrl} accent={COLORS.STEEL_DEEP} />
    </div>

    {/* What the live walkthrough covers — mirrors the three chapters worth seeing move. */}
    <div style={{ marginTop: 18, borderTop: `1pt solid ${COLORS.INK}`, paddingTop: 12 }}>
      <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: SLATE, marginBottom: 10 }}>
        inside the live walkthrough
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: 18 }}>
        {[
          { k: "the pipeline", v: "watch a file split, fan out on virtual threads, and stitch into one member." },
          { k: "the SIMD stage", v: "scalar vs vector Adler-32, animated — the 2.8× as it happens." },
          { k: "the receipts", v: "the benchmarks and the 72 green tests, live in the browser." },
        ].map((s) => (
          <div key={s.k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontFamily: FONTS.MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.02em", color: COLORS.INK }}>{s.k}</span>
            <span style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 10.5, lineHeight: 1.3, color: COLORS.INK_MUTED }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ position: "absolute", left: "0.75in", bottom: "1.0in", fontFamily: FONTS.MONO, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: COLORS.INK_SUBTLE }}>
      {BUILD.closing.microNote}
    </div>
  </BodyPage>
);

const LinkChip: React.FC<{ label: string; url: string; accent: string }> = ({ label, url, accent }) => (
  <div style={{ border: `0.5pt solid ${COLORS.HAIRLINE}`, borderLeft: `2.5px solid ${accent}`, borderRadius: 6, padding: "12px 16px", background: COLORS.PAPER_ELEVATED }}>
    <div style={{ fontFamily: FONTS.MONO, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: FONTS.MONO, fontSize: TYPE.mono.size + 1, fontWeight: 600, color: COLORS.INK }}>{url}</div>
  </div>
);
