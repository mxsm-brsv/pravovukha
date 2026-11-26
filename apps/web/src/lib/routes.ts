/** Корни вкладок: на них нет кнопки «Назад», зато видна нижняя панель. */
export const TAB_ROOTS = ["/", "/learn", "/play", "/profile"] as const;
export type TabRoot = (typeof TAB_ROOTS)[number];

/** usePathname отдаёт путь без basePath; убираем завершающий слеш, кроме корня. */
export function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function isTabRoot(pathname: string | null): boolean {
  return (TAB_ROOTS as readonly string[]).includes(normalizePath(pathname));
}

/** «Назад» ведёт на уровень выше: /profile/goal → /profile. */
export function parentPath(pathname: string | null): string {
  const path = normalizePath(pathname);
  if (path === "/") return "/";
  const parent = path.slice(0, path.lastIndexOf("/"));
  return parent === "" ? "/" : parent;
}

/** Ссылки в статическом экспорте заканчиваются слешем. */
export function href(path: string): string {
  return path === "/" ? "/" : `${normalizePath(path)}/`;
}
