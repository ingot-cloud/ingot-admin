import { describe, expect, it } from "vitest";
import { createAuthRoutes } from "./routes";
describe("same-origin public login", () => {
  it("注册一个无需身份的/login/，不占用管理根路由", () => {
    const routes = createAuthRoutes();
    expect(routes.map((route) => route.path)).toEqual(["/login/"]);
    expect(routes[0]?.meta?.permitAuth).toBe(true);
  });
});
