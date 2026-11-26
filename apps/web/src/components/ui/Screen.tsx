import type { ReactNode } from "react";

interface ScreenProps {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * Каркас экрана: отступы под шапку Telegram и под нижнюю панель,
 * крупный заголовок, ширина колонки ограничена для планшетов и десктопа.
 */
export function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <main
      className="mx-auto w-full max-w-[560px] px-4"
      style={{
        paddingTop: "calc(var(--app-safe-top) + var(--app-back-offset) + 20px)",
        paddingBottom: "calc(var(--app-safe-bottom) + 96px)",
      }}
    >
      {(title || subtitle) && (
        <header className="mb-5 px-1">
          {title && <h1 className="text-[28px] leading-tight font-bold tracking-tight text-fg">{title}</h1>}
          {subtitle && <p className="mt-1 text-[15px] leading-snug text-hint">{subtitle}</p>}
        </header>
      )}
      <div className="flex flex-col gap-6">{children}</div>
    </main>
  );
}
