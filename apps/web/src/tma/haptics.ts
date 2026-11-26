import { useProfileStore } from "@/stores/profile";
import { getWebApp, supports } from "./telegram";

/**
 * Виброотклик по правилам из архитектурного документа.
 * Компоненты вызывают смысловые методы (correct, wrong, pick…), а не сырые API Telegram,
 * чтобы ощущение от одинаковых действий было одинаковым во всех режимах и головоломках.
 * Если пользователь выключил вибрацию в профиле, методы ничего не делают.
 */
function feedback() {
  if (!supports("haptics")) return null;
  if (!useProfileStore.getState().profile.settings.haptics) return null;
  return getWebApp()?.HapticFeedback ?? null;
}

export const haptic = {
  /** Выбор варианта, шаг ползунка, переключение вкладки. */
  select: () => feedback()?.selectionChanged(),
  /** Лёгкое касание: переключатель, второстепенная кнопка. */
  tap: () => feedback()?.impactOccurred("light"),
  /** Верный ответ, сохранение прошло. */
  correct: () => feedback()?.notificationOccurred("success"),
  /** Неверный ответ. */
  wrong: () => feedback()?.notificationOccurred("error"),
  /** Осталась одна жизнь или одна допустимая ошибка. */
  warning: () => feedback()?.notificationOccurred("warning"),
  /** Карточку взяли (drag-and-drop). */
  pick: () => feedback()?.impactOccurred("medium"),
  /** Карточку положили. */
  drop: () => feedback()?.impactOccurred("light"),
  /** Пройден порог свайпа. */
  swipeThreshold: () => feedback()?.impactOccurred("rigid"),
  /** Последние секунды таймера, раз в секунду. */
  tick: () => feedback()?.impactOccurred("soft"),
  /** Головоломка решена, экзамен сдан. */
  solved: () => {
    const hf = feedback();
    if (!hf) return;
    hf.notificationOccurred("success");
    window.setTimeout(() => feedback()?.impactOccurred("heavy"), 140);
  },
};
