import { addDays, type DayKey } from "./day";

export interface Streak {
  /** Длина серии на день lastActiveDay. */
  current: number;
  /** Лучшая серия за всё время. */
  best: number;
  /** Последний день, когда пользователь занимался. */
  lastActiveDay: DayKey | null;
}

export const emptyStreak: Streak = { current: 0, best: 0, lastActiveDay: null };

/**
 * Отмечает занятие в день today.
 * Повторное занятие в тот же день серию не меняет; занятие на следующий день
 * продлевает её; пропуск хотя бы одного дня начинает серию заново.
 */
export function registerActivity(streak: Streak, today: DayKey): Streak {
  if (streak.lastActiveDay === today) return streak;

  const continues = streak.lastActiveDay !== null && addDays(streak.lastActiveDay, 1) === today;
  const current = continues ? streak.current + 1 : 1;

  return {
    current,
    best: Math.max(streak.best, current),
    lastActiveDay: today,
  };
}

/**
 * Серия, которую показываем в интерфейсе на день today.
 * Если пользователь занимался сегодня или вчера, серия ещё жива;
 * если пропустил больше суток — показываем 0.
 */
export function visibleStreak(streak: Streak, today: DayKey): number {
  if (streak.lastActiveDay === null) return 0;
  if (streak.lastActiveDay === today) return streak.current;
  if (addDays(streak.lastActiveDay, 1) === today) return streak.current;
  return 0;
}
