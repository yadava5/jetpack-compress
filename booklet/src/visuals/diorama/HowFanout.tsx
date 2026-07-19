import React from "react";
import { COLORS } from "../../theme";
import { SceneFrame, IsoCube, FlowChannel, iso } from "./primitives";

/**
 * HOW — the virtual-thread fan-out. An isometric input slab splits into a fan
 * of parallel block prisms (a virtual thread each), which converge into a
 * single stitched output member. Amber carries the parallel signal path;
 * near-white is the structure.
 */

const LINE = COLORS.ON_DARK;
const AMBER = COLORS.AMBER;

const N = 5;

// local iso-grid → local svg (the <g> applies translate + scale)
const P = (x: number, y: number, z = 0) => {
  const p = iso(x, y, z);
  return [p.sx, p.sy] as [number, number];
};

export const HowFanout: React.FC = () => {
  const blocks = Array.from({ length: N }, (_, i) => {
    const oy = -9 + i * 4.4;
    return { i, ox: -4, oy, w: 8, d: 2.6, h: 2.2, last: i === N - 1 };
  });
  return (
    <SceneFrame lineColor={LINE} cornerLabels={{ topLeft: "SPLIT · FAN-OUT", bottomRight: "ONE MEMBER" }}>
      <g transform="translate(112 150) scale(3.05)">
        {/* input slab (back) */}
        <IsoCube origin={[-9, -19, 0]} size={[18, 3, 3]} face={{ top: 0.18, left: 0.1, right: 0.06 }} strokeWidth={1} />

        {/* fan-out connectors: input front → each block back */}
        <g style={{ color: AMBER }}>
          {blocks.map((b) => (
            <FlowChannel
              key={b.i}
              from={P(0, -16, 0)}
              to={P(b.ox, b.oy, b.h)}
              curvature={0.18}
              strokeWidth={0.7}
            />
          ))}
        </g>

        {/* parallel block prisms */}
        {blocks.map((b) => {
          const accent = b.i % 2 === 0;
          const el = (
            <IsoCube
              origin={[b.ox, b.oy, 0]}
              size={[b.w, b.d, b.h]}
              face={{ top: accent ? 0.32 : 0.16, left: accent ? 0.18 : 0.09, right: accent ? 0.1 : 0.05 }}
              strokeWidth={accent ? 1 : 0.8}
            />
          );
          return accent ? (
            <g key={b.i} style={{ color: AMBER }}>
              {el}
            </g>
          ) : (
            <React.Fragment key={b.i}>{el}</React.Fragment>
          );
        })}

        {/* fan-in connectors: each block front → output member back */}
        <g style={{ color: AMBER }}>
          {blocks.map((b) => (
            <FlowChannel
              key={b.i}
              from={P(b.ox + b.w, b.oy + b.d / 2, b.h * 0.5)}
              to={P(0, 15, 1.5)}
              curvature={0.18}
              strokeWidth={0.7}
            />
          ))}
        </g>

        {/* output member slab (front) */}
        <g style={{ color: AMBER }}>
          <IsoCube origin={[-9, 14, 0]} size={[18, 3, 3]} face={{ top: 0.3, left: 0.18, right: 0.1 }} strokeWidth={1.1} />
        </g>
      </g>

      {/* labels */}
      <text x={150} y={70} fontFamily="ui-monospace, monospace" fontSize={5.4} fill={LINE} opacity={0.55}>
        vthread / block
      </text>
      <g style={{ color: AMBER }}>
        <text x={150} y={232} fontFamily="ui-monospace, monospace" fontSize={5.6} fontWeight={700} fill="currentColor">
          SYNC_FLUSH
        </text>
        <text x={150} y={240} fontFamily="ui-monospace, monospace" fontSize={5.6} fontWeight={700} fill="currentColor">
          → finish()
        </text>
      </g>
    </SceneFrame>
  );
};
