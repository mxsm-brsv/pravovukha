"use client";

import { normalizeAnswer } from "@pravovukha/shared";
import { useMemo, useState } from "react";
import { correctAnswerText } from "@/components/quiz/QuestionView";
import { ReportSheet } from "@/components/quiz/ReportSheet";
import { Icon } from "@/components/ui/Icon";
import { LoadError, Loading } from "@/components/ui/Loading";
import { Screen } from "@/components/ui/Screen";
import { Section } from "@/components/ui/Section";
import { useContent } from "@/data/content";
import { useDeckQuestions, useLoadedContent, useQueryParam } from "@/data/hooks";
import type { Question } from "@/data/types";
import { questions as questionsWord } from "@/lib/plural";
import { useBackTo } from "@/stores/back";

export default function ListPage() {
  const status = useLoadedContent();
  const deckId = useQueryParam("deck");
  const deck = useContent((s) => s.decks.find((d) => d.id === deckId));
  const error = useContent((s) => s.error);
  const pool = useDeckQuestions(deckId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [report, setReport] = useState<Question | null>(null);
  useBackTo(deckId ? `/learn/deck?id=${deckId}` : "/learn");

  const filtered = useMemo(() => {
    const q = normalizeAnswer(query);
    if (!q) return pool;
    return pool.filter((item) => normalizeAnswer(`${item.q} ${correctAnswerText(item)} ${item.x}`).includes(q));
  }, [pool, query]);

  if (status === "error") return <Screen><LoadError message={error} /></Screen>;
  if (status !== "ready") return <Screen><Loading /></Screen>;

  return (
    <Screen title={deck?.title ?? "Вопросы"} subtitle={`${questionsWord(filtered.length)}. Нажмите на вопрос, чтобы увидеть пояснение.`}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по вопросам и ответам"
        className="h-11 w-full rounded-xl bg-section px-4 text-[16px] text-fg outline-none placeholder:text-hint"
      />
      <Section>
        {filtered.map((q) => {
          const expanded = open === q.id;
          return (
            <div key={q.id} className="px-4 py-3">
              <button type="button" onClick={() => setOpen(expanded ? null : q.id)} className="w-full text-left">
                <span className="block text-[13px] text-hint">№ {q.id} · {q.t}</span>
                <span className="mt-0.5 block text-[16px] leading-snug text-fg">{q.q}</span>
                <span className="mt-1 block text-[15px] font-medium text-success">{correctAnswerText(q)}</span>
              </button>
              {expanded && (
                <div className="mt-2">
                  <p className="text-[14px] leading-relaxed text-hint">{q.x}</p>
                  <button type="button" onClick={() => setReport(q)} className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-hint">
                    <Icon name="flag" size={15} />
                    Неточность? Сообщить
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </Section>
      {report && (
        <ReportSheet open onClose={() => setReport(null)} id={String(report.id)} question={report.q} answer={correctAnswerText(report)} mode="list" />
      )}
    </Screen>
  );
}
