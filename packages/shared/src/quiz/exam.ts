/**
 * Экзамен по образцу ПДД: 20 вопросов за 20 минут, не больше двух ошибок.
 * За каждую ошибку в основной части — пять дополнительных вопросов и пять минут.
 * В дополнительных вопросах ошибаться нельзя.
 */
export const EXAM_RULES = {
  base: 20,
  minutes: 20,
  maxErrors: 2,
  extraPerError: 5,
  extraMinutesPerError: 5,
} as const;

export interface ExamState {
  /** Сколько всего вопросов нужно ответить (растёт с ошибками). */
  total: number;
  answered: number;
  errors: number;
  /** Момент окончания в миллисекундах. */
  deadline: number;
  status: "running" | "passed" | "failed";
  reason?: "errors" | "extra" | "time";
}

export function startExam(now: number): ExamState {
  return {
    total: EXAM_RULES.base,
    answered: 0,
    errors: 0,
    deadline: now + EXAM_RULES.minutes * 60_000,
    status: "running",
  };
}

export function examAnswer(state: ExamState, correct: boolean, now: number): ExamState {
  if (state.status !== "running") return state;
  if (now > state.deadline) return { ...state, status: "failed", reason: "time" };

  const inExtra = state.answered >= EXAM_RULES.base;
  const answered = state.answered + 1;
  if (correct) {
    const done = answered >= state.total;
    return { ...state, answered, status: done ? "passed" : "running" };
  }

  if (inExtra) return { ...state, answered, errors: state.errors + 1, status: "failed", reason: "extra" };
  const errors = state.errors + 1;
  if (errors > EXAM_RULES.maxErrors) return { ...state, answered, errors, status: "failed", reason: "errors" };
  return {
    ...state,
    answered,
    errors,
    total: state.total + EXAM_RULES.extraPerError,
    deadline: state.deadline + EXAM_RULES.extraMinutesPerError * 60_000,
  };
}

export function examTimeout(state: ExamState, now: number): ExamState {
  if (state.status === "running" && now > state.deadline) return { ...state, status: "failed", reason: "time" };
  return state;
}
