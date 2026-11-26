"use client";

import { isWrittenAnswerCorrect, seededRandom, shuffle } from "@pravovukha/shared";
import { motion } from "motion/react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import type { Question } from "@/data/types";
import { cx } from "@/lib/cx";
import { spring } from "@/motion/presets";
import { haptic } from "@/tma/haptics";
import { Icon } from "../ui/Icon";
import { ReportSheet } from "./ReportSheet";

const LETTERS = ["А", "Б", "В", "Г"];

export interface AnswerInfo {
  correct: boolean;
  /** Что выбрал или вписал пользователь. */
  given: string;
}

interface QuestionViewProps {
  question: Question;
  /** Подпись над вопросом: колода или тема. */
  caption?: string;
  onAnswer: (info: AnswerInfo) => void;
  /** Показать пояснение после ответа (в экзамене и играх — по желанию). */
  explain?: "always" | "on-demand" | "never";
  /** Зерно для перемешивания вариантов. */
  seed?: number;
  /** Где показан вопрос — уходит в сообщение о неточности. */
  mode?: string;
  disabled?: boolean;
  /** Время вышло: показываем верный ответ, как после ошибки. */
  timedOut?: boolean;
}

export function correctAnswerText(q: Question): string {
  if (q.f === "mc") return q.o[q.a]!;
  return q.a;
}

/**
 * Один вопрос в любом из трёх форматов. Хранит выбор пользователя, после ответа
 * подсвечивает верный вариант и показывает пояснение со ссылкой на норму.
 */
export function QuestionView({ question, caption, onAnswer, explain = "always", seed = 0, mode = "train", disabled, timedOut }: QuestionViewProps) {
  const [answer_, setResult] = useState<AnswerInfo | null>(null);
  const result = answer_ ?? (timedOut ? { correct: false, given: "" } : null);
  const [typed, setTyped] = useState("");
  const [showWhy, setShowWhy] = useState(explain === "always");
  const [reportOpen, setReportOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const order = useMemo(() => {
    if (question.f !== "mc") return [];
    return shuffle([0, 1, 2, 3], seededRandom(question.id * 7919 + seed));
  }, [question, seed]);

  const answer = (correct: boolean, given: string) => {
    if (result || disabled) return;
    const info = { correct, given };
    setResult(info);
    if (correct) haptic.correct();
    else haptic.wrong();
    onAnswer(info);
  };

  const submitWritten = (e?: FormEvent) => {
    e?.preventDefault();
    if (question.f !== "wr" || !typed.trim()) return;
    inputRef.current?.blur();
    answer(isWrittenAnswerCorrect(typed, [question.a, ...question.acc]), typed.trim());
  };

  const answered = result !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="px-1">
        {caption && <p className="mb-1.5 text-[13px] font-medium tracking-wide text-hint uppercase">{caption}</p>}
        <p className="text-[20px] leading-snug font-semibold text-fg">{question.q}</p>
        {question.f === "yn" && !answered && <p className="mt-1.5 text-[14px] text-hint">Верно ли утверждение?</p>}
      </div>

      {question.f === "yn" && (
        <div className="grid grid-cols-2 gap-3">
          {(["Да", "Нет"] as const).map((option) => {
            const isRight = question.a === option;
            const chosen = result?.given === option;
            return (
              <button
                key={option}
                type="button"
                disabled={answered || disabled}
                onClick={() => answer(option === question.a, option)}
                className={cx(
                  "pressable h-16 rounded-2xl text-[19px] font-semibold transition-colors",
                  !answered && "bg-section text-fg",
                  answered && isRight && "bg-success text-white",
                  answered && chosen && !isRight && "bg-error text-white",
                  answered && !isRight && !chosen && "bg-section text-hint",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {question.f === "mc" && (
        <div className="flex flex-col gap-2.5">
          {order.map((index, position) => {
            const text = question.o[index]!;
            const isRight = index === question.a;
            const chosen = result?.given === text;
            return (
              <button
                key={index}
                type="button"
                disabled={answered || disabled}
                onClick={() => answer(isRight, text)}
                className={cx(
                  "pressable flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[17px] leading-snug transition-colors",
                  !answered && "bg-section text-fg",
                  answered && isRight && "bg-success text-white",
                  answered && chosen && !isRight && "bg-error text-white",
                  answered && !isRight && !chosen && "bg-section text-hint",
                )}
              >
                <span
                  className={cx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold",
                    answered && (isRight || chosen) ? "bg-white/25 text-white" : "bg-[color-mix(in_srgb,var(--app-button)_14%,transparent)] text-button",
                  )}
                >
                  {LETTERS[position]}
                </span>
                <span className="min-w-0 flex-1">{text}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.f === "wr" && (
        <form onSubmit={submitWritten} className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={answered || disabled}
              placeholder="Ваш ответ"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              className={cx(
                "h-14 min-w-0 flex-1 rounded-2xl px-4 text-[18px] outline-none",
                !answered && "bg-section text-fg placeholder:text-hint",
                answered && result?.correct && "bg-success text-white",
                answered && !result?.correct && "bg-error text-white",
              )}
            />
            {!answered && (
              <button
                type="submit"
                disabled={!typed.trim() || disabled}
                className="h-14 shrink-0 rounded-2xl bg-button px-4 text-[16px] font-semibold text-button-fg disabled:opacity-40"
              >
                Проверить
              </button>
            )}
          </div>
          {answered && !result?.correct && (
            <p className="px-1 text-[16px] text-fg">
              Верный ответ: <span className="font-semibold">{question.a}</span>
            </p>
          )}
        </form>
      )}

      {answered && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft} className="flex flex-col gap-2">
          <p className={cx("px-1 text-[17px] font-semibold", result?.correct ? "text-success" : "text-error")}>
            {result?.correct ? "Верно" : answer_ === null && timedOut ? "Время вышло" : "Неверно"}
          </p>
          {explain !== "never" &&
            (showWhy ? (
              <div className="rounded-2xl bg-section p-4">
                <p className="text-[15px] leading-relaxed text-fg">{question.x}</p>
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-hint"
                >
                  <Icon name="flag" size={15} />
                  Неточность? Сообщить
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  setShowWhy(true);
                }}
                className="self-start px-1 text-[15px] text-link"
              >
                Почему так?
              </button>
            ))}
        </motion.div>
      )}

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        id={String(question.id)}
        question={question.q}
        answer={correctAnswerText(question)}
        mode={mode}
      />
    </div>
  );
}
