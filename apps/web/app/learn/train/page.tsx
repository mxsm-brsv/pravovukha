"use client";

import { pickSession, shuffle } from "@pravovukha/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SessionSummary } from "@/components/learn/SessionSummary";
import { QuestionView } from "@/components/quiz/QuestionView";
import { SessionBar } from "@/components/quiz/SessionBar";
import { Cell } from "@/components/ui/Cell";
import { LoadError, Loading } from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useDeckQuestions, useLoadedContent, useProgressReady, useQueryParam } from "@/data/hooks";
import type { Question } from "@/data/types";
import { useBackTo } from "@/stores/back";
import { useProgress } from "@/stores/progress";
import { haptic } from "@/tma/haptics";
import { useMainButton } from "@/tma/useMainButton";

const SESSION_SIZE = 10;
const MISTAKES_SIZE = 20;

export default function TrainPage() {
  const status = useLoadedContent();
  const deckId = useQueryParam("deck");
  const mode = useQueryParam("mode") === "mistakes" ? "mistakes" : "train";
  const decks = useContent((s) => s.decks);
  const error = useContent((s) => s.error);
  const pool = useDeckQuestions(deckId);
  const deckIds = useMemo(
    () => (deckId === "all" ? decks.map((d) => d.id) : deckId ? [deckId] : []),
    [deckId, decks],
  );
  const progressReady = useProgressReady(status === "ready" ? deckIds : []);
  const record = useProgress((s) => s.record);
  const deckTitle = decks.find((d) => d.id === deckId)?.title;
  useBackTo(deckId && deckId !== "all" ? `/learn/deck?id=${deckId}` : "/learn");

  const [round, setRound] = useState(0);
  const [session, setSession] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);

  const buildSession = useCallback(() => {
    const progressMap = useProgress.getState().decks;
    let list: Question[];
    if (mode === "mistakes") {
      list = shuffle(pool.filter((q) => progressMap[q.d]?.get(q.id) === 1)).slice(0, MISTAKES_SIZE);
    } else if (deckId === "all") {
      // По всему банку: берём понемногу из разных колод, сначала ошибки и новые.
      const merged = new Map<number, Question>(pool.map((q) => [q.id, q]));
      const levels = new Map<number, 0 | 1 | 2 | 3>();
      for (const q of pool) levels.set(q.id, progressMap[q.d]?.get(q.id) ?? 0);
      const ids = pickSession([...merged.keys()], levels, SESSION_SIZE);
      list = ids.map((id) => merged.get(id)!);
    } else {
      const ids = pickSession(pool.map((q) => q.id), progressMap[deckId ?? ""] ?? new Map(), SESSION_SIZE);
      const byId = new Map(pool.map((q) => [q.id, q]));
      list = ids.map((id) => byId.get(id)!);
    }
    setSession(list);
    setIndex(0);
    setResults([]);
    setAnswered(false);
  }, [deckId, mode, pool]);

  useEffect(() => {
    if (progressReady && pool.length > 0) buildSession();
  }, [progressReady, pool, buildSession, round]);

  const finished = session !== null && index >= session.length;
  const current = session && !finished ? session[index] : null;

  const next = useCallback(() => {
    haptic.tap();
    setAnswered(false);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }, []);

  useMainButton({
    text: session && index === session.length - 1 ? "Результаты" : "Дальше",
    onClick: next,
    visible: answered && !finished,
  });
  useMainButton({
    text: mode === "mistakes" ? "Ещё раз по ошибкам" : `Ещё ${SESSION_SIZE} вопросов`,
    onClick: () => {
      haptic.tap();
      setRound((r) => r + 1);
    },
    visible: finished && (mode !== "mistakes" || results.some((r) => !r)),
  });

  const title = mode === "mistakes" ? "Работа над ошибками" : (deckTitle ?? "Случайные вопросы");

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready" || !progressReady || session === null) return <Screen><Loading /></Screen>;

  if (session.length === 0) {
    return (
      <Screen title={title}>
        <Section padded>
          <p className="text-[16px] leading-snug text-fg">
            {mode === "mistakes" ? "Ошибок нет — все вопросы, где вы ошибались, уже исправлены." : "В этой теме пока нет вопросов."}
          </p>
        </Section>
        <Section>
          <Cell href="/learn" title="К списку тем" />
        </Section>
      </Screen>
    );
  }

  if (finished) {
    const right = results.filter(Boolean).length;
    return (
      <Screen title={title}>
        <SessionSummary
          title={right === results.length ? "Без ошибок!" : right >= results.length * 0.7 ? "Хороший результат" : "Есть над чем поработать"}
          subtitle={right === results.length ? "Все ответы верные." : `Верно ${right} из ${results.length}.`}
          questions={session}
          results={results}
        />
        <Section>
          {deckId && deckId !== "all" ? (
            <Cell href={`/learn/deck?id=${deckId}`} title="Вернуться к теме" />
          ) : (
            <Cell href="/learn" title="К списку тем" />
          )}
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <SessionBar index={index} total={session.length} results={results} />
      {current && (
        <QuestionView
          key={`${round}-${index}-${current.id}`}
          question={current}
          caption={deckId === "all" ? decks.find((d) => d.id === current.d)?.title : current.t}
          seed={round}
          mode={mode}
          onAnswer={({ correct }) => {
            record(current.d, current.id, correct);
            setResults((r) => [...r, correct]);
            setAnswered(true);
          }}
        />
      )}
    </Screen>
  );
}
