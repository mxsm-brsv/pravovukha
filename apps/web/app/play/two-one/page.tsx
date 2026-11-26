"use client";

import { TWO_TO_ONE, shuffle } from "@pravovukha/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionSummary } from "@/components/learn/SessionSummary";
import { GameIntro } from "@/components/play/GameIntro";
import { QuestionView } from "@/components/quiz/QuestionView";
import { Cell } from "@/components/ui/Cell";
import { Icon } from "@/components/ui/Icon";
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

export default function TwoToOnePage() {
  const status = useLoadedContent();
  const all = useContent((s) => s.questions);
  const decks = useContent((s) => s.decks);
  const error = useContent((s) => s.error);
  const record = useProgress((s) => s.record);
  const best = useGames((s) => s.data.twoToOne);
  const loadGames = useGames((s) => s.load);
  const updateGames = useGames((s) => s.update);
  useBackTo("/play");

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const pool = useMemo(() => all.filter((q) => q.f !== "wr"), [all]);
  const [order, setOrder] = useState<Question[] | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  const [over, setOver] = useState(false);
  const savedBest = useRef(false);

  const errors = results.filter((r) => !r).length;
  const score = results.filter(Boolean).length;
  const current = order && !over ? order[answered ? results.length - 1 : results.length] : null;

  const start = () => {
    haptic.tap();
    setOrder(shuffle(pool));
    setResults([]);
    setAnswered(false);
    setOver(false);
    savedBest.current = false;
  };

  const next = () => {
    haptic.tap();
    if (errors > TWO_TO_ONE.lives || (order && results.length >= order.length)) {
      setOver(true);
    }
    setAnswered(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!over || savedBest.current) return;
    savedBest.current = true;
    if (score > best) {
      haptic.solved();
      updateGames((g) => ({ ...g, twoToOne: Math.max(g.twoToOne, score) }));
    }
  }, [over, score, best, updateGames]);

  useMainButton({ text: "Начать игру", onClick: start, visible: status === "ready" && order === null });
  useMainButton({ text: errors > TWO_TO_ONE.lives ? "Итоги" : "Дальше", onClick: next, visible: answered && !over });
  useMainButton({ text: "Новая игра", onClick: start, visible: over });

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready") return <Screen><Loading /></Screen>;

  if (order === null) {
    return (
      <Screen title="2 к 1" subtitle="Финальный этап «Профбатла»: вопросы подряд, пока не кончатся права на ошибку.">
        <GameIntro
          best={best}
          rules={[
            "Отвечайте на вопросы «Да/Нет» и с выбором ответа из всех тем.",
            `У вас ${TWO_TO_ONE.lives} права на ошибку. После шестой ошибки игра заканчивается.`,
            "Очки — число верных ответов. Пояснение можно открыть после ответа.",
          ]}
        />
      </Screen>
    );
  }

  if (over) {
    const answeredList = order.slice(0, results.length);
    return (
      <Screen title="Игра окончена">
        <SessionSummary
          title={`${score} верных ответов`}
          subtitle={score > best ? "Новый рекорд!" : `Рекорд: ${Math.max(best, score)}`}
          questions={answeredList}
          results={results}
        />
        <Section>
          <Cell href="/play" title="Другие режимы" />
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="mb-5 flex items-center justify-between px-1">
        <span className="text-[17px] font-semibold text-fg tabular-nums">Верно: {score}</span>
        <span className="flex items-center gap-1" aria-label={`Ошибок ${errors} из ${TWO_TO_ONE.lives}`}>
          {Array.from({ length: TWO_TO_ONE.lives }, (_, i) => (
            <Icon key={i} name="heart" size={20} className={cx(i < TWO_TO_ONE.lives - errors ? "text-error" : "text-hint/30")} />
          ))}
        </span>
      </div>
      {current && (
        <QuestionView
          key={`${results.length}-${current.id}`}
          question={current}
          caption={decks.find((d) => d.id === current.d)?.title}
          explain="on-demand"
          mode="two-one"
          onAnswer={({ correct }) => {
            record(current.d, current.id, correct);
            const nextErrors = errors + (correct ? 0 : 1);
            if (!correct && nextErrors === TWO_TO_ONE.lives) haptic.warning();
            setResults((r) => [...r, correct]);
            setAnswered(true);
          }}
        />
      )}
    </Screen>
  );
}
