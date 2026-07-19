import React from "react";
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

    <Body style={{ margin: "20px 0 0" }}>{BUILD.stack.closing}</Body>
    <SourceRail>{BUILD.stack.source}</SourceRail>
  </BodyPage>
);

/** Page 23 — run it. */
export const BuildClosingPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="BUILD" sectionColor={SLATE} eyebrow={BUILD.closing.eyebrow} headline={BUILD.closing.headline} headlineSize="h1">
    <p style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.35, color: COLORS.INK_MUTED, margin: "0 0 20px", maxWidth: "6.2in" }}>
      {BUILD.closing.tagline}
    </p>

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

    {/* Link chips */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
      <LinkChip label={BUILD.closing.liveLabel} url={BUILD.closing.liveUrl} accent={COLORS.AMBER_DEEP} />
      <LinkChip label={BUILD.closing.repoLabel} url={BUILD.closing.repoUrl} accent={COLORS.STEEL_DEEP} />
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
