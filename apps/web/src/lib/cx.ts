/** Склеивает классы, пропуская пустые и ложные значения. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
