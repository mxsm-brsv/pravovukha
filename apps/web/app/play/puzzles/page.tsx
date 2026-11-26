"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { PuzzleImage, PuzzleMedia } from "@/components/play/PuzzleMedia";
import { ReportSheet } from "@/components/quiz/ReportSheet";
import { SessionBar } from "@/components/quiz/SessionBar";
import { Cell } from "@/components/ui/Cell";
import { Icon } from "@/components/ui/Icon";
import { LoadError, Loading } from "@/components/ui/Loading";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useLoadedContent, useQueryParam } from "@/data/hooks";
import { spring } from "@/motion/presets";
import { useBackTo } from "@/stores/back";
import { useGames } from "@/stores/games";
import { haptic } from "@/tma/haptics";
import { useMainButton } from "@/tma/useMainButton";

export default function PuzzlesPage() {
  const status = useLoadedContent();
  const setId = useQueryParam("set");
  const set = useContent((s) => s.puzzles.find((p) => p.id === setId));
  const error = useContent((s) => s.error);
  const loadGames = useGames((s) => s.load);
  const updateGames = useGames((s) => s.update);
  const solvedBefore = useGames((s) => (setId ? s.data.puzzles[setId] : undefined));
  useBackTo("/play");

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const items = useMemo(() => set?.items ?? [], [set]);
  const finished = items.length > 0 && index >= items.length;
  const item = !finished ? items[index] : undefined;

  useMainButton({
    text: "Показать ответ",
    onClick: () => {
      haptic.tap();
      setRevealed(true);
    },
    visible: !!item && !revealed,
  });
  useMainButton({
    text: "Сыграть ещё раз",
    onClick: () => {
      setIndex(0);
      setResults([]);
      setRevealed(false);
      setHint(false);
    },
    visible: finished,
  });

  const mark = (guessed: boolean) => {
    if (!item || !set) return;
    if (guessed) haptic.correct();
    else haptic.wrong();
    setResults((r) => [...r, guessed]);
    if (guessed) {
      updateGames((g) => {
        const list = new Set(g.puzzles[set.id] ?? []);
        list.add(item.id);
        return { ...g, puzzles: { ...g.puzzles, [set.id]: [...list] } };
      });
    }
    setRevealed(false);
    setHint(false);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  };

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready" || !setId) return <Screen><Loading text="Загружаем головоломки…" /></Screen>;
  if (!set) {
    return (
      <Screen title="Набор не найден">
        <Section>
          <Cell href="/play" title="К списку головоломок" />
        </Section>
      </Screen>
    );
  }

  if (finished) {
    const right = results.filter(Boolean).length;
    return (
      <Screen title={set.title}>
        <Section padded>
          <div className="flex items-center gap-4">
            <ProgressRing value={right / results.length} label={`Отгадано ${right} из ${results.length}`}>
              <span className="text-[22px] leading-none font-bold text-fg tabular-nums">{right}</span>
              <span className="mt-0.5 text-[12px] text-hint tabular-nums">из {results.length}</span>
            </ProgressRing>
            <div>
              <p className="text-[19px] font-semibold text-fg">Набор пройден</p>
              <p className="mt-0.5 text-[15px] text-hint">Всего отгадано в этом наборе: {solvedBefore?.length ?? right}.</p>
            </div>
          </div>
        </Section>
        <Section>
          <Cell href="/play" title="Другие головоломки" />
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <SessionBar index={index} total={items.length} results={results} />
      {item && (
        <div className="flex flex-col gap-4">
          <div className="px-1">
            <p className="mb-1.5 text-[13px] font-medium tracking-wide text-hint uppercase">{set.title}</p>
            <p className="text-[21px] leading-snug font-semibold text-fg">{item.prompt}</p>
          </div>
          <PuzzleMedia key={item.id} item={item} />
          {item.hint && !revealed && (
            hint ? (
              <p className="flex items-start gap-2 rounded-2xl bg-section p-3 text-[15px] text-fg">
                <Icon name="bulb" size={18} className="mt-0.5 shrink-0 text-warning" />
                {item.hint}
              </p>
            ) : (
              <button type="button" onClick={() => { haptic.tap(); setHint(true); }} className="inline-flex items-center gap-1.5 self-start px-1 text-[15px] text-link">
                <Icon name="bulb" size={17} />
                Подсказка
              </button>
            )
          )}
          {revealed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft} className="flex flex-col gap-3">
              <div className="rounded-2xl bg-section p-4">
                <p className="text-[13px] font-medium tracking-wide text-hint uppercase">Ответ</p>
                <p className="mt-1 text-[20px] leading-snug font-semibold text-success">{item.answer}</p>
                {item.note && <p className="mt-2 text-[15px] leading-relaxed text-fg">{item.note}</p>}
                <button type="button" onClick={() => setReportOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-hint">
                  <Icon name="flag" size={15} />
                  Неточность? Сообщить
                </button>
              </div>
              {item.answerImage && <PuzzleImage src={item.answerImage} alt={item.answer} />}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => mark(false)} className="pressable h-14 rounded-2xl bg-section text-[17px] font-semibold text-error">
                  Не отгадал
                </button>
                <button type="button" onClick={() => mark(true)} className="pressable h-14 rounded-2xl bg-section text-[17px] font-semibold text-success">
                  Отгадал
                </button>
              </div>
            </motion.div>
          )}
          <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} id={item.id} question={item.prompt} answer={item.answer} mode={`puzzles:${set.id}`} />
        </div>
      )}
    </Screen>
  );
}
