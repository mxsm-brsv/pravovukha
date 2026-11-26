/** Путь к файлу из public/ с учётом адреса сайта на GitHub Pages. */
export function assetUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
  return `${base}/${path.replace(/^\//, "")}`;
}
