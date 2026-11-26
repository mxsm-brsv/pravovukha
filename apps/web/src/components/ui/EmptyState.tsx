import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

/** Экран-заглушка для раздела, где пока нет содержимого: честно говорит, что будет и когда. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[color-mix(in_srgb,var(--app-button)_14%,transparent)] text-button">
        <Icon name={icon} size={32} />
      </span>
      <h2 className="text-[20px] font-semibold text-fg">{title}</h2>
      {children && <div className="mt-2 max-w-[340px] text-[15px] leading-relaxed text-hint">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
