"use client";

import {
  dayKey,
  deckProgressKey,
  nextLevel,
  parseDeckProgress,
  registerAnswers,
  serializeDeckProgress,
  type DeckProgress,
  type Level,
} from "@pravovukha/shared";
import { create } from "zustand";
import { getStorage } from "@/tma/cloudStorage";
import { useProfileStore } from "./profile";

interface ProgressState {
  /** Прогресс загруженных колод. */
  decks: Record<string, DeckProgress>;
  /** Версия для перерисовки после ответа. */
  rev: number;
  loadDecks: (deckIds: string[]) => Promise<void>;
  level: (deckId: string, questionId: number) => Level;
  record: (deckId: string, questionId: number, correct: boolean) => void;
  resetDeck: (deckId: string) => Promise<void>;
}

const loading = new Map<string, Promise<void>>();
const saveTimers = new Map<string, number>();
let writeQueue: Promise<void> = Promise.resolve();
let pendingAnswers = 0;
let answersTimer: number | null = null;

function enqueue(task: () => Promise<void>) {
  writeQueue = writeQueue.then(task).catch((error: unknown) => console.warn("Не удалось сохранить прогресс", error));
}

function flushAnswers() {
  answersTimer = null;
  const count = pendingAnswers;
  pendingAnswers = 0;
  if (count > 0) void useProfileStore.getState().update((p) => registerAnswers(p, dayKey(new Date()), count));
}

export const useProgress = create<ProgressState>((set, get) => ({
  decks: {},
  rev: 0,

  async loadDecks(deckIds) {
    const missing = deckIds.filter((id) => !get().decks[id] && !loading.has(id));
    const waiting = deckIds.map((id) => loading.get(id)).filter(Boolean) as Promise<void>[];
    if (missing.length > 0) {
      const task = (async () => {
        let values: Record<string, string | null> = {};
        try {
          values = await getStorage().getMany(missing.map(deckProgressKey));
        } catch (error) {
          console.warn("Не удалось прочитать прогресс", error);
        }
        const next = { ...get().decks };
        for (const id of missing) next[id] = parseDeckProgress(values[deckProgressKey(id)]);
        set({ decks: next, rev: get().rev + 1 });
      })();
      for (const id of missing) loading.set(id, task);
      waiting.push(task);
    }
    await Promise.all(waiting);
  },

  level(deckId, questionId) {
    return get().decks[deckId]?.get(questionId) ?? 0;
  },

  record(deckId, questionId, correct) {
    const current = get().decks[deckId] ?? new Map();
    const updated = new Map(current);
    updated.set(questionId, nextLevel(current.get(questionId) ?? 0, correct));
    set({ decks: { ...get().decks, [deckId]: updated }, rev: get().rev + 1 });

    const existing = saveTimers.get(deckId);
    if (existing) window.clearTimeout(existing);
    saveTimers.set(
      deckId,
      window.setTimeout(() => {
        saveTimers.delete(deckId);
        const value = serializeDeckProgress(get().decks[deckId] ?? new Map());
        enqueue(() => getStorage().set(deckProgressKey(deckId), value));
      }, 600),
    );

    pendingAnswers += 1;
    if (answersTimer === null) answersTimer = window.setTimeout(flushAnswers, 900);
  },

  async resetDeck(deckId) {
    set({ decks: { ...get().decks, [deckId]: new Map() }, rev: get().rev + 1 });
    enqueue(() => getStorage().remove(deckProgressKey(deckId)));
    await writeQueue;
  },
}));
