"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/motion/presets";

interface ProgressRingProps {
  /** Доля от 0 до 1; значения за пределами обрезаются. */
  value: number;
  size?: number;
  stroke?: number;
  /** Цвет заполненной части; по умолчанию цвет кнопки Telegram. */
  color?: string;
  label: string;
  children?: ReactNode;
}

/** Кольцо прогресса для дневной цели и результатов. */
export function ProgressRing({ value, size = 88, stroke = 9, color = "var(--app-button)", label, children }: ProgressRingProps) {
  const progress = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const radius = (size - stroke) / 2;
  const center = size / 2;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="color-mix(in srgb, var(--app-hint) 22%, transparent)"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress, opacity: progress > 0 ? 1 : 0 }}
          transition={spring.soft}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  );
}
