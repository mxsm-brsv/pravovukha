"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/motion/presets";

/** template пересоздаётся при каждом переходе, поэтому каждый экран мягко появляется. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft}>
      {children}
    </motion.div>
  );
}
