import type { Transition } from "motion/react";

/**
 * Пружины и переходы в одном месте, чтобы движение во всём приложении
 * ощущалось одинаково. Если пользователь включил «Меньше анимации»,
 * MotionConfig в Providers отключает перемещения, оставляя только прозрачность.
 */
export const spring = {
  /** Кнопки, переключатели, индикатор вкладок: быстро и без отскока. */
  snappy: { type: "spring", stiffness: 520, damping: 40, mass: 0.9 },
  /** Смена экранов, появление карточек. */
  soft: { type: "spring", stiffness: 280, damping: 32 },
  /** Верный ответ, решённая головоломка: с лёгким отскоком. */
  bouncy: { type: "spring", stiffness: 420, damping: 20 },
} satisfies Record<string, Transition>;

export const fade = { duration: 0.18, ease: [0.2, 0, 0, 1] } satisfies Transition;
