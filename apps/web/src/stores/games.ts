"use client";

import { z } from "zod";
import { create } from "zustand";
import { getStorage } from "@/tma/cloudStorage";

const KEY = "games_v1";

const schema = z.object({
  twoToOne: z.number().int().min(0).default(0),
  biathlon: z.number().int().min(0).default(0),
  exam: z.object({ passed: z.number().int().min(0), tries: z.number().int().min(0) }).default({ passed: 0, tries: 0 }),
  /** Головоломки: набор → отгаданные id. */
  puzzles: z.record(z.string(), z.array(z.string())).default({}),
});

export type GamesData = z.infer<typeof schema>;

const empty = (): GamesData => schema.parse({});

interface GamesState {
  data: GamesData;
  status: "idle" | "loading" | "ready";
  load: () => Promise<void>;
  update: (mutate: (current: GamesData) => GamesData) => void;
}

let writeQueue: Promise<void> = Promise.resolve();

/** Рекорды игр и отгаданные головоломки. Хранятся одним ключом в CloudStorage. */
export const useGames = create<GamesState>((set, get) => ({
  data: empty(),
  status: "idle",
  async load() {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const raw = await getStorage().get(KEY);
      const parsed = raw ? schema.safeParse(JSON.parse(raw)) : null;
      set({ data: parsed?.success ? parsed.data : empty(), status: "ready" });
    } catch {
      set({ data: empty(), status: "ready" });
    }
  },
  update(mutate) {
    const next = mutate(get().data);
    set({ data: next });
    let value = JSON.stringify(next);
    if (value.length > 4000) {
      // Отгаданных головоломок слишком много — храним рекорды, а список отгаданного укорачиваем.
      value = JSON.stringify({ ...next, puzzles: {} });
    }
    writeQueue = writeQueue
      .then(() => getStorage().set(KEY, value))
      .catch((error: unknown) => console.warn("Не удалось сохранить рекорды", error));
  },
}));
