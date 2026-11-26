"use client";

import { cx } from "@/lib/cx";

interface SessionBarProps {
  index: number;
  total: number;
  /** Результаты уже отвеченных: true — верно. */
  results: boolean[];
  right?: React.ReactNode;
}

/** Полоска прогресса подхода: сегмент на вопрос, цвет по результату. */
export function SessionBar({ index, total, results, right }: SessionBarProps) {
  const segments = Math.min(total, 30);
  return (
    <div className="mb-5 flex items-center gap-3 px-1">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {Array.from({ length: segments }, (_, i) => {
          const r = results[i];
          return (
            <span
              key={i}
              className={cx(
                "h-1.5 flex-1 rounded-full",
                r === true && "bg-success",
                r === false && "bg-error",
                r === undefined && (i === index ? "bg-button" : "bg-hint/25"),
              )}
            />
          );
        })}
      </div>
      <span className="shrink-0 text-[14px] font-medium text-hint tabular-nums">
        {Math.min(index + 1, total)} / {total}
      </span>
      {right}
    </div>
  );
}
