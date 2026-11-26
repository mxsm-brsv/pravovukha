/**
 * Версия сборки. В GitHub Actions сюда попадает хеш коммита (NEXT_PUBLIC_APP_VERSION),
 * в профиле показываем первые 7 символов — по ним легко найти коммит на GitHub.
 */
const raw = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export const APP_VERSION = raw ? raw.slice(0, 7) : "dev";
