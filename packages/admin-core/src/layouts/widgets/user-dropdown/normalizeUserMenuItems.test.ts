import { describe, expect, it } from "vitest";
import {
  USER_MENU_LOGOUT_DIVIDER_KEY,
  normalizeUserMenuItems,
} from "./normalizeUserMenuItems";
import {
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderItemType,
} from "@/plugin/header";
import type { ResolvedHeaderUserMenuItem } from "../header/resolveHeaderConfig";

const action = (key: string): ResolvedHeaderUserMenuItem => ({
  key,
  type: InAdminHeaderItemType.Action,
  label: key,
  disabled: false,
});

const logout = (): ResolvedHeaderUserMenuItem => ({
  key: InAdminHeaderBuiltinUserMenuName.Logout,
  type: InAdminHeaderItemType.Builtin,
  name: InAdminHeaderBuiltinUserMenuName.Logout,
  label: "退出登录",
  disabled: false,
});

const divider = (key: string): ResolvedHeaderUserMenuItem => ({
  key,
  type: InAdminHeaderItemType.Divider,
  label: "",
  disabled: false,
});

describe("normalizeUserMenuItems", () => {
  it("退出登录前自动插入分割线，且不与配置分割线重复", () => {
    expect(normalizeUserMenuItems([action("profile"), logout()]).map((item) => item.key)).toEqual([
      "profile",
      USER_MENU_LOGOUT_DIVIDER_KEY,
      InAdminHeaderBuiltinUserMenuName.Logout,
    ]);
    expect(
      normalizeUserMenuItems([action("profile"), divider("custom"), logout()]).map(
        (item) => item.key,
      ),
    ).toEqual(["profile", "custom", InAdminHeaderBuiltinUserMenuName.Logout]);
  });

  it("仅有退出登录时不额外插线，头像区分割线即可", () => {
    expect(normalizeUserMenuItems([logout()]).map((item) => item.key)).toEqual([
      InAdminHeaderBuiltinUserMenuName.Logout,
    ]);
  });

  it("去掉首尾和连续分割线", () => {
    expect(
      normalizeUserMenuItems([
        divider("lead"),
        action("profile"),
        divider("a"),
        divider("b"),
        action("fixPwd"),
        divider("trail"),
      ]).map((item) => item.key),
    ).toEqual(["profile", "a", "fixPwd"]);
  });
});
