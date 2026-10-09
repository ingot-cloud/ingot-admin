import { describe, it, expect } from "vitest";
import { MenuAccessMode, MenuKind, MenuMatchMode } from "./constants";
import { resolveMenuPath, validateMenu } from "./menuConfiguration";
import type { AppMenuDraft } from "./types";
const base: AppMenuDraft = {
  name: "详情",
  kind: MenuKind.PAGE,
  path: "/orders/",
  accessMode: MenuAccessMode.OPEN,
  matchMode: MenuMatchMode.ANY,
  actionIds: [],
  sortOrder: 0,
  hidden: true,
  props: true,
  routeParams: [{ name: "a", remark: "订单" }, { name: "b" }],
};
describe("menu parameters", () => {
  it("声明顺序生成模板且保留存量路径", () => {
    expect(resolveMenuPath(base.path, base.routeParams)).toBe("/orders/:a/:b");
    expect(resolveMenuPath("/old/:id")).toBe("/old/:id");
    expect(validateMenu(base)).toEqual([]);
  });
  it("校验参数名、重复、必填、隐藏及基础路径", () => {
    expect(validateMenu({ ...base, hidden: false })[0]?.field).toBe("hidden");
    expect(validateMenu({ ...base, routeParams: [] })[0]?.field).toBe("params");
    expect(validateMenu({ ...base, path: "/orders/:old" })[0]?.step).toBe(0);
    expect(validateMenu({ ...base, routeParams: [{ name: "a" }, { name: "a" }] })[0]?.field).toBe(
      "param-1",
    );
    expect(validateMenu({ ...base, routeParams: [{ name: "1a" }] })[0]?.field).toBe("param-0");
  });
  it("保护页面要求操作，目录不要求操作", () => {
    expect(validateMenu({ ...base, accessMode: MenuAccessMode.ACTION })[0]?.step).toBe(1);
    expect(
      validateMenu({ ...base, kind: MenuKind.DIRECTORY, accessMode: MenuAccessMode.ACTION }),
    ).toEqual([]);
  });
});
