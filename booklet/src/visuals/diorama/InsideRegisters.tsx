import React from "react";
import { COLORS } from "../../theme";
import { SceneFrame, IsoCube, IsoPlane, FlowChannel, iso } from "./primitives";

/**
 * INSIDE — the engine room. A memory-mapped file plane (FFM) with one stride
 * lit; a SIMD vector register lifted above it, its top face divided into
 * byte-lanes; and the B2I widening into a small cluster of int-lane cubes.
 * Copper is the hand-vectorized signal; near-white is structure.
 */

const LINE = COLORS.ON_DARK;
const COPPER = COLORS.COPPER;

const P = (x: number, y: number, z = 0) => {
  const p = iso(x, y, z);
  return [p.sx, p.sy] as [number, number];
};

export const InsideRegisters: React.FC = () => (
  <SceneFrame lineColor={LINE} cornerLabels={{ topLeft: "SIMD REGISTER", bottomRight: "FFM · mmap" }}>
    <g transform="translate(108 156) scale(3.0)">
      {/* memory-mapped file plane */}
      <IsoPlane origin={[-16, -8, 0]} size={[30, 15]} fillOpacity={0.04} strokeOpacity={0.5} strokeWidth={0.9} grid={{ rows: 3, cols: 12 }} dashedBorder />

      {/* one 16-byte stride lit on the mapping */}
      <g style={{ color: COPPER }}>
        <IsoPlane origin={[-4, -6, 0.06]} size={[9, 3]} fillOpacity={0.22} strokeOpacity={0.7} strokeWidth={0.9} grid={{ rows: 1, cols: 8 }} />
      </g>

      {/* load: stride → register */}
      <g style={{ color: COPPER }}>
        <FlowChannel from={P(0.5, -4.5, 0.1)} to={P(0.5, -1, 3)} curvature={0.12} strokeWidth={0.8} tracer />
      </g>

      {/* vector register (the loaded 16-byte ByteVector) */}
      <g style={{ color: COPPER }}>
        <IsoCube origin={[-8, -2, 3]} size={[16, 3, 1.4]} face={{ top: 0.16, left: 0.12, right: 0.07 }} strokeWidth={1.1} />
        {/* lane divisions on the register top */}
        <IsoPlane origin={[-8, -2, 4.4]} size={[16, 3]} fillOpacity={0} strokeOpacity={0.8} strokeWidth={0.7} grid={{ rows: 1, cols: 16 }} />
      </g>

      {/* widen B2I → int-lane cluster (4 int vectors) */}
      <g style={{ color: COPPER }}>
        <FlowChannel from={P(8, -0.5, 4)} to={P(12, 3, 3)} curvature={0.14} strokeWidth={0.7} />
        {Array.from({ length: 4 }, (_, i) => (
          <IsoCube
            key={i}
            origin={[11 + i * 1.7, 2 + i * 0.2, 3]}
            size={[1.4, 1.4, 1.4]}
            face={{ top: 0.28, left: 0.16, right: 0.09 }}
            strokeWidth={0.7}
          />
        ))}
      </g>
    </g>

    {/* labels — leadered to their subjects: the lit stride on the mapping and
        the B2I int-lane cluster (previously floated high-right, detached) */}
    <g style={{ color: COPPER }}>
      <circle cx={137} cy={154} r={1.2} fill="currentColor" />
      <line x1={137} y1={154} x2={152} y2={140} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.7} />
      <text x={155} y={138} fontFamily="ui-monospace, monospace" fontSize={5.4} fontWeight={700} fill="currentColor">
        16-byte stride
      </text>
      <circle cx={144} cy={170} r={1.2} fill="currentColor" />
      <line x1={144} y1={170} x2={156} y2={166} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.7} />
      <text x={159} y={168} fontFamily="ui-monospace, monospace" fontSize={5} fill="currentColor" opacity={0.9}>
        B2I → int
      </text>
    </g>
    <text x={30} y={250} fontFamily="ui-monospace, monospace" fontSize={5} letterSpacing="1" fill={LINE} opacity={0.42}>
      S1 = Σ b · S2 = Σ i·b
    </text>
  </SceneFrame>
);
