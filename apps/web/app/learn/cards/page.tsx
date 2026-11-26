"use client";

import { pickSession } from "@pravovukha/shared";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SessionSummary } from "@/components/learn/SessionSummary";
import { correctAnswerText } from "@/components/quiz/QuestionView";
import { ReportSheet } from "@/components/quiz/ReportSheet";
import { SessionBar } from "@/components/quiz/SessionBar";
import { Cell } from "@/components/ui/Cell";
import { Icon } from "@/components/ui/Icon";
import { LoadError, Loading } from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useDeckQuestions, useLoadedContent, useProgressReady, useQueryParam } from "@/data/hooks";
import type { Question } from "@/data/types";
import { spring } from "@/motion/presets";
import { useBackTo } from "@/stores/back";
import { useProgress } from "@/stores/progress";
import { haptic } from "@/tma/haptics";
import { useMainButton } from "@/tma/useMainButton";

const SIZE = 15;

function front(q: Question): string {
  if (q.f === "yn") return `${q.q}. Верно?`;
  return q.q;
}

export default function CardsPage() {
  const status = useLoadedContent();
  const deckId = useQueryParam("deck");
  const deck = useContent((s) => s.decks.find((d) => d.id === deckId));
  const error = useContent((s) => s.error);
  const pool = useDeckQuestions(deckId);
  const ready = useProgressReady(status === "ready" && deckId ? [deckId] : []);
  const record = useProgress((s) => s.record);
  useBackTo(deckId ? `/learn/deck?id=${deckId}` : "/learn");

  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  const byId = useMemo(() => new Map(pool.map((q) => [q.id, q])), [pool]);

  useEffect(() => {
    if (!ready || pool.length === 0 || !deckId) return;
    const progress = useProgress.getState().decks[deckId] ?? new Map();
    setCards(pickSession(pool.map((q) => q.id), progress, SIZE).map((id) => byId.get(id)!));
    setIndex(0);
    setResults([]);
    setFlipped(false);
  }, [ready, pool, byId, deckId, round]);

  const finished = cards !== null && index >= cards.length;
  const card = cards && !finished ? cards[index] : null;

  const mark = useCallback(
    (known: boolean) => {
      if (!card) return;
      if (known) haptic.correct();
      else haptic.wrong();
      record(card.d, card.id, known);
      setResults((r) => [...r, known]);
      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [card, record],
  );

  useMainButton({ text: "Показать ответ", onClick: () => { haptic.tap(); setFlipped(true); }, visible: !!card && !flipped });
  useMainButton({ text: "Ещё карточки", onClick: () => setRound((r) => r + 1), visible: finished });

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready" || !ready || !cards) return <Screen><Loading /></Screen>;

  if (finished) {
    const known = results.filter(Boolean).length;
    return (
      <Screen title="Карточки">
        <SessionSummary title={`Знаю: ${known} из ${results.length}`} subtitle="Карточки с «Не знаю» вернутся в следующий раз." questions={cards} results={results} />
        <Section>
          <Cell href={`/learn/deck?id=${deckId}`} title="Вернуться к теме" />
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <SessionBar index={index} total={cards.length} results={results} />
      {card && (
        <>
          <p className="mb-2 px-1 text-[13px] font-medium tracking-wide text-hint uppercase">{deck?.title ?? card.t}</p>
          <div className="[perspective:1200px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.button
                key={`${card.id}-${flipped}`}
                type="button"
                onClick={() => {
                  if (!flipped) {
                    haptic.tap();
                    setFlipped(true);
                  }
                }}
                initial={{ rotateY: flipped ? -90 : 0, opacity: flipped ? 0 : 1 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ ...spring.snappy, duration: 0.25 }}
                className="flex min-h-[300px] w-full flex-col justify-center rounded-3xl bg-section p-6 text-left shadow-sm"
              >
                {!flipped ? (
                  <>
                    <p className="text-[21px] leading-snug font-semibold text-fg">{front(card)}</p>
                    <p className="mt-4 text-[14px] text-hint">Вспомните ответ и нажмите на карточку</p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] text-hint">{front(card)}</p>
                    <p className="mt-3 text-[24px] leading-tight font-bold text-success">{correctAnswerText(card)}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-fg">{card.x}</p>
                  </>
                )}
              </motion.button>
            </AnimatePresence>
          </div>

          {flipped && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => mark(false)} className="pressable h-14 rounded-2xl bg-section text-[17px] font-semibold text-error">
                  Не знал
                </button>
                <button type="button" onClick={() => mark(true)} className="pressable h-14 rounded-2xl bg-section text-[17px] font-semibold text-success">
                  Знал
                </button>
              </div>
              <button type="button" onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1.5 self-center text-[14px] text-hint">
                <Icon name="flag" size={15} />
                Неточность? Сообщить
              </button>
            </motion.div>
          )}
          <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} id={String(card.id)} question={card.q} answer={correctAnswerText(card)} mode="cards" />
        </>
      )}
    </Screen>
  );
}
