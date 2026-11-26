"use client";

import { EXAM_RULES, examAnswer, examTimeout, shuffle, startExam, type ExamState } from "@pravovukha/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SessionSummary } from "@/components/learn/SessionSummary";
import { QuestionView } from "@/components/quiz/QuestionView";
import { SessionBar } from "@/components/quiz/SessionBar";
import { Cell } from "@/components/ui/Cell";
import { Icon } from "@/components/ui/Icon";
import { LoadError, Loading } from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useDeckQuestions, useLoadedContent, useQueryParam } from "@/data/hooks";
import type { Question } from "@/data/types";
import { cx } from "@/lib/cx";
import { useBackTo } from "@/stores/back";
import { useGames } from "@/stores/games";
import { useProgress } from "@/stores/progress";
import { haptic } from "@/tma/haptics";
import { useMainButton } from "@/tma/useMainButton";

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const REASONS: Record<NonNullable<ExamState["reason"]>, string> = {
  errors: "Больше двух ошибок в основной части.",
  extra: "Ошибка в дополнительных вопросах — там ошибаться нельзя.",
  time: "Закончилось время.",
};

export default function ExamPage() {
  const status = useLoadedContent();
  const deckId = useQueryParam("deck");
  const deck = useContent((s) => s.decks.find((d) => d.id === deckId));
  const error = useContent((s) => s.error);
  const pool = useDeckQuestions(deckId);
  const record = useProgress((s) => s.record);
  const loadGames = useGames((s) => s.load);
  const updateGames = useGames((s) => s.update);
  useBackTo(deckId && deckId !== "all" ? `/learn/deck?id=${deckId}` : "/learn");

  const [started, setStarted] = useState(false);
  const [order, setOrder] = useState<Question[]>([]);
  const [exam, setExam] = useState<ExamState | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const saved = useRef(false);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const start = useCallback(() => {
    haptic.tap();
    setOrder(shuffle(pool));
    setExam(startExam(Date.now()));
    setResults([]);
    setAnswered(false);
    setStarted(true);
    saved.current = false;
  }, [pool]);

  useEffect(() => {
    if (!exam || exam.status !== "running") return;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setExam((e) => (e ? examTimeout(e, t) : e));
    }, 500);
    return () => window.clearInterval(timer);
  }, [exam?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const showResult = exam !== null && exam.status !== "running" && !answered;

  useEffect(() => {
    if (!exam || exam.status === "running" || saved.current) return;
    saved.current = true;
    if (exam.status === "passed") haptic.solved();
    updateGames((g) => ({ ...g, exam: { tries: g.exam.tries + 1, passed: g.exam.passed + (exam.status === "passed" ? 1 : 0) } }));
  }, [exam, updateGames]);

  const current = !exam ? null : answered ? order[exam.answered - 1] : exam.status === "running" ? order[exam.answered] : null;

  const next = () => {
    haptic.tap();
    setAnswered(false);
    window.scrollTo({ top: 0 });
  };

  useMainButton({ text: "Начать экзамен", onClick: start, visible: status === "ready" && !started && pool.length > 0 });
  useMainButton({ text: exam?.status === "running" ? "Дальше" : "Результат", onClick: next, visible: started && answered });
  useMainButton({ text: "Ещё раз", onClick: start, visible: started && showResult });

  const remaining = exam ? exam.deadline - now : 0;
  const answeredQuestions = useMemo(() => order.slice(0, results.length), [order, results.length]);

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready") return <Screen><Loading /></Screen>;

  const title = deckId === "all" ? "Экзамен" : `Экзамен: ${deck?.title ?? ""}`;

  if (!started) {
    return (
      <Screen title={title} subtitle={deckId === "all" ? "Вопросы из всех тем в случайном порядке." : `Вопросы по теме «${deck?.title}».`}>
        <Section header="Правила">
          <Cell icon="list" iconTone="blue" title={`${EXAM_RULES.base} вопросов`} subtitle="Пояснения — после экзамена" />
          <Cell icon="timer" iconTone="orange" title={`${EXAM_RULES.minutes} минут`} subtitle="Время идёт с первого вопроса" />
          <Cell icon="cross" iconTone="red" title={`Не больше ${EXAM_RULES.maxErrors} ошибок`} subtitle="За каждую ошибку — 5 дополнительных вопросов и 5 минут, в них ошибаться нельзя" />
        </Section>
        {pool.length < EXAM_RULES.base + EXAM_RULES.extraPerError * EXAM_RULES.maxErrors && (
          <Section padded>
            <p className="text-[15px] leading-snug text-hint">В теме мало вопросов, поэтому некоторые могут не встретиться, а дополнительных может не хватить.</p>
          </Section>
        )}
      </Screen>
    );
  }

  if (exam && showResult) {
    const passed = exam.status === "passed";
    return (
      <Screen title={passed ? "Экзамен сдан" : "Экзамен не сдан"}>
        <SessionSummary
          title={passed ? "Сдано!" : "Не сдано"}
          subtitle={passed ? `Ошибок: ${exam.errors}.` : REASONS[exam.reason ?? "errors"]}
          questions={answeredQuestions}
          results={results}
        />
        <Section>
          <Cell href={deckId && deckId !== "all" ? `/learn/deck?id=${deckId}` : "/learn"} title="Вернуться" />
        </Section>
      </Screen>
    );
  }

  const outOfQuestions = exam !== null && exam.status === "running" && !current;
  if (exam && outOfQuestions) {
    // Вопросы в теме закончились раньше, чем нужно: засчитываем как сдачу.
    return (
      <Screen title="Вопросы закончились">
        <SessionSummary title="Все вопросы темы пройдены" subtitle={`Ошибок: ${exam.errors}.`} questions={answeredQuestions} results={results} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SessionBar
        index={exam ? Math.min(exam.answered - (answered ? 1 : 0), exam.total - 1) : 0}
        total={exam?.total ?? EXAM_RULES.base}
        results={results}
        right={
          <span className={cx("inline-flex items-center gap-1 text-[15px] font-semibold tabular-nums", remaining < 60_000 ? "text-error" : "text-fg")}>
            <Icon name="timer" size={17} />
            {formatTime(remaining)}
          </span>
        }
      />
      {exam && (
        <p className="mb-3 px-1 text-[14px] text-hint">
          Ошибок: {exam.errors} из {EXAM_RULES.maxErrors}
          {exam.total > EXAM_RULES.base && ` · дополнительных вопросов: ${exam.total - EXAM_RULES.base}`}
        </p>
      )}
      {current && (
        <QuestionView
          key={`${exam?.deadline}-${results.length}-${current.id}`}
          question={current}
          caption={deck?.title ?? current.t}
          explain="never"
          mode="exam"
          disabled={answered}
          onAnswer={({ correct }) => {
            record(current.d, current.id, correct);
            setResults((r) => [...r, correct]);
            setExam((e) => (e ? examAnswer(e, correct, Date.now()) : e));
            setAnswered(true);
          }}
        />
      )}
    </Screen>
  );
}
