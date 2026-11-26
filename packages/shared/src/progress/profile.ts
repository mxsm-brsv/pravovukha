import { z } from "zod";
import { isDayKey } from "./day";
import { emptyStreak, registerActivity } from "./streak";

/**
 * Ключ профиля в Telegram CloudStorage. В ключах допустимы только A-Z, a-z, 0-9, _ и -
 * (1–128 символов), значение — до 4096 символов.
 */
export const PROFILE_STORAGE_KEY = "profile_v1";

export const CLOUD_KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;

/** Лимит длины значения в Telegram CloudStorage. */
export const CLOUD_VALUE_LIMIT = 4096;

/** Варианты дневной цели, вопросов в день. */
export const DAILY_GOALS = [10, 20, 30, 50] as const;
export type DailyGoal = (typeof DAILY_GOALS)[number];
export const DEFAULT_DAILY_GOAL: DailyGoal = 20;

const dayKeySchema = z.string().refine(isDayKey, "Ожидается день в формате YYYY-MM-DD");

const dailyGoalSchema = z
  .number()
  .int()
  .refine((n): n is DailyGoal => (DAILY_GOALS as readonly number[]).includes(n), "Неизвестная дневная цель");

export const profileSchema = z.object({
  v: z.literal(1),
  settings: z.object({
    haptics: z.boolean(),
    reduceMotion: z.boolean(),
    dailyGoal: dailyGoalSchema,
  }),
  streak: z.object({
    current: z.number().int().min(0),
    best: z.number().int().min(0),
    lastActiveDay: dayKeySchema.nullable(),
  }),
  today: z.object({
    day: dayKeySchema.nullable(),
    answered: z.number().int().min(0),
  }),
});

export type Profile = z.infer<typeof profileSchema>;
export type Settings = Profile["settings"];

export function defaultProfile(): Profile {
  return {
    v: 1,
    settings: { haptics: true, reduceMotion: false, dailyGoal: DEFAULT_DAILY_GOAL },
    streak: { ...emptyStreak },
    today: { day: null, answered: 0 },
  };
}

/**
 * Разбирает сохранённый профиль. Пустое, повреждённое или устаревшее значение
 * не ломает приложение: возвращается профиль по умолчанию.
 */
export function parseProfile(raw: string | null | undefined): Profile {
  if (!raw) return defaultProfile();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return defaultProfile();
  }
  const result = profileSchema.safeParse(json);
  return result.success ? result.data : defaultProfile();
}

export function serializeProfile(profile: Profile): string {
  const value = JSON.stringify(profileSchema.parse(profile));
  if (value.length > CLOUD_VALUE_LIMIT) {
    throw new Error(`Профиль занимает ${value.length} символов — больше лимита CloudStorage (${CLOUD_VALUE_LIMIT})`);
  }
  return value;
}

/** Сколько вопросов пройдено сегодня; вчерашний счётчик сегодня не считается. */
export function answeredToday(profile: Profile, today: string): number {
  return profile.today.day === today ? profile.today.answered : 0;
}

/**
 * Учитывает ответы: увеличивает счётчик дня (вчерашний сбрасывается) и продлевает серию.
 */
export function registerAnswers(profile: Profile, today: string, count = 1): Profile {
  const answered = answeredToday(profile, today) + count;
  return {
    ...profile,
    today: { day: today, answered },
    streak: registerActivity(profile.streak, today),
  };
}
