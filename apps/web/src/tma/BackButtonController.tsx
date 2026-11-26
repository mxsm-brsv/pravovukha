"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { href, isTabRoot, parentPath } from "@/lib/routes";
import { haptic } from "./haptics";
import { getWebApp, isInTelegram, supports } from "./telegram";

/**
 * Кнопка «Назад» Telegram синхронизирована с роутером: видна на вложенных экранах
 * и ведёт на уровень выше. В браузере вместо неё — стрелка в левом верхнем углу.
 */
export function BackButtonController() {
  const pathname = usePathname();
  const router = useRouter();
  const [native, setNative] = useState(false);
  const visible = !isTabRoot(pathname);

  useEffect(() => setNative(supports("backButton")), []);

  const goBack = useCallback(() => {
    haptic.tap();
    router.push(href(parentPath(pathname)));
  }, [pathname, router]);

  useEffect(() => {
    if (!native) return;
    const button = getWebApp()?.BackButton;
    if (!button) return;
    if (!visible) {
      button.hide();
      return;
    }
    button.show();
    button.onClick(goBack);
    return () => {
      button.offClick(goBack);
    };
  }, [native, visible, goBack]);

  const showFallback = !native && visible && !isInTelegram();

  // Запасная стрелка занимает место над заголовком — Screen сдвигает содержимое вниз.
  useEffect(() => {
    const root = document.documentElement;
    if (showFallback) root.dataset.fallbackBack = "";
    else delete root.dataset.fallbackBack;
    return () => {
      delete root.dataset.fallbackBack;
    };
  }, [showFallback]);

  if (!showFallback) return null;

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Назад"
      className="fixed left-3 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-section text-link shadow-sm"
      style={{ top: "calc(var(--app-safe-top) + 10px)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
