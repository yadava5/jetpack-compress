import React from "react";
import { BodyPage } from "../templates/BodyPage";
import { COLORS, FONTS, SECTION_INK } from "../theme";
import { WHY } from "../content";
import { PullQuote } from "../primitives/PullQuote";
import { Body, Lede, StatStrip, SourceRail, ScopeColumn } from "./_shared";

type PageProps = { parity: "recto" | "verso"; pageNumber: number; totalPages: number };
const STEEL = SECTION_INK["01_WHY"];

/** Page 05 — the idle machine. */
export const WhyIdlePage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="WHY" sectionColor={STEEL} eyebrow={WHY.idle.eyebrow} headline={WHY.idle.headline}>
    <div style={{ margin: "2px 0 20px", maxWidth: "6.2in" }}>
      <PullQuote color={COLORS.INK}>{WHY.idle.pullQuote}</PullQuote>
    </div>
    {WHY.idle.body.map((t) => (
      <Body key={t.slice(0, 24)}>{t}</Body>
    ))}
    <StatStrip stats={WHY.idle.stats} accent={STEEL} style={{ marginTop: 12 }} />
    <p
      style={{
        fontFamily: FONTS.SERIF,
        fontStyle: "italic",
        fontSize: 15,
        lineHeight: 1.4,
        color: COLORS.INK,
        margin: "18px 0 0",
        maxWidth: "6.2in",
      }}
    >
      {WHY.idle.coda}
    </p>
    <SourceRail>{WHY.idle.source}</SourceRail>
  </BodyPage>
);

/** Page 06 — throughput on the floor. */
export const WhyFloorPage: React.FC<PageProps> = (p) => {
  const scaleMax = 470;
  return (
    <BodyPage {...p} sectionLabel="WHY" sectionColor={STEEL} eyebrow={WHY.floor.eyebrow} headline={WHY.floor.headline}>
      <Lede>{WHY.floor.lede}</Lede>

      <div style={{ maxWidth: "6.4in", marginBottom: 22 }}>
        <FloorBar value={Number(WHY.floor.floorValue)} scaleMax={scaleMax} color={STEEL} valueLabel={`${WHY.floor.floorValue} MB/s`} caption={WHY.floor.floorLabel} />
        <div style={{ height: 12 }} />
        <FloorBar
          value={Number(WHY.floor.recoveredValue)}
          scaleMax={scaleMax}
          color={COLORS.AMBER_DEEP}
          valueLabel={`${WHY.floor.recoveredValue} MB/s`}
          caption={WHY.floor.recoveredLabel}
          dashed
        />
        <div style={{ position: "relative", height: 14, marginTop: 6 }}>
          {[0, 100, 200, 300, 400].map((t) => (
            <span
              key={t}
              style={{
                position: "absolute",
                left: `${(t / scaleMax) * 100}%`,
                fontFamily: FONTS.MONO,
                fontSize: 8,
                color: COLORS.INK_SUBTLE,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {t}
            </span>
          ))}
          <span style={{ position: "absolute", right: 0, fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.INK_SUBTLE }}>MB/s</span>
        </div>
      </div>

      <Body>{WHY.floor.body}</Body>
      <SourceRail>{WHY.floor.source}</SourceRail>
    </BodyPage>
  );
};

const FloorBar: React.FC<{
  value: number;
  scaleMax: number;
  color: string;
  valueLabel: string;
  caption: string;
  dashed?: boolean;
}> = ({ value, scaleMax, color, valueLabel, caption, dashed }) => (
  <div>
    <div style={{ position: "relative", height: 30, borderRadius: 5, background: COLORS.SURFACE, overflow: "hidden", border: dashed ? `1px dashed ${color}` : "none" }}>
      <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${(value / scaleMax) * 100}%`, background: color, opacity: dashed ? 0.28 : 0.9 }} />
      <span
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: FONTS.MONO,
          fontSize: 12,
          fontWeight: 700,
          color: dashed ? color : COLORS.PAPER,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {valueLabel}
      </span>
    </div>
    <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, color: COLORS.INK_MUTED, marginTop: 4 }}>{caption}</div>
  </div>
);

/** Page 07 — an honest scope. */
export const WhyScopePage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="WHY" sectionColor={STEEL} eyebrow={WHY.scope.eyebrow} headline={WHY.scope.headline}>
    <div
      style={{
        margin: "2px 0 18px",
        maxWidth: "6.3in",
        borderLeft: `2.5px solid ${COLORS.AMBER_DEEP}`,
        paddingLeft: 16,
      }}
    >
      <PullQuote color={COLORS.INK}>{WHY.scope.thesis}</PullQuote>
    </div>
    {WHY.scope.body.map((t) => (
      <Body key={t.slice(0, 24)}>{t}</Body>
    ))}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", columnGap: 18, marginTop: 16 }}>
      <ScopeColumn label="hand-written" accent={COLORS.AMBER_DEEP} items={WHY.scope.handWritten} variant="solid" />
      <ScopeColumn label="delegated → zlib" accent={COLORS.STEEL_DEEP} items={WHY.scope.delegated} variant="solid" />
      <ScopeColumn label="planned / future" accent={COLORS.SLATE_DEEP} items={WHY.scope.planned} variant="dashed" />
    </div>
    <SourceRail>{WHY.scope.source}</SourceRail>
  </BodyPage>
);
