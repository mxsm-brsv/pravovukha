"use client";

import { deepLinkPath, parseStartParam } from "@pravovukha/shared";
import { MotionConfig } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useEnvStore } from "@/stores/env";
import { useProfileStore } from "@/stores/profile";
import { BackButtonController } from "@/tma/BackButtonController";
import { MainButtonHost } from "@/tma/MainButtonHost";
import { currentColorScheme, getStartParam, getWebApp, isInTelegram, supports } from "@/tma/telegram";
import type { WebApp } from "telegram-web-app";
import { TabBar } from "./TabBar";

function applyScheme(): void {
  document.documentElement.dataset.scheme = currentColorScheme();
}

/** Шапка, фон и нижняя панель Telegram красятся в цвет фона приложения. */
function paintTelegramChrome(wa: WebApp): void {
  if (supports("headerColor")) {
    wa.setHeaderColor("secondary_bg_color");
    wa.setBackgroundColor("secondary_bg_color");
  }
  if (supports("bottomBar")) wa.setBottomBarColor("secondary_bg_color");
}

/**
 * Связывает тему приложения с темой Telegram (или системы, если открыто в браузере)
 * и сообщает Telegram, что приложение готово к показу.
 */
function ThemeBridge() {
  useEffect(() => {
    applyScheme();
    const wa = getWebApp();

    if (wa && isInTelegram()) {
      paintTelegramChrome(wa);
      wa.ready();
      wa.expand();
      const onThemeChanged = () => {
        applyScheme();
        paintTelegramChrome(wa);
      };
      wa.onEvent("themeChanged", onThemeChanged);
      return () => wa.offEvent("themeChanged", onThemeChanged);
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyScheme);
    return () => media.removeEventListener("change", applyScheme);
  }, []);

  return null;
}

// Ссылка t.me/<бот>?startapp=… обрабатывается один раз за запуск,
// а не при каждом повторном монтировании в StrictMode.
let startParamHandled = false;

/** Открывает экран из параметра startapp, например ?startapp=goal → «Дневная цель». */
function StartParamRouter() {
  const router = useRouter();

  useEffect(() => {
    if (startParamHandled) return;
    startParamHandled = true;
    const path = deepLinkPath(parseStartParam(getStartParam()));
    if (path !== "/") router.replace(path);
  }, [router]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const reduceMotion = useProfileStore((s) => s.profile.settings.reduceMotion);

  useEffect(() => {
    useEnvStore.getState().init();
    void useProfileStore.getState().load();
  }, []);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <ThemeBridge />
      <StartParamRouter />
      <BackButtonController />
      {children}
      <TabBar />
      <MainButtonHost />
    </MotionConfig>
  );
}
