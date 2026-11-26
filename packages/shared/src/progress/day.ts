/**
 * Календарный день пользователя в виде строки YYYY-MM-DD.
 * Серия дней и дневная цель считаются по местному времени устройства,
 * поэтому день берём из локальных геттеров Date, а не из UTC.
 */
export type DayKey = string;

const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isDayKey(value: string): value is DayKey {
  const match = DAY_KEY_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return dayKey(date) === value;
}

/** Сдвиг дня на delta суток (может быть отрицательным). */
export function addDays(key: DayKey, delta: number): DayKey {
  const match = DAY_KEY_RE.exec(key);
  if (!match) throw new Error(`Некорректный день: ${key}`);
  const [, y, m, d] = match;
  // Полдень исключает сдвиги из-за перехода на летнее время.
  const date = new Date(Number(y), Number(m) - 1, Number(d), 12);
  date.setDate(date.getDate() + delta);
  return dayKey(date);
}
