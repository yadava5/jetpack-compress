import React from "react";
import { COLORS } from "../../theme";
import { SceneFrame, IsoCube, IsoPlane } from "./primitives";

/**
 * PROOF — the measured bars. Four isometric throughput bars on a chart floor:
 * scalar vs vector (2.8×) and single-thread vs parallel (~6.5×). Green marks
 * the two hero bars — the results actually measured. Bar heights are
 * proportional within each pair; the exact numbers live on the PROOF pages.
 */

const LINE = COLORS.ON_DARK;
const GREEN = COLORS.GREEN;

type Bar = { ox: number; h: number; hero: boolean; tag: string };

const BARS: Bar[] = [
  { ox: -13, h: 2.2, hero: false, tag: "scalar" },
  { ox: -7.5, h: 6.2, hero: true, tag: "vector" },
  { ox: 1.5, h: 1.8, hero: false, tag: "1-thread" },
  { ox: 7, h: 7.2, hero: true, tag: "parallel" },
];

export const ProofBars: React.FC = () => (
  <SceneFrame lineColor={LINE} cornerLabels={{ topLeft: "MEASURED", bottomRight: "JMH 1.37" }}>
    <g transform="translate(112 176) scale(3.0)">
      {/* chart floor */}
      <IsoPlane origin={[-16, -6, 0]} size={[30, 12]} fillOpacity={0.04} strokeOpacity={0.45} strokeWidth={0.9} grid={{ rows: 2, cols: 6 }} dashedBorder />
      {BARS.map((b, i) => {
        const cube = (
          <IsoCube
            origin={[b.ox, -3, 0]}
            size={[4, 4, b.h]}
            face={{ top: b.hero ? 0.34 : 0.14, left: b.hero ? 0.2 : 0.09, right: b.hero ? 0.11 : 0.05 }}
            strokeWidth={b.hero ? 1.1 : 0.8}
          />
        );
        return b.hero ? (
          <g key={i} style={{ color: GREEN }}>
            {cube}
          </g>
        ) : (
          <React.Fragment key={i}>{cube}</React.Fragment>
        );
      })}
    </g>

    {/* multiples — set directly above their hero bars (vector, parallel), not
        floating in the upper corners */}
    <g style={{ color: GREEN }}>
      <text x={100} y={136} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={8} fontWeight={700} fill="currentColor">
        2.8×
      </text>
      <text x={138} y={154} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={8} fontWeight={700} fill="currentColor">
        ~6.5×
      </text>
    </g>
    <text x={40} y={250} fontFamily="ui-monospace, monospace" fontSize={5} letterSpacing="1" fill={LINE} opacity={0.42}>
      vector · parallel — the two hero bars
    </text>
  </SceneFrame>
);
