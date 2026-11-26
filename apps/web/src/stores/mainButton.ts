"use client";

import { create } from "zustand";

export interface MainButtonConfig {
  owner: symbol;
  text: string;
  enabled: boolean;
  loading: boolean;
  onClick: () => void;
}

interface MainButtonState {
  config: MainButtonConfig | null;
  show: (config: MainButtonConfig) => void;
  release: (owner: symbol) => void;
}

/**
 * Главная кнопка одна на экран. Экран заявляет её через useMainButton,
 * а MainButtonHost показывает нативную кнопку Telegram или запасную кнопку в браузере.
 */
export const useMainButtonStore = create<MainButtonState>((set, get) => ({
  config: null,
  show: (config) => set({ config }),
  release: (owner) => {
    if (get().config?.owner === owner) set({ config: null });
  },
}));
