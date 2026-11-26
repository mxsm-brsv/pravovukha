"use client";

import { deckStats } from "@pravovukha/shared";
import { useMemo, useState } from "react";
import { Cell } from "@/components/ui/Cell";
import { LoadError, Loading } from "@/components/ui/Loading";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useDeckQuestions, useLoadedContent, useProgressReady, useQueryParam } from "@/data/hooks";
import { questions as questionsWord } from "@/lib/plural";
import { useProgress } from "@/stores/progress";
import { haptic } from "@/tma/haptics";

export default function DeckPage() {
  const status = useLoadedContent();
  const id = useQueryParam("id");
  const deck = useContent((s) => s.decks.find((d) => d.id === id));
  const error = useContent((s) => s.error);
  const questions = useDeckQuestions(id);
  const ready = useProgressReady(id ? [id] : []);
  const progress = useProgress((s) => (id ? s.decks[id] : undefined));
  const resetDeck = useProgress((s) => s.resetDeck);
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = useMemo(
    () => deckStats(questions.map((q) => q.id), progress ?? new Map()),
    [questions, progress],
  );

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready" || !id) return <Screen><Loading /></Screen>;
  if (!deck) {
    return (
      <Screen title="Колода не найдена">
        <Section padded>
          <p className="text-[15px] text-hint">Возможно, её убрали из банка вопросов. Вернитесь к списку тем.</p>
        </Section>
      </Screen>
    );
  }

  const share = stats.total ? stats.known / stats.total : 0;

  return (
    <Screen title={deck.title} subtitle={`${questionsWord(stats.total)} по тексту ${deck.source}`}>
      <Section padded>
        <div className="flex items-center gap-4">
          <ProgressRing value={share} label={`Знаю ${stats.known} из ${stats.total}`}>
            <span className="text-[20px] leading-none font-bold text-fg tabular-nums">{Math.round(share * 100)}%</span>
          </ProgressRing>
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[20px] font-semibold text-success tabular-nums">{ready ? stats.known : "–"}</p>
              <p className="text-[13px] text-hint">знаю</p>
            </div>
            <div>
              <p className="text-[20px] font-semibold text-error tabular-nums">{ready ? stats.mistakes : "–"}</p>
              <p className="text-[13px] text-hint">ошибки</p>
            </div>
            <div>
              <p className="text-[20px] font-semibold text-fg tabular-nums">{ready ? stats.fresh : "–"}</p>
              <p className="text-[13px] text-hint">новые</p>
            </div>
          </div>
        </div>
      </Section>

      <Section header="Заниматься" footer="Тренировка начинает с ошибок, потом даёт новые вопросы. Вопрос считается выученным, когда вы ответили на него верно два раза подряд.">
        <Cell href={`/learn/train?deck=${deck.id}`} icon="target2" iconTone="blue" title="Тренировка" subtitle="10 вопросов с пояснениями" />
        <Cell href={`/learn/cards?deck=${deck.id}`} icon="cards" iconTone="violet" title="Карточки" subtitle="Вспомните ответ и переверните карточку" />
        <Cell
          href={`/learn/train?deck=${deck.id}&mode=mistakes`}
          icon="refresh"
          iconTone="red"
          title="Ошибки"
          subtitle={stats.mistakes ? "Только вопросы, где вы ошиблись" : "Ошибок пока нет"}
          after={stats.mistakes || undefined}
        />
        <Cell href={`/learn/exam?deck=${deck.id}`} icon="timer" iconTone="orange" title="Экзамен по теме" subtitle="20 вопросов, не больше двух ошибок" />
        <Cell href={`/learn/list?deck=${deck.id}`} icon="list" iconTone="gray" title="Все вопросы с ответами" subtitle="Прочитать перед конкурсом" />
      </Section>

      {stats.total - stats.fresh > 0 && (
        <Section>
          {confirmReset ? (
            <Cell
              onClick={() => {
                haptic.warning();
                void resetDeck(deck.id);
                setConfirmReset(false);
              }}
              title={<span className="text-destructive">Да, сбросить прогресс</span>}
              subtitle="Все вопросы снова станут новыми"
            />
          ) : (
            <Cell onClick={() => setConfirmReset(true)} title={<span className="text-destructive">Сбросить прогресс по теме</span>} />
          )}
        </Section>
      )}
    </Screen>
  );
}
