import { describe, expect, it } from "vitest";
import { isWrittenAnswerCorrect, normalizeAnswer } from "./answer";

describe("normalizeAnswer", () => {
  it("убирает регистр, ё, кавычки и знаки", () => {
    expect(normalizeAnswer("  «Единое ОКНО»! ")).toBe("единое окно");
    expect(normalizeAnswer("Ёлка")).toBe("елка");
  });
});

describe("isWrittenAnswerCorrect", () => {
  it("принимает любое написание из списка", () => {
    expect(isWrittenAnswerCorrect("ЦС профсоюза", ["центральный совет", "ЦС профсоюза"])).toBe(true);
  });
  it("прощает одну опечатку в длинном слове", () => {
    expect(isWrittenAnswerCorrect("сафаров", ["Сафаров"])).toBe(true);
    expect(isWrittenAnswerCorrect("сафоров", ["Сафаров"])).toBe(true);
    expect(isWrittenAnswerCorrect("сафонов", ["Сафаров"])).toBe(false);
  });
  it("числа сверяет точно", () => {
    expect(isWrittenAnswerCorrect("6", ["6", "шесть"])).toBe(true);
    expect(isWrittenAnswerCorrect("8", ["6", "шесть"])).toBe(false);
    expect(isWrittenAnswerCorrect("2:3", ["2:3"])).toBe(true);
  });
  it("пустой ответ не засчитывается", () => {
    expect(isWrittenAnswerCorrect("   ", ["6"])).toBe(false);
  });
});
