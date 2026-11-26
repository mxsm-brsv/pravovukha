"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { spring } from "@/motion/presets";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Нижняя шторка поверх экрана: заголовок, содержимое, закрытие тапом по фону. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-[560px] rounded-t-3xl bg-app px-4 pt-3"
            style={{ paddingBottom: "calc(var(--app-safe-bottom) + 16px)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring.snappy}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-hint/40" />
            <h2 className="mb-3 px-1 text-[20px] font-semibold text-fg">{title}</h2>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
