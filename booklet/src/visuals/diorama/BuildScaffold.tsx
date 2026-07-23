import React from "react";
import { COLORS } from "../../theme";
import { SceneFrame, IsoCube, IsoPlane } from "./primitives";

/**
 * BUILD — the toolchain, stacked. An isometric stack: JDK 25 as the wide base,
 * Maven above it, the runnable jar (CLI) on top, and the JMH benchmark jar set
 * a little apart and dashed — it lives behind a Maven profile, off the default
 * build path. Slate is the deliberately-plain workshop tone.
 */

const LINE = COLORS.ON_DARK;
const SLATE = COLORS.SLATE;

export const BuildScaffold: React.FC = () => (
  <SceneFrame lineColor={LINE} cornerLabels={{ topLeft: "TOOLCHAIN", bottomRight: "JDK 25 · MAVEN" }}>
    <g transform="translate(104 150) scale(3.0)">
      {/* ground */}
      <IsoPlane origin={[-13, -9, 0]} size={[26, 17]} fillOpacity={0.03} strokeOpacity={0.4} strokeWidth={0.8} dashedBorder />

      {/* JDK 25 — wide base */}
      <IsoCube origin={[-9, -6, 0]} size={[18, 12, 2.4]} face={{ top: 0.14, left: 0.09, right: 0.05 }} strokeWidth={1} />

      {/* Maven — middle */}
      <IsoCube origin={[-6, -4, 2.4]} size={[12, 8, 2.2]} face={{ top: 0.16, left: 0.1, right: 0.06 }} strokeWidth={0.95} />

      {/* the runnable jar (CLI) — slate highlight, on top */}
      <g style={{ color: SLATE }}>
        <IsoCube origin={[-4.5, -2.5, 4.6]} size={[5.5, 5.5, 2.6]} face={{ top: 0.32, left: 0.2, right: 0.11 }} strokeWidth={1.1} />
      </g>

      {/* JMH bench jar — behind, dashed (profile, off the default path) */}
      <IsoCube origin={[3, -1.5, 4.6]} size={[4, 4, 1.8]} face={{ top: 0.08, left: 0.05, right: 0.03 }} strokeWidth={0.7} dashed dashPattern="2 2" />
    </g>

    {/* labels — leadered to their layers of the scaffold */}
    <g opacity={0.75}>
      <circle cx={66} cy={139} r={1.2} fill={LINE} />
      <line x1={66} y1={139} x2={61} y2={133} stroke={LINE} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.7} />
      <text x={58} y={131} textAnchor="end" fontFamily="ui-monospace, monospace" fontSize={6} letterSpacing="1" fill={LINE}>
        JDK 25
      </text>
    </g>
    <g opacity={0.7}>
      <circle cx={79} cy={141} r={1} fill={LINE} />
      <line x1={79} y1={141} x2={74} y2={146} stroke={LINE} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.7} />
      <text x={71} y={149} textAnchor="end" fontFamily="ui-monospace, monospace" fontSize={5.4} fill={LINE}>
        mvn
      </text>
    </g>
    <g style={{ color: SLATE }}>
      <text x={96} y={112} fontFamily="ui-monospace, monospace" fontSize={5.6} fontWeight={700} fill="currentColor">
        jar · CLI
      </text>
    </g>
    <g opacity={0.6}>
      <circle cx={127} cy={138} r={1} fill={LINE} />
      <line x1={127} y1={138} x2={163} y2={123} stroke={LINE} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.6} />
      <text x={166} y={121} fontFamily="ui-monospace, monospace" fontSize={5} fill={LINE}>
        JMH · -Pbench
      </text>
    </g>
  </SceneFrame>
);
