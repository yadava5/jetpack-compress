import React from "react";
import type { SectionKey } from "../../theme";
import { WhyIdleCores } from "./WhyIdleCores";
import { HowFanout } from "./HowFanout";
import { InsideRegisters } from "./InsideRegisters";
import { ProofBars } from "./ProofBars";
import { BuildScaffold } from "./BuildScaffold";

/**
 * Barrel + SectionKey → diorama component map. Each chapter divider pulls its
 * isometric line-art from here: the idle multi-core die (WHY), the
 * virtual-thread fan-out (HOW), the SIMD register + mmap slab (INSIDE), the
 * measured benchmark bars (PROOF), and the toolchain scaffold (BUILD).
 */

export const DIORAMAS: Record<SectionKey, React.FC> = {
  "01_WHY": WhyIdleCores,
  "02_HOW": HowFanout,
  "03_INSIDE": InsideRegisters,
  "04_PROOF": ProofBars,
  "05_BUILD": BuildScaffold,
};

export { WhyIdleCores, HowFanout, InsideRegisters, ProofBars, BuildScaffold };
