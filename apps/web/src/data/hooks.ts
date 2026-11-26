"use client";

import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@/stores/progress";
import { useContent } from "./content";
import type { Question } from "./types";

/** Загружает банк вопросов при первом обращении. */
export function useLoadedContent() {
  const status = useContent((s) => s.status);
  const load = useContent((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
  return status;
}

/** Вопросы колоды или всего банка (deckId = "all"). */
export function useDeckQuestions(deckId: string | null): Question[] {
  const questions = useContent((s) => s.questions);
  const byDeck = useContent((s) => s.byDeck);
  return useMemo(() => {
    if (!deckId) return [];
    if (deckId === "all") return questions;
    return byDeck.get(deckId) ?? [];
  }, [deckId, questions, byDeck]);
}

/** Догружает прогресс нужных колод; возвращает true, когда он прочитан. */
export function useProgressReady(deckIds: string[]): boolean {
  const loadDecks = useProgress((s) => s.loadDecks);
  const key = deckIds.join(",");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    setReady(false);
    if (!key) return;
    void loadDecks(key.split(",")).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [key, loadDecks]);
  return ready;
}

/** Параметр из адреса страницы (?id=…). В статическом экспорте читаем его на клиенте. */
export function useQueryParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value;
}
