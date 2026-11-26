import { describe, expect, it } from "vitest";
import { deckStats, nextLevel, parseDeckProgress, pickSession, serializeDeckProgress } from "./progress";
import { seededRandom } from "./random";

describe("прогресс колоды", () => {
  it("сериализуется и читается обратно", () => {
    const map = parseDeckProgress("12.2,15.1,7.3");
    expect(map.get(15)).toBe(1);
    expect(serializeDeckProgress(map)).toBe("7.3,12.2,15.1");
  });
  it("игнорирует мусор", () => {
    expect(parseDeckProgress("x,12.9,13.2,,").size).toBe(1);
  });
  it("уровни меняются по ответам", () => {
    expect(nextLevel(0, true)).toBe(2);
    expect(nextLevel(2, true)).toBe(3);
    expect(nextLevel(3, false)).toBe(1);
    expect(nextLevel(1, true)).toBe(2);
  });
  it("подход начинается с ошибок, потом новые", () => {
    const progress = parseDeckProgress("1.3,2.1,3.2");
    const session = pickSession([1, 2, 3, 4, 5], progress, 3, seededRandom(1));
    expect(session[0]).toBe(2);
    expect(new Set(session.slice(1))).toEqual(new Set([4, 5]));
  });
  it("статистика", () => {
    const s = deckStats([1, 2, 3, 4], parseDeckProgress("1.3,2.1,3.2"));
    expect(s).toEqual({ total: 4, known: 2, learned: 1, mistakes: 1, fresh: 1 });
  });
});
