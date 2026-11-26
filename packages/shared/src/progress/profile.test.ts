import { describe, expect, it } from "vitest";
import {
  CLOUD_KEY_RE,
  CLOUD_VALUE_LIMIT,
  PROFILE_STORAGE_KEY,
  answeredToday,
  defaultProfile,
  parseProfile,
  serializeProfile,
} from "./profile";

describe("profile", () => {
  it("хранится под ключом, который принимает Telegram CloudStorage", () => {
    expect(PROFILE_STORAGE_KEY).toMatch(CLOUD_KEY_RE);
    expect("p:v1").not.toMatch(CLOUD_KEY_RE);
    expect("a".repeat(129)).not.toMatch(CLOUD_KEY_RE);
  });

  it("возвращает профиль по умолчанию для пустого и повреждённого значения", () => {
    expect(parseProfile(null)).toEqual(defaultProfile());
    expect(parseProfile("")).toEqual(defaultProfile());
    expect(parseProfile("{не json")).toEqual(defaultProfile());
    expect(parseProfile(JSON.stringify({ v: 2 }))).toEqual(defaultProfile());
  });

  it("сохраняет и читает профиль без потерь", () => {
    const p = defaultProfile();
    p.settings.dailyGoal = 50;
    p.settings.haptics = false;
    p.streak = { current: 3, best: 7, lastActiveDay: "2026-11-25" };
    p.today = { day: "2026-11-25", answered: 12 };
    expect(parseProfile(serializeProfile(p))).toEqual(p);
  });

  it("отклоняет неизвестную дневную цель и несуществующий день", () => {
    const p = defaultProfile() as unknown as { settings: { dailyGoal: number } };
    p.settings.dailyGoal = 17;
    expect(parseProfile(JSON.stringify(p))).toEqual(defaultProfile());

    const q = defaultProfile();
    expect(parseProfile(JSON.stringify({ ...q, today: { day: "2026-02-30", answered: 1 } }))).toEqual(defaultProfile());
  });

  it("укладывается в лимит одного значения CloudStorage", () => {
    expect(serializeProfile(defaultProfile()).length).toBeLessThan(CLOUD_VALUE_LIMIT);
  });

  it("считает пройденное сегодня только для сегодняшнего дня", () => {
    const p = defaultProfile();
    p.today = { day: "2026-11-25", answered: 8 };
    expect(answeredToday(p, "2026-11-25")).toBe(8);
    expect(answeredToday(p, "2026-11-26")).toBe(0);
  });
});
