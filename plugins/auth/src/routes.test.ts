import { describe, expect, it } from "vitest";
import { createAuthRoutes } from "./routes";

describe("createAuthRoutes", () => {
  it("提供登录挑战与错误页，不注册管理台菜单", () => {
    const routes = createAuthRoutes();
    expect(routes.map((item) => item.path).sort()).toEqual(["/", "/errors", "/oauth2/challenge"]);
    expect(routes.some((item) => item.path === "/" && "redirect" in item)).toBe(true);
  });
});
