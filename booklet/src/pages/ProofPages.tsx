import React from "react";
import { BodyPage } from "../templates/BodyPage";
import { COLORS, FONTS, TYPE, SECTION_INK } from "../theme";
import { PROOF, BENCH_META } from "../content";
import { Body, Callout, SourceRail } from "./_shared";

type PageProps = { parity: "recto" | "verso"; pageNumber: number; totalPages: number };
const GREEN = SECTION_INK["04_PROOF"];

// ── shared bench pieces ─────────────────────────────────────────────────────

const Hero: React.FC<{ value: string; label: string; color: string }> = ({ value, label, color }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 4 }}>
    <div
      style={{
        fontFamily: FONTS.MONO,
        fontSize: TYPE.metricHero.size,
        fontWeight: 700,
        letterSpacing: TYPE.metricHero.tracking,
        lineHeight: 0.9,
        color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </div>
    <div style={{ paddingBottom: 8, maxWidth: "2.7in" }}>
      <div style={{ fontFamily: FONTS.MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.INK_MUTED, lineHeight: 1.35 }}>
        {label}
      </div>
    </div>
  </div>
);

const monoP = "ui-monospace, 'SF Mono', Menlo, monospace";

type LolliRow = { label: string; value: number; valueLabel: string; mult: string; role: "baseline" | "hero" | "reference" };

/**
 * Lollipop / dot plot — the three Adler-32 throughputs as stems + dots on one
 * GB/s axis. Scalar (steel) and vector (amber, the hero) are the honest
 * comparison; the JDK native intrinsic (slate, hollow) is a dashed reference
 * dot, not a beaten target. Reads off the bar-chart idiom entirely.
 */
const Lollipop: React.FC<{ rows: LolliRow[]; max: number }> = ({ rows, max }) => {
  const X0 = 8;
  const X1 = 560;
  const x = (v: number) => X0 + (v / max) * (X1 - X0);
  const rowY = (i: number) => 34 + i * 52;
  const ticks = [0, 3, 6, 9, 12, 15];
  const axisY = rowY(rows.length - 1) + 30;
  return (
    <div style={{ maxWidth: "6.4in" }}>
      <svg viewBox={`0 0 600 ${axisY + 22}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        {rows.map((r, i) => {
          const color = r.role === "baseline" ? COLORS.STEEL_DEEP : r.role === "hero" ? COLORS.AMBER_DEEP : COLORS.SLATE_DEEP;
          const y = rowY(i);
          const ref = r.role === "reference";
          return (
            <g key={r.label}>
              {/* header line: label left, value·mult right */}
              <text x={X0} y={y - 12} fontFamily={monoP} fontSize={9.5} fontWeight={r.role === "hero" ? 700 : 500} fill={COLORS.INK}>{r.label}</text>
              <text x={X1} y={y - 12} textAnchor="end" fontFamily={monoP} fontSize={9} fill={COLORS.INK_MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>{`${r.valueLabel} · ${r.mult}`}</text>
              {/* stem */}
              <line x1={X0} y1={y} x2={x(r.value)} y2={y} stroke={color} strokeOpacity={ref ? 0.4 : 0.8} strokeWidth={ref ? 1.4 : 3} strokeLinecap="round" strokeDasharray={ref ? "3 3" : undefined} />
              {/* dot */}
              <circle cx={x(r.value)} cy={y} r={r.role === "hero" ? 8 : 6.5} fill={ref ? COLORS.PAPER : color} stroke={color} strokeWidth={ref ? 1.6 : 1.2} strokeDasharray={ref ? "2.5 2" : undefined} />
              {r.role === "hero" && (
                <>
                  <rect x={x(r.value) + 14} y={y - 10} width={116} height={20} rx={10} fill={COLORS.AMBER_TINT} stroke={COLORS.AMBER_DEEP} strokeWidth={0.8} />
                  <text x={x(r.value) + 72} y={y + 4} textAnchor="middle" fontFamily={monoP} fontSize={9} fontWeight={700} fill={COLORS.AMBER_DEEP}>▲ 2.8× vs scalar</text>
                </>
              )}
              {ref && (
                <text x={X0} y={y + 18} fontFamily={monoP} fontSize={7.5} fill={COLORS.INK_SUBTLE}>native intrinsic — a reference point, not a target that was beaten</text>
              )}
            </g>
          );
        })}
        {/* axis */}
        <line x1={X0} y1={axisY} x2={X1} y2={axisY} stroke={COLORS.HAIRLINE} strokeWidth={0.6} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={axisY} x2={x(t)} y2={axisY + 4} stroke={COLORS.HAIRLINE_STRONG} strokeWidth={0.6} />
            <text x={x(t)} y={axisY + 14} textAnchor="middle" fontFamily={monoP} fontSize={7.5} fill={COLORS.INK_SUBTLE} style={{ fontVariantNumeric: "tabular-nums" }}>{t}</text>
          </g>
        ))}
        <text x={X1} y={axisY - 5} textAnchor="end" fontFamily={monoP} fontSize={7.5} fill={COLORS.INK_SUBTLE}>GB/s</text>
      </svg>
    </div>
  );
};

/**
 * Radial gauge — the parallel multiple as a speedometer. The needle reads the
 * measured ~6.5×; the translucent arc band spans the honest ±50% quick-run
 * error (3.25× → 9.75×). A distinct form from the SIMD-page lollipop, and it
 * carries its own error bar visibly.
 */
const SpeedGauge: React.FC = () => {
  const cx = 300;
  const cy = 196;
  const R = 150;
  const MAX = 10;
  const value = 6.5;
  const errLo = value * 0.5;
  const errHi = value * 1.5;
  // value fraction → point on the top semicircle (y grows down)
  const pt = (t: number, r: number) => {
    const phi = (Math.PI * (1 - t)); // t=0 → π (left), t=1 → 0 (right)
    return [cx + r * Math.cos(phi), cy - r * Math.sin(phi)] as const;
  };
  const arc = (t1: number, t2: number, r: number) => {
    const [x1, y1] = pt(t1, r);
    const [x2, y2] = pt(t2, r);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const ticks = [0, 2, 4, 6, 8, 10];
  const [nx, ny] = pt(value / MAX, R - 34);
  return (
    <div style={{ maxWidth: "6.4in" }}>
      <svg viewBox="0 0 600 236" width="100%" style={{ display: "block", overflow: "visible" }}>
        {/* full track */}
        <path d={arc(0, 1, R)} fill="none" stroke={COLORS.SURFACE} strokeWidth={9} strokeLinecap="round" />
        {/* ±50% error band */}
        <path d={arc(errLo / MAX, errHi / MAX, R)} fill="none" stroke={COLORS.AMBER} strokeOpacity={0.22} strokeWidth={17} />
        {/* value arc 0 → 6.5 */}
        <path d={arc(0, value / MAX, R)} fill="none" stroke={COLORS.AMBER_DEEP} strokeWidth={9} strokeLinecap="round" />
        {/* baseline 1× notch */}
        {(() => { const [bx, by] = pt(1 / MAX, R + 6); const [bx2, by2] = pt(1 / MAX, R - 9); return (
          <>
            <line x1={bx2} y1={by2} x2={bx} y2={by} stroke={COLORS.STEEL_DEEP} strokeWidth={1.4} />
            {/* anchored end, outside the dial — centered it ran under the value arc */}
            <text x={bx - 16} y={by + 4} textAnchor="end" fontFamily={monoP} fontSize={7.5} fontWeight={700} fill={COLORS.STEEL_DEEP}>1× floor</text>
          </>
        ); })()}
        {/* ticks */}
        {ticks.map((t) => {
          const [ox, oy] = pt(t / MAX, R + 4);
          const [ix, iy] = pt(t / MAX, R - 5);
          const [lx, ly] = pt(t / MAX, R + 17);
          const anchor = t === 0 ? "start" : t === MAX ? "end" : "middle";
          return (
            <g key={t}>
              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke={COLORS.HAIRLINE_STRONG} strokeWidth={0.7} />
              <text x={lx} y={ly + 3} textAnchor={anchor} fontFamily={monoP} fontSize={7.5} fill={COLORS.INK_SUBTLE} style={{ fontVariantNumeric: "tabular-nums" }}>{`${t}×`}</text>
            </g>
          );
        })}
        {/* needle + hub — the needle reads ~6.5× (Hero + chips carry the number) */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={COLORS.INK} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill={COLORS.INK} />
        <circle cx={cx} cy={cy} r={2.4} fill={COLORS.PAPER} />
        {/* band legend */}
        <text x={cx} y={cy + 26} textAnchor="middle" fontFamily={monoP} fontSize={8} fill={COLORS.INK_MUTED}>
          shaded band = ±50% quick-run error (3.25× – 9.75×)
        </text>
      </svg>
      {/* underlying throughputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 6, borderTop: `1pt solid ${COLORS.INK}`, borderBottom: `0.5pt solid ${COLORS.HAIRLINE}` }}>
        <div style={{ padding: "10px 16px 10px 0" }}>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 18, fontWeight: 700, color: COLORS.STEEL_DEEP, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>66.8 MB/s</div>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 8, letterSpacing: "0.04em", color: COLORS.INK_MUTED, marginTop: 4 }}>singleThreadedJdk · 1.0×</div>
        </div>
        <div style={{ padding: "10px 0 10px 16px", borderLeft: `0.5pt solid ${COLORS.HAIRLINE}` }}>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 18, fontWeight: 700, color: COLORS.AMBER_DEEP, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>434.6 MB/s</div>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 8, letterSpacing: "0.04em", color: COLORS.INK_MUTED, marginTop: 4 }}>parallelVirtualThreads · ~6.5× · 10 cores</div>
        </div>
      </div>
    </div>
  );
};

const BenchMeta: React.FC = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontFamily: FONTS.MONO, fontSize: 7.8, color: COLORS.INK_MUTED }}>
    <span>■ {BENCH_META.machine}</span>
    <span>■ {BENCH_META.jvm}</span>
    <span>■ {BENCH_META.harness}</span>
  </div>
);

// ── pages ───────────────────────────────────────────────────────────────────

/** Page 18 — 2.8× vector over scalar (lollipop). */
export const ProofSimdPage: React.FC<PageProps> = (p) => {
  const max = 15;
  const rows: LolliRow[] = PROOF.simd.bars.map((b) => ({
    label: b.label,
    value: b.gbps,
    valueLabel: `${b.gbps.toFixed(2)} GB/s`,
    mult: b.mult,
    role: b.role,
  }));
  return (
    <BodyPage {...p} sectionLabel="PROOF" sectionColor={GREEN} eyebrow={PROOF.simd.eyebrow} headline={PROOF.simd.headline}>
      <Hero value={PROOF.simd.hero} label={PROOF.simd.heroLabel} color={COLORS.AMBER_DEEP} />
      <div style={{ height: 16 }} />
      <Lollipop rows={rows} max={max} />
      <Body style={{ marginTop: 14 }}>{PROOF.simd.body}</Body>
      <BenchEnvironment />
      <SourceRail extra={`${PROOF.simd.buffer} · ${BENCH_META.quickRun}`}>{PROOF.simd.source}</SourceRail>
    </BodyPage>
  );
};

/**
 * The benchmark environment (left) and how to read the modest NEON gain
 * (right). Every value is BENCH_META / PROOF.simd — the honest context that
 * lets a reader judge the 2.8× rather than take it on faith.
 */
const BenchEnvironment: React.FC = () => {
  const rows = [
    { k: "MACHINE", v: BENCH_META.machine },
    { k: "JVM", v: BENCH_META.jvm },
    { k: "HARNESS", v: BENCH_META.harness },
    { k: "RUN", v: `${PROOF.simd.buffer} · ${BENCH_META.quickRun}` },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        columnGap: 20,
        marginTop: 16,
        borderTop: `1pt solid ${COLORS.INK}`,
        paddingTop: 14,
        maxWidth: "6.4in",
      }}
    >
      <div>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN, marginBottom: 8 }}>
          benchmark environment
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((r) => (
            <div key={r.k} style={{ display: "grid", gridTemplateColumns: "0.7in 1fr", columnGap: 10, alignItems: "baseline" }}>
              <span style={{ fontFamily: FONTS.MONO, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", color: COLORS.INK_MUTED }}>{r.k}</span>
              <span style={{ fontFamily: FONTS.MONO, fontSize: 8.5, color: COLORS.INK, lineHeight: 1.3 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderLeft: `0.5pt solid ${COLORS.HAIRLINE}`, paddingLeft: 18 }}>
        <div style={{ fontFamily: FONTS.MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.AMBER_DEEP, marginBottom: 8 }}>
          reading the gain
        </div>
        <p style={{ fontFamily: FONTS.SERIF, fontStyle: "italic", fontSize: 11, lineHeight: 1.4, color: COLORS.INK_MUTED, margin: 0 }}>
          128-bit NEON moves 16 bytes a stride — a deliberately modest width. On AVX2 (32 B) or AVX-512 (64 B) the
          same code has more lanes to fill, so expect a larger vector-over-scalar multiple there.
        </p>
      </div>
    </div>
  );
};

/** Page 19 — ~6.5× parallel over single-thread (radial gauge with ±50% band). */
export const ProofParallelPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="PROOF" sectionColor={GREEN} eyebrow={PROOF.parallel.eyebrow} headline={PROOF.parallel.headline}>
    <Hero value={PROOF.parallel.hero} label={PROOF.parallel.heroLabel} color={COLORS.AMBER_DEEP} />
    <div style={{ height: 10 }} />
    <SpeedGauge />
    <div style={{ fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.INK_MUTED, marginTop: 8 }}>
      ⊢ {PROOF.parallel.errorNote} · {PROOF.parallel.corpus}
    </div>
    <Body style={{ marginTop: 12 }}>{PROOF.parallel.body}</Body>
    <div style={{ marginTop: 10 }}>
      <BenchMeta />
    </div>
    <Callout label="why the error bar is this wide" accent={GREEN} style={{ marginTop: 16 }}>
      A quick run trades precision for speed — one fork, three warmup and four one-second measurement iterations.
      That is enough to show the shape of the win, not to pin the exact multiple; the shaded band is that honesty made
      visible. Re-run the full JMH harness for a tight number.
    </Callout>
    <SourceRail extra={BENCH_META.quickRun}>{PROOF.parallel.source}</SourceRail>
  </BodyPage>
);

/** Page 20 — 72 tests, and it's real gzip. */
export const ProofTestsPage: React.FC<PageProps> = (p) => (
  <BodyPage {...p} sectionLabel="PROOF" sectionColor={GREEN} eyebrow={PROOF.tests.eyebrow} headline={PROOF.tests.headline}>
    <Body>{PROOF.tests.body}</Body>

    <div style={{ borderTop: `1pt solid ${COLORS.INK}`, marginTop: 6 }}>
      {PROOF.tests.suites.map((s) => (
        <div
          key={s.name}
          style={{
            display: "grid",
            gridTemplateColumns: "1.4in 0.5in 1fr",
            columnGap: 12,
            alignItems: "baseline",
            padding: "9px 0",
            borderBottom: `0.5pt solid ${COLORS.HAIRLINE}`,
          }}
        >
          <span style={{ fontFamily: FONTS.MONO, fontSize: 11, fontWeight: 700, color: COLORS.INK }}>{s.name}</span>
          <span style={{ fontFamily: FONTS.MONO, fontSize: 12, fontWeight: 700, color: GREEN, fontVariantNumeric: "tabular-nums" }}>{s.count}</span>
          <span style={{ fontFamily: FONTS.SANS, fontSize: 9.5, lineHeight: 1.4, color: COLORS.INK_MUTED }}>{s.proves}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0 0" }}>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.INK_MUTED }}>
          Tests run: 72 · Failures: 0 · Errors: 0 · Skipped: 0
        </span>
        <span style={{ fontFamily: FONTS.MONO, fontSize: 22, fontWeight: 700, color: GREEN, fontVariantNumeric: "tabular-nums" }}>{PROOF.tests.total}</span>
      </div>
    </div>

    <ValidationMethods />

    <Callout label="the strongest proof" accent={GREEN} style={{ marginTop: 14 }}>
      {PROOF.tests.crossTool}
    </Callout>
    <SourceRail>{PROOF.tests.source}</SourceRail>
  </BodyPage>
);

/**
 * The three independent ways the output is checked — the plain-language
 * version of PROOF.tests.body. Each card names the suite that enforces it, so
 * the claim traces to a green test, not a promise.
 */
const ValidationMethods: React.FC = () => {
  const methods = [
    { g: "↻", t: "round-trip", d: "decompress(compress(x)) == x — through our decoder and a plain GZIPInputStream.", suite: "RoundTripTest · 21" },
    { g: "⇄", t: "cross-tool gzip", d: "the system gzip -t / gzip -dc decode our bytes, and we decode gzip -9’s.", suite: "CrossToolTest · 3" },
    { g: "≡", t: "checksum parity", d: "the vectorized Adler-32 is bit-identical to java.util.zip.Adler32.", suite: "Adler32Test · 35" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 18 }}>
      {methods.map((m) => (
        <div key={m.t} style={{ border: `0.5pt solid ${COLORS.HAIRLINE}`, borderTop: `2.5px solid ${GREEN}`, borderRadius: 5, background: COLORS.PAPER_ELEVATED, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontFamily: FONTS.MONO, fontSize: 14, fontWeight: 700, color: GREEN, lineHeight: 1 }}>{m.g}</span>
            <span style={{ fontFamily: FONTS.MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.02em", color: COLORS.INK }}>{m.t}</span>
          </div>
          <div style={{ fontFamily: FONTS.SANS, fontSize: 9.5, lineHeight: 1.35, color: COLORS.INK_MUTED }}>{m.d}</div>
          <div style={{ fontFamily: FONTS.MONO, fontSize: 8, fontWeight: 600, letterSpacing: "0.04em", color: GREEN, marginTop: "auto" }}>{m.suite}</div>
        </div>
      ))}
    </div>
  );
};
