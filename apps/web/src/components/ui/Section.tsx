import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

interface SectionProps {
  header?: ReactNode;
  footer?: ReactNode;
  /** Карточка без внутренних разделителей, с отступами (для произвольного содержимого). */
  padded?: boolean;
  className?: string;
  /** Для списка вариантов: role="radiogroup" и подпись для экранного диктора. */
  role?: "radiogroup" | "list";
  label?: string;
  children: ReactNode;
}

/** Группа ячеек в стиле настроек Telegram: подпись сверху, скруглённый блок, пояснение снизу. */
export function Section({ header, footer, padded = false, className, role, label, children }: SectionProps) {
  return (
    <section className={className}>
      {header && <h2 className="mb-1.5 px-4 text-[13px] font-medium tracking-wide text-hint uppercase">{header}</h2>}
      <div
        role={role}
        aria-label={label}
        className={cx(
          "overflow-hidden rounded-2xl bg-section",
          padded ? "p-4" : "divide-y divide-separator",
        )}
      >
        {children}
      </div>
      {footer && <p className="mt-1.5 px-4 text-[13px] leading-snug text-hint">{footer}</p>}
    </section>
  );
}
