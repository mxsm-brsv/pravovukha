"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { href as toHref } from "@/lib/routes";
import { haptic } from "@/tma/haptics";
import { Icon, type IconName } from "./Icon";

/** Цвета плашек под иконками, как в настройках Telegram. */
const ICON_TONES = {
  blue: "bg-[#2f88f0]",
  orange: "bg-[#f09a37]",
  green: "bg-[#34c759]",
  violet: "bg-[#8e6cf0]",
  red: "bg-[#ef5b5b]",
  gray: "bg-[#8e8e93]",
  teal: "bg-[#2fb5c7]",
} as const;

export type IconTone = keyof typeof ICON_TONES;

interface CellBaseProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: IconName;
  iconTone?: IconTone;
  /** Значение справа: «20 вопросов», переключатель, галочка. */
  after?: ReactNode;
  chevron?: boolean;
  className?: string;
}

type CellProps =
  | (CellBaseProps & { href: string; onClick?: never; role?: never; selected?: never; disabled?: never })
  | (CellBaseProps & {
      href?: never;
      onClick: () => void;
      role?: "button" | "radio" | "switch";
      selected?: boolean;
      disabled?: boolean;
    })
  | (CellBaseProps & { href?: never; onClick?: never; role?: never; selected?: never; disabled?: never });

function CellContent({ title, subtitle, icon, iconTone = "blue", after, chevron }: CellBaseProps) {
  return (
    <>
      {icon && (
        <span
          className={cx(
            "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-white",
            ICON_TONES[iconTone],
          )}
        >
          <Icon name={icon} size={18} strokeWidth={2.2} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[17px] leading-snug text-fg">{title}</span>
        {subtitle && <span className="mt-0.5 block text-[14px] leading-snug text-hint">{subtitle}</span>}
      </span>
      {after !== undefined && <span className="shrink-0 text-[17px] text-hint">{after}</span>}
      {chevron && <Icon name="chevronRight" size={18} className="shrink-0 text-hint opacity-70" />}
    </>
  );
}

const rowClass = "flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left";

/** Строка списка: ссылка, кнопка или просто строка со значением. */
export function Cell(props: CellProps) {
  const { className } = props;

  if (props.href !== undefined) {
    return (
      <Link href={toHref(props.href)} onClick={() => haptic.tap()} className={cx(rowClass, "pressable", className)}>
        <CellContent {...props} chevron={props.chevron ?? true} />
      </Link>
    );
  }

  if (props.onClick !== undefined) {
    const role = props.role ?? "button";
    return (
      <button
        type="button"
        role={role === "button" ? undefined : role}
        aria-checked={role === "button" ? undefined : Boolean(props.selected)}
        disabled={props.disabled}
        onClick={props.onClick}
        className={cx(rowClass, "pressable disabled:opacity-50", className)}
      >
        <CellContent {...props} />
      </button>
    );
  }

  return (
    <div className={cx(rowClass, className)}>
      <CellContent {...props} />
    </div>
  );
}
