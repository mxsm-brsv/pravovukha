import { CLOUD_VALUE_LIMIT } from "../progress/profile";
import { shuffle } from "./random";

/**
 * Прогресс по колоде: для каждого вопроса — уровень.
 * 0 — ещё не отвечал, 1 — ошибся (вопрос вернётся), 2 — ответил верно, 3 — выучен (верно дважды подряд).
 * В CloudStorage хранится строкой «12.2,15.1» под ключом p_<колода>; номер вопроса берётся из таблицы
 * и не меняется, поэтому прогресс переживает правки текста.
 */
export type Level = 0 | 1 | 2 | 3;
export type DeckProgress = Map<number, Level>;

export function deckProgressKey(deckId: string): string {
  return `p_${deckId}`;
}

export function parseDeckProgress(raw: string | null | undefined): DeckProgress {
  const map: DeckProgress = new Map();
  if (!raw) return map;
  for (const part of raw.split(",")) {
    const [id, level] = part.split(".");
    const n = Number(id);
    const l = Number(level);
    if (Number.isInteger(n) && n > 0 && (l === 1 || l === 2 || l === 3)) map.set(n, l);
  }
  return map;
}

export function serializeDeckProgress(progress: DeckProgress): string {
  const parts: string[] = [];
  for (const [id, level] of [...progress.entries()].sort((a, b) => a[0] - b[0])) {
    if (level > 0) parts.push(`${id}.${level}`);
  }
  const value = parts.join(",");
  if (value.length > CLOUD_VALUE_LIMIT) {
    throw new Error(`Прогресс колоды занимает ${value.length} символов — больше лимита CloudStorage`);
  }
  return value;
}

export function nextLevel(level: Level, correct: boolean): Level {
  if (!correct) return 1;
  if (level === 2 || level === 3) return 3;
  return 2;
}

export interface DeckStats {
  total: number;
  /** Ответил верно хотя бы раз и с тех пор не ошибался. */
  known: number;
  /** Ответил верно дважды подряд. */
  learned: number;
  /** Последний ответ был ошибкой. */
  mistakes: number;
  /** Ещё не встречались. */
  fresh: number;
}

export function deckStats(ids: readonly number[], progress: DeckProgress): DeckStats {
  const stats: DeckStats = { total: ids.length, known: 0, learned: 0, mistakes: 0, fresh: 0 };
  for (const id of ids) {
    const level = progress.get(id) ?? 0;
    if (level === 0) stats.fresh++;
    else if (level === 1) stats.mistakes++;
    else {
      stats.known++;
      if (level === 3) stats.learned++;
    }
  }
  return stats;
}

/**
 * Вопросы для подхода: сначала ошибки, потом новые, потом отвеченные один раз, потом выученные.
 * Внутри каждой группы порядок случайный.
 */
export function pickSession(
  ids: readonly number[],
  progress: DeckProgress,
  size: number,
  random: () => number = Math.random,
): number[] {
  const buckets: number[][] = [[], [], [], []];
  for (const id of ids) {
    const level = progress.get(id) ?? 0;
    const order = level === 1 ? 0 : level === 0 ? 1 : level === 2 ? 2 : 3;
    buckets[order]!.push(id);
  }
  return buckets.flatMap((bucket) => shuffle(bucket, random)).slice(0, size);
}
