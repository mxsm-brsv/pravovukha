"use client";

import { deckStats } from "@pravovukha/shared";
import { useMemo } from "react";
import { Cell } from "@/components/ui/Cell";
import { LoadError, Loading } from "@/components/ui/Loading";
import { Ring } from "@/components/ui/Ring";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useLoadedContent, useProgressReady } from "@/data/hooks";
import { documentsDative, questions as questionsWord } from "@/lib/plural";
import { useProgress } from "@/stores/progress";

export default function LearnPage() {
  const status = useLoadedContent();
  const decks = useContent((s) => s.decks);
  const groups = useContent((s) => s.groups);
  const byDeck = useContent((s) => s.byDeck);
  const total = useContent((s) => s.questions.length);
  const error = useContent((s) => s.error);
  const deckIds = useMemo(() => decks.map((d) => d.id), [decks]);
  const progressReady = useProgressReady(deckIds);
  const progress = useProgress((s) => s.decks);

  const stats = useMemo(() => {
    const map = new Map<string, ReturnType<typeof deckStats>>();
    for (const d of decks) {
      const ids = (byDeck.get(d.id) ?? []).map((q) => q.id);
      map.set(d.id, deckStats(ids, progress[d.id] ?? new Map()));
    }
    return map;
  }, [decks, byDeck, progress]);

  const mistakes = [...stats.values()].reduce((n, s) => n + s.mistakes, 0);
  const known = [...stats.values()].reduce((n, s) => n + s.known, 0);

  if (status === "error") {
    return (
      <Screen title="Учить">
        <LoadError message={error} />
      </Screen>
    );
  }

  if (status !== "ready") {
    return (
      <Screen title="Учить">
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen
      title="Учить"
      subtitle={`${questionsWord(total)} по ${documentsDative(decks.length)}.${progressReady && known > 0 ? ` Вы знаете ответы на ${known}.` : ""}`}
    >
      <Section header="Быстрый старт">
        <Cell
          href="/learn/train?deck=all"
          icon="shuffle"
          iconTone="blue"
          title="Случайные вопросы"
          subtitle="10 вопросов из всех тем, сначала новые"
        />
        <Cell
          href="/learn/exam?deck=all"
          icon="timer"
          iconTone="orange"
          title="Экзамен"
          subtitle="20 вопросов за 20 минут, не больше двух ошибок"
        />
        <Cell
          href="/learn/train?deck=all&mode=mistakes"
          icon="refresh"
          iconTone="red"
          title="Работа над ошибками"
          subtitle={mistakes > 0 ? "Вопросы, в которых вы ошиблись" : "Ошибок пока нет"}
          after={progressReady && mistakes > 0 ? mistakes : undefined}
        />
      </Section>

      {groups.map((group) => {
        const list = decks.filter((d) => d.group === group.id);
        if (list.length === 0) return null;
        return (
          <Section key={group.id} header={group.title}>
            {list.map((deck) => {
              const s = stats.get(deck.id);
              const subtitle = progressReady && s
                ? `Знаю ${s.known} из ${s.total}${s.mistakes ? ` · ошибок ${s.mistakes}` : ""}`
                : questionsWord(deck.count);
              return (
                <Cell
                  key={deck.id}
                  href={`/learn/deck?id=${deck.id}`}
                  title={deck.title}
                  subtitle={subtitle}
                  after={progressReady && s ? <Ring value={s.total ? s.known / s.total : 0} /> : undefined}
                />
              );
            })}
          </Section>
        );
      })}
    </Screen>
  );
}
