"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useMainButtonStore } from "@/stores/mainButton";

interface Options {
  text: string;
  onClick: () => void;
  visible?: boolean;
  enabled?: boolean;
  loading?: boolean;
}

/**
 * Показывает главную кнопку экрана («Начать», «Проверить», «Сохранить»)
 * и убирает её, когда экран уходит.
 */
export function useMainButton({ text, onClick, visible = true, enabled = true, loading = false }: Options): void {
  const owner = useRef(Symbol("main-button")).current;
  const handler = useRef(onClick);

  useLayoutEffect(() => {
    handler.current = onClick;
  }, [onClick]);

  useEffect(() => {
    const { show, release } = useMainButtonStore.getState();
    if (!visible) {
      release(owner);
      return;
    }
    show({ owner, text, enabled, loading, onClick: () => handler.current() });
  }, [owner, text, visible, enabled, loading]);

  useEffect(() => () => useMainButtonStore.getState().release(owner), [owner]);
}
