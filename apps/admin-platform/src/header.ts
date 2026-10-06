import {
  Message,
  defineHeaderBuiltinUserMenuItem,
  defineHeaderBuiltinUtility,
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderBuiltinUtilityName,
  InAdminHeaderUtilityItemType,
  type InAdminHeaderConfig,
} from "@ingot/admin-core";
import { ref } from "vue";
import BizHeaderHelp from "./components/BizHeaderHelp.vue";

/** 平台导航复用 IAM 当前应用与授权菜单，核心组件联动路由和侧栏。 */
const notifyCount = ref(3);

export const createAdminHeader = (): InAdminHeaderConfig => ({
  navigation: { source: "applications", maxVisibleItems: 2 },
  search: { placeholder: "搜索功能导航" },
  utilities: [
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Fullscreen),
    {
      type: InAdminHeaderUtilityItemType.Action,
      key: "notify",
      label: "通知",
      icon: "ingot:bell-outlined",
      badge: notifyCount,
      onClick: () => {
        notifyCount.value = 0;
        Message.success("打开通知（示例）");
      },
    },
    {
      type: InAdminHeaderUtilityItemType.Component,
      key: "help",
      label: "帮助",
      component: BizHeaderHelp,
    },
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Settings),
  ],
  user: {
    menu: [
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.Profile),
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.SwitchOrg),
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.FixPwd),
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.Logout),
    ],
  },
});
