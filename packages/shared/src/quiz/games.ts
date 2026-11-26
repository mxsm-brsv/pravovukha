/**
 * Правила игровых режимов по Положению о конкурсе «Ты — лидер» МЭИ.
 *
 * «2 к 1» — у команды пять права на ошибку, после шестой ошибки она выбывает.
 * «Правовой биатлон» — вопрос читают дважды, на ответ несколько секунд; ошибся — выбыл.
 */
export const TWO_TO_ONE = { lives: 5 } as const;

export const BIATHLON = {
  /** Время на ответ после «второго прочтения»: секунды на формат. */
  seconds: { yn: 8, mc: 12, wr: 25 },
  /** Пауза на чтение вопроса: столько символов в секунду. */
  readingCharsPerSecond: 18,
  minReading: 3,
  maxReading: 12,
} as const;

export function biathlonReadingSeconds(questionLength: number): number {
  const raw = Math.ceil(questionLength / BIATHLON.readingCharsPerSecond);
  return Math.min(BIATHLON.maxReading, Math.max(BIATHLON.minReading, raw));
}
