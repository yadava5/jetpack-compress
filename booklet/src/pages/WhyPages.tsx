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
    <div style={{ margin: "2px 0 16px", maxWidth: "6.4in" }}>
      <PullQuote color={COLORS.INK}>{WHY.idle.pullQuote}</PullQuote>
    </div>
    {WHY.idle.body.map((t) => (
      <Body key={t.slice(0, 24)}>{t}</Body>
    ))}

    <CoreComparison />

    <StatStrip stats={WHY.idle.stats} accent={STEEL} style={{ marginTop: 16 }} />
    <p
      style={{
        fontFamily: FONTS.SERIF,
        fontStyle: "italic",
        fontSize: 15,
        lineHeight: 1.4,
        color: COLORS.INK,
        margin: "14px 0 0",
        maxWidth: "6.4in",
      }}
    >
      {WHY.idle.coda}
    </p>
    <SourceRail>{WHY.idle.source}</SourceRail>
  </BodyPage>
);

/**
 * The book's whole thesis in one picture: the ten cores of the benchmark
 * machine (BENCH_META) under single-thread gzip — one lit, nine dark — versus
 * block-parallel, where every core is busy. Schematic of the 10-core box; the
 * multiple is the measured §04 figure.
 */
const CoreComparison: React.FC = () => {
  const CORES = 10;
  const Row: React.FC<{ label: string; busy: number; right: string; rightSub: string; rightColor: string }> = ({
    label,
    busy,
    right,
    rightSub,
    rightColor,
  }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1.15in 1fr 1.35in", columnGap: 14, alignItems: "center" }}>
      <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.02em", color: COLORS.INK, lineHeight: 1.2 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
        {Array.from({ length: CORES }, (_, i) => {
          const on = i < busy;
          return (
            <div
              key={i}
              style={{
                height: 22,
                borderRadius: 2.5,
                background: on ? COLORS.AMBER_DEEP : "transparent",
                border: on ? "none" : `1px solid ${COLORS.HAIRLINE_STRONG}`,
              }}
            />
          );
        })}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 12, fontWeight: 700, color: rightColor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{right}</div>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 7.5, color: COLORS.INK_MUTED, marginTop: 3 }}>{rightSub}</div>
      </div>
    </div>
  );
  return (
    <div
      style={{
        border: `0.5pt solid ${COLORS.HAIRLINE}`,
        borderRadius: 6,
        background: COLORS.PAPER_ELEVATED,
        padding: "14px 16px",
        marginTop: 18,
        maxWidth: "6.4in",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: STEEL }}>
          core occupancy · single-thread vs block-parallel
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 7, color: COLORS.INK_SUBTLE }}>schematic · 10-core Apple Silicon</span>
      </div>
      <Row label="single-thread gzip" busy={1} right="1 / 10" rightSub="busy · 66.8 MB/s" rightColor={STEEL} />
      <Row label="block-parallel · jetpack" busy={10} right="10 / 10" rightSub="busy · ~6.5× → §04" rightColor={COLORS.AMBER_DEEP} />
      <div style={{ borderTop: `0.5pt solid ${COLORS.HAIRLINE}`, paddingTop: 10, fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 10.5, lineHeight: 1.35, color: COLORS.INK_MUTED }}>
        Same codec, same output — the speed-up is the nine cores gzip leaves parked, put to work.
      </div>
    </div>
  );
};

