"use client";

import { motion } from "motion/react";
import { cx } from "@/lib/cx";
import { spring } from "@/motion/presets";

/**
 * Визуальный переключатель. Нажимается вся строка (Cell с role="switch"),
 * поэтому сам переключатель скрыт от экранного диктора и не получает фокус.
 */
export function Switch({ checked, disabled = false }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative flex h-[31px] w-[51px] items-center rounded-full p-[2px] transition-colors duration-200",
        checked ? "justify-end bg-button" : "justify-start bg-[color-mix(in_srgb,var(--app-hint)_35%,transparent)]",
        disabled && "opacity-50",
      )}
    >
      <motion.span layout transition={spring.snappy} className="block h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]" />
    </span>
  );
}
