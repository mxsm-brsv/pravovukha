"use client";

import { create } from "zustand";
import { getEnvironment, getTelegramUser, supports } from "@/tma/telegram";

export interface EnvUser {
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
}

interface EnvState {
  /** false при статической сборке и до первого эффекта на клиенте. */
  ready: boolean;
  inTelegram: boolean;
  version: string | null;
  platform: string | null;
  user: EnvUser | null;
  hapticsAvailable: boolean;
  /** Прогресс уходит в CloudStorage (Telegram 6.9+), иначе — в localStorage браузера. */
  cloudStorageAvailable: boolean;
  init: () => void;
}

/**
 * Сведения о том, где открыто приложение. Читаются один раз после загрузки страницы:
 * при статическом экспорте window ещё нет, поэтому до init() всё считается «неизвестным».
 */
export const useEnvStore = create<EnvState>((set, get) => ({
  ready: false,
  inTelegram: false,
  version: null,
  platform: null,
  user: null,
  hapticsAvailable: false,
  cloudStorageAvailable: false,

  init() {
    if (get().ready) return;
    const env = getEnvironment();
    const tgUser = getTelegramUser();
    set({
      ready: true,
      inTelegram: env.inTelegram,
      version: env.version,
      platform: env.platform,
      hapticsAvailable: supports("haptics"),
      cloudStorageAvailable: supports("cloudStorage"),
      user: tgUser
        ? {
            firstName: tgUser.first_name,
            lastName: tgUser.last_name ?? null,
            username: tgUser.username ?? null,
            photoUrl: tgUser.photo_url ?? null,
          }
        : null,
    });
  },
}));
