import { describe, expect, it } from "vitest";
import { addDays, dayKey, isDayKey } from "./day";
import { emptyStreak, registerActivity, visibleStreak } from "./streak";

describe("day", () => {
  it("формирует ключ по местной дате", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("сдвигает день через границы месяца и года", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("проверяет формат и существование дня", () => {
    expect(isDayKey("2026-11-26")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("26-11-2026")).toBe(false);
  });
});

describe("streak", () => {
  it("начинает серию с первого занятия", () => {
    expect(registerActivity(emptyStreak, "2026-11-26")).toEqual({
      current: 1,
      best: 1,
      lastActiveDay: "2026-11-26",
    });
  });

  it("не меняет серию при повторном занятии в тот же день", () => {
    const s = registerActivity(emptyStreak, "2026-11-26");
    expect(registerActivity(s, "2026-11-26")).toBe(s);
  });

  it("продлевает серию на следующий день, в том числе через смену месяца", () => {
    let s = registerActivity(emptyStreak, "2026-11-30");
    s = registerActivity(s, "2026-12-01");
    s = registerActivity(s, "2026-12-02");
    expect(s.current).toBe(3);
    expect(s.best).toBe(3);
  });

  it("сбрасывает серию после пропуска, но помнит лучшую", () => {
    let s = registerActivity(emptyStreak, "2026-11-01");
    s = registerActivity(s, "2026-11-02");
    s = registerActivity(s, "2026-11-04");
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });

  it("показывает живую серию сегодня и вчера, а после пропуска — ноль", () => {
    const s = registerActivity(registerActivity(emptyStreak, "2026-11-24"), "2026-11-25");
    expect(visibleStreak(s, "2026-11-25")).toBe(2);
    expect(visibleStreak(s, "2026-11-26")).toBe(2);
    expect(visibleStreak(s, "2026-11-27")).toBe(0);
    expect(visibleStreak(emptyStreak, "2026-11-27")).toBe(0);
  });
});
