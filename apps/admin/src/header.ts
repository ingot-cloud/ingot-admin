import {
  Message,
  defineHeaderBuiltinUserMenuItem,
  defineHeaderBuiltinUtility,
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderBuiltinUtilityName,
  InAdminHeaderItemType,
  InAdminHeaderNavGroupTrigger,
  type InAdminHeaderConfig,
} from "@ingot/admin-core";
import { ref } from "vue";

/**
 * 顶栏示例配置，便于对照大类菜单、小部件和用户菜单。
 * 选中与点击只做演示提示，未接入侧栏过滤或业务路由。
 */
const activeNavKey = ref("ops");
const notifyCount = ref(3);

const privateOnNavSelect = (entryKey: string, itemKey?: string) => {
  if (itemKey) {
    Message.success(`选择分组项：${entryKey} / ${itemKey}`);
    return;
  }
  activeNavKey.value = entryKey;
  Message.success(`切换大类：${entryKey}`);
};

export const createAdminHeader = (): InAdminHeaderConfig => ({
  navigation: {
    activeKey: activeNavKey,
    onSelect: ({ entryKey, itemKey }) => {
      privateOnNavSelect(entryKey, itemKey);
    },
    items: [
      { key: "ops", label: "运营", icon: "ep:monitor" },
      { key: "commerce", label: "电商", icon: "ep:goods" },
      {
        key: "platform",
        type: InAdminHeaderItemType.Group,
        label: "平台",
        icon: "ep:grid",
        trigger: InAdminHeaderNavGroupTrigger.Hover,
        groups: [
          {
            key: "org",
            title: "组织",
            items: [
              { key: "dept", label: "部门", icon: "ep:office-building" },
              { key: "member", label: "成员", icon: "ep:user" },
            ],
          },
          {
            key: "system",
            title: "系统",
            items: [
              { key: "app", label: "应用", icon: "ep:connection" },
              { key: "dict", label: "字典", icon: "ep:collection" },
            ],
          },
        ],
      },
    ],
  },
  search: {
    placeholder: "搜索功能导航",
  },
  utilities: [
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Fullscreen),
    {
      type: InAdminHeaderItemType.Action,
      key: "notify",
      label: "通知",
      icon: "ep:bell",
      badge: notifyCount,
      onClick: () => {
        notifyCount.value = 0;
        Message.success("打开通知（示例）");
      },
    },
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Settings),
  ],
  user: {
    menu: [
      {
        type: InAdminHeaderItemType.Action,
        key: "profile",
        label: "个人资料",
        icon: "ep:user",
        onClick: () => {
          Message.success("打开个人资料（示例）");
        },
      },
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.SwitchOrg),
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.FixPwd),
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.Logout),
    ],
  },
});
