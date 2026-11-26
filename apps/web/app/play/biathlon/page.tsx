"use client";

import { BIATHLON, biathlonReadingSeconds, shuffle } from "@pravovukha/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SessionSummary } from "@/components/learn/SessionSummary";
import { GameIntro } from "@/components/play/GameIntro";
import { QuestionView } from "@/components/quiz/QuestionView";
import { Cell } from "@/components/ui/Cell";
import { LoadError, Loading } from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useLoadedContent } from "@/data/hooks";
import type { Question } from "@/data/types";
import { cx } from "@/lib/cx";
import { useBackTo } from "@/stores/back";
import { useGames } from "@/stores/games";
import { useProgress } from "@/stores/progress";
import { haptic } from "@/tma/haptics";
import { useMainButton } from "@/tma/useMainButton";

function limitFor(q: Question): number {
  return biathlonReadingSeconds(q.q.length) + BIATHLON.seconds[q.f];
}

export default function BiathlonPage() {
  const status = useLoadedContent();
  const all = useContent((s) => s.questions);
  const decks = useContent((s) => s.decks);
  const error = useContent((s) => s.error);
  const record = useProgress((s) => s.record);
  const best = useGames((s) => s.data.biathlon);
  const loadGames = useGames((s) => s.load);
  const updateGames = useGames((s) => s.update);
  useBackTo("/play");

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const pool = useMemo(() => all.filter((q) => q.l <= 2), [all]);
  const [order, setOrder] = useState<Question[] | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [over, setOver] = useState(false);
  const [left, setLeft] = useState(0);
  const deadline = useRef(0);
  const lastTick = useRef(0);
  const savedBest = useRef(false);

  const score = results.filter(Boolean).length;
  const index = answered ? results.length - 1 : results.length;
  const current = order && !over ? order[index] : null;
  const limit = current ? limitFor(current) : 1;

  const finishQuestion = useCallback(
    (q: Question, correct: boolean) => {
      record(q.d, q.id, correct);
      setResults((r) => [...r, correct]);
      setAnswered(true);
    },
    [record],
  );

  // Таймер текущего вопроса
  useEffect(() => {
    if (!current || answered) return;
    deadline.current = Date.now() + limitFor(current) * 1000;
    lastTick.current = 0;
    setLeft(limitFor(current));
    const timer = window.setInterval(() => {
      const ms = deadline.current - Date.now();
      const seconds = Math.max(0, ms / 1000);
      setLeft(seconds);
      const whole = Math.ceil(seconds);
      if (whole <= 3 && whole > 0 && whole !== lastTick.current) {
        lastTick.current = whole;
        haptic.tick();
      }
      if (ms <= 0) {
        window.clearInterval(timer);
        haptic.wrong();
        setTimedOut(true);
        finishQuestion(current, false);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [current, answered, finishQuestion]);

  const start = () => {
    haptic.tap();
    setOrder(shuffle(pool));
    setResults([]);
    setAnswered(false);
    setTimedOut(false);
    setOver(false);
    savedBest.current = false;
  };

  const next = () => {
    haptic.tap();
    const lastWrong = results.length > 0 && !results[results.length - 1];
    if (lastWrong || (order && results.length >= order.length)) setOver(true);
    setAnswered(false);
    setTimedOut(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!over || savedBest.current) return;
    savedBest.current = true;
    if (score > best) {
      haptic.solved();
      updateGames((g) => ({ ...g, biathlon: Math.max(g.biathlon, score) }));
    }
  }, [over, score, best, updateGames]);

  const lastWrong = results.length > 0 && !results[results.length - 1];
  useMainButton({ text: "На старт", onClick: start, visible: status === "ready" && order === null });
  useMainButton({ text: lastWrong ? "Итоги" : "Следующий", onClick: next, visible: answered && !over });
  useMainButton({ text: "Ещё забег", onClick: start, visible: over });

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready") return <Screen><Loading /></Screen>;

  if (order === null) {
    return (
      <Screen title="Правовой биатлон" subtitle="Как на сцене: игроки отвечают по очереди, ошибся — выбыл.">
        <GameIntro
          best={best}
          rules={[
            "Вопросы из всех тем, базовой и средней сложности.",
            `На вопрос даётся время на чтение и ещё ${BIATHLON.seconds.yn} с на «Да/Нет», ${BIATHLON.seconds.mc} с на выбор и ${BIATHLON.seconds.wr} с на вписанный ответ.`,
            "Одна ошибка или вышедшее время — забег окончен. Очки — ответы подряд без ошибок.",
          ]}
        />
      </Screen>
    );
  }

  if (over) {
    return (
      <Screen title="Забег окончен">
        <SessionSummary
          title={`${score} подряд`}
          subtitle={score > best ? "Новый рекорд!" : `Рекорд: ${Math.max(best, score)}`}
          questions={order.slice(0, results.length)}
          results={results}
        />
        <Section>
          <Cell href="/play" title="Другие режимы" />
        </Section>
      </Screen>
    );
  }

  const share = Math.max(0, Math.min(1, left / limit));
  return (
    <Screen>
      <div className="mb-5 flex items-center gap-3 px-1">
        <span className="shrink-0 text-[17px] font-semibold text-fg tabular-nums">Подряд: {score}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-hint/25" aria-hidden="true">
          <div
            className={cx("h-full rounded-full transition-[width] duration-100 ease-linear", share < 0.25 ? "bg-error" : "bg-button")}
            style={{ width: `${answered ? 0 : share * 100}%` }}
          />
        </div>
        <span className={cx("w-8 shrink-0 text-right text-[15px] font-semibold tabular-nums", left <= 3 ? "text-error" : "text-hint")}>
          {answered ? "–" : Math.ceil(left)}
        </span>
      </div>
      {current && (
        <QuestionView
          key={`${index}-${current.id}`}
          question={current}
          caption={decks.find((d) => d.id === current.d)?.title}
          explain="on-demand"
          mode="biathlon"
          timedOut={timedOut}
          disabled={answered}
          onAnswer={({ correct }) => {
            if (answered) return;
            finishQuestion(current, correct);
          }}
        />
      )}
    </Screen>
  );
}
