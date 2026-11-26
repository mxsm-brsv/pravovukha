"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { href, isTabRoot, normalizePath, type TabRoot } from "@/lib/routes";
import { spring } from "@/motion/presets";
import { useMainButtonStore } from "@/stores/mainButton";
import { haptic } from "@/tma/haptics";
import { Icon, type IconName } from "./ui/Icon";

const TABS: ReadonlyArray<{ path: TabRoot; label: string; icon: IconName }> = [
  { path: "/", label: "Главная", icon: "home" },
  { path: "/learn", label: "Учить", icon: "book" },
  { path: "/play", label: "Играть", icon: "puzzle" },
  { path: "/profile", label: "Профиль", icon: "user" },
];

/** К какой вкладке относится экран: /profile/goal подсвечивает «Профиль». */
function activeTab(pathname: string): TabRoot {
  const path = normalizePath(pathname);
  const match = TABS.find((tab) => tab.path !== "/" && (path === tab.path || path.startsWith(`${tab.path}/`)));
  return match?.path ?? "/";
}

/**
 * Нижняя панель вкладок. Видна только на корневых экранах и прячется,
 * когда экран показывает главную кнопку Telegram, чтобы они не спорили за низ экрана.
 */
export function TabBar() {
  const pathname = usePathname();
  const mainButtonShown = useMainButtonStore((s) => s.config !== null);
  const visible = isTabRoot(pathname) && !mainButtonShown;
  const current = activeTab(pathname);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.nav
          key="tab-bar"
          aria-label="Разделы"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-separator bg-[color-mix(in_srgb,var(--app-section)_88%,transparent)] backdrop-blur-xl"
          style={{ paddingBottom: "var(--app-safe-bottom)" }}
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={spring.snappy}
        >
          <ul className="mx-auto flex max-w-[560px] px-2">
            {TABS.map((tab) => {
              const active = tab.path === current;
              return (
                <li key={tab.path} className="flex-1">
                  <Link
                    href={href(tab.path)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      if (!active) haptic.select();
                    }}
                    className={cx(
                      "relative flex h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                      active ? "text-button" : "text-hint",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="tab-indicator"
                        className="absolute top-1.5 h-8 w-14 rounded-full bg-[color-mix(in_srgb,var(--app-button)_14%,transparent)]"
                        transition={spring.snappy}
                      />
                    )}
                    <Icon name={tab.icon} size={24} strokeWidth={active ? 2.3 : 2} className="relative" />
                    <span className="relative">{tab.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
