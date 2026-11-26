"use client";

import { useState } from "react";
import { correctAnswerText } from "@/components/quiz/QuestionView";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Section } from "@/components/ui/Section";
import type { Question } from "@/data/types";
import { cx } from "@/lib/cx";
import { Icon } from "../ui/Icon";

interface SessionSummaryProps {
  title: string;
  subtitle?: string;
  questions: Question[];
  results: boolean[];
}

/** Итог подхода: сколько верно и разбор ошибок с пояснениями. */
export function SessionSummary({ title, subtitle, questions, results }: SessionSummaryProps) {
  const right = results.filter(Boolean).length;
  const wrong = questions.filter((_, i) => results[i] === false);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Section padded>
        <div className="flex items-center gap-4">
          <ProgressRing
            value={results.length ? right / results.length : 0}
            color={right === results.length ? "var(--app-success)" : "var(--app-button)"}
            label={`${right} из ${results.length} верно`}
          >
            <span className="text-[22px] leading-none font-bold text-fg tabular-nums">{right}</span>
            <span className="mt-0.5 text-[12px] text-hint tabular-nums">из {results.length}</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-semibold text-fg">{title}</p>
            {subtitle && <p className="mt-0.5 text-[15px] leading-snug text-hint">{subtitle}</p>}
          </div>
        </div>
      </Section>

      {wrong.length > 0 && (
        <Section header="Разбор ошибок" footer="Эти вопросы вернутся в следующих подходах, пока вы не ответите на них верно.">
          {wrong.map((q) => {
            const expanded = open === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setOpen(expanded ? null : q.id)}
                className="pressable flex w-full flex-col gap-1.5 px-4 py-3 text-left"
              >
                <span className="flex w-full items-start gap-2">
                  <Icon name="cross" size={18} className="mt-0.5 shrink-0 text-error" />
                  <span className="flex-1 text-[16px] leading-snug text-fg">{q.q}</span>
                </span>
                <span className="pl-[26px] text-[15px] text-success">Ответ: {correctAnswerText(q)}</span>
                <span className={cx("pl-[26px] text-[14px] leading-snug text-hint", !expanded && "line-clamp-2")}>{q.x}</span>
              </button>
            );
          })}
        </Section>
      )}
    </>
  );
}
