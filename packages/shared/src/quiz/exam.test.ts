import { describe, expect, it } from "vitest";
import { EXAM_RULES, examAnswer, startExam } from "./exam";

const run = (answers: boolean[]) => {
  let s = startExam(0);
  for (const a of answers) s = examAnswer(s, a, 1000);
  return s;
};

describe("экзамен", () => {
  it("20 верных — сдан", () => {
    expect(run(Array(20).fill(true)).status).toBe("passed");
  });
  it("ошибка добавляет пять вопросов и пять минут", () => {
    const s = run([false]);
    expect(s.total).toBe(25);
    expect(s.deadline).toBe((EXAM_RULES.minutes + 5) * 60_000);
  });
  it("три ошибки — не сдан", () => {
    expect(run([false, false, false]).status).toBe("failed");
  });
  it("ошибка в дополнительных вопросах — не сдан", () => {
    const answers = [false, ...Array(19).fill(true), false];
    const s = run(answers);
    expect(s.status).toBe("failed");
    expect(s.reason).toBe("extra");
  });
  it("две ошибки и все дополнительные верно — сдан", () => {
    const s = run([false, false, ...Array(18).fill(true), ...Array(10).fill(true)]);
    expect(s.status).toBe("passed");
  });
});
