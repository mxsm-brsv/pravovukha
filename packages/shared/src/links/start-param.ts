/**
 * Ссылки вида https://t.me/<бот>?startapp=<параметр> открывают нужный экран.
 * Telegram пропускает в параметре только A-Z, a-z, 0-9, _ и -, до 512 символов.
 * Новые виды ссылок (колода, вопрос) добавляются здесь вместе с их экранами.
 */
export type DeepLink = { kind: "home" } | { kind: "profile" } | { kind: "goal" };

const START_PARAM_RE = /^[A-Za-z0-9_-]{1,512}$/;

export function parseStartParam(param: string | null | undefined): DeepLink {
  if (!param || !START_PARAM_RE.test(param)) return { kind: "home" };
  switch (param) {
    case "profile":
      return { kind: "profile" };
    case "goal":
      return { kind: "goal" };
    default:
      return { kind: "home" };
  }
}

export function buildStartParam(link: DeepLink): string | null {
  switch (link.kind) {
    case "home":
      return null;
    case "profile":
      return "profile";
    case "goal":
      return "goal";
  }
}

/** Путь внутри приложения (без basePath), со слешем на конце, как в статическом экспорте. */
export function deepLinkPath(link: DeepLink): string {
  switch (link.kind) {
    case "home":
      return "/";
    case "profile":
      return "/profile/";
    case "goal":
      return "/profile/goal/";
  }
}
