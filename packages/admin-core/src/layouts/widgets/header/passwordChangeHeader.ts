import { defineHeaderBuiltinUserMenuItem, InAdminHeaderBuiltinUserMenuName } from "@/plugin/header";
import { resolveHeaderConfig, type ResolvedHeaderConfig } from "./resolveHeaderConfig";

/** 强制改密只允许静态品牌和内置退出登录，不继承 APP 的业务扩展。 */
export const resolvePasswordChangeHeader = (): ResolvedHeaderConfig =>
  resolveHeaderConfig({
    navigation: { items: [] },
    utilities: [],
    user: {
      menu: [defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.Logout)],
    },
  });
