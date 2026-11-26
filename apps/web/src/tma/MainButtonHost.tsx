"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { spring } from "@/motion/presets";
import { useMainButtonStore } from "@/stores/mainButton";
import { getWebApp, isInTelegram } from "./telegram";

/**
 * Внутри Telegram управляет нативной MainButton, в браузере рисует запасную кнопку
 * того же вида внизу экрана — так экраны можно отлаживать без телефона.
 */
export function MainButtonHost() {
  const config = useMainButtonStore((s) => s.config);
  const [inTelegram, setInTelegram] = useState(false);

  useEffect(() => setInTelegram(isInTelegram()), []);

  useEffect(() => {
    if (!inTelegram) return;
    const wa = getWebApp();
    if (!wa) return;
    const button = wa.MainButton;

    if (!config) {
      button.hideProgress();
      button.hide();
      return;
    }

    button.setParams({
      text: config.text,
      is_visible: true,
      is_active: config.enabled && !config.loading,
      color: wa.themeParams.button_color ?? undefined,
      text_color: wa.themeParams.button_text_color ?? undefined,
    });
    if (config.loading) button.showProgress(false);
    else button.hideProgress();

    const onClick = () => {
      if (config.enabled && !config.loading) config.onClick();
    };
    button.onClick(onClick);
    return () => {
      button.offClick(onClick);
    };
  }, [config, inTelegram]);

  if (inTelegram) return null;

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          key="main-button"
          className="fixed inset-x-0 bottom-0 z-40 px-4 pt-2"
          style={{ paddingBottom: "calc(var(--app-safe-bottom) + 12px)" }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={spring.snappy}
        >
          <motion.button
            type="button"
            disabled={!config.enabled || config.loading}
            onClick={config.onClick}
            whileTap={{ scale: 0.98 }}
            className="h-12 w-full rounded-xl bg-button font-semibold text-button-fg transition-opacity disabled:opacity-50"
          >
            {config.loading ? "Сохраняю…" : config.text}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