/** Page 06 — throughput on the floor (dumbbell: the gap the scheduler closes). */
export const WhyFloorPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="WHY" sectionColor={STEEL} eyebrow={WHY.floor.eyebrow} headline={WHY.floor.headline}>
    <Lede>{WHY.floor.lede}</Lede>

    <ThroughputGap floor={Number(WHY.floor.floorValue)} recovered={Number(WHY.floor.recoveredValue)} />

    {/* Reading the gap — two annotations flanking the chart's takeaway. */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 18, borderTop: `1pt solid ${COLORS.INK}`, borderBottom: `0.5pt solid ${COLORS.HAIRLINE}` }}>
      <div style={{ padding: "12px 16px 12px 0" }}>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 22, fontWeight: 700, color: STEEL, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>66.8 MB/s</div>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, letterSpacing: "0.04em", color: COLORS.INK_MUTED, marginTop: 5 }}>{WHY.floor.floorLabel}</div>
      </div>
      <div style={{ padding: "12px 0 12px 16px", borderLeft: `0.5pt solid ${COLORS.HAIRLINE}` }}>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 22, fontWeight: 700, color: COLORS.AMBER_DEEP, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>+367.8 MB/s</div>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, letterSpacing: "0.04em", color: COLORS.INK_MUTED, marginTop: 5 }}>recovered by the block scheduler · ≈6.5× the floor (§04)</div>
      </div>
    </div>

    <Body style={{ marginTop: 18 }}>{WHY.floor.body}</Body>

    <CorpusMakeup />

    <SourceRail>{WHY.floor.source}</SourceRail>
  </BodyPage>
);

/**
 * What the floor is measured on: the 32 MiB mixed corpus — compressible text
 * runs plus incompressible noise — at DEFLATE level 6. Same corpus the §04
 * parallel number uses, so the floor and the recovery are like-for-like.
 */
