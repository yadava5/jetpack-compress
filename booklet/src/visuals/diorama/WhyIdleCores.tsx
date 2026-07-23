import React from "react";
import { COLORS } from "../../theme";
import { SceneFrame, IsoCube, IsoPlane } from "./primitives";

/**
 * WHY — the idle machine. An isometric CPU die: a 2×5 grid of core cells on a
 * substrate. Nine sit flat and dim (idle); one stands tall and amber-lit —
 * the single core doing single-threaded gzip's work. The whole point of §01
 * in one image: the throughput is the cores that are parked.
 */

const LINE = COLORS.ON_DARK;
const AMBER = COLORS.AMBER;

const COLS = 5;
const ROWS = 2;
const BUSY = { r: 0, c: 2 };

export const WhyIdleCores: React.FC = () => (
  <SceneFrame lineColor={LINE} cornerLabels={{ topLeft: "10 CORES", bottomRight: "1 BUSY · 9 IDLE" }}>
    <g transform="translate(104 150) scale(3.15)">
      {/* die substrate */}
      <IsoPlane
        origin={[-15, -9, 0]}
        size={[28, 13]}
        fillOpacity={0.05}
        strokeOpacity={0.5}
        strokeWidth={0.9}
        grid={{ rows: ROWS, cols: COLS }}
        dashedBorder
      />
      {/* cores */}
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const busy = r === BUSY.r && c === BUSY.c;
          const ox = -13.5 + c * 5.4;
          const oy = -7.5 + r * 5.4;
          const h = busy ? 4.2 : 0.8;
          const key = `${r}-${c}`;
          if (busy) {
            return (
              <g key={key} style={{ color: AMBER }}>
                <IsoCube
                  origin={[ox, oy, 0]}
                  size={[3.6, 3.6, h]}
                  face={{ top: 0.4, left: 0.22, right: 0.12 }}
                  strokeWidth={1.1}
                />
              </g>
            );
          }
          return (
            <IsoCube
              key={key}
              origin={[ox, oy, 0]}
              size={[3.6, 3.6, h]}
              face={{ top: 0.12, left: 0.07, right: 0.04 }}
              strokeWidth={0.7}
            />
          );
        }),
      )}
    </g>

    {/* busy-core callout — dot on the lit core's apex, short leader to the
        label sitting just above the die (was floating 60px up-right, detached) */}
    <g style={{ color: AMBER }}>
      <circle cx={117} cy={121} r={1.4} fill="currentColor" />
      <line x1={117} y1={121} x2={144} y2={103} stroke="currentColor" strokeWidth={0.6} strokeDasharray="3 2" opacity={0.7} />
      <text x={147} y={101} fontFamily="ui-monospace, monospace" fontSize={6.5} fontWeight={700} fill="currentColor">
        gzip
      </text>
      <text x={147} y={109} fontFamily="ui-monospace, monospace" fontSize={4.6} fill="currentColor" opacity={0.85}>
        single thread
      </text>
    </g>

    {/* idle whisper */}
    <text x={40} y={250} fontFamily="ui-monospace, monospace" fontSize={5} letterSpacing="1" fill={LINE} opacity={0.4}>
      90% of the silicon, parked
    </text>
  </SceneFrame>
);
