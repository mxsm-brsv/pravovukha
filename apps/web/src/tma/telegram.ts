import type { WebApp, WebAppUser } from "telegram-web-app";

/**
 * Тонкая обёртка над официальным telegram-web-app.js.
 * Скрипт подключается в app/layout.tsx; в браузере он тоже создаёт объект WebApp,
 * но с пустым initData — так мы отличаем запуск внутри Telegram от отладки в браузере.
 */

/** Минимальные версии Bot API для возможностей, которыми пользуемся. */
export const FEATURE_VERSION = {
  backButton: "6.1",
  haptics: "6.1",
  headerColor: "6.1",
  cloudStorage: "6.9",
  verticalSwipes: "7.7",
  bottomBar: "7.10",
  fullscreen: "8.0",
} as const;

export function getWebApp(): WebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function isInTelegram(): boolean {
  const wa = getWebApp();
  return wa !== null && wa.initData.length > 0;
}

export function supports(feature: keyof typeof FEATURE_VERSION): boolean {
  const wa = getWebApp();
  return wa !== null && isInTelegram() && wa.isVersionAtLeast(FEATURE_VERSION[feature]);
}

export function getTelegramUser(): WebAppUser | null {
  return isInTelegram() ? (getWebApp()?.initDataUnsafe.user ?? null) : null;
}

export function getStartParam(): string | null {
  return isInTelegram() ? (getWebApp()?.initDataUnsafe.start_param ?? null) : null;
}

export function getEnvironment(): { inTelegram: boolean; version: string | null; platform: string | null } {
  const wa = getWebApp();
  const inTelegram = isInTelegram();
  return {
    inTelegram,
    version: inTelegram && wa ? wa.version : null,
    platform: inTelegram && wa ? wa.platform : null,
  };
}

export function currentColorScheme(): "light" | "dark" {
  const wa = getWebApp();
  if (wa && isInTelegram()) return wa.colorScheme;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}
