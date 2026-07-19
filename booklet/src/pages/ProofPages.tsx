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

type BarRow = { label: string; valueLabel: string; frac: number; mult: string; role: "baseline" | "hero" | "reference"; errorFrac?: [number, number] };

const BarChart: React.FC<{ rows: BarRow[] }> = ({ rows }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: "6.4in" }}>
    {rows.map((r) => {
      const color = r.role === "baseline" ? COLORS.STEEL_DEEP : r.role === "hero" ? COLORS.AMBER_DEEP : COLORS.SLATE;
      return (
        <div key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontFamily: FONTS.MONO, fontSize: 9.5, color: COLORS.INK }}>{r.label}</span>
            <span style={{ fontFamily: FONTS.MONO, fontSize: 9, color: COLORS.INK_MUTED, fontVariantNumeric: "tabular-nums" }}>
              {r.valueLabel} · {r.mult}
            </span>
          </div>
          <div style={{ position: "relative", height: 24, borderRadius: 4, background: COLORS.SURFACE, overflow: "visible" }}>
            <div
              style={{
                position: "absolute",
                inset: "0 auto 0 0",
                width: `${r.frac * 100}%`,
                borderRadius: 4,
                background: r.role === "reference" ? "transparent" : color,
                opacity: r.role === "hero" ? 0.92 : 0.7,
                border: r.role === "reference" ? `1px dashed ${COLORS.SLATE_DEEP}` : "none",
                backgroundImage:
                  r.role === "reference"
                    ? `repeating-linear-gradient(45deg, ${COLORS.HAIRLINE} 0, ${COLORS.HAIRLINE} 4px, transparent 4px, transparent 9px)`
                    : "none",
              }}
            />
            {r.errorFrac && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${r.errorFrac[0] * 100}%`,
                  width: `${(r.errorFrac[1] - r.errorFrac[0]) * 100}%`,
                  height: 2,
                  transform: "translateY(-50%)",
                  background: COLORS.INK,
                  opacity: 0.55,
                }}
              >
                <span style={{ position: "absolute", left: 0, top: -5, width: 2, height: 12, background: COLORS.INK, opacity: 0.55 }} />
                <span style={{ position: "absolute", right: 0, top: -5, width: 2, height: 12, background: COLORS.INK, opacity: 0.55 }} />
              </div>
            )}
          </div>
          {r.role === "reference" && (
            <div style={{ fontFamily: FONTS.MONO, fontSize: 7.5, color: COLORS.INK_SUBTLE, marginTop: 2 }}>native intrinsic — a reference point, not a target that was beaten</div>
          )}
        </div>
      );
    })}
  </div>
);

const BenchMeta: React.FC = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontFamily: FONTS.MONO, fontSize: 7.8, color: COLORS.INK_MUTED }}>
    <span>■ {BENCH_META.machine}</span>
    <span>■ {BENCH_META.jvm}</span>
    <span>■ {BENCH_META.harness}</span>
  </div>
);

// ── pages ───────────────────────────────────────────────────────────────────

/** Page 18 — 2.8× vector over scalar. */
export const ProofSimdPage: React.FC<PageProps> = (p) => {
  const max = 15;
  const rows: BarRow[] = PROOF.simd.bars.map((b) => ({
    label: b.label,
    valueLabel: `${b.gbps.toFixed(2)} GB/s`,
    frac: b.gbps / max,
    mult: b.mult,
    role: b.role,
  }));
  return (
    <BodyPage {...p} sectionLabel="PROOF" sectionColor={GREEN} eyebrow={PROOF.simd.eyebrow} headline={PROOF.simd.headline}>
      <Hero value={PROOF.simd.hero} label={PROOF.simd.heroLabel} color={COLORS.AMBER_DEEP} />
      <div style={{ height: 18 }} />
      <BarChart rows={rows} />
      <Body style={{ marginTop: 18 }}>{PROOF.simd.body}</Body>
      <div style={{ marginTop: 10 }}>
        <BenchMeta />
      </div>
      <SourceRail extra={`${PROOF.simd.buffer} · ${BENCH_META.quickRun}`}>{PROOF.simd.source}</SourceRail>
    </BodyPage>
  );
};

/** Page 19 — ~6.5× parallel over single-thread. */
export const ProofParallelPage: React.FC<PageProps> = (p) => {
  const max = 680;
  const rows: BarRow[] = PROOF.parallel.bars.map((b) => {
    const base: BarRow = {
      label: b.label,
      valueLabel: `${b.mbps.toFixed(1)} MB/s`,
      frac: b.mbps / max,
      mult: b.mult,
      role: b.role,
    };
    if ("errorPct" in b && b.errorPct) {
      const lo = (b.mbps * (1 - b.errorPct / 100)) / max;
      const hi = (b.mbps * (1 + b.errorPct / 100)) / max;
      base.errorFrac = [lo, hi];
    }
    return base;
  });
  return (
    <BodyPage {...p} sectionLabel="PROOF" sectionColor={GREEN} eyebrow={PROOF.parallel.eyebrow} headline={PROOF.parallel.headline}>
      <Hero value={PROOF.parallel.hero} label={PROOF.parallel.heroLabel} color={COLORS.AMBER_DEEP} />
      <div style={{ height: 18 }} />
      <BarChart rows={rows} />
      <div style={{ fontFamily: FONTS.MONO, fontSize: 8, color: COLORS.INK_MUTED, marginTop: 6 }}>
        ⊢ {PROOF.parallel.errorNote} · {PROOF.parallel.corpus}
      </div>
      <Body style={{ marginTop: 16 }}>{PROOF.parallel.body}</Body>
      <div style={{ marginTop: 10 }}>
        <BenchMeta />
      </div>
      <SourceRail extra={BENCH_META.quickRun}>{PROOF.parallel.source}</SourceRail>
    </BodyPage>
  );
};

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

    <Callout label="cross-tool validated" accent={GREEN} style={{ marginTop: 18 }}>
      {PROOF.tests.crossTool}
    </Callout>
    <SourceRail>{PROOF.tests.source}</SourceRail>
  </BodyPage>
);
