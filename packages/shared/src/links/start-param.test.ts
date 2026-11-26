import { describe, expect, it } from "vitest";
import { buildStartParam, deepLinkPath, parseStartParam, type DeepLink } from "./start-param";

describe("start param", () => {
  it("открывает главную без параметра и при неизвестном или недопустимом параметре", () => {
    expect(parseStartParam(undefined)).toEqual({ kind: "home" });
    expect(parseStartParam("")).toEqual({ kind: "home" });
    expect(parseStartParam("unknown")).toEqual({ kind: "home" });
    expect(parseStartParam("profile/../x")).toEqual({ kind: "home" });
    expect(parseStartParam("a".repeat(513))).toEqual({ kind: "home" });
  });

  it("разбирает известные ссылки и строит их обратно", () => {
    const links: DeepLink[] = [{ kind: "profile" }, { kind: "goal" }];
    for (const link of links) {
      const param = buildStartParam(link);
      expect(param).not.toBeNull();
      expect(parseStartParam(param)).toEqual(link);
    }
    expect(buildStartParam({ kind: "home" })).toBeNull();
  });

  it("даёт пути со слешем на конце для статического экспорта", () => {
    expect(deepLinkPath({ kind: "home" })).toBe("/");
    expect(deepLinkPath({ kind: "profile" })).toBe("/profile/");
    expect(deepLinkPath({ kind: "goal" })).toBe("/profile/goal/");
  });
});
