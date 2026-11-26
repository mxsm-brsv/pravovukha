/** Маленькое кольцо прогресса для строк списка. */
export function Ring({ value, size = 28 }: { value: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-hint/25" />
      {v > 0 && <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${c * v} ${c}`}
        className={v >= 1 ? "text-success" : "text-button"}
      />}
    </svg>
  );
}
