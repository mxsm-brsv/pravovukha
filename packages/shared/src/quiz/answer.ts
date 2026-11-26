/**
 * Проверка вписанного ответа. Сравниваем без учёта регистра, ё/е, кавычек и знаков
 * препинания. В словах длиннее пяти букв прощаем одну опечатку, в длинных — две;
 * ответы с цифрами должны совпасть точно.
 */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"'“”„`.,;:!?()[\]\-–—…/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      cur.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return limit + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

function allowedTypos(answer: string): number {
  if (/\d/.test(answer)) return 0;
  const letters = answer.replace(/\s/g, "").length;
  if (letters >= 12) return 2;
  if (letters >= 6) return 1;
  return 0;
}

export function isWrittenAnswerCorrect(input: string, accepted: readonly string[]): boolean {
  const given = normalizeAnswer(input);
  if (!given) return false;
  return accepted.some((option) => {
    const target = normalizeAnswer(option);
    if (!target) return false;
    if (given === target) return true;
    const typos = allowedTypos(target);
    return typos > 0 && distance(given, target, typos) <= typos;
  });
}