const CorpusMakeup: React.FC = () => {
  const segs = [
    { frac: 0.58, color: COLORS.STEEL_DEEP, tint: COLORS.STEEL_TINT, label: "compressible text runs", note: "LZ77 finds the matches" },
    { frac: 0.42, color: COLORS.SLATE_DEEP, tint: "rgba(139,147,161,0.14)", label: "incompressible noise", note: "stored, near 1:1" },
  ];
  return (
    <div style={{ marginTop: 18, maxWidth: "6.4in", borderTop: `1pt solid ${COLORS.INK}`, paddingTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: STEEL }}>
          the corpus, both numbers share
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.INK_SUBTLE }}>32 MiB mixed · level 6 · schematic</span>
      </div>
      <div style={{ display: "flex", gap: 3, height: 22 }}>
        {segs.map((s) => (
          <div key={s.label} style={{ flex: s.frac, background: s.tint, borderTop: `2.5px solid ${s.color}`, borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
        {segs.map((s) => (
          <div key={s.label} style={{ flex: s.frac }}>
            <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, color: s.color }}>{s.label}</div>
            <div style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 9.5, color: COLORS.INK_MUTED }}>{s.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * A dumbbell / range plot: the single-thread floor (steel) and the recovered
 * block-parallel throughput (amber) as two points on one MB/s axis, joined by
 * the "gap" the scheduler closes. Same two numbers as the old paired bars —
 * read as distance, not length.
 */
const ThroughputGap: React.FC<{ floor: number; recovered: number }> = ({ floor, recovered }) => {
  const scaleMax = 470;
  const X0 = 74;
  const X1 = 556;
  const Y = 74;
  const x = (v: number) => X0 + (v / scaleMax) * (X1 - X0);
  const fx = x(floor);
  const rx = x(recovered);
  const mult = (recovered / floor).toFixed(1);
  const ticks = [0, 100, 200, 300, 400];
  return (
    <div
      style={{
        border: `0.5pt solid ${COLORS.HAIRLINE}`,
        borderRadius: 6,
        background: COLORS.PAPER_ELEVATED,
        padding: 14,
        maxWidth: "6.4in",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: STEEL }}>
          throughput · floor → recovered
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 7, color: COLORS.INK_SUBTLE }}>MB/s · level 6 · 32 MiB corpus</span>
      </div>
      <svg viewBox="0 0 600 150" width="100%" style={{ display: "block", overflow: "visible" }}>
        {/* baseline axis */}
        <line x1={X0} y1={Y} x2={X1} y2={Y} stroke={COLORS.HAIRLINE} strokeWidth={1} />
        {/* the gap segment (recovered over floor) */}
        <line x1={fx} y1={Y} x2={rx} y2={Y} stroke={COLORS.AMBER_DEEP} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
        {/* gap pill */}
        <g>
          <rect x={(fx + rx) / 2 - 62} y={Y - 44} width={124} height={22} rx={11} fill={COLORS.AMBER_TINT} stroke={COLORS.AMBER_DEEP} strokeWidth={0.9} />
          <text x={(fx + rx) / 2} y={Y - 29} textAnchor="middle" fontFamily={mono} fontSize={10} fontWeight={700} fill={COLORS.AMBER_DEEP}>
            {`the gap · ≈${mult}×`}
          </text>
          <line x1={(fx + rx) / 2} y1={Y - 22} x2={(fx + rx) / 2} y2={Y - 4} stroke={COLORS.AMBER_DEEP} strokeWidth={0.7} strokeDasharray="2 2" opacity={0.6} />
        </g>
        {/* floor dot */}
        <circle cx={fx} cy={Y} r={7} fill={COLORS.PAPER} stroke={STEEL} strokeWidth={2.4} />
        <text x={fx} y={Y + 22} textAnchor="middle" fontFamily={mono} fontSize={11} fontWeight={700} fill={STEEL} style={{ fontVariantNumeric: "tabular-nums" }}>{floor}</text>
        <text x={fx} y={Y + 33} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={COLORS.INK_MUTED}>single-thread floor</text>
        {/* recovered dot */}
        <circle cx={rx} cy={Y} r={8.5} fill={COLORS.AMBER_DEEP} stroke={COLORS.PAPER} strokeWidth={1.5} />
        <text x={rx} y={Y + 22} textAnchor="middle" fontFamily={mono} fontSize={11} fontWeight={700} fill={COLORS.AMBER_DEEP} style={{ fontVariantNumeric: "tabular-nums" }}>{recovered}</text>
        <text x={rx} y={Y + 33} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={COLORS.INK_MUTED}>block-parallel</text>
        {/* axis ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={Y + 42} x2={x(t)} y2={Y + 46} stroke={COLORS.HAIRLINE_STRONG} strokeWidth={0.6} />
            <text x={x(t)} y={Y + 56} textAnchor="middle" fontFamily={mono} fontSize={7.5} fill={COLORS.INK_SUBTLE} style={{ fontVariantNumeric: "tabular-nums" }}>{t}</text>
          </g>
        ))}
        <text x={X1} y={Y + 56} textAnchor="end" fontFamily={mono} fontSize={7.5} fill={COLORS.INK_SUBTLE}>MB/s</text>
      </svg>
    </div>
  );
};

const mono = "ui-monospace, 'SF Mono', Menlo, monospace";

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

    <ScopeRatio
      handWritten={WHY.scope.handWritten.length}
      delegated={WHY.scope.delegated.length}
    />

    <SourceRail>{WHY.scope.source}</SourceRail>
  </BodyPage>
);

/**
 * The scope, as one bar: five hand-written parts (amber) and two delegated to
 * zlib (steel), summing to a single byte-valid gzip member. Counts come
 * straight from the two lists above — no invented figures.
 */
const ScopeRatio: React.FC<{ handWritten: number; delegated: number }> = ({ handWritten, delegated }) => {
  const total = handWritten + delegated;
  return (
    <div style={{ marginTop: 20, maxWidth: "6.4in", borderTop: `1pt solid ${COLORS.INK}`, paddingTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.INK_MUTED }}>
          the whole engine, in {total} parts
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.INK_SUBTLE }}>
          {handWritten} hand-written · {delegated} delegated
        </span>
      </div>
      <div style={{ display: "flex", gap: 3, height: 24 }}>
        {Array.from({ length: handWritten }, (_, i) => (
          <div key={`h${i}`} style={{ flex: 1, background: COLORS.AMBER_TINT, borderTop: `2.5px solid ${COLORS.AMBER_DEEP}`, borderRadius: 2 }} />
        ))}
        {Array.from({ length: delegated }, (_, i) => (
          <div key={`d${i}`} style={{ flex: 1, background: COLORS.STEEL_TINT, borderTop: `2.5px solid ${COLORS.STEEL_DEEP}`, borderRadius: 2 }} />
        ))}
      </div>
      <p style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 13, lineHeight: 1.4, color: COLORS.INK, margin: "12px 0 0" }}>
        Five parts written by hand, two handed to a battle-tested codec — and the delegation is itself the proof the output is standard gzip.
      </p>
    </div>
  );
};
