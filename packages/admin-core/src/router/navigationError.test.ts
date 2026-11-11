import { describe, expect, it } from "vitest";
import {
  NAVIGATION_ERROR_PATH,
  navigationErrorLocation,
  navigationRecoveryPath,
} from "./navigationError";

describe("导航配置恢复地址", () => {
  it("保留业务深链接、查询与锚点", () => {
    const path = "/platform/iam/applications?domain=PLATFORM#menus";
    expect(navigationErrorLocation(path)).toEqual({
      path: NAVIGATION_ERROR_PATH,
      replace: true,
      query: { returnTo: path },
    });
  });

  it.each([
    "https://example.test/",
    "//example.test",
    "/%2f%2fexample.test",
    "/login/",
    NAVIGATION_ERROR_PATH,
    "/auth/%6eavigation-error/",
  ])("拒绝外站、认证循环与错误页自身：%s", (value) =>
    expect(navigationRecoveryPath(value)).toBe("/"),
  );
});
