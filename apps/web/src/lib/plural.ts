/**
 * Русское склонение после числа: plural(1, "день", "дня", "дней") → «1 день»,
 * plural(3, …) → «3 дня», plural(11, …) → «11 дней».
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export const days = (n: number) => plural(n, "день", "дня", "дней");
export const questions = (n: number) => plural(n, "вопрос", "вопроса", "вопросов");
