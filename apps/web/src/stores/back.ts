"use client";

import { useEffect } from "react";
import { create } from "zustand";

interface BackState {
  target: string | null;
  set: (target: string | null) => void;
}

/** Куда ведёт «Назад», если не на уровень выше: из тренировки — обратно в колоду. */
export const useBackStore = create<BackState>((set) => ({
  target: null,
  set: (target) => set({ target }),
}));

export function useBackTo(target: string | null): void {
  useEffect(() => {
    useBackStore.getState().set(target);
    return () => useBackStore.getState().set(null);
  }, [target]);
}
