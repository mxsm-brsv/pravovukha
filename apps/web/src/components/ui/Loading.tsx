import { Icon } from "./Icon";

/** Заглушка, пока грузится банк вопросов или прогресс. */
export function Loading({ text = "Загружаем вопросы…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-hint">
      <Icon name="book" size={28} className="animate-pulse" />
      <p className="text-[15px]">{text}</p>
    </div>
  );
}

export function LoadError({ message }: { message: string | null }) {
  return (
    <div className="rounded-2xl bg-section p-4 text-[15px] leading-snug text-fg">
      Не получилось загрузить вопросы. Проверьте интернет и откройте приложение ещё раз.
      {message && <span className="mt-1 block text-[13px] text-hint">{message}</span>}
    </div>
  );
}
