"use client";

import { create } from "zustand";
import { assetUrl } from "./assets";
import type { Deck, DeckGroup, PuzzleSet, Question } from "./types";

interface ContentState {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  questions: Question[];
  byId: Map<number, Question>;
  byDeck: Map<string, Question[]>;
  decks: Deck[];
  groups: DeckGroup[];
  puzzles: PuzzleSet[];
  load: () => Promise<void>;
}

async function fetchJson<T>(path: string, version: string | null): Promise<T> {
  const url = assetUrl(path) + (version ? `?v=${version}` : "");
  const response = await fetch(url, { cache: version ? "force-cache" : "no-cache" });
  if (!response.ok) throw new Error(`Не удалось загрузить ${path}: ${response.status}`);
  return (await response.json()) as T;
}

/**
 * Вопросы, колоды и головоломки лежат статичными файлами в public/data.
 * Сначала читаем короткий decks.json без кэша, чтобы узнать версию,
 * остальное берём по версии — после обновления банка браузер скачает новые файлы.
 */
export const useContent = create<ContentState>((set, get) => ({
  status: "idle",
  error: null,
  questions: [],
  byId: new Map(),
  byDeck: new Map(),
  decks: [],
  groups: [],
  puzzles: [],

  async load() {
    if (get().status === "loading" || get().status === "ready") return;
    set({ status: "loading", error: null });
    try {
      const decks = await fetchJson<{ v: string; groups: DeckGroup[]; decks: Deck[] }>("data/decks.json", null);
      const [questions, puzzles] = await Promise.all([
        fetchJson<{ questions: Question[] }>("data/questions.json", decks.v),
        fetchJson<{ sets: PuzzleSet[] }>("data/puzzles.json", decks.v),
      ]);
      const byId = new Map<number, Question>();
      const byDeck = new Map<string, Question[]>();
      for (const q of questions.questions) {
        byId.set(q.id, q);
        const list = byDeck.get(q.d);
        if (list) list.push(q);
        else byDeck.set(q.d, [q]);
      }
      set({
        status: "ready",
        questions: questions.questions,
        byId,
        byDeck,
        decks: decks.decks,
        groups: decks.groups,
        puzzles: puzzles.sets,
      });
    } catch (error) {
      console.warn(error);
      set({ status: "error", error: error instanceof Error ? error.message : String(error) });
    }
  },
}));

export function useContentReady(): boolean {
  const status = useContent((s) => s.status);
  return status === "ready";
}
